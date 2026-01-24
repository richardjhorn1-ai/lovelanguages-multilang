import { Audio, Sequence, staticFile } from 'remotion';

// Voiceover line definition
interface VoiceoverLine {
  file: string;        // Audio filename in public/audio/
  startFrame: number;  // When this line starts
  durationFrames: number; // How long the audio plays
  voice: 'A' | 'B';    // Which voice (for reference)
}

// All voiceover lines with timing (30fps)
// TIGHT SCRIPT - 13 lines, ~88 second video
// Voice A = founder (male student), Voice B = girlfriend (Polish tutor)
// Scene order: Hero → Languages → LoveGifts → Challenge → LoveLog → Games → Progress → AIChat → CTA
export const VOICEOVER_LINES: VoiceoverLine[] = [
  // HERO (0-7s = frames 0-210)
  { file: 'line-01-a.mp3', startFrame: 0, durationFrames: 122, voice: 'A' },     // "My girlfriend's Polish. I kept forgetting..."
  { file: 'line-02-b.mp3', startFrame: 130, durationFrames: 77, voice: 'B' },    // "So we built something different."

  // LANGUAGES (7-15s = frames 210-450)
  { file: 'line-03-a.mp3', startFrame: 220, durationFrames: 104, voice: 'A' },   // "Eighteen languages. Over three hundred..."

  // LOVE GIFTS (15-27s = frames 450-810)
  { file: 'line-05-b.mp3', startFrame: 460, durationFrames: 68, voice: 'B' },    // "I send him words like little gifts."
  { file: 'line-06-a.mp3', startFrame: 540, durationFrames: 132, voice: 'A' },   // "She sent me tęsknię za tobą..."

  // CHALLENGE (27-39s = frames 810-1170)
  { file: 'line-07-b.mp3', startFrame: 820, durationFrames: 73, voice: 'B' },    // "When he forgets something — quiz time."

  // LOVE LOG (39-47s = frames 1170-1410)
  { file: 'line-08-a.mp3', startFrame: 1180, durationFrames: 111, voice: 'A' },  // "Everything saved in our Love Log..."

  // GAMES (47-61s = frames 1410-1830)
  { file: 'line-09-a.mp3', startFrame: 1420, durationFrames: 72, voice: 'A' },   // "Seven ways to practise every word."

  // PROGRESS (61-71s = frames 1830-2130)
  { file: 'line-12-b.mp3', startFrame: 1840, durationFrames: 52, voice: 'B' },   // "It's not just vocabulary."
  { file: 'line-13-a.mp3', startFrame: 1900, durationFrames: 61, voice: 'A' },   // "It's how our story gets written."

  // AI CHAT (71-81s = frames 2130-2430)
  { file: 'line-04-b.mp3', startFrame: 2140, durationFrames: 138, voice: 'B' },  // "The AI knows you're learning as a couple..."

  // CTA (81-88s = frames 2430-2640)
  { file: 'line-14-a.mp3', startFrame: 2440, durationFrames: 39, voice: 'A' },   // "Love Languages."
  { file: 'line-15-b.mp3', startFrame: 2490, durationFrames: 62, voice: 'B' },   // "Language learning built for two."
];

// Helper to get total duration
export const TOTAL_VOICEOVER_FRAMES = 2552; // Last line ends at frame 2552 (~85s at 30fps)

interface VoiceoverProps {
  volume?: number;
}

export const Voiceover: React.FC<VoiceoverProps> = ({ volume = 1 }) => {
  return (
    <>
      {VOICEOVER_LINES.map((line, index) => (
        <Sequence key={index} from={line.startFrame} durationInFrames={line.durationFrames}>
          <Audio
            src={staticFile(`audio/${line.file}`)}
            volume={volume}
          />
        </Sequence>
      ))}
    </>
  );
};

// Export script text for reference (matches scene order)
export const SCRIPT_LINES = [
  // HERO
  { voice: 'A', text: "My girlfriend's Polish. I kept forgetting every word she taught me." },
  { voice: 'B', text: "So we built something different." },
  // LANGUAGES
  { voice: 'A', text: "Eighteen languages. Over three hundred combinations." },
  // LOVE GIFTS
  { voice: 'B', text: "I send him words like little gifts." },
  { voice: 'A', text: "She sent me tęsknię za tobą. Saved forever, tagged with her name." },
  // CHALLENGE
  { voice: 'B', text: "When he forgets something — quiz time." },
  // LOVE LOG
  { voice: 'A', text: "Everything saved in our Love Log. It's like a diary of us." },
  // GAMES
  { voice: 'A', text: "Seven ways to practise every word." },
  // PROGRESS
  { voice: 'B', text: "It's not just vocabulary." },
  { voice: 'A', text: "It's how our story gets written." },
  // AI CHAT
  { voice: 'B', text: "The AI knows you're learning as a couple — your level, your journey, everything." },
  // CTA
  { voice: 'A', text: "Love Languages." },
  { voice: 'B', text: "Language learning built for two." },
];
