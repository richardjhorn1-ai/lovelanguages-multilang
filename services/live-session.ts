export interface LiveSessionConfig {
  userLog?: string[];
  onTranscript?: (role: 'user' | 'model', text: string, isFinal: boolean) => void;
  onClose?: () => void;
}

export class LiveSession {
  constructor(private config: LiveSessionConfig) {}

  async connect(_mode?: string) {
    console.warn('Live session is disabled until a server-side proxy is available.');
    this.config.onClose?.();
    throw new Error('Live session requires a secured server proxy and cannot run in the browser.');
  }

  disconnect() {
    this.config.onClose?.();
  }
}
