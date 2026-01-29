#!/usr/bin/env node
/**
 * Direct insert for Greek (el) native language articles into Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  let value = line.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// Read articles from JSON file
const articles = JSON.parse(fs.readFileSync('./generated/el_articles.json', 'utf8'));

async function main() {
  const results = { success: [], failed: [] };

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`[${i + 1}/${articles.length}] Inserting: ${article.slug}`);

    try {
      const { error } = await supabase
        .from('blog_articles')
        .insert(article);

      if (error) {
        console.error(`  ❌ DB Error: ${error.message}`);
        results.failed.push({ slug: article.slug, error: error.message });
      } else {
        console.log(`  ✅ Saved`);
        results.success.push(article.slug);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      results.failed.push({ slug: article.slug, error: err.message });
    }
  }

  console.log('\n=== INSERT COMPLETE ===');
  console.log(`Success: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);

  // Save log
  const logDir = './generation_logs';
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logContent = `# Greek (el) Batch 1 Generation Log
Generated: ${new Date().toISOString()}

## Summary
- Native Language: Greek (el)
- Total attempted: ${articles.length}
- Success: ${results.success.length}
- Failed: ${results.failed.length}

## Topics Generated
1. 100 Most Common Words (100-words)
2. Pet Names & Endearments (pet-names)
3. How to Say I Love You (i-love-you)
4. Greetings & Farewells (greetings)
5. Date Night Vocabulary (date-night)

## Target Languages (17)
en, de, fr, es, it, pt, pl, ru, uk, nl, tr, ro, sv, no, da, cs, hu

## Successful Articles
${results.success.map(s => `- ✅ ${s}`).join('\n')}

## Failed Articles
${results.failed.map(f => `- ❌ ${f.slug}: ${f.error}`).join('\n') || 'None'}
`;

  fs.writeFileSync(`${logDir}/el_batch1.md`, logContent);
  console.log(`\nLog saved to ${logDir}/el_batch1.md`);
}

main().catch(console.error);
