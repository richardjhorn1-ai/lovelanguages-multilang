#!/usr/bin/env node
/**
 * Batch generator for Ukrainian (uk) native language articles
 * Generates missing "100 Most Common Words" and "Pet Names & Endearments" articles
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Language names in Ukrainian and English
const languageNames = {
  en: { uk: 'англійська', en: 'english' },
  de: { uk: 'німецька', en: 'german' },
  fr: { uk: 'французька', en: 'french' },
  es: { uk: 'іспанська', en: 'spanish' },
  it: { uk: 'італійська', en: 'italian' },
  pt: { uk: 'португальська', en: 'portuguese' },
  pl: { uk: 'польська', en: 'polish' },
  ru: { uk: 'російська', en: 'russian' },
  nl: { uk: 'нідерландська', en: 'dutch' },
  tr: { uk: 'турецька', en: 'turkish' },
  ro: { uk: 'румунська', en: 'romanian' },
  sv: { uk: 'шведська', en: 'swedish' },
  no: { uk: 'норвезька', en: 'norwegian' },
  da: { uk: 'данська', en: 'danish' },
  cs: { uk: 'чеська', en: 'czech' },
  el: { uk: 'грецька', en: 'greek' },
  hu: { uk: 'угорська', en: 'hungarian' }
};

const topics = {
  '100-words': {
    slugTemplate: (langEn) => `100-most-common-${langEn}-words`,
    titleTemplate: (langUk) => `100 найпоширеніших слів ${langUk} мови`,
    promptTemplate: (langUk, langEn) => `Write a comprehensive vocabulary article in UKRAINIAN about "100 найпоширеніших слів ${langUk} мови" (100 Most Common ${langEn.charAt(0).toUpperCase() + langEn.slice(1)} Words) for Ukrainian speakers learning ${langEn}. The article should include at least 50 of the most essential words organized by category (verbs, nouns, adjectives, etc.) with ${langEn} words, Ukrainian translations, and pronunciation guides.`
  },
  'pet-names': {
    slugTemplate: (langEn) => `${langEn}-pet-names-and-endearments`,
    titleTemplate: (langUk) => `Ніжні звертання та ласкаві імена ${langUk} мовою`,
    promptTemplate: (langUk, langEn) => `Write a romantic vocabulary article in UKRAINIAN about "${langUk} ніжні звертання та ласкаві імена" (${langEn.charAt(0).toUpperCase() + langEn.slice(1)} Pet Names and Endearments) for Ukrainian speakers learning ${langEn}. Include at least 25-30 terms of endearment with ${langEn} words, Ukrainian translations, pronunciation guides, and cultural context about when to use each term.`
  }
};

const systemPrompt = `You are an expert language educator writing SEO-optimized blog articles in UKRAINIAN for "Love Languages" - an app that helps couples learn languages together.

CRITICAL: ALL content must be written in UKRAINIAN (українською мовою). Only the target language words/phrases being taught should be in the target language.

Your articles should be:
1. WRITTEN IN UKRAINIAN - Title, description, all explanatory text in Ukrainian
2. ACCURATE - Target language spelling and pronunciation must be perfect
3. EDUCATIONAL - Clear explanations with pronunciation guides
4. ENGAGING - Written for couples, romantic tone, practical examples
5. SEO-OPTIMIZED - Natural keyword usage, good heading structure

## Available MDX Components

Always import these at the top:
\`\`\`
import VocabCard from '@components/VocabCard.astro';
import ConjugationTable from '@components/ConjugationTable.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';
\`\`\`

### VocabCard - For individual words/phrases
\`\`\`jsx
<VocabCard
  word="[target language word]"
  translation="[Ukrainian translation]"
  pronunciation="[phonetic pronunciation]"
  example="[example sentence in target language]"
/>
\`\`\`

### PhraseOfDay - Featured phrase (use 1 per article, near top)
\`\`\`jsx
<PhraseOfDay
  word="[target language phrase]"
  translation="[Ukrainian translation]"
  pronunciation="[phonetic]"
  context="[context explanation in Ukrainian]"
/>
\`\`\`

### CultureTip - Cultural insights (use 1-2 per article)
\`\`\`jsx
<CultureTip title="[Title in Ukrainian]">
[Cultural insight in Ukrainian...]
</CultureTip>
\`\`\`

### CTA - Call to action (always at the end)
\`\`\`jsx
<CTA />
\`\`\`

## Output Format
Return ONLY a valid JSON object (no markdown code blocks):
{
  "title": "Title in UKRAINIAN",
  "description": "150-160 char meta description in UKRAINIAN",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full MDX content with Ukrainian explanatory text..."
}`;

async function generateArticle(targetLang, topicKey) {
  const topic = topics[topicKey];
  const langNames = languageNames[targetLang];
  const slug = topic.slugTemplate(langNames.en);
  const prompt = topic.promptTemplate(langNames.uk, langNames.en);

  console.log(`\nGenerating: ${slug} (uk -> ${targetLang})`);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `${prompt}

Target language: ${langNames.en} (${targetLang})
Native language: Ukrainian (uk)

Remember:
- ALL explanatory text in UKRAINIAN
- Target language words with Ukrainian translations
- Include pronunciation guides
- Use MDX components appropriately
- Include at least 3-4 VocabCard components
- Include 1 PhraseOfDay near the top
- Include 1-2 CultureTip components
- End with <CTA />

Return ONLY valid JSON with: title, description, tags, content`
    }]
  });

  const textContent = message.content.find(c => c.type === 'text');
  let jsonStr = textContent.text.trim();

  // Extract JSON if wrapped
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  const parsed = JSON.parse(jsonStr);

  return {
    slug,
    native_lang: 'uk',
    target_lang: targetLang,
    title: parsed.title,
    description: parsed.description,
    category: 'vocabulary',
    difficulty: 'beginner',
    read_time: 6,
    image: `/images/blog/${targetLang}-vocabulary.jpg`,
    tags: parsed.tags || ['vocabulary', 'learning', langNames.uk],
    content: parsed.content,
    published: true,
    date: new Date().toISOString().split('T')[0]
  };
}

async function main() {
  const targetLangs = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'nl', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];
  const topicKeys = ['100-words', 'pet-names'];

  const results = {
    success: [],
    failed: []
  };

  let total = targetLangs.length * topicKeys.length;
  let current = 0;

  for (const targetLang of targetLangs) {
    for (const topicKey of topicKeys) {
      current++;
      console.log(`\n[${current}/${total}] Processing ${topicKey} for ${targetLang}...`);

      try {
        const article = await generateArticle(targetLang, topicKey);

        // Insert into Supabase
        const { error } = await supabase
          .from('blog_articles')
          .insert(article);

        if (error) {
          console.error(`  ❌ DB Error: ${error.message}`);
          results.failed.push({ lang: targetLang, topic: topicKey, error: error.message });
        } else {
          console.log(`  ✅ Saved: ${article.slug}`);
          results.success.push({ lang: targetLang, topic: topicKey, slug: article.slug });
        }

        // Rate limiting - wait 2 seconds between requests
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        results.failed.push({ lang: targetLang, topic: topicKey, error: err.message });
      }
    }
  }

  // Write summary
  console.log('\n=== GENERATION COMPLETE ===');
  console.log(`Success: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);

  // Save log
  const logDir = './generation_logs';
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logContent = `# UK Batch 1 Generation Log
Generated: ${new Date().toISOString()}

## Summary
- Total attempted: ${total}
- Success: ${results.success.length}
- Failed: ${results.failed.length}

## Successful Articles
${results.success.map(r => `- ✅ ${r.slug} (${r.lang})`).join('\n')}

## Failed Articles
${results.failed.map(r => `- ❌ ${r.lang}/${r.topic}: ${r.error}`).join('\n') || 'None'}
`;

  fs.writeFileSync(`${logDir}/uk_batch1.md`, logContent);
  console.log(`\nLog saved to ${logDir}/uk_batch1.md`);
}

main().catch(console.error);
