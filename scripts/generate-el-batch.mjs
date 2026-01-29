#!/usr/bin/env node
/**
 * Batch generator for Greek (el) native language articles
 * Generates 5 topic types for all 17 target languages
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
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
  // Remove surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}
console.log('Loaded env vars:', Object.keys(env).filter(k => k.includes('SUPABASE') || k.includes('ANTHROPIC')));

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Language names in Greek and English
const languageNames = {
  en: { el: 'αγγλικά', en: 'english' },
  de: { el: 'γερμανικά', en: 'german' },
  fr: { el: 'γαλλικά', en: 'french' },
  es: { el: 'ισπανικά', en: 'spanish' },
  it: { el: 'ιταλικά', en: 'italian' },
  pt: { el: 'πορτογαλικά', en: 'portuguese' },
  pl: { el: 'πολωνικά', en: 'polish' },
  ru: { el: 'ρωσικά', en: 'russian' },
  uk: { el: 'ουκρανικά', en: 'ukrainian' },
  nl: { el: 'ολλανδικά', en: 'dutch' },
  tr: { el: 'τουρκικά', en: 'turkish' },
  ro: { el: 'ρουμανικά', en: 'romanian' },
  sv: { el: 'σουηδικά', en: 'swedish' },
  no: { el: 'νορβηγικά', en: 'norwegian' },
  da: { el: 'δανικά', en: 'danish' },
  cs: { el: 'τσέχικα', en: 'czech' },
  hu: { el: 'ουγγρικά', en: 'hungarian' }
};

const topics = {
  '100-words': {
    slugTemplate: (langEn) => `100-most-common-${langEn}-words`,
    titleTemplate: (langEl) => `100 πιο συνηθισμένες λέξεις στα ${langEl}`,
    promptTemplate: (langEl, langEn) => `Write a comprehensive vocabulary article in GREEK about "100 πιο συνηθισμένες λέξεις στα ${langEl}" (100 Most Common ${langEn.charAt(0).toUpperCase() + langEn.slice(1)} Words) for Greek speakers learning ${langEn}. The article should include at least 50 of the most essential words organized by category (verbs, nouns, adjectives, etc.) with ${langEn} words, Greek translations, and pronunciation guides.`
  },
  'pet-names': {
    slugTemplate: (langEn) => `${langEn}-pet-names-and-endearments`,
    titleTemplate: (langEl) => `Χαϊδευτικά και τρυφερά ονόματα στα ${langEl}`,
    promptTemplate: (langEl, langEn) => `Write a romantic vocabulary article in GREEK about "Χαϊδευτικά και τρυφερά ονόματα στα ${langEl}" (${langEn.charAt(0).toUpperCase() + langEn.slice(1)} Pet Names and Endearments) for Greek speakers learning ${langEn}. Include at least 25-30 terms of endearment with ${langEn} words, Greek translations, pronunciation guides, and cultural context about when to use each term.`
  },
  'i-love-you': {
    slugTemplate: (langEn) => `how-to-say-i-love-you-in-${langEn}`,
    titleTemplate: (langEl) => `Πώς να πεις "Σ'αγαπώ" στα ${langEl}`,
    promptTemplate: (langEl, langEn) => `Write a romantic article in GREEK about "Πώς να πεις Σ'αγαπώ στα ${langEl}" (How to Say I Love You in ${langEn.charAt(0).toUpperCase() + langEn.slice(1)}) for Greek speakers learning ${langEn}. Include the main phrase, variations for different intensity levels (like/love/adore), regional variations, when to use each form, cultural context, and romantic phrases that go beyond just "I love you".`
  },
  'greetings': {
    slugTemplate: (langEn) => `${langEn}-greetings-and-farewells`,
    titleTemplate: (langEl) => `Χαιρετισμοί και αποχαιρετισμοί στα ${langEl}`,
    promptTemplate: (langEl, langEn) => `Write a practical vocabulary article in GREEK about "Χαιρετισμοί και αποχαιρετισμοί στα ${langEl}" (${langEn.charAt(0).toUpperCase() + langEn.slice(1)} Greetings and Farewells) for Greek speakers learning ${langEn}. Include formal and informal greetings, time-specific greetings (morning/evening), farewells, and how to greet romantic partners. Cover at least 20-25 expressions.`
  },
  'date-night': {
    slugTemplate: (langEn) => `${langEn}-date-night-vocabulary`,
    titleTemplate: (langEl) => `Λεξιλόγιο για ραντεβού στα ${langEl}`,
    promptTemplate: (langEl, langEn) => `Write a romantic vocabulary article in GREEK about "Λεξιλόγιο για ραντεβού στα ${langEl}" (${langEn.charAt(0).toUpperCase() + langEn.slice(1)} Date Night Vocabulary) for Greek speakers learning ${langEn}. Include restaurant vocabulary, ordering food/drinks, compliments for your partner, conversation starters, expressions of affection, and phrases for planning a romantic evening. Include at least 30 useful phrases.`
  }
};

const systemPrompt = `You are an expert language educator writing SEO-optimized blog articles in GREEK for "Love Languages" - an app that helps couples learn languages together.

CRITICAL: ALL content must be written in GREEK (στα ελληνικά). Only the target language words/phrases being taught should be in the target language.

Your articles should be:
1. WRITTEN IN GREEK - Title, description, all explanatory text in Greek
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
  translation="[Greek translation]"
  pronunciation="[phonetic pronunciation]"
  example="[example sentence in target language]"
/>
\`\`\`

### PhraseOfDay - Featured phrase (use 1 per article, near top)
\`\`\`jsx
<PhraseOfDay
  word="[target language phrase]"
  translation="[Greek translation]"
  pronunciation="[phonetic]"
  context="[context explanation in Greek]"
/>
\`\`\`

### CultureTip - Cultural insights (use 1-2 per article)
\`\`\`jsx
<CultureTip title="[Title in Greek]">
[Cultural insight in Greek...]
</CultureTip>
\`\`\`

### CTA - Call to action (always at the end)
\`\`\`jsx
<CTA />
\`\`\`

## Output Format
Return ONLY a valid JSON object (no markdown code blocks):
{
  "title": "Title in GREEK",
  "description": "150-160 char meta description in GREEK",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full MDX content with Greek explanatory text..."
}`;

async function generateArticle(targetLang, topicKey) {
  const topic = topics[topicKey];
  const langNames = languageNames[targetLang];
  const slug = topic.slugTemplate(langNames.en);
  const prompt = topic.promptTemplate(langNames.el, langNames.en);

  console.log(`\nGenerating: ${slug} (el -> ${targetLang})`);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `${prompt}

Target language: ${langNames.en} (${targetLang})
Native language: Greek (el)

Remember:
- ALL explanatory text in GREEK
- Target language words with Greek translations
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
    native_lang: 'el',
    target_lang: targetLang,
    title: parsed.title,
    description: parsed.description,
    category: 'vocabulary',
    difficulty: 'beginner',
    read_time: 6,
    image: `/images/blog/${targetLang}-vocabulary.jpg`,
    tags: parsed.tags || ['λεξιλόγιο', 'εκμάθηση', langNames.el],
    content: parsed.content,
    published: true,
    date: new Date().toISOString().split('T')[0]
  };
}

async function main() {
  const targetLangs = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'uk', 'nl', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'hu'];
  const topicKeys = ['100-words', 'pet-names', 'i-love-you', 'greetings', 'date-night'];

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

  const logContent = `# Greek (el) Batch 1 Generation Log
Generated: ${new Date().toISOString()}

## Summary
- Native Language: Greek (el)
- Total attempted: ${total}
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
${results.success.map(r => `- ✅ ${r.slug} (el -> ${r.lang})`).join('\n')}

## Failed Articles
${results.failed.map(r => `- ❌ ${r.lang}/${r.topic}: ${r.error}`).join('\n') || 'None'}
`;

  fs.writeFileSync(`${logDir}/el_batch1.md`, logContent);
  console.log(`\nLog saved to ${logDir}/el_batch1.md`);
}

main().catch(console.error);
