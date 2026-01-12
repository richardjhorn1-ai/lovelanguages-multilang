/**
 * Sound effects service for UI feedback
 * Handles preloading, playback, and mute state
 */

// Sound effect types
export type SoundEffect =
  | 'correct'
  | 'countdown'
  | 'new-words'
  | 'notification'
  | 'perfect'
  | 'record-start'
  | 'record-stop'
  | 'test-passed'
  | 'tier-up'
  | 'xp-gain';

// All available sounds
const SOUND_FILES: SoundEffect[] = [
  'correct',
  'countdown',
  'new-words',
  'notification',
  'perfect',
  'record-start',
  'record-stop',
  'test-passed',
  'tier-up',
  'xp-gain',
];

// Storage key for mute preference
const MUTE_STORAGE_KEY = 'love-languages-sounds-muted';

class SoundService {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private muted: boolean = false;
  private loaded: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Load mute preference from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MUTE_STORAGE_KEY);
      this.muted = stored === 'true';
    }
  }

  /**
   * Preload all sound files for instant playback
   */
  preload(): void {
    if (this.loaded || typeof window === 'undefined') return;

    SOUND_FILES.forEach((name) => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.sounds.set(name, audio);
    });

    this.loaded = true;
  }

  /**
   * Play a sound effect
   */
  play(name: SoundEffect): void {
    if (this.muted || typeof window === 'undefined') return;

    // Ensure sounds are preloaded
    if (!this.loaded) {
      this.preload();
    }

    const audio = this.sounds.get(name);
    if (audio) {
      // Clone for overlapping playback support
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.volume;
      clone.play().catch(() => {
        // Ignore autoplay errors (user hasn't interacted yet)
      });
    }
  }

  /**
   * Check if sounds are muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    }
    return this.muted;
  }

  /**
   * Set mute state directly
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
}

// Singleton instance
export const sounds = new SoundService();

// Preload sounds when module loads (will run after first interaction)
if (typeof window !== 'undefined') {
  // Preload on first user interaction to comply with autoplay policies
  const preloadOnInteraction = () => {
    sounds.preload();
    window.removeEventListener('click', preloadOnInteraction);
    window.removeEventListener('keydown', preloadOnInteraction);
    window.removeEventListener('touchstart', preloadOnInteraction);
  };

  window.addEventListener('click', preloadOnInteraction);
  window.addEventListener('keydown', preloadOnInteraction);
  window.addEventListener('touchstart', preloadOnInteraction);
}
