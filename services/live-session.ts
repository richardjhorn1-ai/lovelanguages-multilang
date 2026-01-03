import { GoogleGenAI, Session } from '@google/genai';
import { supabase } from './supabase';
import { AudioRecorder, AudioPlayer, checkAudioSupport } from './audio-utils';
import { ChatMode } from '../types';

export type LiveSessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface LiveSessionConfig {
  mode: ChatMode;
  userLog?: string[];
  onTranscript?: (role: 'user' | 'model', text: string, isFinal: boolean) => void;
  onStateChange?: (state: LiveSessionState) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

// Debug mode - set to true for verbose logging
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log(`[LiveSession ${new Date().toISOString().slice(11, 23)}]`, ...args);
  }
}

export class LiveSession {
  private config: LiveSessionConfig;
  private session: Session | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private state: LiveSessionState = 'disconnected';
  private currentTranscript = '';
  private audioChunkCount = 0;

  constructor(config: LiveSessionConfig) {
    this.config = config;
  }

  /**
   * Connect to Gemini Live API using the SDK
   */
  async connect(): Promise<void> {
    // Check browser support
    const support = checkAudioSupport();
    if (!support.supported) {
      throw new Error(support.error || 'Audio not supported');
    }

    this.setState('connecting');
    log('Starting connection...');

    try {
      // Get auth headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please log in to use voice mode');
      }

      log('Requesting ephemeral token...');

      // Request ephemeral token from backend
      const tokenResponse = await fetch('/api/live-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mode: this.config.mode,
          userLog: this.config.userLog || []
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        log('Token request failed:', error);
        throw new Error(error.error || 'Failed to get voice session token');
      }

      const { token, model } = await tokenResponse.json();
      log('Got token for model:', model);

      // Create SDK client with ephemeral token
      // CRITICAL: Must use v1alpha for ephemeral tokens (both methods for safety)
      log('Creating SDK client with ephemeral token...');
      const ai = new GoogleGenAI({
        apiKey: token,
        apiVersion: 'v1alpha',
        httpOptions: { apiVersion: 'v1alpha' }
      });

      // Initialize audio player
      this.audioPlayer = new AudioPlayer((isPlaying) => {
        if (isPlaying) {
          this.setState('speaking');
        } else if (this.state === 'speaking') {
          this.setState('listening');
        }
      });

      // Connect using the SDK - it handles all the WebSocket protocol internally
      // Config is LOCKED in ephemeral token via liveConnectConstraints
      // So we only pass the model (required) and callbacks, no config
      log('Connecting via SDK live.connect() (config locked in token)...');
      this.session = await ai.live.connect({
        model: `models/${model}`,
        callbacks: {
          onopen: () => {
            log('SDK session opened');
          },
          onmessage: (message: any) => {
            this.handleMessage(message);
          },
          onerror: (error: any) => {
            log('SDK session error:', error);
            this.config.onError?.(new Error(error?.message || 'Voice connection error'));
          },
          onclose: (event: any) => {
            log('SDK session closed:', event);
            this.cleanup();
            this.config.onClose?.();
          }
        }
      });

      log('SDK session connected, starting audio...');
      this.setState('listening');

      // Initialize audio recorder and start capturing
      this.audioRecorder = new AudioRecorder();
      await this.startListening();
      log('Audio capture started successfully');

    } catch (error) {
      log('Connection error:', error);
      this.setState('error');
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (!this.audioRecorder || !this.session || this.state !== 'listening') return;

    try {
      await this.audioRecorder.start((base64Audio) => {
        this.sendAudio(base64Audio);
      });
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.audioRecorder?.stop();
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.cleanup();
    this.setState('disconnected');
    this.config.onClose?.();
  }

  private cleanup(): void {
    log('Cleaning up...');

    this.audioRecorder?.stop();
    this.audioRecorder = null;

    this.audioPlayer?.stop();
    this.audioPlayer = null;

    if (this.session) {
      try {
        this.session.close();
      } catch (e) {
        // Ignore close errors
      }
      this.session = null;
    }

    this.audioChunkCount = 0;
  }

  private setState(state: LiveSessionState): void {
    log(`State: ${this.state} → ${state}`);
    this.state = state;
    this.config.onStateChange?.(state);
  }

  private sendAudio(base64Audio: string): void {
    if (!this.session) return;

    this.audioChunkCount++;
    // Log every 50th chunk to avoid spam
    if (this.audioChunkCount % 50 === 1) {
      log(`Sending audio chunk #${this.audioChunkCount} (${base64Audio.length} bytes)`);
    }

    try {
      // Use the SDK's sendRealtimeInput method
      this.session.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000'
        }
      });
    } catch (error) {
      log('Error sending audio:', error);
    }
  }

  private handleMessage(message: any): void {
    try {
      log('Received message:', Object.keys(message));

      // Handle server content (responses)
      if (message.serverContent) {
        this.handleServerContent(message.serverContent);
      }

      // Handle tool calls (if any)
      if (message.toolCall) {
        log('Tool call received:', message.toolCall);
      }

    } catch (error) {
      log('Error handling message:', error);
    }
  }

  private handleServerContent(content: any): void {
    // Handle interruption
    if (content.interrupted) {
      log('Turn interrupted');
      this.audioPlayer?.stop();
      this.currentTranscript = '';
      return;
    }

    // Input transcription (what user said) - new format for audio-only mode
    if (content.inputTranscription?.text) {
      log('User transcript:', content.inputTranscription.text);
      this.config.onTranscript?.('user', content.inputTranscription.text, true);
    }

    // Output transcription (what model said) - new format for audio-only mode
    // These come in chunks, so we accumulate them
    if (content.outputTranscription?.text) {
      this.currentTranscript += content.outputTranscription.text;
      log('Model transcript (accumulated):', this.currentTranscript);
      this.config.onTranscript?.('model', this.currentTranscript, false);
    }

    // Process MODEL response parts (audio)
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        // Handle audio output
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          log('Received audio response');
          this.audioPlayer?.play(part.inlineData.data);
        }
      }
    }

    // Handle turn complete
    if (content.turnComplete) {
      log('Turn complete');
      if (this.currentTranscript) {
        this.config.onTranscript?.('model', this.currentTranscript, true);
        this.currentTranscript = '';
      }
    }
  }

  /**
   * Get current session state
   */
  getState(): LiveSessionState {
    return this.state;
  }
}
