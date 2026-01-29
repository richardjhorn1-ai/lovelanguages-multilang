import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1].trim()] = match[2];
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const broken = [
  { native: 'no', target: 'hu', slug: 'grammar-basics-for-beginners' },
  { native: 'uk', target: 'sv', slug: 'greetings-and-farewells' },
  { native: 'sv', target: 'nl', slug: 'meeting-your-partner-s-family' },
  { native: 'it', target: 'tr', slug: 'romantic-phrases-for-every-occasion' },
  { native: 'cs', target: 'pt', slug: 'essential-phrases-for-couples' },
];

async function check() {
  for (const b of broken) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, slug, native_lang, target_lang, published')
      .eq('native_lang', b.native)
      .eq('target_lang', b.target)
      .eq('slug', b.slug)
      .single();

    console.log(`${b.native}/${b.target}/${b.slug}:`);
    if (data) {
      console.log(`  published = ${data.published}`);
    } else {
      console.log(`  NOT FOUND in DB! Error: ${error?.message}`);
    }
  }
}

check();
