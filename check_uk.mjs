import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
  if (m) vars[m[1]] = m[2];
}

const supabase = createClient(vars.SUPABASE_URL, vars.SUPABASE_SERVICE_KEY);

// Check existing UK articles
const { data: ukData } = await supabase
  .from('blog_articles')
  .select('slug, target_lang')
  .eq('native_lang', 'uk');

console.log('Existing UK articles:', ukData?.length || 0);
if (ukData?.length > 0) {
  console.log('Samples:', JSON.stringify(ukData.slice(0, 5), null, 2));
}

// Get a sample article for format reference
const { data: sample } = await supabase
  .from('blog_articles')
  .select('*')
  .eq('category', 'vocabulary')
  .limit(1)
  .single();

if (sample) {
  console.log('\n=== Sample article structure ===');
  console.log('Keys:', Object.keys(sample));
  console.log('title:', sample.title);
  console.log('native_lang:', sample.native_lang);
  console.log('target_lang:', sample.target_lang);
  console.log('category:', sample.category);
  console.log('tags:', sample.tags);
  console.log('read_time:', sample.read_time);
  console.log('content preview:', sample.content?.substring(0, 1500));
}
