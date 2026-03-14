/**
 * Transcription Session Service
 *
 * WebSocket client for OpenAI's Realtime API (transcription-only mode)
 * Features: Multi-language transcription with auto-detect and code-switching
 *
 * Flow:
 * 1. Backend calls OpenAI API to create ephemeral token
 * 2. Frontend connects to WebSocket URL with token via protocol headers
 * 3. Stream audio chunks, receive transcripts (deltas + completed)
 */

import { AudioRecorder, checkAudioSupport } from './audio-utils';
import { supabase } from './supabase';
import { apiFetch } from './api-config';

// Session states
export type TranscriptionState = 'disconnected' | 'connecting' | 'listening' | 'paused' | 'error';

// Transcript chunk emitted to the UI
export interface TranscriptChunk {
  id: string;
  text: string;
  translation?: string;
  speaker: string;
  timestamp: number;
  isFinal: boolean;
  confidence?: number;
  language?: string;  // Detected language ISO code
  previousItemId?: string | null;
}

// Configuration for TranscriptionSession
export interface TranscriptionConfig {
  onTranscript: (chunk: TranscriptChunk) => void;
  onStateChange: (state: TranscriptionState) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
  targetLanguage?: string;
  nativeLanguage?: string;
}

// OpenAI Realtime API requires 24kHz PCM input
const OPENAI_SAMPLE_RATE = 24000;

// Debug mode — enable in development
const DEBUG = import.meta.env.DEV;

function log(...args: any[]) {
  if (DEBUG) {
    console.log(`[TranscriptionSession ${new Date().toISOString().slice(11, 23)}]`, ...args);
  }
}

/**
 * TranscriptionSession manages real-time audio transcription with OpenAI Realtime API
 */
export class TranscriptionSession {
  private config: TranscriptionConfig;
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private state: TranscriptionState = 'disconnected';
  private audioChunkCount = 0;
  private hasCalledOnClose = false;

  // Delta accumulation — OpenAI sends incremental text, not full partials
  private partialTexts = new Map<string, string>();
  private previousItemIds = new Map<string, string | null>();
  private transcriptCounter = 0;

  constructor(config: TranscriptionConfig) {
    this.config = config;
  }

  /**
   * Connect to OpenAI Realtime API via backend token proxy
   */
  async connect(): Promise<void> {
    // Check browser support
    const support = checkAudioSupport();
    if (!support.supported) {
      throw new Error(support.error || 'Audio not supported');
    }

    this.setState('connecting');
    this.hasCalledOnClose = false;
    log('Starting OpenAI Realtime connection...');

    try {
      // Get auth headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please log in to use Listen Mode');
      }

      log('Requesting transcription session from backend...');

      // Request ephemeral token from backend
      const tokenResponse = await apiFetch('/api/transcription-token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetLanguage: this.config.targetLanguage,
          nativeLanguage: this.config.nativeLanguage
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        log('Token request failed:', error);
        throw new Error(error.error || 'Failed to initialize Listen Mode');
      }

      const { token, url, targetLanguage, nativeLanguage } = await tokenResponse.json();
      // Freeze session language pair from server response
      if (targetLanguage) this.config.targetLanguage = targetLanguage;
      if (nativeLanguage) this.config.nativeLanguage = nativeLanguage;
      log('Got ephemeral token, connecting to OpenAI WebSocket...');

      // Connect to OpenAI Realtime API WebSocket.
      // Browser auth is passed via subprotocols because custom headers are not available.
      this.ws = new WebSocket(url, [
        'realtime',
        'openai-insecure-api-key.' + token,
        'openai-beta.realtime-v1'
      ]);

      this.ws.onopen = () => {
        log('WebSocket connected, starting audio capture...');
        void this.startListening();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (event) => {
        log('WebSocket error:', event);
        this.config.onError(new Error('Connection error'));
        this.setState('error');
      };

      this.ws.onclose = (event) => {
        log('WebSocket closed:', event.code, event.reason);
        this.cleanup();
        this.setState('disconnected');
        if (!this.hasCalledOnClose) {
          this.hasCalledOnClose = true;
          this.config.onClose?.();
        }
      };

    } catch (error) {
      log('Connection error:', error);
      this.setState('error');
      this.config.onError(error as Error);
      throw error;
    }
  }

  /**
   * Start listening and capturing audio
   */
  async startListening(): Promise<void> {
    if (this.state !== 'connecting' && this.state !== 'paused') {
      log('Cannot start listening in state:', this.state);
      return;
    }

    try {
      this.audioRecorder = new AudioRecorder();
      await this.audioRecorder.start((base64Audio) => {
        this.sendAudio(base64Audio);
      }, OPENAI_SAMPLE_RATE);

      this.setState('listening');
      log('Audio capture started at', OPENAI_SAMPLE_RATE, 'Hz');
    } catch (error) {
      log('Failed to start audio:', error);
      this.config.onError(error as Error);
      this.setState('error');
    }
  }

  /**
   * Pause listening (stop audio capture but keep connection)
   */
  pauseListening(): void {
    if (this.state !== 'listening') return;

    this.audioRecorder?.stop();
    this.audioRecorder = null;
    this.setState('paused');
    log('Listening paused');
  }

  /**
   * Resume listening after pause
   */
  async resumeListening(): Promise<void> {
    if (this.state !== 'paused') return;

    await this.startListening();
  }

  /**
   * Stop listening and disconnect
   */
  async disconnect(): Promise<void> {
    if (this.hasCalledOnClose) return;
    this.hasCalledOnClose = true;
    log('Disconnecting...');

    // Stop audio capture immediately
    this.audioRecorder?.stop();
    this.audioRecorder = null;

    // Close WebSocket
    if (this.ws) {
      // Null out handlers to prevent stale callbacks
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try { this.ws.close(); } catch (e) { /* ignore */ }
      this.ws = null;
    }

    this.audioChunkCount = 0;
    this.partialTexts.clear();
    this.previousItemIds.clear();
    this.setState('disconnected');
    this.config.onClose?.();
  }

  /**
   * Send audio chunk to OpenAI
   */
  private sendAudio(base64Audio: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.audioChunkCount++;
    if (this.audioChunkCount % 50 === 1) {
      log(`Sending audio chunk #${this.audioChunkCount}`);
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
    } catch (error) {
      log('Error sending audio:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages from OpenAI
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'session.created':
          log('Session created:', message.session?.id);
          break;

        case 'session.updated':
          log('Session configured');
          break;

        case 'input_audio_buffer.committed':
          this.handleInputAudioCommitted(message);
          break;

        case 'conversation.item.input_audio_transcription.delta':
          this.handleTranscriptDelta(message);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          this.handleTranscriptCompleted(message);
          break;

        case 'input_audio_buffer.speech_started':
          log('Speech started');
          break;

        case 'input_audio_buffer.speech_stopped':
          log('Speech stopped');
          break;

        case 'error':
          log('OpenAI error:', message.error);
          this.config.onError(new Error(message.error?.message || 'Transcription error'));
          break;

        default:
          // Ignore other event types (response.*, etc.)
          break;
      }

    } catch (error) {
      log('Error parsing message:', error);
    }
  }

  private handleInputAudioCommitted(message: any): void {
    const itemId = message.item_id;
    if (!itemId) return;

    this.previousItemIds.set(itemId, message.previous_item_id || null);
  }

  /**
   * Handle incremental transcript delta from OpenAI
   * Accumulates text per item_id and emits as partial
   */
  private handleTranscriptDelta(message: any): void {
    const itemId = message.item_id;
    const delta = message.delta || '';

    if (!delta) return;

    // Accumulate delta text for this item
    const accumulated = (this.partialTexts.get(itemId) || '') + delta;
    this.partialTexts.set(itemId, accumulated);

    const chunk: TranscriptChunk = {
      id: itemId || `partial_${Date.now()}`,
      text: accumulated.trim(),
      speaker: 'speaker_0',  // OpenAI Realtime doesn't support live diarization
      timestamp: Date.now(),
      isFinal: false,
    };

    log('Partial:', `${chunk.text.length} chars`);
    this.config.onTranscript(chunk);
  }

  /**
   * Handle completed transcript from OpenAI
   * Emits as final and clears delta accumulator
   */
  private handleTranscriptCompleted(message: any): void {
    const itemId = message.item_id;
    const transcript = message.transcript || '';

    if (!transcript.trim()) {
      this.partialTexts.delete(itemId);
      return;
    }

    // Clear accumulated deltas for this item
    this.partialTexts.delete(itemId);

    this.transcriptCounter++;
    const chunk: TranscriptChunk = {
      id: itemId || `transcript_${this.transcriptCounter}`,
      text: transcript.trim(),
      speaker: 'speaker_0',
      timestamp: Date.now(),
      isFinal: true,
      previousItemId: itemId ? this.previousItemIds.get(itemId) || null : null,
    };

    log('Final transcript:', `${chunk.text.length} chars`);
    this.config.onTranscript(chunk);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    log('Cleaning up...');

    this.audioRecorder?.stop();
    this.audioRecorder = null;

    if (this.ws) {
      try { this.ws.close(); } catch (e) { /* ignore */ }
      this.ws = null;
    }

    this.audioChunkCount = 0;
    this.partialTexts.clear();
    this.previousItemIds.clear();
  }

  /**
   * Update and emit state
   */
  private setState(state: TranscriptionState): void {
    if (this.state === state) return;
    log(`State: ${this.state} → ${state}`);
    this.state = state;
    this.config.onStateChange(state);
  }

  /**
   * Get current state
   */
  getState(): TranscriptionState {
    return this.state;
  }
}
