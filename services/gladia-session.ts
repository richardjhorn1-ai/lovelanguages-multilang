/**
 * Gladia Session Service
 *
 * WebSocket client for Gladia's real-time speech-to-text API
 * Features: Multi-language transcription with translation to native language
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
  onTranslationUpdate?: (translation: string, originalLanguage: string) => void;
  onSummary?: (summary: string) => void;
  onStateChange: (state: GladiaState) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
  targetLanguage?: string;
  nativeLanguage?: string;
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
      const tokenResponse = await fetch('/api/gladia-token/', {
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

      const { sessionId, websocketUrl, targetLanguage, nativeLanguage } = await tokenResponse.json();
      this.sessionId = sessionId;
      // Freeze session language pair from server response
      if (targetLanguage) this.config.targetLanguage = targetLanguage;
      if (nativeLanguage) this.config.nativeLanguage = nativeLanguage;
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
   * Stop listening and disconnect gracefully.
   * Waits up to 5s for Gladia's post_processing summary before closing.
   */
  async disconnect(): Promise<void> {
    if (this.hasCalledOnClose) return;
    this.hasCalledOnClose = true;
    log('Disconnecting...');

    // 1. Stop audio capture immediately (no more audio sent)
    this.audioRecorder?.stop();
    this.audioRecorder = null;

    // 2. Send stop_recording and wait for summary
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Install handlers BEFORE sending stop_recording to avoid race
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          log('Summary wait timeout — closing without summary');
          resolve();
        }, 5000);

        // Override onmessage to intercept post_processing
        this.ws!.onmessage = (event) => {
          this.handleMessage(event.data);
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'post_processing') {
              clearTimeout(timeout);
              log('Summary received — closing');
              resolve();
            }
          } catch (e) { /* ignore parse errors */ }
        };

        // If Gladia closes the socket from its side, also resolve
        this.ws!.onclose = () => {
          clearTimeout(timeout);
          log('WebSocket closed by server during summary wait');
          this.ws = null;  // Already closed, prevent double close in step 3
          resolve();
        };

        // Now send stop_recording (handlers already installed)
        try {
          this.ws!.send(JSON.stringify({ type: 'stop_recording' }));
        } catch (e) { /* ignore send errors */ }
      });

      // Null out handlers after promise resolves (prevents stale callbacks)
      if (this.ws) {
        this.ws.onmessage = null;
        this.ws.onclose = null;
      }
    }

    // 3. Close WebSocket if still open (may already be null if server closed it)
    if (this.ws) {
      try { this.ws.close(); } catch (e) { /* ignore */ }
      this.ws = null;
    }

    this.audioChunkCount = 0;
    this.sessionId = null;
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

        case 'post_processing':
          this.handlePostProcessing(message);
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
    // Use dynamic language keys instead of hardcoded 'en'
    const nativeLang = this.config.nativeLanguage || 'en';
    const targetLang = this.config.targetLanguage || 'pl';

    const utteranceTranslations = transcriptData.utterance?.translations || {};
    const topLevelTranslations = transcriptData.translations || {};
    const resultTranslations = transcriptData.results?.[0]?.translations || {};

    let translation = '';
    translation = utteranceTranslations[nativeLang] || topLevelTranslations[nativeLang] || resultTranslations[nativeLang]
      || utteranceTranslations[targetLang] || topLevelTranslations[targetLang] || resultTranslations[targetLang]
      || transcriptData.translation || '';

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
   * Emits to ChatArea for matching to most recent unmatched entry
   */
  private handleTranslation(message: any): void {
    const translationData = message.data || message;
    const translation = translationData.translated_utterance?.text || '';
    const originalLang = translationData.original_language;
    const targetLang = translationData.target_language;

    if (!translation || originalLang === targetLang) return;

    log('Translation received:', `${originalLang}→${targetLang}`, `"${translation.slice(0, 50)}..."`);

    // Emit to ChatArea — it will match to the most recent unmatched entry
    this.config.onTranslationUpdate?.(translation, originalLang);
  }

  /**
   * Handle post_processing messages (summarization)
   */
  private handlePostProcessing(message: any): void {
    const data = message.data || message;
    // Gladia summarization result
    const summary = data.summarization?.results || data.summary || '';
    if (summary) {
      log('Gladia summary received:', summary.slice(0, 100));
      this.config.onSummary?.(typeof summary === 'string' ? summary : JSON.stringify(summary));
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
