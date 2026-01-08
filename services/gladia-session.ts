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
  language?: string;  // Detected language: 'pl', 'en', etc.
}

// Configuration for GladiaSession
export interface GladiaConfig {
  onTranscript: (chunk: TranscriptChunk) => void;
  onStateChange: (state: GladiaState) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
}

// Debug mode - set to false to reduce console noise
const DEBUG = import.meta.env.DEV;  // Enable in development

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
  private hasCalledOnClose = false;  // Prevents double onClose callback

  // Partial transcript accumulation
  private currentSpeaker = 'speaker_0';
  private transcriptCounter = 0;

  // Note: Real-time translation matching removed - translations handled in post-processing

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
    this.hasCalledOnClose = false;  // Reset for new connection
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
        this.setState('disconnected');  // Always update state
        // Only fire onClose if disconnect() hasn't already fired it
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
    if (this.hasCalledOnClose) return;  // Already disconnecting
    this.hasCalledOnClose = true;
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
          log('Unknown message type:', message.type);
      }

    } catch (error) {
      log('Error parsing message:', error);
    }
  }

  /**
   * Handle transcript messages from Gladia
   */
  private handleTranscript(message: any, isFinal: boolean): void {
    // Extract transcript data - Gladia v2 format
    const transcriptData = message.data || message;

    // Note: Full transcript logging removed for privacy
    // Enable locally if debugging transcript parsing issues:
    // if (isFinal) log('FULL TRANSCRIPT MESSAGE:', JSON.stringify(message, null, 2));

    // Get the text
    const text = transcriptData.utterance?.text ||
                 transcriptData.transcript ||
                 transcriptData.text || '';

    if (!text.trim()) return;

    // Get detected language (with code_switching enabled)
    const detectedLanguage = transcriptData.utterance?.language ||
                             transcriptData.language ||
                             'unknown';

    log(`Detected language: ${detectedLanguage}`);

    // Get translation if available (from realtime_processing)
    let translation = '';
    if (transcriptData.utterance?.translations?.en) {
      translation = transcriptData.utterance.translations.en;
    } else if (transcriptData.translations?.en) {
      translation = transcriptData.translations.en;
    } else if (transcriptData.translation) {
      translation = transcriptData.translation;
    } else if (transcriptData.results?.[0]?.translations?.en) {
      translation = transcriptData.results[0].translations.en;
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
      language: detectedLanguage !== 'unknown' ? detectedLanguage : undefined,
    };

    log(isFinal ? 'Final transcript:' : 'Partial:',
        `${chunk.text.length} chars`,
        chunk.language ? `[${chunk.language}]` : '',
        translation ? '(translated)' : '');

    // Emit ALL transcripts immediately - no waiting for translations
    // Translations will be added in post-session processing by Gemini
    this.config.onTranscript(chunk);
  }

  /**
   * Handle translation messages from Gladia
   * Note: Real-time translation display removed - translations are handled in post-processing
   * We still log them for debugging purposes
   */
  private handleTranslation(message: any): void {
    const translationData = message.data || message;
    const translation = translationData.translated_utterance?.text || '';
    const originalLang = translationData.original_language;
    const targetLang = translationData.target_language;

    // Just log for debugging - translations handled in post-session processing
    if (translation && originalLang !== targetLang) {
      log('Translation available (for post-processing):', `${originalLang}→${targetLang}`, `${translation.length} chars`);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    log('Cleaning up...');

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
    if (this.state === state) return;  // Skip redundant state changes
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
