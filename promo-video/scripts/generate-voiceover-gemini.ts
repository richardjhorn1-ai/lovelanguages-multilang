/**
 * Gemini TTS Voiceover Generator (backup)
 * Run: npx ts-node scripts/generate-voiceover-gemini.ts
 *
 * Generates voiceover audio using Google Gemini TTS.
 * Requires GEMINI_API_KEY environment variable.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Voice configuration
const VOICE_CONFIG = {
  voiceA: 'Charon',  // Founder - firm, clear (male)
  voiceB: 'Kore',    // Girlfriend - warm, expressive (female)
  model: 'gemini-2.5-flash-preview-tts',
};

// The script - TIGHT VERSION (15 lines, ~75-90s)
// Voice A = Male founder (Charon), Voice B = Female girlfriend (Kore)
const SCRIPT_LINES: { voice: 'A' | 'B'; text: string; filename: string; scene: string }[] = [
  // HERO
  { voice: 'A', text: "My girlfriend's Polish. I kept forgetting every word she taught me.", filename: 'line-01-a.wav', scene: 'Hero' },
  { voice: 'B', text: "So we built something different.", filename: 'line-02-b.wav', scene: 'Hero' },

  // LANGUAGES
  { voice: 'A', text: "Eighteen languages. Over three hundred combinations.", filename: 'line-03-a.wav', scene: 'Languages' },

  // AI CHAT
  { voice: 'B', text: "The AI knows you're learning as a couple — your level, your journey, everything.", filename: 'line-04-b.wav', scene: 'AI Chat' },

  // LOVE GIFTS
  { voice: 'B', text: "I send him words like little gifts.", filename: 'line-05-b.wav', scene: 'Love Gifts' },
  { voice: 'A', text: "She sent me tęsknię za tobą. Saved forever, tagged with her name.", filename: 'line-06-a.wav', scene: 'Love Gifts' },

  // CHALLENGE
  { voice: 'B', text: "When he forgets something — quiz time.", filename: 'line-07-b.wav', scene: 'Challenge' },

  // LOVE LOG
  { voice: 'A', text: "Everything saved in our Love Log. It's like a diary of us.", filename: 'line-08-a.wav', scene: 'Love Log' },

  // GAMES
  { voice: 'A', text: "Seven ways to practise every word.", filename: 'line-09-a.wav', scene: 'Games' },

  // LISTEN MODE
  { voice: 'A', text: "Listen Mode captures real conversations — not textbook phrases.", filename: 'line-10-a.wav', scene: 'Listen Mode' },

  // FOR TUTORS
  { voice: 'B', text: "I see his progress, his streaks. The app coaches me too.", filename: 'line-11-b.wav', scene: 'For Tutors' },

  // PROGRESS / EMOTIONAL
  { voice: 'B', text: "It's not just vocabulary.", filename: 'line-12-b.wav', scene: 'Progress' },
  { voice: 'A', text: "It's how our story gets written.", filename: 'line-13-a.wav', scene: 'Progress' },

  // CTA
  { voice: 'A', text: "Love Languages.", filename: 'line-14-a.wav', scene: 'CTA' },
  { voice: 'B', text: "Language learning built for two.", filename: 'line-15-b.wav', scene: 'CTA' },
];

// Convert raw PCM to WAV format
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize - 8;

  const wav = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  wav.write('RIFF', 0);
  wav.writeUInt32LE(fileSize, 4);
  wav.write('WAVE', 8);

  // fmt chunk
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16); // fmt chunk size
  wav.writeUInt16LE(1, 20); // audio format (PCM)
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);
  pcmData.copy(wav, 44);

  return wav;
}

async function generateSpeech(
  text: string,
  voiceName: string,
  outputPath: string
): Promise<void> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${VOICE_CONFIG.model}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract audio data from response
  const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) {
    throw new Error('No audio data in response');
  }

  // Decode base64 PCM data
  const pcmBuffer = Buffer.from(inlineData.data, 'base64');

  // Convert PCM to WAV (Gemini returns audio/L16 at 24000Hz)
  const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);

  fs.writeFileSync(outputPath, wavBuffer);
}

async function main() {
  const outputDir = path.join(__dirname, '../public/audio');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('Gemini TTS Voiceover Generator');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log(`Model: ${VOICE_CONFIG.model}`);
  console.log(`Voice A: ${VOICE_CONFIG.voiceA}`);
  console.log(`Voice B: ${VOICE_CONFIG.voiceB}`);
  console.log(`Total lines: ${SCRIPT_LINES.length}`);
  console.log('='.repeat(60));
  console.log();

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < SCRIPT_LINES.length; i++) {
    const line = SCRIPT_LINES[i];
    const voiceName = line.voice === 'A' ? VOICE_CONFIG.voiceA : VOICE_CONFIG.voiceB;
    const outputPath = path.join(outputDir, line.filename);

    console.log(`[${i + 1}/${SCRIPT_LINES.length}] ${line.scene}: ${line.filename}`);
    console.log(`  Voice: ${voiceName}`);
    console.log(`  Text: "${line.text}"`);

    try {
      await generateSpeech(line.text, voiceName, outputPath);
      console.log(`  ✅ Saved`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      errorCount++;
    }

    // Delay to respect rate limits (10 requests/min = 6 sec between requests)
    if (i < SCRIPT_LINES.length - 1) {
      console.log('  (waiting 7s for rate limit...)');
      await new Promise(resolve => setTimeout(resolve, 7000));
    }

    console.log();
  }

  console.log('='.repeat(60));
  console.log('GENERATION COMPLETE');
  console.log(`  ✅ Success: ${successCount}/${SCRIPT_LINES.length}`);
  if (errorCount > 0) {
    console.log(`  ❌ Errors: ${errorCount}/${SCRIPT_LINES.length}`);
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
