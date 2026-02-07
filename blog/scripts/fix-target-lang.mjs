#!/usr/bin/env node
/**
 * fix-target-lang.mjs — Generate title fixes for RO/PL articles missing target language names.
 *
 * Reads broken-articles.json, generates new titles with target language inserted.
 * Outputs target-lang-fixes.json for use with update-batch.mjs.
 *
 * Usage:
 *   node fix-target-lang.mjs
 *   node fix-target-lang.mjs --preview   # just show samples, don't write
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data/broken-articles.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const items = data.issues.missing_target_lang;

const PREVIEW = process.argv.includes('--preview');

// Romanian language names — feminine adjective form (most common in titles)
const RO_LANG_ADJ = {
  en: 'Engleză', es: 'Spaniolă', fr: 'Franceză', de: 'Germană',
  it: 'Italiană', pt: 'Portugheză', nl: 'Olandeză', sv: 'Suedeză',
  no: 'Norvegiană', da: 'Daneză', pl: 'Poloneză', cs: 'Cehă',
  hu: 'Maghiară', el: 'Greacă', tr: 'Turcă', uk: 'Ucraineană', ru: 'Rusă',
};

// Polish locative forms (used with "po")
const PL_LANG_LOC = {
  en: 'angielsku', es: 'hiszpańsku', fr: 'francusku', de: 'niemiecku',
  it: 'włosku', pt: 'portugalsku', nl: 'holendersku', sv: 'szwedzku',
  no: 'norwesku', da: 'duńsku', cs: 'czesku', hu: 'węgiersku',
  el: 'grecku', tr: 'turecku', uk: 'ukraińsku', ru: 'rosyjsku', ro: 'rumuńsku',
};

// Polish genitive adjective forms (used with nouns: "słów X")
const PL_LANG_GEN_PL = {
  en: 'angielskich', es: 'hiszpańskich', fr: 'francuskich', de: 'niemieckich',
  it: 'włoskich', pt: 'portugalskich', nl: 'holenderskich', sv: 'szwedzkich',
  no: 'norweskich', da: 'duńskich', cs: 'czeskich', hu: 'węgierskich',
  el: 'greckich', tr: 'tureckich', uk: 'ukraińskich', ru: 'rosyjskich', ro: 'rumuńskich',
};

const updates = [];
const skipped = [];

for (const a of items) {
  let newTitle = a.title;
  const target = a.target_lang;

  if (a.native_lang === 'ro') {
    const langName = RO_LANG_ADJ[target];
    if (!langName) { skipped.push(a); continue; }

    // Pattern 1: "în XX" (2-letter code at end or before punctuation) → replace with language name
    // Special case: "Cerere și Logodnă în XX" → shorten to "Cerere în [lang]"
    const codePattern = new RegExp(' în ' + target.toUpperCase() + '(?:\\b|$)');
    if (codePattern.test(newTitle)) {
      // Shorten the long proposal title pattern
      newTitle = newTitle
        .replace('Expresii pentru Cerere și Logodnă', 'Expresii pentru Logodnă')
        .replace(codePattern, ' în ' + langName);
    }
    // Pattern 2: title has colon — insert "în [lang]" before colon
    else if (newTitle.includes(':')) {
      const colonIdx = newTitle.indexOf(':');
      newTitle = newTitle.slice(0, colonIdx) + ' în ' + langName + newTitle.slice(colonIdx);
    }
    // Pattern 3: no colon — append "în [lang]"
    else {
      newTitle = newTitle + ' în ' + langName;
    }
  }

  if (a.native_lang === 'pl') {
    const langLoc = PL_LANG_LOC[target];
    const langGenPl = PL_LANG_GEN_PL[target];
    if (!langLoc) { skipped.push(a); continue; }

    // Pattern 1: "słów dla par" → insert adjective before "dla"
    if (newTitle.includes('słów dla par')) {
      newTitle = newTitle.replace('słów dla par', 'słów ' + langGenPl + ' dla par');
    }
    // Pattern 2: "randkę" → append "po X"
    else if (newTitle.includes('randkę')) {
      newTitle = newTitle.replace('randkę', 'randkę po ' + langLoc);
    }
    // Pattern 3: "Fraz na Każdą" → insert adjective
    else if (/Fraz\b/i.test(newTitle)) {
      const capAdj = langGenPl.charAt(0).toUpperCase() + langGenPl.slice(1);
      newTitle = newTitle.replace(/Fraz\b/i, 'Fraz ' + capAdj);
    }
    // Pattern 4: title with colon — insert "po X" before colon
    else if (newTitle.includes(':')) {
      const colonIdx = newTitle.indexOf(':');
      newTitle = newTitle.slice(0, colonIdx) + ' po ' + langLoc + newTitle.slice(colonIdx);
    }
    // Pattern 5: append "po X"
    else {
      newTitle = newTitle + ' po ' + langLoc;
    }
  }

  // Truncate if > 70 chars (SEO best practice)
  if (newTitle.length > 70) {
    // Try to truncate at last space before 70
    const lastSpace = newTitle.lastIndexOf(' ', 70);
    if (lastSpace > 40) {
      newTitle = newTitle.slice(0, lastSpace);
    }
  }

  if (newTitle !== a.title) {
    updates.push({ id: a.id, title: newTitle });
  } else {
    skipped.push(a);
  }
}

// Report
process.stderr.write(`fix-target-lang: ${updates.length} fixes generated, ${skipped.length} skipped\n\n`);

// Show samples
const roUpdates = updates.filter(u => items.find(i => i.id === u.id)?.native_lang === 'ro');
const plUpdates = updates.filter(u => items.find(i => i.id === u.id)?.native_lang === 'pl');

process.stderr.write(`RO fixes: ${roUpdates.length}\n`);
for (const u of roUpdates.slice(0, 8)) {
  const orig = items.find(i => i.id === u.id);
  process.stderr.write(`  [→${orig.target_lang}] ${orig.title}\n`);
  process.stderr.write(`       → ${u.title} (${u.title.length} chars)\n`);
}

process.stderr.write(`\nPL fixes: ${plUpdates.length}\n`);
for (const u of plUpdates.slice(0, 8)) {
  const orig = items.find(i => i.id === u.id);
  process.stderr.write(`  [→${orig.target_lang}] ${orig.title}\n`);
  process.stderr.write(`       → ${u.title} (${u.title.length} chars)\n`);
}

if (skipped.length > 0) {
  process.stderr.write(`\nSkipped:\n`);
  for (const s of skipped) {
    process.stderr.write(`  [${s.native_lang}→${s.target_lang}] ${s.title}\n`);
  }
}

// Length distribution
const lengths = updates.map(u => u.title.length);
if (lengths.length > 0) {
  process.stderr.write(`\nTitle lengths: min=${Math.min(...lengths)} max=${Math.max(...lengths)} avg=${Math.round(lengths.reduce((s,l)=>s+l,0)/lengths.length)}\n`);
}

if (!PREVIEW) {
  const outPath = path.join(__dirname, 'data/target-lang-fixes.json');
  fs.writeFileSync(outPath, JSON.stringify(updates, null, 2));
  process.stderr.write(`\nWritten ${updates.length} updates to ${outPath}\n`);
}
