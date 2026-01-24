import { Audio, Sequence, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { VOICEOVER_LINES } from './Voiceover';

/**
 * Audio Mix Component
 *
 * Combines all audio layers for the promo video:
 * 1. Background music (continuous, ducked during voiceover)
 * 2. Voiceover lines (timed to scenes)
 * 3. Sound effects (timed to specific moments)
 */

// Sound effect definitions with timing
interface SoundEffect {
  file: string;
  startFrame: number;
  volume?: number;
}

// Scene timing reference (30fps) - matched to voiceover:
// Hero: 0-375 (0-12.5s)
// Languages: 375-600 (12.5-20s)
// AI Chat: 600-855 (20-28.5s)
// Love Gifts: 855-1140 (28.5-38s)
// Challenge: 1140-1350 (38-45s)
// Love Log: 1350-1545 (45-51.5s)
// Games: 1545-1815 (51.5-60.5s)
// Progress: 1815-2055 (60.5-68.5s)
// CTA: 2055-2295 (68.5-76.5s)

const SOUND_EFFECTS: SoundEffect[] = [
  // Hero scene - sparkle on emotional moment
  { file: 'sfx/sparkle.mp3', startFrame: 300, volume: 0.4 },

  // Languages scene - swoosh for flag animations
  { file: 'sfx/swoosh-up.mp3', startFrame: 400, volume: 0.3 },
  { file: 'sfx/app-notification.mp3', startFrame: 550, volume: 0.4 }, // 306 counter reveal

  // AI Chat scene - ping for messages
  { file: 'sfx/ping.mp3', startFrame: 650, volume: 0.4 },
  { file: 'sfx/pop.mp3', startFrame: 770, volume: 0.3 },

  // Love Gifts scene - gift reveal sounds
  { file: 'sfx/gift-reveal.mp3', startFrame: 900, volume: 0.5 },
  { file: 'sfx/heartbeat.mp3', startFrame: 950, volume: 0.25 },
  { file: 'sfx/app-new-words.mp3', startFrame: 1050, volume: 0.4 },

  // Challenge scene - quiz sounds
  { file: 'sfx/app-notification.mp3', startFrame: 1170, volume: 0.4 },
  { file: 'sfx/app-correct.mp3', startFrame: 1250, volume: 0.5 },
  { file: 'sfx/app-test-passed.mp3', startFrame: 1330, volume: 0.5 },

  // Love Log scene - word card sounds
  { file: 'sfx/slide.mp3', startFrame: 1380, volume: 0.3 },
  { file: 'sfx/pop.mp3', startFrame: 1450, volume: 0.3 },
  { file: 'sfx/pop.mp3', startFrame: 1500, volume: 0.3 },

  // Games scene - game mode transitions
  { file: 'sfx/whoosh-soft.mp3', startFrame: 1580, volume: 0.3 },
  { file: 'sfx/tap.mp3', startFrame: 1680, volume: 0.4 },
  { file: 'sfx/app-correct.mp3', startFrame: 1760, volume: 0.4 },

  // Progress scene - XP and level up
  { file: 'sfx/app-xp-gain.mp3', startFrame: 1860, volume: 0.5 },
  { file: 'sfx/app-tier-up.mp3', startFrame: 1960, volume: 0.5 },
  { file: 'sfx/confetti.mp3', startFrame: 2030, volume: 0.4 },

  // CTA scene - final sparkle
  { file: 'sfx/sparkle.mp3', startFrame: 2100, volume: 0.5 },
  { file: 'sfx/app-perfect.mp3', startFrame: 2200, volume: 0.4 },
];

interface AudioMixProps {
  /** Master volume for all audio (0-1) */
  masterVolume?: number;
  /** Background music volume (0-1) */
  musicVolume?: number;
  /** Voiceover volume (0-1) */
  voiceoverVolume?: number;
  /** Sound effects volume (0-1) */
  sfxVolume?: number;
  /** Whether to duck music during voiceover */
  duckMusic?: boolean;
}

export const AudioMix: React.FC<AudioMixProps> = ({
  masterVolume = 1,
  musicVolume = 0.25,
  voiceoverVolume = 1,
  sfxVolume = 0.6,
  duckMusic = true,
}) => {
  const frame = useCurrentFrame();

  // Calculate if voiceover is currently playing (for ducking)
  const isVoiceoverPlaying = VOICEOVER_LINES.some(
    line => frame >= line.startFrame && frame < line.startFrame + line.durationFrames
  );

  // Duck music volume when voiceover is playing
  const currentMusicVolume = duckMusic && isVoiceoverPlaying
    ? musicVolume * 0.4  // Duck to 40% during voiceover
    : musicVolume;

  return (
    <>
      {/* Background Music - loops throughout */}
      <Audio
        src={staticFile('audio/background-music.mp3')}
        volume={currentMusicVolume * masterVolume}
        loop
      />

      {/* Voiceover Lines */}
      {VOICEOVER_LINES.map((line, index) => (
        <Sequence
          key={`vo-${index}`}
          from={line.startFrame}
          durationInFrames={line.durationFrames}
        >
          <Audio
            src={staticFile(`audio/${line.file}`)}
            volume={voiceoverVolume * masterVolume}
          />
        </Sequence>
      ))}

      {/* Sound Effects */}
      {SOUND_EFFECTS.map((sfx, index) => (
        <Sequence
          key={`sfx-${index}`}
          from={sfx.startFrame}
          durationInFrames={90} // ~3 seconds max for any SFX
        >
          <Audio
            src={staticFile(`audio/${sfx.file}`)}
            volume={(sfx.volume || 0.5) * sfxVolume * masterVolume}
          />
        </Sequence>
      ))}
    </>
  );
};

export default AudioMix;
