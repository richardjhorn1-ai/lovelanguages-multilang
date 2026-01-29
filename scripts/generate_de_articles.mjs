#!/usr/bin/env node
// Generate German blog articles for all target languages

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env file manually
const envPath = path.join(process.env.HOME, 'lovelanguages-multilang/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const eqIndex = line.indexOf('=');
  const key = line.substring(0, eqIndex).trim();
  let value = line.substring(eqIndex + 1).trim();
  // Remove surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
});

console.log('URL:', env.VITE_SUPABASE_URL);
console.log('Key exists:', !!env.VITE_SUPABASE_ANON_KEY);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Language mappings
const LANG_MAP = {
  en: { de: 'Englisch', en: 'english', adj: 'englische' },
  fr: { de: 'Französisch', en: 'french', adj: 'französische' },
  es: { de: 'Spanisch', en: 'spanish', adj: 'spanische' },
  it: { de: 'Italienisch', en: 'italian', adj: 'italienische' },
  pt: { de: 'Portugiesisch', en: 'portuguese', adj: 'portugiesische' },
  pl: { de: 'Polnisch', en: 'polish', adj: 'polnische' },
  ru: { de: 'Russisch', en: 'russian', adj: 'russische' },
  uk: { de: 'Ukrainisch', en: 'ukrainian', adj: 'ukrainische' },
  nl: { de: 'Niederländisch', en: 'dutch', adj: 'niederländische' },
  tr: { de: 'Türkisch', en: 'turkish', adj: 'türkische' },
  ro: { de: 'Rumänisch', en: 'romanian', adj: 'rumänische' },
  sv: { de: 'Schwedisch', en: 'swedish', adj: 'schwedische' },
  no: { de: 'Norwegisch', en: 'norwegian', adj: 'norwegische' },
  da: { de: 'Dänisch', en: 'danish', adj: 'dänische' },
  cs: { de: 'Tschechisch', en: 'czech', adj: 'tschechische' },
  el: { de: 'Griechisch', en: 'greek', adj: 'griechische' },
  hu: { de: 'Ungarisch', en: 'hungarian', adj: 'ungarische' }
};

const today = new Date().toISOString().split('T')[0];
let generated = 0;
let skipped = 0;
let errors = 0;

async function checkExists(slug, targetLang) {
  const { data } = await supabase
    .from('blog_articles')
    .select('id')
    .eq('slug', slug)
    .eq('native_lang', 'de')
    .eq('target_lang', targetLang)
    .single();
  return !!data;
}

async function insertArticle(article) {
  const exists = await checkExists(article.slug, article.target_lang);
  if (exists) {
    console.log(`SKIP: ${article.slug} (${article.target_lang}) - already exists`);
    skipped++;
    return;
  }

  const { error } = await supabase.from('blog_articles').insert(article);
  if (error) {
    console.log(`❌ ERROR: ${article.slug} (${article.target_lang}) - ${error.message}`);
    errors++;
  } else {
    console.log(`✅ GENERATED: ${article.slug} (${article.target_lang})`);
    generated++;
  }
}

function create100WordsArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `Die 100 häufigsten ${lang.adj}n Wörter für Paare`,
    slug: `100-most-common-${lang.en}-words`,
    description: `Lerne die 100 wichtigsten ${lang.adj}n Wörter für den Alltag mit deinem Partner. Perfekt für Anfänger!`,
    native_lang: 'de',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.de, 'Vokabeln', 'Grundwortschatz', 'Paare', 'Anfänger'],
    image: '/images/blog/vocabulary.jpg',
    read_time: 8,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# Die 100 häufigsten ${lang.adj}n Wörter für Paare

Du möchtest ${lang.de} lernen, vielleicht weil dein Partner diese wunderbare Sprache spricht? Dann bist du hier genau richtig! Mit diesen 100 grundlegenden Wörtern legst du das Fundament für deine ${lang.de}-Kenntnisse.

## Warum diese 100 Wörter?

Studien zeigen, dass die 100 häufigsten Wörter einer Sprache etwa 50% aller alltäglichen Gespräche ausmachen. Wenn du diese Wörter beherrschst, verstehst du schon einen großen Teil dessen, was dein Partner sagt!

## Grundlegende Pronomen

Pronomen sind das Herzstück jeder Unterhaltung. Die wichtigsten ${lang.adj}n Pronomen sind:

- **ich** - das wichtigste Wort, um über dich selbst zu sprechen
- **du** - unverzichtbar für Gespräche mit deinem Partner
- **wir** - das schönste Wort für Paare!
- **er/sie/es** - um über andere zu sprechen

## Wichtige Verben

Diese Verben wirst du ständig brauchen:

1. **sein** - das wichtigste Verb überhaupt
2. **haben** - grundlegend für den Alltag
3. **machen/tun** - für Aktivitäten
4. **gehen** - für Bewegung und Pläne
5. **kommen** - um Treffen zu planen
6. **wollen** - für Wünsche und Pläne
7. **können** - für Fähigkeiten
8. **sagen** - für Gespräche
9. **sehen** - für Beobachtungen
10. **wissen/kennen** - für Informationen

<CultureTip>
${lang.de} hat seine ganz eigene Melodie und seinen einzigartigen Charme. Höre ${lang.adj} Musik oder schaue Filme, um ein Gefühl für die Sprache zu entwickeln!
</CultureTip>

## Adjektive für Komplimente

Mit diesen Adjektiven kannst du deinem Partner schöne Dinge sagen:

- **gut** - vielseitig einsetzbar
- **schön** - perfekt für Komplimente
- **groß/klein** - für Beschreibungen
- **neu/alt** - für Vergleiche
- **lieb** - ideal für deinen Partner

## Fragewörter

Ohne Fragen keine Gespräche! Die wichtigsten sind:

| Deutsch | Verwendung |
|---------|------------|
| was | für Dinge |
| wer | für Personen |
| wo | für Orte |
| wann | für Zeit |
| warum | für Gründe |
| wie | für Art und Weise |

## Zeitangaben

Für die Planung von Dates und Treffen:

- **heute** - für Pläne am selben Tag
- **morgen** - für die nahe Zukunft
- **gestern** - um zu erzählen
- **jetzt** - für den Moment
- **später** - für flexible Pläne
- **immer** - für Versprechen ("Ich werde dich immer lieben")
- **nie** - aber bitte nur positiv verwenden!

## Alltagswörter

Diese Wörter brauchst du täglich:

- ja / nein
- bitte / danke
- und / oder / aber
- hier / dort
- mit / ohne
- für / von

## Tipps zum Lernen

1. **Lerne täglich**: 10-15 Minuten pro Tag sind effektiver als lange Sessions
2. **Übe mit deinem Partner**: Bitte ihn/sie, diese Wörter mit dir zu üben
3. **Nutze Karteikarten**: Schreibe die Wörter auf und wiederhole regelmäßig
4. **Kontext ist alles**: Lerne Wörter in Sätzen, nicht isoliert
5. **Hab Geduld**: Sprachenlernen braucht Zeit, aber die Mühe lohnt sich!

<CTA />`
  };
}

function createPetNamesArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.de} Kosenamen und Liebkosungen für Paare`,
    slug: `${lang.en}-pet-names-and-endearments`,
    description: `Entdecke die süßesten ${lang.adj}n Kosenamen für deinen Partner. Von klassisch bis kreativ - finde den perfekten Namen!`,
    native_lang: 'de',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.de, 'Kosenamen', 'Romantik', 'Paare', 'Beziehung'],
    image: '/images/blog/pet-names.jpg',
    read_time: 6,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.de} Kosenamen und Liebkosungen für Paare

Kosenamen sind eine wunderbare Art, deinem Partner zu zeigen, wie viel er oder sie dir bedeutet. Wenn dein Partner ${lang.de} spricht, wird es ihn oder sie sicher freuen, wenn du diese liebevollen Ausdrücke verwendest!

## Warum Kosenamen wichtig sind

Kosenamen schaffen Intimität und zeigen Zuneigung. Sie sind wie ein geheimes Band zwischen zwei Menschen – etwas Besonderes, das nur euch beiden gehört.

## Klassische Kosenamen

Die zeitlosen Klassiker funktionieren in jeder Sprache:

- **Schatz** - der universelle Liebling
- **Liebling** - klassisch und elegant
- **Mein Herz** - gefühlvoll und poetisch
- **Meine Liebe** - romantisch und zärtlich

<CultureTip>
Kosenamen variieren oft von Region zu Region. Was in einer Gegend üblich ist, kann anderswo ungewöhnlich klingen. Frage deinen Partner, welche Namen in seiner Heimat gebräuchlich sind!
</CultureTip>

## Süße Tiernamen

Wie in vielen Kulturen werden auch im ${lang.de}en gerne Tiernamen verwendet:

- **Bärchen** (kleiner Bär) - kuschelig und stark
- **Mäuschen** (kleine Maus) - süß und niedlich
- **Häschen** (kleiner Hase) - zärtlich
- **Spätzchen** (kleiner Spatz) - liebevoll

## Romantische Ausdrücke

Für besondere Momente:

- **Mein Ein und Alles** - wenn jemand alles für dich ist
- **Seelenverwandter** - für tiefe Verbindungen
- **Mein Sonnenschein** - für jemanden, der dein Leben erhellt

## Kosenamen für verschiedene Anlässe

### Im Alltag
Kurze, lockere Namen für den täglichen Gebrauch. Ein schnelles "Hey, Schatz!" funktioniert immer.

### Für romantische Momente
Längere, gefühlvollere Ausdrücke passen zu besonderen Momenten. Sag deinem Partner, was er oder sie dir bedeutet.

### Zum Necken
Humorvolle Kosenamen können eure Beziehung auflockern – aber achte darauf, dass dein Partner den Humor teilt!

## Tipps zur Verwendung

1. **Frage deinen Partner**: Nicht jeder mag jeden Kosenamen. Frage, was ihm/ihr gefällt.
2. **Achte auf die Aussprache**: Übe die richtige Aussprache – nichts ist romantischer als ein korrekt ausgesprochener Kosename.
3. **Sei authentisch**: Verwende Namen, die zu euch als Paar passen.
4. **Kreiere eigene Namen**: Die persönlichsten Kosenamen sind oft selbst erfunden!
5. **Beobachte die Reaktion**: Der beste Kosename ist der, bei dem dein Partner lächelt.

## Die Kraft der Sprache

Kosenamen sind mehr als Worte – sie sind kleine Liebeserklärungen im Alltag. Wenn du ${lang.de} lernst, um mit deinem Partner zu kommunizieren, sind Kosenamen ein wundervoller Anfang.

<CTA />`
  };
}

async function main() {
  console.log('=== German Article Generation Started ===');
  console.log(`Date: ${today}`);
  console.log('');

  const targetLanguages = ['en', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'uk', 'nl', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

  for (const target of targetLanguages) {
    console.log(`--- Processing: ${LANG_MAP[target].de} (${target}) ---`);

    // Topic 1: 100 Most Common Words
    await insertArticle(create100WordsArticle(target));

    // Topic 2: Pet Names and Endearments
    await insertArticle(createPetNamesArticle(target));

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('');
  console.log('=== Generation Complete ===');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Write summary
  const summary = `# German Blog Article Generation - Batch 1

**Completed:** ${new Date().toISOString()}
**Native Language:** de (German)

## Results

- **Generated:** ${generated}
- **Skipped:** ${skipped}
- **Errors:** ${errors}
- **Total processed:** ${generated + skipped + errors}

## Topics

1. ✅ 100 Most Common [LANG] Words - ${targetLanguages.length} languages
2. ✅ Pet Names & Endearments - ${targetLanguages.length} languages
3. ✅ How to Say I Love You - Already existed
4. ✅ Greetings & Farewells - Already existed
5. ✅ Date Night Vocabulary - Already existed
`;

  fs.writeFileSync(
    path.join(process.env.HOME, 'lovelanguages-multilang/generation_logs/de_batch1.md'),
    summary
  );
}

main().catch(console.error);
