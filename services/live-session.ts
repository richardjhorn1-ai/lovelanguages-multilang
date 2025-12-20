
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export interface LiveSessionConfig {
  userLog?: string[]; 
  onTranscript?: (role: 'user' | 'model', text: string, isFinal: boolean) => void;
  onClose?: () => void;
}

export class LiveSession {
  private client: GoogleGenAI;
  private session: any;
  private inputAudioContext?: AudioContext;
  private outputAudioContext?: AudioContext;
  private inputSource?: MediaStreamAudioSourceNode;
  private processor?: ScriptProcessorNode;
  private audioStream?: MediaStream;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private config: LiveSessionConfig;
  private currentInput = "";
  private currentOutput = "";

  constructor(config: LiveSessionConfig) {
    // @ts-ignore
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.config = config;
  }

  async connect(mode: 'listen' | 'chat' | 'tutor') {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    const COMMON_INSTRUCTIONS = `
You are "Cupid," a supportive Polish coach.
GLOBAL INVARIANTS:
- NEVER reply fully in Polish.
- ALWAYS explain using clear English first.
- Clarity matters more than immersion.
- TONE: Warm, encouraging, human.
`;

    const INSTRUCTIONS = {
        listen: `${COMMON_INSTRUCTIONS}
**MODE: THE SILENT SUPPORTER.** Listen and clarify pragmatics or translations in English briefly.`,
        chat: `${COMMON_INSTRUCTIONS}
**MODE: CONVERSATIONAL COACH.** Natural conversation in English. Introduce Polish phrases periodically. Help the student construct sentences.`,
        tutor: `${COMMON_INSTRUCTIONS}
**MODE: EXPERT TUTOR.** Explain ONE concept in English, provide clear examples, and show how it helps them with their partner.`
    };

    const sessionPromise = this.client.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: async () => {
          await this.startAudioInput(sessionPromise);
        },
        onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
        onclose: () => {
            this.cleanup();
            this.config.onClose?.();
        },
        onerror: (err) => console.error('Live Session Error', err),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: INSTRUCTIONS[mode],
      },
    });
    
    this.session = await sessionPromise;
  }

  private async startAudioInput(sessionPromise: Promise<any>) {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.inputAudioContext) return;
      this.inputSource = this.inputAudioContext.createMediaStreamSource(this.audioStream);
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = this.createPcmBlob(inputData);
        sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
    } catch (e) {
      console.error("Mic access denied", e);
    }
  }

  private async handleMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;
    
    if (serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
        this.playAudioChunk(serverContent.modelTurn.parts[0].inlineData.data);
    }

    if (serverContent?.inputTranscription) {
        this.currentInput += serverContent.inputTranscription.text;
        this.config.onTranscript?.('user', this.currentInput, false);
    }
    if (serverContent?.outputTranscription) {
        this.currentOutput += serverContent.outputTranscription.text;
        this.config.onTranscript?.('model', this.currentOutput, false);
    }

    if (serverContent?.turnComplete) {
        const finalInput = this.currentInput.trim();
        const finalOutput = this.currentOutput.trim();
        if (finalInput) this.config.onTranscript?.('user', finalInput, true);
        if (finalOutput) this.config.onTranscript?.('model', finalOutput, true);
        this.currentInput = "";
        this.currentOutput = "";
    }

    if (serverContent?.interrupted) {
        for (const source of this.sources.values()) { source.stop(); }
        this.sources.clear();
        this.nextStartTime = 0;
        this.currentOutput = ""; 
        this.config.onTranscript?.('model', "", false);
    }
  }

  private async playAudioChunk(base64: string) {
    if (!this.outputAudioContext) return;
    const arrayBuffer = this.base64ToArrayBuffer(base64);
    const audioBuffer = await this.decodeAudioData(new Uint8Array(arrayBuffer), this.outputAudioContext, 24000, 1);
    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  disconnect() { this.cleanup(); if (this.session) this.session.close(); }

  private cleanup() {
    this.audioStream?.getTracks().forEach(t => t.stop());
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
  }

  private createPcmBlob(data: Float32Array): { mimeType: string; data: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    const uint8 = new Uint8Array(int16.buffer);
    return { data: this.arrayBufferToBase64(uint8), mimeType: 'audio/pcm;rate=16000' };
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(buffer[i]); }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes.buffer;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
    }
    return buffer;
  }
}
