/**
 * Audio utilities for Gemini Live API
 * - AudioRecorder: Captures microphone audio at 16kHz PCM mono
 * - AudioPlayer: Plays audio from Gemini at 24kHz
 */

// Gemini Live API audio format requirements
export const INPUT_SAMPLE_RATE = 16000;  // 16kHz for input
export const OUTPUT_SAMPLE_RATE = 24000; // 24kHz for output

/**
 * Records audio from the microphone and emits base64-encoded PCM chunks
 */
export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onDataCallback: ((base64Data: string) => void) | null = null;

  /**
   * Start recording from the microphone
   * @param onData Callback that receives base64-encoded audio chunks
   */
  async start(onData: (base64Data: string) => void): Promise<void> {
    this.onDataCallback = onData;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Create audio context - browser will use its native sample rate
      this.audioContext = new AudioContext();
      const nativeSampleRate = this.audioContext.sampleRate;
      console.log(`[AudioRecorder] Native sample rate: ${nativeSampleRate}Hz, target: ${INPUT_SAMPLE_RATE}Hz`);

      // Create source from microphone
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Use ScriptProcessor for audio processing
      const bufferSize = 4096;
      const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Resample if needed (from native rate to 16kHz)
        let outputData: Float32Array;
        if (nativeSampleRate !== INPUT_SAMPLE_RATE) {
          outputData = this.resample(inputData, nativeSampleRate, INPUT_SAMPLE_RATE);
        } else {
          outputData = inputData;
        }

        // Convert Float32 [-1, 1] to Int16 PCM
        const pcmData = new Int16Array(outputData.length);
        for (let i = 0; i < outputData.length; i++) {
          const s = Math.max(-1, Math.min(1, outputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const base64 = this.arrayBufferToBase64(pcmData.buffer);
        this.onDataCallback?.(base64);
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  /**
   * Simple linear resampling from source rate to target rate
   */
  private resample(inputData: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation
      output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
    }

    return output;
  }

  /**
   * Stop recording and release resources
   */
  stop(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onDataCallback = null;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Plays audio received from Gemini Live API
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;

  constructor(onPlaybackStateChange?: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = onPlaybackStateChange || null;
  }

  /**
   * Initialize the audio player
   */
  async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }

    // Resume if suspended (required for some browsers)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Add audio data to the playback queue
   * @param base64Audio Base64-encoded PCM audio data from Gemini
   */
  async play(base64Audio: string): Promise<void> {
    await this.init();

    if (!this.audioContext || !this.gainNode) return;

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert Int16 PCM to Float32
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 0x8000;
      }

      // Create AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.copyToChannel(float32Data, 0);

      // Schedule playback
      this.queueAudio(audioBuffer);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  private queueAudio(buffer: AudioBuffer): void {
    if (!this.audioContext || !this.gainNode) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // Calculate start time for gapless playback
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    // Track playback state
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.onPlaybackStateChange?.(true);
    }

    source.onended = () => {
      // Check if this was the last audio in queue
      if (this.audioContext && this.audioContext.currentTime >= this.nextStartTime - 0.05) {
        this.isPlaying = false;
        this.onPlaybackStateChange?.(false);
      }
    };
  }

  /**
   * Stop playback and clear the queue
   */
  stop(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
    this.onPlaybackStateChange?.(false);
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

/**
 * Check if the browser supports required audio APIs
 */
export function checkAudioSupport(): { supported: boolean; error?: string } {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, error: 'Microphone access not supported in this browser' };
  }

  if (!window.AudioContext) {
    return { supported: false, error: 'Web Audio API not supported in this browser' };
  }

  return { supported: true };
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}
