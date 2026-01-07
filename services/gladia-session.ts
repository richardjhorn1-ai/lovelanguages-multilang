/**
 * Gladia Session Service
 *
 * WebSocket client for Gladia's real-time speech-to-text API
 * Features: Polish transcription, English translation
 *
 * Flow:
 * 1. Backend calls Gladia API to create session → returns WebSocket URL
 * 2. Frontend connects to WebSocket URL (auth via URL token)
 * 3. Stream audio chunks, receive transcripts
 */

import { AudioRecorder, checkAudioSupport } from './audio-utils';
import { supabase } from './supabase';

// Session states
export type GladiaState = 'disconnected' | 'connecting' | 'listening' | 'paused' | 'error';

// Transcript chunk from Gladia
export interface TranscriptChunk {
  id: string;
  text: string;
  translation?: string;
  speaker: string;
  timestamp: number;
  isFinal: boolean;
  confidence?: number;
}

// Configuration for GladiaSession
export interface GladiaConfig {
  onTranscript: (chunk: TranscriptChunk) => void;
  onStateChange: (state: GladiaState) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
}

// Debug mode - set to false to reduce console noise
const DEBUG = false;

function log(...args: any[]) {
  if (DEBUG) {
    console.log(`[GladiaSession ${new Date().toISOString().slice(11, 23)}]`, ...args);
  }
}

/**
 * GladiaSession manages real-time audio transcription with Gladia API
 */
export class GladiaSession {
  private config: GladiaConfig;
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private state: GladiaState = 'disconnected';
  private audioChunkCount = 0;
  private sessionId: string | null = null;

  // Partial transcript accumulation
  private currentSpeaker = 'speaker_0';
  private transcriptCounter = 0;

  // Track transcripts waiting for translations
  private pendingTranscripts: Map<string, { chunk: TranscriptChunk; timer: ReturnType<typeof setTimeout> }> = new Map();
  private lastTranscriptId: string | null = null;

  constructor(config: GladiaConfig) {
    this.config = config;
  }

  /**
   * Connect to Gladia API via backend token proxy
   */
  async connect(): Promise<void> {
    // Check browser support
    const support = checkAudioSupport();
    if (!support.supported) {
      throw new Error(support.error || 'Audio not supported');
    }

    this.setState('connecting');
    log('Starting Gladia connection...');

    try {
      // Get auth headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please log in to use Listen Mode');
      }

      log('Requesting Gladia session from backend...');

      // Request WebSocket URL from backend
      // Backend calls Gladia API with our API key and returns the WebSocket URL
      const tokenResponse = await fetch('/api/gladia-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        log('Token request failed:', error);
        throw new Error(error.error || 'Failed to initialize Listen Mode');
      }

      const { sessionId, websocketUrl } = await tokenResponse.json();
      this.sessionId = sessionId;
      log('Got WebSocket URL for session:', sessionId);

      // Connect to Gladia WebSocket (URL contains embedded auth token)
      log('Connecting to Gladia WebSocket...');
      this.ws = new WebSocket(websocketUrl);

      this.ws.onopen = () => {
        log('WebSocket connected, starting audio capture...');
        this.startListening();
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
        this.config.onClose?.();
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
      });

      this.setState('listening');
      log('Audio capture started');
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
  disconnect(): void {
    log('Disconnecting...');

    // Send stop_recording signal to trigger any final processing
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'stop_recording' }));
      } catch (e) {
        // Ignore
      }
    }

    this.cleanup();
    this.setState('disconnected');
    this.config.onClose?.();
  }

  /**
   * Send audio chunk to Gladia
   */
  private sendAudio(base64Audio: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.audioChunkCount++;
    if (this.audioChunkCount % 50 === 1) {
      log(`Sending audio chunk #${this.audioChunkCount}`);
    }

    try {
      // Gladia accepts audio as JSON with base64 data
      this.ws.send(JSON.stringify({
        type: 'audio_chunk',
        data: {
          chunk: base64Audio
        }
      }));
    } catch (error) {
      log('Error sending audio:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      log('Received message:', message.type || message.event || 'unknown');

      // Handle different message types from Gladia
      switch (message.type) {
        case 'transcript':
          this.handleTranscript(message, true);
          break;

        case 'partial_transcript':
          this.handleTranscript(message, false);
          break;

        case 'translation':
          this.handleTranslation(message);
          break;

        case 'speech_start':
          log('Speech started');
          break;

        case 'speech_end':
          log('Speech ended');
          break;

        case 'error':
          log('Gladia error:', message.data || message.message);
          this.config.onError(new Error(message.data?.message || message.message || 'Transcription error'));
          break;

        default:
          log('Unknown message type:', message.type, message);
      }

    } catch (error) {
      log('Error parsing message:', error, data);
    }
  }

  /**
   * Handle transcript messages from Gladia
   */
  private handleTranscript(message: any, isFinal: boolean): void {
    // Extract transcript data - Gladia v2 format
    const transcriptData = message.data || message;

    // Get the text
    const text = transcriptData.utterance?.text ||
                 transcriptData.transcript ||
                 transcriptData.text || '';

    if (!text.trim()) return;

    // Get translation if available (from realtime_processing)
    let translation = '';
    if (transcriptData.utterance?.translations?.en) {
      translation = transcriptData.utterance.translations.en;
    } else if (transcriptData.translations?.en) {
      translation = transcriptData.translations.en;
    } else if (transcriptData.translation) {
      translation = transcriptData.translation;
    }

    // Get speaker info if available
    const speaker = transcriptData.utterance?.speaker !== undefined
      ? `speaker_${transcriptData.utterance.speaker}`
      : this.currentSpeaker;

    if (speaker !== this.currentSpeaker) {
      this.currentSpeaker = speaker;
    }

    // Get confidence
    const confidence = transcriptData.utterance?.confidence || transcriptData.confidence;

    this.transcriptCounter++;
    const chunk: TranscriptChunk = {
      id: isFinal ? `transcript_${this.transcriptCounter}` : `partial_${Date.now()}`,
      text: text.trim(),
      translation: translation.trim() || undefined,
      speaker,
      timestamp: Date.now(),
      isFinal,
      confidence,
    };

    log(isFinal ? 'Final transcript:' : 'Partial:', chunk.text, translation ? `→ ${chunk.translation}` : '');

    // For final transcripts without translation, wait briefly for translation message
    if (isFinal && !chunk.translation) {
      this.lastTranscriptId = chunk.id;

      // Set timer to emit transcript if no translation arrives within 800ms
      const timer = setTimeout(() => {
        if (this.pendingTranscripts.has(chunk.id)) {
          log('Emitting transcript without translation (timeout):', chunk.text);
          this.pendingTranscripts.delete(chunk.id);
          this.config.onTranscript(chunk);
        }
      }, 800);

      this.pendingTranscripts.set(chunk.id, { chunk, timer });
      log('Waiting for translation for:', chunk.id);
    } else {
      // Emit immediately (partials or transcripts with inline translation)
      this.config.onTranscript(chunk);
    }
  }

  /**
   * Handle translation messages from Gladia
   * Translations arrive separately and need to be merged with the transcript
   */
  private handleTranslation(message: any): void {
    const translationData = message.data || message;

    // Extract English translation
    const translation = translationData.translations?.en ||
                       translationData.translation?.en ||
                       translationData.translation ||
                       translationData.text || '';

    if (!translation.trim()) {
      log('Empty translation received, ignoring');
      return;
    }

    log('Translation received:', translation);

    // Find the most recent pending transcript to merge with
    // Gladia sends translation right after the transcript it belongs to
    if (this.lastTranscriptId && this.pendingTranscripts.has(this.lastTranscriptId)) {
      const pending = this.pendingTranscripts.get(this.lastTranscriptId)!;
      clearTimeout(pending.timer);
      this.pendingTranscripts.delete(this.lastTranscriptId);

      // Merge translation with transcript
      const mergedChunk: TranscriptChunk = {
        ...pending.chunk,
        translation: translation.trim(),
      };

      log('Merged translation with transcript:', mergedChunk.text, '→', mergedChunk.translation);
      this.config.onTranscript(mergedChunk);
      this.lastTranscriptId = null;
    } else {
      // No pending transcript - log for debugging
      log('Translation received but no pending transcript to merge with');
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    log('Cleaning up...');

    // Clear all pending transcript timers
    for (const pending of this.pendingTranscripts.values()) {
      clearTimeout(pending.timer);
    }
    this.pendingTranscripts.clear();
    this.lastTranscriptId = null;

    this.audioRecorder?.stop();
    this.audioRecorder = null;

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // Ignore close errors
      }
      this.ws = null;
    }

    this.audioChunkCount = 0;
    this.sessionId = null;
  }

  /**
   * Update and emit state
   */
  private setState(state: GladiaState): void {
    log(`State: ${this.state} → ${state}`);
    this.state = state;
    this.config.onStateChange(state);
  }

  /**
   * Get current state
   */
  getState(): GladiaState {
    return this.state;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}
