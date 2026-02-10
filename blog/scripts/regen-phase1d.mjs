#!/usr/bin/env node
/**
 * Phase 1d: Regenerate content_html for articles with missing tag converters.
 * Tags: PhrasePair, PhraseCard, VocabCell, KVocabCard, and 1 leaked CultureTip.
 * Also fixes the malformed CultureTip quoting in article 68c49821.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMdxToHtml } from './component-converters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : null;
})();

// Load articles
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));

// Tags that were previously unhandled (now have converters)
const MISSING_TAGS_RE = /<(?:PhrasePair|PhraseCard|VocabCell|KVocabCard)[\s\S]*?\/>/i;
const CULTURETIP_ID = '68c49821-8c85-4429-8c91-db06c0b45e07';

// Fix the 3 malformed CultureTip tags in article 68c49821
// They have mixed single/double quoting that breaks extractProp.
// Convert from self-closing with broken props to children format.
function fixCultureTipContent(content) {
  // Tag 1
  content = content.replace(
    `<CultureTip title="\u{1F1EE}\u{1F1F9} Douceur italienne' content="Les Italiens utilisent les consonnes doubles pour exprimer l"intensit\u00E9. Dire 'ti voglio bene' avec des doubles consonnes bien marqu\u00E9es montre plus d'\u00E9motion !"/>`,
    `<CultureTip title="\u{1F1EE}\u{1F1F9} Douceur italienne">\nLes Italiens utilisent les consonnes doubles pour exprimer l'intensit\u00E9. Dire "ti voglio bene" avec des doubles consonnes bien marqu\u00E9es montre plus d'\u00E9motion !\n</CultureTip>`
  );
  // Tag 2
  content = content.replace(
    `<CultureTip title="\u{1F1EE}\u{1F1F9} L'accent chantant' content="Les Italiens "chantent' naturellement. Mettez l'accent sur l'avant-derni\u00E8re syllabe et votre italien sonnera d\u00E9j\u00E0 plus authentique !"/>`,
    `<CultureTip title="\u{1F1EE}\u{1F1F9} L'accent chantant">\nLes Italiens "chantent" naturellement. Mettez l'accent sur l'avant-derni\u00E8re syllabe et votre italien sonnera d\u00E9j\u00E0 plus authentique !\n</CultureTip>`
  );
  // Tag 3
  content = content.replace(
    `<CultureTip title="\u{1F1EE}\u{1F1F9} R\u00E9gions et accents' content="L"italien du nord prononce plus 'clos' (come \u2192 'kohm'), tandis que le sud est plus 'ouvert' (come \u2192 'koh-meh'). Les deux sont corrects !"/>`,
    `<CultureTip title="\u{1F1EE}\u{1F1F9} R\u00E9gions et accents">\nL'italien du nord prononce plus "clos" (come \u2192 "kohm"), tandis que le sud est plus "ouvert" (come \u2192 "koh-meh"). Les deux sont corrects !\n</CultureTip>`
  );
  return content;
}

// Find affected articles
const affected = [];
for (const a of data.articles) {
  if (a.target_lang === 'all') continue;
  const content = a.content || '';
  if (MISSING_TAGS_RE.test(content) || a.id === CULTURETIP_ID) {
    affected.push(a);
  }
}

console.log(`Found ${affected.length} articles with missing tags to regenerate`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? affected.slice(0, LIMIT) : affected;
let fixed = 0, failed = 0, unchanged = 0, contentFixed = 0;
const tagStats = { phrasePairs: 0, phraseCards: 0, vocabCellKVocab: 0, cultureTipFix: 0 };

for (let i = 0; i < toProcess.length; i++) {
  const article = toProcess[i];
  const label = `[${i + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}\u2192${article.target_lang}`;

  let content = article.content;
  let contentChanged = false;

  // Fix CultureTip content if this is the broken article
  if (article.id === CULTURETIP_ID) {
    const before = content;
    content = fixCultureTipContent(content);
    if (content !== before) {
      contentChanged = true;
      tagStats.cultureTipFix++;
      console.log(`  ${label}: Fixed CultureTip quoting`);
    }
  }

  // Count which tags are being converted
  if (/<PhrasePair/i.test(content)) tagStats.phrasePairs++;
  if (/<PhraseCard/i.test(content)) tagStats.phraseCards++;
  if (/<(?:VocabCell|KVocabCard)/i.test(content)) tagStats.vocabCellKVocab++;

  let html;
  try {
    const result = convertMdxToHtml(content, article.native_lang, article.target_lang);
    html = result.html;
  } catch (e) {
    console.log(`  ${label}: HTML ERROR \u2014 ${e.message}`);
    failed++;
    continue;
  }

  // Check if HTML actually changed
  if (html === article.content_html && !contentChanged) {
    unchanged++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${label}: WOULD REGEN${contentChanged ? ' (+ content fix)' : ''}`);
    fixed++;
    if (contentChanged) contentFixed++;
    continue;
  }

  // Update DB — content + content_html if content changed, otherwise just content_html
  const updateData = contentChanged
    ? { content, content_html: html }
    : { content_html: html };

  const { error } = await supabase
    .from('blog_articles')
    .update(updateData)
    .eq('id', article.id);

  if (error) {
    console.log(`  ${label}: DB ERROR \u2014 ${error.message}`);
    failed++;
  } else {
    fixed++;
    if (contentChanged) contentFixed++;
    if (fixed % 50 === 0) console.log(`  Progress: ${fixed} regenerated...`);
  }
}

console.log(`\nDone.`);
console.log(`  Regenerated: ${fixed}`);
console.log(`  Content fixed: ${contentFixed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Unchanged: ${unchanged}`);
console.log(`  Tags: PhrasePair=${tagStats.phrasePairs}, PhraseCard=${tagStats.phraseCards}, VocabCell/KVocabCard=${tagStats.vocabCellKVocab}, CultureTip fix=${tagStats.cultureTipFix}`);
