/**
 * ElevenLabs Voiceover Generator
 * Run: npx ts-node scripts/generate-voiceover.ts
 *
 * Generates all voiceover audio files for the promo video.
 * Requires ELEVENLABS_API_KEY environment variable.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required');
  console.error('Get your API key from: https://elevenlabs.io/app/settings/api-keys');
  process.exit(1);
}

// ============================================================
// CONFIGURATION
// ============================================================

const VOICE_CONFIG = {
  // Voice A: Male founder - British, warm storyteller
  voiceA: {
    id: 'JBFqnCBsd6RMkjVDRZzb', // George - Warm, Captivating Storyteller (British)
    name: 'Voice A (Founder - George)',
  },

  // Voice B: Female girlfriend - warm and bright
  voiceB: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, engaging
    name: 'Voice B (Girlfriend - Bella)',
  },

  // Model to use - eleven_multilingual_v2 for best quality + language support
  model: 'eleven_multilingual_v2',

  // Voice settings
  settings: {
    stability: 0.5,        // 0-1: Lower = more expressive, higher = more consistent
    similarity_boost: 0.75, // 0-1: How closely to match the original voice
    style: 0.4,            // 0-1: Style exaggeration (v2 only)
    use_speaker_boost: true,
  },
};

// The complete script - TIGHT VERSION (15 lines, ~75-90s)
// Mapped directly to visual scenes
// Voice A = Male founder (student learning Polish)
// Voice B = Female girlfriend (Polish tutor)
const SCRIPT_LINES: { voice: 'A' | 'B'; text: string; filename: string; scene: string }[] = [
  // HERO
  { voice: 'A', text: "My girlfriend's Polish. I kept forgetting every word she taught me.", filename: 'line-01-a.mp3', scene: 'Hero' },
  { voice: 'B', text: "So we built something different.", filename: 'line-02-b.mp3', scene: 'Hero' },

  // LANGUAGES
  { voice: 'A', text: "Eighteen languages. Over three hundred combinations.", filename: 'line-03-a.mp3', scene: 'Languages' },

  // AI CHAT
  { voice: 'B', text: "The AI knows you're learning as a couple — your level, your journey, everything.", filename: 'line-04-b.mp3', scene: 'AI Chat' },

  // LOVE GIFTS
  { voice: 'B', text: "I send him words like little gifts.", filename: 'line-05-b.mp3', scene: 'Love Gifts' },
  { voice: 'A', text: "She sent me tęsknię za tobą. Saved forever, tagged with her name.", filename: 'line-06-a.mp3', scene: 'Love Gifts' },

  // CHALLENGE
  { voice: 'B', text: "When he forgets something — quiz time.", filename: 'line-07-b.mp3', scene: 'Challenge' },

  // LOVE LOG
  { voice: 'A', text: "Everything saved in our Love Log. It's like a diary of us.", filename: 'line-08-a.mp3', scene: 'Love Log' },

  // GAMES
  { voice: 'A', text: "Seven ways to practise every word.", filename: 'line-09-a.mp3', scene: 'Games' },

  // LISTEN MODE
  { voice: 'A', text: "Listen Mode captures real conversations — not textbook phrases.", filename: 'line-10-a.mp3', scene: 'Listen Mode' },

  // FOR TUTORS
  { voice: 'B', text: "I see his progress, his streaks. The app coaches me too.", filename: 'line-11-b.mp3', scene: 'For Tutors' },

  // PROGRESS / EMOTIONAL
  { voice: 'B', text: "It's not just vocabulary.", filename: 'line-12-b.mp3', scene: 'Progress' },
  { voice: 'A', text: "It's how our story gets written.", filename: 'line-13-a.mp3', scene: 'Progress' },

  // CTA
  { voice: 'A', text: "Love Languages.", filename: 'line-14-a.mp3', scene: 'CTA' },
  { voice: 'B', text: "Language learning built for two.", filename: 'line-15-b.mp3', scene: 'CTA' },
];

async function generateSpeech(
  text: string,
  voiceId: string,
  outputPath: string
): Promise<void> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: VOICE_CONFIG.model,
        voice_settings: VOICE_CONFIG.settings,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

async function main() {
  const outputDir = path.join(__dirname, '../public/audio');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('ElevenLabs Voiceover Generator');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log(`Model: ${VOICE_CONFIG.model}`);
  console.log(`Voice A: ${VOICE_CONFIG.voiceA.name} (${VOICE_CONFIG.voiceA.id})`);
  console.log(`Voice B: ${VOICE_CONFIG.voiceB.name} (${VOICE_CONFIG.voiceB.id})`);
  console.log(`Total lines: ${SCRIPT_LINES.length}`);
  console.log('='.repeat(60));
  console.log();

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < SCRIPT_LINES.length; i++) {
    const line = SCRIPT_LINES[i];
    const voiceConfig = line.voice === 'A' ? VOICE_CONFIG.voiceA : VOICE_CONFIG.voiceB;
    const outputPath = path.join(outputDir, line.filename);

    console.log(`[${i + 1}/${SCRIPT_LINES.length}] ${line.scene}: ${line.filename}`);
    console.log(`  Voice: ${voiceConfig.name}`);
    console.log(`  Text: "${line.text}"`);

    try {
      await generateSpeech(line.text, voiceConfig.id, outputPath);
      console.log(`  ✅ Saved`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    if (i < SCRIPT_LINES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log();
  }

  console.log('='.repeat(60));
  console.log('GENERATION COMPLETE');
  console.log(`  ✅ Success: ${successCount}/${SCRIPT_LINES.length}`);
  if (errorCount > 0) {
    console.log(`  ❌ Errors: ${errorCount}/${SCRIPT_LINES.length}`);
  }
  console.log();
  console.log('Next steps:');
  console.log('  1. Preview: npm start (opens Remotion studio)');
  console.log('  2. Render: npm run build');
  console.log('='.repeat(60));
}

main().catch(console.error);
