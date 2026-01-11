import { GoogleGenAI, Session } from '@google/genai';
import { supabase } from './supabase';
import { AudioRecorder, AudioPlayer, checkAudioSupport } from './audio-utils';
import { ChatMode } from '../types';
import { LANGUAGE_CONFIGS } from '../constants/language-config';

export type LiveSessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface ConversationScenario {
  id: string;
  name: string;
  icon?: string;
  persona: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LiveSessionConfig {
  mode: ChatMode | 'conversation';
  userLog?: string[];
  conversationScenario?: ConversationScenario;
  userName?: string;
  targetLanguage?: string;
  nativeLanguage?: string;
  onTranscript?: (role: 'user' | 'model', text: string, isFinal: boolean) => void;
  onStateChange?: (state: LiveSessionState) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

// Debug mode - enabled in development, disabled in production
const DEBUG = import.meta.env.DEV;

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
  private userTranscript = '';
  private userTranscriptTimer: ReturnType<typeof setTimeout> | null = null;
  private audioChunkCount = 0;
  private hasCalledOnClose = false;  // Prevents double onClose callback

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
    this.hasCalledOnClose = false;  // Reset for new connection
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
          userLog: this.config.userLog || [],
          conversationScenario: this.config.conversationScenario,
          userName: this.config.userName,
          targetLanguage: this.config.targetLanguage,
          nativeLanguage: this.config.nativeLanguage
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
            this.setState('disconnected');  // Always update state
            // Only fire onClose if disconnect() hasn't already fired it
            if (!this.hasCalledOnClose) {
              this.hasCalledOnClose = true;
              this.config.onClose?.();
            }
          }
        }
      });

      log('SDK session connected');

      // Initialize audio recorder
      this.audioRecorder = new AudioRecorder();

      // For conversation mode, prompt AI to speak first
      if (this.config.mode === 'conversation' && this.config.conversationScenario) {
        log('Conversation mode: prompting AI to speak first...');
        this.setState('speaking');

        // Send a text message to trigger the AI's opening line
        // The system prompt already instructs it to start the conversation
        try {
          this.session.sendClientContent({
            turns: [{
              role: 'user',
              parts: [{ text: `[The customer has just arrived. Begin the conversation in ${LANGUAGE_CONFIGS[this.config.targetLanguage || 'pl']?.name || 'the target language'} as instructed in your role.]` }]
            }],
            turnComplete: true
          });
          log('Sent initial prompt to AI');
        } catch (e) {
          log('Error sending initial prompt:', e);
        }

        // Start listening after a short delay to let AI start speaking
        setTimeout(async () => {
          if (this.state === 'speaking' || this.state === 'listening') {
            await this.startListening();
            log('Audio capture started after AI prompt');
            // Note: State remains 'speaking' until AI finishes its first response
            // AudioPlayer callback will transition to 'listening' when playback ends
          }
        }, 500);
      } else {
        // Normal mode - start listening immediately
        this.setState('listening');
        await this.startListening();
        log('Audio capture started successfully');
      }

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
    // Allow starting audio capture in 'listening' OR 'speaking' state
    // Speaking state is valid for conversation mode where AI speaks first
    // but we still need to capture user audio for when they respond
    if (!this.audioRecorder || !this.session) return;
    if (this.state !== 'listening' && this.state !== 'speaking') return;

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
    if (this.hasCalledOnClose) return; // Already disconnecting
    this.hasCalledOnClose = true;

    this.cleanup();
    this.setState('disconnected');
    this.config.onClose?.();
  }

  private cleanup(): void {
    log('Cleaning up...');

    // Clear any pending transcript timer
    if (this.userTranscriptTimer) {
      clearTimeout(this.userTranscriptTimer);
      this.userTranscriptTimer = null;
    }

    this.audioRecorder?.stop();
    this.audioRecorder = null;

    this.audioPlayer?.destroy();  // Full cleanup, not just stop
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
    this.userTranscript = '';
    this.currentTranscript = '';
  }

  private setState(state: LiveSessionState): void {
    if (this.state === state) return;  // Skip redundant state changes
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
    // Handle interruption - save partial transcripts before clearing
    if (content.interrupted) {
      log('Turn interrupted');
      this.audioPlayer?.stop();

      // Save partial model transcript if any (so interrupted messages are preserved)
      if (this.currentTranscript.trim()) {
        log('Saving interrupted model transcript:', this.currentTranscript);
        this.config.onTranscript?.('model', this.currentTranscript, true);
      }
      this.currentTranscript = '';
      return;
    }

    // Input transcription (what user said) - accumulate chunks and debounce
    if (content.inputTranscription?.text) {
      // Clear any pending finalization timer
      if (this.userTranscriptTimer) {
        clearTimeout(this.userTranscriptTimer);
        this.userTranscriptTimer = null;
      }

      // Accumulate user transcript
      this.userTranscript += content.inputTranscription.text;
      log('User transcript (accumulated):', this.userTranscript);
      this.config.onTranscript?.('user', this.userTranscript, false);

      // Set timer to finalize after 10s of silence (long for thinking time)
      this.userTranscriptTimer = setTimeout(() => {
        if (this.userTranscript) {
          log('User transcript finalized (timeout):', this.userTranscript);
          this.config.onTranscript?.('user', this.userTranscript, true);
          this.userTranscript = '';
        }
      }, 10000);
    }

    // Output transcription (what model said) - new format for audio-only mode
    // These come in chunks, so we accumulate them
    if (content.outputTranscription?.text) {
      // Finalize user transcript when model starts responding
      if (this.userTranscript) {
        if (this.userTranscriptTimer) {
          clearTimeout(this.userTranscriptTimer);
          this.userTranscriptTimer = null;
        }
        log('User transcript finalized (model responding):', this.userTranscript);
        this.config.onTranscript?.('user', this.userTranscript, true);
        this.userTranscript = '';
      }

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
