/**
 * ElevenLabs Voice Explorer
 * Run: npx ts-node scripts/elevenlabs-voices.ts
 *
 * Lists available voices and searches for suitable voices for the promo video.
 * Requires ELEVENLABS_API_KEY environment variable.
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required');
  console.error('Get your API key from: https://elevenlabs.io/app/settings/api-keys');
  process.exit(1);
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url?: string;
}

interface SharedVoice {
  public_owner_id: string;
  voice_id: string;
  name: string;
  accent: string;
  gender: string;
  age: string;
  descriptive: string;
  use_case: string;
  category: string;
  language: string;
  locale: string;
  description: string;
  preview_url: string;
  usage_character_count_1y: number;
  usage_character_count_7d: number;
  play_api_usage_character_count_1y: number;
  cloned_by_count: number;
  rate: number;
  free_users_allowed: boolean;
  live_moderation_enabled: boolean;
  featured: boolean;
  notice_period: number | null;
  instagram_username: string | null;
  twitter_username: string | null;
  youtube_username: string | null;
  tiktok_username: string | null;
  image_url: string | null;
}

async function getMyVoices(): Promise<Voice[]> {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': API_KEY! }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }

  const data = await response.json();
  return data.voices;
}

async function searchSharedVoices(params: {
  gender?: string;
  language?: string;
  accent?: string;
  use_case?: string;
  search?: string;
  page_size?: number;
}): Promise<SharedVoice[]> {
  const queryParams = new URLSearchParams();
  if (params.gender) queryParams.append('gender', params.gender);
  if (params.language) queryParams.append('language', params.language);
  if (params.accent) queryParams.append('accent', params.accent);
  if (params.use_case) queryParams.append('use_case', params.use_case);
  if (params.search) queryParams.append('search', params.search);
  queryParams.append('page_size', String(params.page_size || 20));

  const response = await fetch(
    `https://api.elevenlabs.io/v1/shared-voices?${queryParams}`,
    { headers: { 'xi-api-key': API_KEY! } }
  );

  if (!response.ok) {
    throw new Error(`Failed to search voices: ${response.statusText}`);
  }

  const data = await response.json();
  return data.voices;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ElevenLabs Voice Explorer');
  console.log('='.repeat(60));

  // List your own voices first
  console.log('\n📚 YOUR VOICES (already in your account):');
  console.log('-'.repeat(40));

  try {
    const myVoices = await getMyVoices();
    if (myVoices.length === 0) {
      console.log('No voices in your account yet.');
    } else {
      myVoices.forEach(v => {
        console.log(`  ${v.name}`);
        console.log(`    ID: ${v.voice_id}`);
        console.log(`    Category: ${v.category}`);
        if (v.labels.gender) console.log(`    Gender: ${v.labels.gender}`);
        if (v.labels.accent) console.log(`    Accent: ${v.labels.accent}`);
        console.log();
      });
    }
  } catch (e) {
    console.error('Error fetching your voices:', e);
  }

  // Search for male voices (Voice A - founder)
  console.log('\n🎙️ VOICE A CANDIDATES (Male, conversational):');
  console.log('-'.repeat(40));

  try {
    const maleVoices = await searchSharedVoices({
      gender: 'male',
      language: 'en',
      use_case: 'conversational',
      page_size: 10
    });

    maleVoices.slice(0, 5).forEach(v => {
      console.log(`  ${v.name}`);
      console.log(`    ID: ${v.voice_id}`);
      console.log(`    Accent: ${v.accent}`);
      console.log(`    Description: ${v.description?.slice(0, 80)}...`);
      console.log(`    Preview: ${v.preview_url}`);
      console.log();
    });
  } catch (e) {
    console.error('Error searching male voices:', e);
  }

  // Search for female Polish voices (Voice B - girlfriend)
  console.log('\n🎙️ VOICE B CANDIDATES (Female, Polish):');
  console.log('-'.repeat(40));

  try {
    const polishVoices = await searchSharedVoices({
      gender: 'female',
      language: 'pl',
      page_size: 10
    });

    if (polishVoices.length === 0) {
      console.log('No Polish female voices found. Trying European accent...');
      const europeanVoices = await searchSharedVoices({
        gender: 'female',
        accent: 'european',
        page_size: 10
      });
      europeanVoices.slice(0, 5).forEach(v => {
        console.log(`  ${v.name}`);
        console.log(`    ID: ${v.voice_id}`);
        console.log(`    Accent: ${v.accent}`);
        console.log(`    Language: ${v.language}`);
        console.log(`    Description: ${v.description?.slice(0, 80)}...`);
        console.log(`    Preview: ${v.preview_url}`);
        console.log();
      });
    } else {
      polishVoices.slice(0, 5).forEach(v => {
        console.log(`  ${v.name}`);
        console.log(`    ID: ${v.voice_id}`);
        console.log(`    Accent: ${v.accent}`);
        console.log(`    Description: ${v.description?.slice(0, 80)}...`);
        console.log(`    Preview: ${v.preview_url}`);
        console.log();
      });
    }
  } catch (e) {
    console.error('Error searching Polish voices:', e);
  }

  // Also search for general female voices with slight accent
  console.log('\n🎙️ VOICE B ALTERNATIVES (Female, slight accent):');
  console.log('-'.repeat(40));

  try {
    const femaleVoices = await searchSharedVoices({
      gender: 'female',
      use_case: 'conversational',
      search: 'warm gentle',
      page_size: 10
    });

    femaleVoices.slice(0, 5).forEach(v => {
      console.log(`  ${v.name}`);
      console.log(`    ID: ${v.voice_id}`);
      console.log(`    Accent: ${v.accent}`);
      console.log(`    Description: ${v.description?.slice(0, 80)}...`);
      console.log(`    Preview: ${v.preview_url}`);
      console.log();
    });
  } catch (e) {
    console.error('Error searching female voices:', e);
  }

  console.log('\n' + '='.repeat(60));
  console.log('NEXT STEPS:');
  console.log('1. Listen to voice previews to pick the best ones');
  console.log('2. Copy the voice_id values you want to use');
  console.log('3. Update scripts/generate-voiceover.ts with chosen voice IDs');
  console.log('4. Run: npx ts-node scripts/generate-voiceover.ts');
  console.log('='.repeat(60));
}

main().catch(console.error);
