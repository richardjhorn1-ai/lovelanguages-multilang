
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { RefObject } from 'react';

export interface LiveSessionConfig {
  videoRef?: RefObject<HTMLVideoElement | null>;
  userLog?: string[]; 
  onTranscript?: (role: 'user' | 'model', text: string) => void;
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
  private videoInterval?: number;
  private config: LiveSessionConfig;

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

    // Prepare context string
    const knownWords = this.config.userLog && this.config.userLog.length > 0 
      ? `User knows: ${this.config.userLog.slice(0, 30).join(', ')}.`
      : "User is a beginner.";

    // --- DYNAMIC SYSTEM INSTRUCTIONS (AUDIO OPTIMIZED) ---
    // Audio rules: Keep it short. No markdown. Phonetic help is key.
    
    const INSTRUCTIONS = {
        listen: `
ROLE: THE SILENT INTERPRETER
1. **BEHAVIOR:** Listen to the background audio.
2. **INTERVENTION:** DO NOT SPEAK unless the user addresses you directly (e.g., "Translate that," "What does that mean?").
3. **STYLE:** Concise, helpful. If you translate, give the Polish word and the English meaning immediately.
4. **GOAL:** Capture vocabulary for the transcript logs.
`,
        chat: `
ROLE: THE WINGMAN COACH
1. **BEHAVIOR:** You are on a date with the user (who speaks English) and their partner (who speaks Polish).
2. **STYLE:** Friendly, charming, brief.
3. **METHOD:**
   - If they ask how to say something, give the Polish phrase followed by a slow, clear pronunciation guide.
   - If they try to speak Polish and fail, correct them gently: "Close! Try saying..."
4. **CONTEXT:** ${knownWords}
`,
        tutor: `
ROLE: THE ORAL DRILL INSTRUCTOR
1. **BEHAVIOR:** Conduct a rapid-fire oral practice session.
2. **METHOD:**
   - Give a simple English phrase (e.g., "I like coffee").
   - Wait for their Polish attempt.
   - Correct immediate pronunciation or grammar errors.
   - Move to the next phrase.
3. **FOCUS:** Keep the flow moving. Don't lecture. Drill.
4. **CONTEXT:** ${knownWords}
`
    };

    const sessionPromise = this.client.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: async () => {
          console.log(`Live Session Connected (${mode})`);
          await this.startAudioInput(sessionPromise);
          if (this.config.videoRef) {
            this.startVideoInput(sessionPromise);
          }
        },
        onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
        onclose: () => {
            console.log('Live Session Closed');
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

  private startVideoInput(sessionPromise: Promise<any>) {
    if (!this.config.videoRef) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    this.videoInterval = window.setInterval(() => {
        const video = this.config.videoRef?.current;
        if (!video || !video.videoWidth || !ctx) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        
        sessionPromise.then(session => {
            session.sendRealtimeInput({
                media: { mimeType: 'image/jpeg', data: base64Data }
            });
        });
    }, 1000);
  }

  private async handleMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;
    
    if (serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
        const base64Audio = serverContent.modelTurn.parts[0].inlineData.data;
        this.playAudioChunk(base64Audio);
    }

    if (serverContent?.inputTranscription) {
        this.config.onTranscript?.('user', serverContent.inputTranscription.text);
    }
    if (serverContent?.outputTranscription) {
        this.config.onTranscript?.('model', serverContent.outputTranscription.text);
    }
  }

  private async playAudioChunk(base64: string) {
    if (!this.outputAudioContext) return;

    const arrayBuffer = this.base64ToArrayBuffer(base64);
    const audioBuffer = await this.decodeAudioData(
        new Uint8Array(arrayBuffer), 
        this.outputAudioContext,
        24000, 
        1
    );

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  disconnect() {
    this.cleanup();
  }

  private cleanup() {
    if (this.videoInterval) clearInterval(this.videoInterval);
    
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
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const uint8 = new Uint8Array(int16.buffer);
    return {
      data: this.arrayBufferToBase64(uint8),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}
