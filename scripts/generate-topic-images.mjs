#!/usr/bin/env node
/**
 * Generate topic-based images for all target languages using Glif Z Image Turbo
 * Creates photorealistic couple images with culturally-themed backgrounds
 *
 * Usage: node scripts/generate-topic-images.mjs [--dry-run] [--topic=pet-names] [--lang=pl]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from main .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const GLIF_API_KEY = env.GLIF_API_KEY;
const GLIF_ID = 'cmincelxf0000l104qgpz7iaa'; // Z Image Turbo

// All 18 target languages with cultural context
const LANGUAGES = {
  en: { name: 'English', culture: 'British pub, London street, cozy English cottage' },
  es: { name: 'Spanish', culture: 'Spanish plaza, Mediterranean terrace, flamenco atmosphere' },
  fr: { name: 'French', culture: 'Parisian café, French countryside, Eiffel Tower view' },
  de: { name: 'German', culture: 'German beer garden, Bavarian village, Black Forest setting' },
  it: { name: 'Italian', culture: 'Italian piazza, Tuscan vineyard, Roman architecture' },
  pt: { name: 'Portuguese', culture: 'Lisbon street, Portuguese tiles, coastal Portugal' },
  nl: { name: 'Dutch', culture: 'Amsterdam canal, Dutch windmill, cozy Dutch café' },
  pl: { name: 'Polish', culture: 'Krakow old town, Polish countryside, traditional Polish home' },
  ru: { name: 'Russian', culture: 'Moscow scene, Russian architecture, cozy Russian dacha' },
  uk: { name: 'Ukrainian', culture: 'Kyiv cityscape, Ukrainian village, sunflower fields' },
  tr: { name: 'Turkish', culture: 'Istanbul bazaar, Turkish tea house, Bosphorus view' },
  ro: { name: 'Romanian', culture: 'Bucharest architecture, Transylvanian village, Romanian countryside' },
  sv: { name: 'Swedish', culture: 'Stockholm waterfront, Swedish forest cabin, Scandinavian minimalist home' },
  no: { name: 'Norwegian', culture: 'Norwegian fjord, Oslo harbor, cozy Norwegian cabin' },
  da: { name: 'Danish', culture: 'Copenhagen street, Danish hygge interior, Nordic café' },
  cs: { name: 'Czech', culture: 'Prague old town, Czech countryside, Bohemian café' },
  el: { name: 'Greek', culture: 'Santorini white buildings, Athens acropolis view, Greek taverna' },
  hu: { name: 'Hungarian', culture: 'Budapest Danube view, Hungarian thermal bath, Budapest café' },
};

// Topics with scene descriptions
const TOPICS = {
  'pet-names': {
    name: 'Pet Names & Terms of Endearment',
    scene: 'couple cuddling on sofa, intimate moment, warm lighting, affectionate gaze',
  },
  'i-love-you': {
    name: 'Saying I Love You',
    scene: 'couple holding hands, romantic sunset, tender moment, soft golden light',
  },
  'romantic-phrases': {
    name: 'Romantic Phrases',
    scene: 'couple whispering to each other, romantic dinner setting, candlelight',
  },
  'meeting-family': {
    name: 'Meeting the Family',
    scene: 'couple meeting parents, warm family gathering, welcoming atmosphere, home setting',
  },
  'greetings': {
    name: 'Greetings & Farewells',
    scene: 'couple saying goodbye at door, morning kiss, coffee together, natural light',
  },
  'date-night': {
    name: 'Date Night Vocabulary',
    scene: 'couple at romantic restaurant, elegant dinner, wine glasses, intimate table',
  },
  'grammar': {
    name: 'Grammar Basics',
    scene: 'couple studying together, notebooks and coffee, focused learning, cozy study nook',
  },
  'pronunciation': {
    name: 'Pronunciation Guide',
    scene: 'one partner teaching other to speak, mouth movement focus, patient teaching moment',
  },
  'compliments': {
    name: 'Compliments',
    scene: 'partner blushing from compliment, shy smile, garden or balcony setting',
  },
  'common-words': {
    name: '100 Common Words',
    scene: 'couple with flashcards, vocabulary practice, bright study session, enthusiastic',
  },
  'flirting': {
    name: 'Flirting Phrases',
    scene: 'playful couple, teasing moment, bar or café setting, flirtatious body language',
  },
  'miss-you': {
    name: 'I Miss You',
    scene: 'couple reuniting after time apart, airport or train station, emotional embrace',
  },
  'love-letter': {
    name: 'Love Letter Writing',
    scene: 'person writing letter by window, romantic stationery, thoughtful expression',
  },
  'argue': {
    name: 'Arguments & Disagreements',
    scene: 'couple having serious discussion, but still respectful, kitchen or living room',
  },
  'makeup': {
    name: 'Making Up After Fight',
    scene: 'couple making up, apologetic hug, relief and forgiveness, warm reconciliation',
  },
  'apology': {
    name: 'Saying Sorry',
    scene: 'partner offering flowers apologetically, sincere expression, seeking forgiveness',
  },
  'support': {
    name: 'Emotional Support',
    scene: 'partner comforting other, shoulder to lean on, supportive embrace, soft lighting',
  },
  'first-date': {
    name: 'First Date Phrases',
    scene: 'couple on first date, nervous excitement, café meeting, new romance energy',
  },
  'hard-to-learn': {
    name: 'Is This Language Hard?',
    scene: 'determined learner with books, partner encouraging, challenging but hopeful',
  },
  'essential-phrases': {
    name: 'Essential Phrases',
    scene: 'couple practicing conversation, phrasebook in hand, travel planning together',
  },
  'wedding': {
    name: 'Wedding Vocabulary',
    scene: 'couple at wedding venue, romantic ceremony setting, flowers and decoration',
  },
  'anniversary': {
    name: 'Anniversary Celebrations',
    scene: 'couple celebrating anniversary, champagne toast, special dinner, elegant setting',
  },
  'texting': {
    name: 'Texting & Messaging',
    scene: 'couple smiling at phones, sending sweet messages, modern apartment',
  },
  'jealousy': {
    name: 'Handling Jealousy',
    scene: 'couple having honest conversation, emotional but healthy discussion, trust building',
  },
  'forgiveness': {
    name: 'Forgiveness',
    scene: 'couple forgiving each other, peaceful resolution, holding hands, relief',
  },
};

function generatePrompt(langCode, topicKey) {
  const lang = LANGUAGES[langCode];
  const topic = TOPICS[topicKey];

  if (!lang || !topic) return null;

  return `Photorealistic image of a romantic mixed-ethnicity couple, ${topic.scene}. Background: ${lang.culture}. Warm natural lighting, shallow depth of field, professional photography, 4K quality, intimate and authentic moment. No text or watermarks.`;
}

async function generateImage(prompt, retries = 3) {
  if (!GLIF_API_KEY) {
    console.error('❌ GLIF_API_KEY not set in .env.local');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://simple-api.glif.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GLIF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: GLIF_ID,
          inputs: [prompt],
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.error(`   Attempt ${attempt}/${retries} - Error: ${result.error}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, attempt * 3000));
          continue;
        }
        return null;
      }

      return result.output || null;
    } catch (error) {
      console.error(`   Attempt ${attempt}/${retries} - Error:`, error.message);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, attempt * 3000));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function downloadImage(url, destPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (error) {
    console.error('Download error:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filterTopic = args.find(a => a.startsWith('--topic='))?.split('=')[1];
  const filterLang = args.find(a => a.startsWith('--lang='))?.split('=')[1];

  console.log('🖼️  Topic Image Generator for Love Languages Blog');
  console.log('================================================\n');

  if (!GLIF_API_KEY) {
    console.error('❌ GLIF_API_KEY not found in .env.local');
    console.error('   Add it: echo \'GLIF_API_KEY="your_key"\' >> .env.local');
    process.exit(1);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '../blog/public/blog/topics');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check existing images
  const existingImages = new Set(
    fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : []
  );

  // Build list of images to generate
  const toGenerate = [];
  const languages = filterLang ? [filterLang] : Object.keys(LANGUAGES);
  const topics = filterTopic ? [filterTopic] : Object.keys(TOPICS);

  for (const langCode of languages) {
    for (const topicKey of topics) {
      const filename = `${langCode}-${topicKey}.jpg`;
      if (!existingImages.has(filename)) {
        toGenerate.push({ langCode, topicKey, filename });
      }
    }
  }

  console.log(`📊 Status:`);
  console.log(`   Languages: ${languages.length}`);
  console.log(`   Topics: ${topics.length}`);
  console.log(`   Total combinations: ${languages.length * topics.length}`);
  console.log(`   Already exist: ${existingImages.size}`);
  console.log(`   To generate: ${toGenerate.length}`);
  console.log(`   Estimated credits: ~${toGenerate.length}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN - No images will be generated\n');
    console.log('Sample prompts:');
    toGenerate.slice(0, 3).forEach(({ langCode, topicKey }) => {
      console.log(`\n${langCode}-${topicKey}:`);
      console.log(`   ${generatePrompt(langCode, topicKey)}`);
    });
    return;
  }

  if (toGenerate.length === 0) {
    console.log('✅ All images already exist!');
    return;
  }

  console.log('🚀 Starting generation...\n');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const { langCode, topicKey, filename } = toGenerate[i];
    const lang = LANGUAGES[langCode];
    const topic = TOPICS[topicKey];

    console.log(`[${i + 1}/${toGenerate.length}] ${lang.name} - ${topic.name}`);

    const prompt = generatePrompt(langCode, topicKey);
    const imageUrl = await generateImage(prompt);

    if (imageUrl) {
      const destPath = path.join(outputDir, filename);
      if (await downloadImage(imageUrl, destPath)) {
        console.log(`   ✅ Saved: ${filename}`);
        success++;
      } else {
        console.log(`   ❌ Download failed`);
        failed++;
      }
    } else {
      console.log(`   ❌ Generation failed`);
      failed++;
    }

    // Rate limit: 2 seconds between requests
    if (i < toGenerate.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n================================================');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output: ${outputDir}`);
}

main().catch(console.error);
