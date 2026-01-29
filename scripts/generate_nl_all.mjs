#!/usr/bin/env node
/**
 * Dutch Articles Batch Generator - Complete
 * Generates 5 topics × 17 target languages = 85 articles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'blog/src/content/articles/nl');

const today = new Date().toISOString().split('T')[0];

// Target languages
const LANGUAGES = {
  en: { english: 'english', dutch: 'Engels', flag: '🇬🇧', country: 'Engeland' },
  de: { english: 'german', dutch: 'Duits', flag: '🇩🇪', country: 'Duitsland' },
  fr: { english: 'french', dutch: 'Frans', flag: '🇫🇷', country: 'Frankrijk' },
  es: { english: 'spanish', dutch: 'Spaans', flag: '🇪🇸', country: 'Spanje' },
  it: { english: 'italian', dutch: 'Italiaans', flag: '🇮🇹', country: 'Italië' },
  pt: { english: 'portuguese', dutch: 'Portugees', flag: '🇵🇹', country: 'Portugal' },
  pl: { english: 'polish', dutch: 'Pools', flag: '🇵🇱', country: 'Polen' },
  ru: { english: 'russian', dutch: 'Russisch', flag: '🇷🇺', country: 'Rusland' },
  uk: { english: 'ukrainian', dutch: 'Oekraïens', flag: '🇺🇦', country: 'Oekraïne' },
  tr: { english: 'turkish', dutch: 'Turks', flag: '🇹🇷', country: 'Turkije' },
  ro: { english: 'romanian', dutch: 'Roemeens', flag: '🇷🇴', country: 'Roemenië' },
  sv: { english: 'swedish', dutch: 'Zweeds', flag: '🇸🇪', country: 'Zweden' },
  no: { english: 'norwegian', dutch: 'Noors', flag: '🇳🇴', country: 'Noorwegen' },
  da: { english: 'danish', dutch: 'Deens', flag: '🇩🇰', country: 'Denemarken' },
  cs: { english: 'czech', dutch: 'Tsjechisch', flag: '🇨🇿', country: 'Tsjechië' },
  el: { english: 'greek', dutch: 'Grieks', flag: '🇬🇷', country: 'Griekenland' },
  hu: { english: 'hungarian', dutch: 'Hongaars', flag: '🇭🇺', country: 'Hongarije' }
};

// Language-specific vocabulary data
const VOCAB_DATA = {
  en: {
    love: 'love', iLoveYou: 'I love you', pronunciation: '/aɪ lʌv juː/',
    hello: 'hello', goodbye: 'goodbye', goodMorning: 'good morning',
    myLove: 'my love', darling: 'darling', sweetheart: 'sweetheart',
    beautiful: 'beautiful', handsome: 'handsome', kiss: 'kiss',
    dinner: 'dinner', wine: 'wine', romantic: 'romantic',
    words100: ['I', 'you', 'the', 'is', 'are', 'was', 'have', 'has', 'will', 'can', 'love', 'heart', 'beautiful', 'good', 'day', 'night', 'time', 'life', 'world', 'home'],
    petNames: ['honey', 'sweetie', 'baby', 'love', 'dear', 'sweetheart', 'darling', 'babe', 'angel', 'sunshine']
  },
  de: {
    love: 'Liebe', iLoveYou: 'Ich liebe dich', pronunciation: '/ɪç ˈliːbə dɪç/',
    hello: 'Hallo', goodbye: 'Tschüss', goodMorning: 'Guten Morgen',
    myLove: 'meine Liebe', darling: 'Liebling', sweetheart: 'Schatz',
    beautiful: 'schön', handsome: 'gutaussehend', kiss: 'Kuss',
    dinner: 'Abendessen', wine: 'Wein', romantic: 'romantisch',
    words100: ['ich', 'du', 'der', 'die', 'das', 'ist', 'sind', 'war', 'haben', 'kann', 'Liebe', 'Herz', 'schön', 'gut', 'Tag', 'Nacht', 'Zeit', 'Leben', 'Welt', 'Haus'],
    petNames: ['Schatz', 'Liebling', 'Hase', 'Maus', 'Engel', 'Süße/r', 'Bärchen', 'Herzchen', 'Schnucki', 'Spatz']
  },
  fr: {
    love: 'amour', iLoveYou: 'Je t\'aime', pronunciation: '/ʒə tɛm/',
    hello: 'Bonjour', goodbye: 'Au revoir', goodMorning: 'Bonjour',
    myLove: 'mon amour', darling: 'chéri/chérie', sweetheart: 'mon cœur',
    beautiful: 'beau/belle', handsome: 'beau', kiss: 'bisou',
    dinner: 'dîner', wine: 'vin', romantic: 'romantique',
    words100: ['je', 'tu', 'le', 'la', 'est', 'sont', 'était', 'avoir', 'peut', 'amour', 'cœur', 'beau', 'bon', 'jour', 'nuit', 'temps', 'vie', 'monde', 'maison', 'être'],
    petNames: ['mon amour', 'mon cœur', 'chéri/e', 'mon trésor', 'ma puce', 'mon lapin', 'mon ange', 'ma belle', 'mon chou', 'bébé']
  },
  es: {
    love: 'amor', iLoveYou: 'Te quiero / Te amo', pronunciation: '/te ˈkjeɾo/',
    hello: 'Hola', goodbye: 'Adiós', goodMorning: 'Buenos días',
    myLove: 'mi amor', darling: 'cariño', sweetheart: 'corazón',
    beautiful: 'hermoso/a', handsome: 'guapo', kiss: 'beso',
    dinner: 'cena', wine: 'vino', romantic: 'romántico',
    words100: ['yo', 'tú', 'el', 'la', 'es', 'son', 'era', 'tener', 'puede', 'amor', 'corazón', 'hermoso', 'bueno', 'día', 'noche', 'tiempo', 'vida', 'mundo', 'casa', 'ser'],
    petNames: ['mi amor', 'cariño', 'corazón', 'cielo', 'mi vida', 'tesoro', 'bebé', 'nene/a', 'mi rey/reina', 'guapo/a']
  },
  it: {
    love: 'amore', iLoveYou: 'Ti amo', pronunciation: '/ti ˈaːmo/',
    hello: 'Ciao', goodbye: 'Arrivederci', goodMorning: 'Buongiorno',
    myLove: 'amore mio', darling: 'tesoro', sweetheart: 'dolcezza',
    beautiful: 'bello/bella', handsome: 'bello', kiss: 'bacio',
    dinner: 'cena', wine: 'vino', romantic: 'romantico',
    words100: ['io', 'tu', 'il', 'la', 'è', 'sono', 'era', 'avere', 'può', 'amore', 'cuore', 'bello', 'buono', 'giorno', 'notte', 'tempo', 'vita', 'mondo', 'casa', 'essere'],
    petNames: ['amore', 'tesoro', 'cucciolo/a', 'caro/a', 'dolcezza', 'angelo', 'stellina', 'piccolo/a', 'gioia', 'bello/a']
  },
  pt: {
    love: 'amor', iLoveYou: 'Eu te amo', pronunciation: '/ew tɨ ˈɐmu/',
    hello: 'Olá', goodbye: 'Adeus', goodMorning: 'Bom dia',
    myLove: 'meu amor', darling: 'querido/a', sweetheart: 'coração',
    beautiful: 'bonito/a', handsome: 'bonito', kiss: 'beijo',
    dinner: 'jantar', wine: 'vinho', romantic: 'romântico',
    words100: ['eu', 'tu', 'o', 'a', 'é', 'são', 'era', 'ter', 'pode', 'amor', 'coração', 'bonito', 'bom', 'dia', 'noite', 'tempo', 'vida', 'mundo', 'casa', 'ser'],
    petNames: ['meu amor', 'querido/a', 'meu bem', 'coração', 'bebê', 'fofo/a', 'meu anjo', 'meu príncipe/princesa', 'gatinho/a', 'docinho']
  },
  pl: {
    love: 'miłość', iLoveYou: 'Kocham cię', pronunciation: '/ˈkɔxam t͡ɕɛ/',
    hello: 'Cześć', goodbye: 'Do widzenia', goodMorning: 'Dzień dobry',
    myLove: 'moja miłości', darling: 'kochanie', sweetheart: 'skarbie',
    beautiful: 'piękny/a', handsome: 'przystojny', kiss: 'pocałunek',
    dinner: 'kolacja', wine: 'wino', romantic: 'romantyczny',
    words100: ['ja', 'ty', 'jest', 'są', 'był', 'mieć', 'może', 'miłość', 'serce', 'piękny', 'dobry', 'dzień', 'noc', 'czas', 'życie', 'świat', 'dom', 'być', 'on', 'ona'],
    petNames: ['kochanie', 'skarbie', 'misiu', 'kotku', 'słoneczko', 'złotko', 'serce', 'myszko', 'kwiatuszku', 'aniołku']
  },
  ru: {
    love: 'любовь', iLoveYou: 'Я тебя люблю', pronunciation: '/ja tʲɪˈbʲa lʲʊˈblʲu/',
    hello: 'Привет', goodbye: 'Пока', goodMorning: 'Доброе утро',
    myLove: 'моя любовь', darling: 'дорогой/дорогая', sweetheart: 'милый/милая',
    beautiful: 'красивый/ая', handsome: 'красивый', kiss: 'поцелуй',
    dinner: 'ужин', wine: 'вино', romantic: 'романтический',
    words100: ['я', 'ты', 'он', 'она', 'есть', 'был', 'иметь', 'может', 'любовь', 'сердце', 'красивый', 'хороший', 'день', 'ночь', 'время', 'жизнь', 'мир', 'дом', 'быть', 'это'],
    petNames: ['любимый/ая', 'дорогой/ая', 'милый/ая', 'зайка', 'солнышко', 'котик', 'малыш/ка', 'родной/ая', 'сладкий/ая', 'рыбка']
  },
  uk: {
    love: 'любов', iLoveYou: 'Я тебе кохаю', pronunciation: '/jɑ teˈbe koˈxɑju/',
    hello: 'Привіт', goodbye: 'До побачення', goodMorning: 'Доброго ранку',
    myLove: 'моя любов', darling: 'коханий/кохана', sweetheart: 'любий/люба',
    beautiful: 'гарний/а', handsome: 'гарний', kiss: 'поцілунок',
    dinner: 'вечеря', wine: 'вино', romantic: 'романтичний',
    words100: ['я', 'ти', 'він', 'вона', 'є', 'був', 'мати', 'може', 'любов', 'серце', 'гарний', 'добрий', 'день', 'ніч', 'час', 'життя', 'світ', 'дім', 'бути', 'це'],
    petNames: ['коханий/а', 'любий/а', 'сонечко', 'зайчик', 'котик', 'малюк', 'рідний/а', 'серденько', 'зірочка', 'душенька']
  },
  tr: {
    love: 'aşk', iLoveYou: 'Seni seviyorum', pronunciation: '/seni sevijorum/',
    hello: 'Merhaba', goodbye: 'Hoşça kal', goodMorning: 'Günaydın',
    myLove: 'aşkım', darling: 'sevgilim', sweetheart: 'canım',
    beautiful: 'güzel', handsome: 'yakışıklı', kiss: 'öpücük',
    dinner: 'akşam yemeği', wine: 'şarap', romantic: 'romantik',
    words100: ['ben', 'sen', 'o', 'bu', 'var', 'yok', 'olmak', 'yapabilmek', 'aşk', 'kalp', 'güzel', 'iyi', 'gün', 'gece', 'zaman', 'hayat', 'dünya', 'ev', 'evet', 'hayır'],
    petNames: ['aşkım', 'canım', 'hayatım', 'tatlım', 'sevgilim', 'güzelim', 'balım', 'bir tanem', 'kuzum', 'şekerim']
  },
  ro: {
    love: 'dragoste', iLoveYou: 'Te iubesc', pronunciation: '/te juˈbesk/',
    hello: 'Bună', goodbye: 'La revedere', goodMorning: 'Bună dimineața',
    myLove: 'iubirea mea', darling: 'dragule/draga', sweetheart: 'suflet',
    beautiful: 'frumos/frumoasă', handsome: 'frumos', kiss: 'sărut',
    dinner: 'cină', wine: 'vin', romantic: 'romantic',
    words100: ['eu', 'tu', 'el', 'ea', 'este', 'sunt', 'era', 'avea', 'poate', 'dragoste', 'inimă', 'frumos', 'bun', 'zi', 'noapte', 'timp', 'viață', 'lume', 'casă', 'fi'],
    petNames: ['iubire', 'dragule/draga', 'sufletul meu', 'scumpe/scumpa', 'puiule', 'îngerașule', 'păpușică', 'dulceață', 'dragostea mea', 'soare']
  },
  sv: {
    love: 'kärlek', iLoveYou: 'Jag älskar dig', pronunciation: '/jɑː ˈɛlskar dɛj/',
    hello: 'Hej', goodbye: 'Hejdå', goodMorning: 'God morgon',
    myLove: 'min kärlek', darling: 'älskling', sweetheart: 'hjärtat',
    beautiful: 'vacker', handsome: 'snygg', kiss: 'kyss',
    dinner: 'middag', wine: 'vin', romantic: 'romantisk',
    words100: ['jag', 'du', 'han', 'hon', 'är', 'var', 'ha', 'kan', 'kärlek', 'hjärta', 'vacker', 'bra', 'dag', 'natt', 'tid', 'liv', 'värld', 'hus', 'vara', 'det'],
    petNames: ['älskling', 'gull', 'hjärtat', 'raring', 'sötis', 'skansen', 'min lansen', 'knull', 'bebis', 'kanin']
  },
  no: {
    love: 'kjærlighet', iLoveYou: 'Jeg elsker deg', pronunciation: '/jæɪ ˈɛlskər dɛɪ/',
    hello: 'Hei', goodbye: 'Ha det', goodMorning: 'God morgen',
    myLove: 'min kjærlighet', darling: 'kjæreste', sweetheart: 'hjertet',
    beautiful: 'vakker', handsome: 'kjekk', kiss: 'kyss',
    dinner: 'middag', wine: 'vin', romantic: 'romantisk',
    words100: ['jeg', 'du', 'han', 'hun', 'er', 'var', 'ha', 'kan', 'kjærlighet', 'hjerte', 'vakker', 'god', 'dag', 'natt', 'tid', 'liv', 'verden', 'hus', 'være', 'det'],
    petNames: ['kjæreste', 'elskede', 'skansen', 'gull', 'søtnos', 'vennen', 'hjertet', 'pusling', 'snuppa', 'skansen']
  },
  da: {
    love: 'kærlighed', iLoveYou: 'Jeg elsker dig', pronunciation: '/jɑj ˈɛlsgɐ dɑj/',
    hello: 'Hej', goodbye: 'Farvel', goodMorning: 'God morgen',
    myLove: 'min kærlighed', darling: 'skat', sweetheart: 'hjertensgodt',
    beautiful: 'smuk', handsome: 'flot', kiss: 'kys',
    dinner: 'aftensmad', wine: 'vin', romantic: 'romantisk',
    words100: ['jeg', 'du', 'han', 'hun', 'er', 'var', 'have', 'kan', 'kærlighed', 'hjerte', 'smuk', 'god', 'dag', 'nat', 'tid', 'liv', 'verden', 'hus', 'være', 'det'],
    petNames: ['skat', 'elskede', 'søde', 'gull', 'kanin', 'mus', 'hjerte', 'engel', 'dyreansen', 'snutte']
  },
  cs: {
    love: 'láska', iLoveYou: 'Miluji tě', pronunciation: '/ˈmɪlujɪ cɛ/',
    hello: 'Ahoj', goodbye: 'Na shledanou', goodMorning: 'Dobré ráno',
    myLove: 'má lásko', darling: 'drahoušku', sweetheart: 'miláčku',
    beautiful: 'krásný/á', handsome: 'pohledný', kiss: 'polibek',
    dinner: 'večeře', wine: 'víno', romantic: 'romantický',
    words100: ['já', 'ty', 'on', 'ona', 'je', 'byl', 'mít', 'může', 'láska', 'srdce', 'krásný', 'dobrý', 'den', 'noc', 'čas', 'život', 'svět', 'dům', 'být', 'to'],
    petNames: ['miláčku', 'zlatíčko', 'drahoušku', 'broučku', 'kotě', 'beruško', 'srdíčko', 'princezno', 'medvídku', 'kočičko']
  },
  el: {
    love: 'αγάπη', iLoveYou: 'Σ\'αγαπώ', pronunciation: '/saɣaˈpo/',
    hello: 'Γεια σου', goodbye: 'Αντίο', goodMorning: 'Καλημέρα',
    myLove: 'αγάπη μου', darling: 'αγαπημένε/η', sweetheart: 'καρδιά μου',
    beautiful: 'όμορφος/η', handsome: 'όμορφος', kiss: 'φιλί',
    dinner: 'δείπνο', wine: 'κρασί', romantic: 'ρομαντικός',
    words100: ['εγώ', 'εσύ', 'αυτός', 'αυτή', 'είναι', 'ήταν', 'έχω', 'μπορώ', 'αγάπη', 'καρδιά', 'όμορφος', 'καλός', 'μέρα', 'νύχτα', 'χρόνος', 'ζωή', 'κόσμος', 'σπίτι', 'είμαι', 'αυτό'],
    petNames: ['αγάπη μου', 'μωρό μου', 'ψυχή μου', 'ζωή μου', 'καρδιά μου', 'αστέρι μου', 'άγγελέ μου', 'λατρεία μου', 'θησαυρέ μου', 'γλύκα μου']
  },
  hu: {
    love: 'szerelem', iLoveYou: 'Szeretlek', pronunciation: '/ˈsɛrɛtlɛk/',
    hello: 'Szia', goodbye: 'Viszlát', goodMorning: 'Jó reggelt',
    myLove: 'szerelmem', darling: 'drágám', sweetheart: 'édesem',
    beautiful: 'gyönyörű', handsome: 'jóképű', kiss: 'csók',
    dinner: 'vacsora', wine: 'bor', romantic: 'romantikus',
    words100: ['én', 'te', 'ő', 'az', 'van', 'volt', 'lenni', 'tud', 'szerelem', 'szív', 'gyönyörű', 'jó', 'nap', 'éjszaka', 'idő', 'élet', 'világ', 'ház', 'hogy', 'ez'],
    petNames: ['drágám', 'édesem', 'szívem', 'kincsem', 'bogaram', 'cicám', 'angyalom', 'babám', 'nyuszim', 'tubicám']
  }
};

// Generate article content
function generateArticle(langCode, topicType) {
  const lang = LANGUAGES[langCode];
  const vocab = VOCAB_DATA[langCode];

  switch(topicType) {
    case '100-words': return generate100Words(langCode, lang, vocab);
    case 'pet-names': return generatePetNames(langCode, lang, vocab);
    case 'i-love-you': return generateILoveYou(langCode, lang, vocab);
    case 'greetings': return generateGreetings(langCode, lang, vocab);
    case 'date-night': return generateDateNight(langCode, lang, vocab);
    default: throw new Error(`Unknown topic: ${topicType}`);
  }
}

function generate100Words(langCode, lang, vocab) {
  const slug = `100-most-common-${lang.english}-words`;
  const title = `De 100 Meest Voorkomende ${lang.dutch}e Woorden`;
  const desc = `Leer de 100 meest gebruikte ${lang.dutch}e woorden met uitspraak en voorbeelden. Perfect voor koppels die samen ${lang.dutch} willen leren.`;

  const content = `---
title: "${title}"
description: "${desc}"
category: vocabulary
difficulty: beginner
readTime: 15
date: '${today}'
image: /blog/${slug}-dutch.jpg
tags: ['${lang.dutch.toLowerCase()}', 'woordenschat', 'beginners', 'koppels', 'basiswoorden']
nativeLanguage: nl
language: ${langCode}
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Het ${lang.dutch} leren begint met de basis. In dit artikel vind je de 100 meest voorkomende ${lang.dutch}e woorden die je direct kunt gebruiken in gesprekken met je partner!

<PhraseOfDay
  word="${vocab.love}"
  translation="liefde"
  pronunciation="${vocab.pronunciation.split('/')[1] ? '/' + vocab.pronunciation.split('/')[1] : '/...'}"
  context="Het belangrijkste woord om te leren - liefde is universeel!"
/>

## Waarom Deze 100 Woorden?

Onderzoek toont aan dat de 100 meest voorkomende woorden ongeveer 50% van alle geschreven tekst uitmaken. Door deze woorden te leren, krijg je snel een basis waarmee je:

- Eenvoudige zinnen kunt begrijpen
- Basis gesprekken kunt voeren
- Je partner kunt verrassen met je kennis

## Persoonlijke Voornaamwoorden

De basis van elke zin begint hier.

<VocabCard
  word="${vocab.words100[0]}"
  translation="ik"
  pronunciation="/.../"
  example="${vocab.iLoveYou}"
  exampleTranslation="Ik hou van je."
/>

<VocabCard
  word="${vocab.words100[1]}"
  translation="jij"
  pronunciation="/.../"
  example="${vocab.words100[1]} ${vocab.beautiful}"
  exampleTranslation="Jij bent mooi."
/>

<CultureTip flag="${lang.flag}" title="Taalweetje">
In het ${lang.dutch} zijn er vaak formele en informele vormen van 'jij'. Met je partner gebruik je altijd de informele vorm!
</CultureTip>

## Essentiële Werkwoorden

Werkwoorden zijn de motor van elke zin.

| ${lang.dutch} | Nederlands | Gebruik |
|---------------|------------|---------|
| ${vocab.words100[4]} | is/zijn | basis |
| ${vocab.words100[7]} | hebben | bezit |
| ${vocab.words100[8]} | kunnen | vermogen |

## Bijvoeglijke Naamwoorden voor Complimenten

<VocabCard
  word="${vocab.beautiful}"
  translation="mooi"
  pronunciation="/.../"
  example="${vocab.words100[1]} ${vocab.words100[4]} ${vocab.beautiful}"
  exampleTranslation="Je bent mooi."
/>

## Romantische Woorden

| ${lang.dutch} | Nederlands |
|---------------|------------|
| ${vocab.love} | liefde |
| ${vocab.words100[10]} | liefde |
| ${vocab.words100[11]} | hart |
| ${vocab.kiss} | kus |

## Tips om te Leren

1. **Dagelijkse herhaling** - Oefen 10 woorden per dag
2. **Samen oefenen** - Vraag je partner om je te helpen
3. **Context gebruiken** - Leer woorden in zinnen, niet los
4. **Luister en herhaal** - Imiteer de uitspraak van moedertaalsprekers
5. **Wees geduldig** - Elke taal kost tijd!

<CultureTip flag="${lang.flag}" title="Fun Fact over ${lang.dutch}">
${lang.dutch} wordt gesproken in ${lang.country} en is een prachtige taal met een rijke geschiedenis. Door de taal van je partner te leren, toon je respect voor hun cultuur!
</CultureTip>

## Volgende Stappen

Nu je de basis woorden kent, kun je verder met:
- Koosnaampjes en liefkozingen
- Begroetingen en afscheid nemen
- Romantische zinnen

Onthoud: elke stap brengt je dichter bij het hart van je partner!

<CTA />
`;

  return { slug, content };
}

function generatePetNames(langCode, lang, vocab) {
  const slug = `${lang.english}-pet-names-and-endearments`;
  const title = `${lang.dutch}e Koosnaampjes en Liefkozingen`;
  const desc = `Ontdek de liefste ${lang.dutch}e koosnaampjes voor je partner. Van schattige bijnamen tot romantische liefkozingen.`;

  const content = `---
title: "${title}"
description: "${desc}"
category: vocabulary
difficulty: beginner
readTime: 8
date: '${today}'
image: /blog/${slug}-dutch.jpg
tags: ['${lang.dutch.toLowerCase()}', 'koosnaampjes', 'romantisch', 'koppels', 'liefkozingen']
nativeLanguage: nl
language: ${langCode}
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Koosnaampjes zijn in elke taal speciaal. Ontdek de liefste ${lang.dutch}e koosnaampjes om je partner te laten smelten!

<PhraseOfDay
  word="${vocab.darling}"
  translation="schat/lieverd"
  pronunciation="/.../"
  context="Het meest gebruikte koosnaampje in het ${lang.dutch}!"
/>

## De Populairste Koosnaampjes

Deze koosnaampjes hoor je het vaakst in ${lang.country}.

<VocabCard
  word="${vocab.petNames[0]}"
  translation="liefste/schat"
  pronunciation="/.../"
  example="${vocab.iLoveYou}, ${vocab.petNames[0]}."
  exampleTranslation="Ik hou van je, schat."
/>

<VocabCard
  word="${vocab.petNames[1]}"
  translation="schatje"
  pronunciation="/.../"
  example="Goedemorgen, ${vocab.petNames[1]}!"
  exampleTranslation="Goedemorgen, schatje!"
/>

<VocabCard
  word="${vocab.petNames[2]}"
  translation="liefje"
  pronunciation="/.../"
  example="${vocab.petNames[2]}, kom je?"
  exampleTranslation="Liefje, kom je?"
/>

<CultureTip flag="${lang.flag}" title="Culturele Context">
In ${lang.country} worden koosnaampjes vaak gebruikt, zelfs in het openbaar. Het is een teken van genegenheid!
</CultureTip>

## Klassieke Koosnaampjes

| ${lang.dutch} | Nederlands | Wanneer Gebruiken |
|---------------|------------|-------------------|
| ${vocab.petNames[0]} | schat | altijd |
| ${vocab.petNames[1]} | liefje | casual |
| ${vocab.petNames[2]} | lieverd | intiem |
| ${vocab.petNames[3]} | snoes | speels |
| ${vocab.petNames[4]} | engel | romantisch |

## Schattige Diernamen

In veel talen worden dieren als koosnaampjes gebruikt!

<VocabCard
  word="${vocab.petNames[5]}"
  translation="schatje (letterlijk: klein dier)"
  pronunciation="/.../"
  example="Mijn kleine ${vocab.petNames[5]}!"
  exampleTranslation="Mijn kleine schatje!"
/>

## Koosnaampjes voor Mannen

<VocabCard
  word="${vocab.petNames[6]}"
  translation="knapperd/liefste"
  pronunciation="/.../"
  example="Hé ${vocab.petNames[6]}, hoe was je dag?"
  exampleTranslation="Hé liefste, hoe was je dag?"
/>

## Koosnaampjes voor Vrouwen

<VocabCard
  word="${vocab.petNames[7]}"
  translation="schatje/liefje"
  pronunciation="/.../"
  example="${vocab.petNames[7]}, je ziet er prachtig uit!"
  exampleTranslation="Schatje, je ziet er prachtig uit!"
/>

## Wanneer Welk Koosnaampje?

1. **Thuis**: Alle koosnaampjes zijn gepast
2. **In het openbaar**: Kies subtielere opties
3. **Bij familie**: Klassieke koosnaampjes
4. **SMS/Chat**: Korte, speelse namen

<CultureTip flag="${lang.flag}" title="Pro Tip">
Begin met één koosnaampje en bouw langzaam uit. Je partner waardeert de moeite die je doet om ${lang.dutch} te leren!
</CultureTip>

## Jouw Unieke Koosnaampje

Het mooiste koosnaampje is er één die alleen jullie begrijpen. Combineer ${lang.dutch}e woorden om iets unieks te maken voor jullie relatie!

<CTA />
`;

  return { slug, content };
}

function generateILoveYou(langCode, lang, vocab) {
  const slug = `how-to-say-i-love-you-in-${lang.english}`;
  const title = `Hoe Zeg Je "Ik Hou Van Je" in het ${lang.dutch}?`;
  const desc = `Leer alle manieren om "ik hou van je" te zeggen in het ${lang.dutch}. Van casual tot diep romantisch.`;

  const content = `---
title: "${title}"
description: "${desc}"
category: vocabulary
difficulty: beginner
readTime: 8
date: '${today}'
image: /blog/${slug}-dutch.jpg
tags: ['${lang.dutch.toLowerCase()}', 'ik hou van je', 'romantisch', 'liefde', 'koppels']
nativeLanguage: nl
language: ${langCode}
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

"Ik hou van je" zeggen in de taal van je partner is een van de meest romantische gebaren. Leer alle manieren om je liefde uit te drukken in het ${lang.dutch}!

<PhraseOfDay
  word="${vocab.iLoveYou}"
  translation="Ik hou van je"
  pronunciation="${vocab.pronunciation}"
  context="De belangrijkste zin in elke taal - en nu ken je hem in het ${lang.dutch}!"
/>

## De Basis: Ik Hou Van Je

<VocabCard
  word="${vocab.iLoveYou}"
  translation="Ik hou van je"
  pronunciation="${vocab.pronunciation}"
  example="${vocab.iLoveYou}, ${vocab.darling}."
  exampleTranslation="Ik hou van je, schat."
/>

<CultureTip flag="${lang.flag}" title="Het Gewicht van Deze Woorden">
In ${lang.country} worden deze woorden niet lichtzinnig gebruikt. Als je ze zegt, weet je partner dat je het meent!
</CultureTip>

## Variaties en Intensiteit

| ${lang.dutch} | Nederlands | Intensiteit |
|---------------|------------|-------------|
| ${vocab.iLoveYou} | Ik hou van je | ⭐⭐⭐ |
| ${vocab.iLoveYou} (+ veel) | Ik hou heel veel van je | ⭐⭐⭐⭐ |
| ${vocab.myLove} | Mijn liefde | ⭐⭐⭐⭐⭐ |

## Romantische Uitdrukkingen

<VocabCard
  word="${vocab.myLove}"
  translation="mijn liefde"
  pronunciation="/.../"
  example="Je bent ${vocab.myLove}."
  exampleTranslation="Je bent mijn liefde."
/>

<VocabCard
  word="${vocab.sweetheart}"
  translation="liefje/schat"
  pronunciation="/.../"
  example="${vocab.sweetheart}, ik mis je."
  exampleTranslation="Schat, ik mis je."
/>

## Wanneer Zeg Je Het?

1. **De eerste keer** - Kies een speciaal moment
2. **Dagelijks** - 's Ochtends of 's avonds
3. **Als afscheid** - Voordat je weggaat
4. **Spontaan** - Omdat je het voelt

<CultureTip flag="${lang.flag}" title="Culturele Nuance">
In ${lang.country} kan de manier waarop je "ik hou van je" zegt de diepte van je gevoelens uitdrukken. De uitspraak en toon zijn belangrijk!
</CultureTip>

## Reacties op "Ik Hou Van Je"

| ${lang.dutch} | Nederlands |
|---------------|------------|
| Ik ook van jou | Ik ook van jou |
| Meer dan je weet | Meer dan je weet |
| Voor altijd | Voor altijd |

## Tips voor de Eerste Keer

1. **Oefen de uitspraak** - Luister naar native speakers
2. **Kies het juiste moment** - Niet onder druk
3. **Wees oprecht** - Je partner voelt het
4. **Maak je geen zorgen** - Een accent is charmant!

## Liefde Uitdrukken Zonder Woorden

Soms zeggen gebaren meer dan woorden. In ${lang.country} zijn deze gebaren ook belangrijk:
- Hand vasthouden
- Een knuffel geven
- Oogcontact maken
- Kleine attenties

<CTA />
`;

  return { slug, content };
}

function generateGreetings(langCode, lang, vocab) {
  const slug = `${lang.english}-greetings-and-farewells`;
  const title = `${lang.dutch}e Begroetingen en Afscheid Nemen`;
  const desc = `Leer hoe je begroet en afscheid neemt in het ${lang.dutch}. Essentiële zinnen voor elke dag met je partner.`;

  const content = `---
title: "${title}"
description: "${desc}"
category: vocabulary
difficulty: beginner
readTime: 8
date: '${today}'
image: /blog/${slug}-dutch.jpg
tags: ['${lang.dutch.toLowerCase()}', 'begroetingen', 'afscheid', 'dagelijks', 'koppels']
nativeLanguage: nl
language: ${langCode}
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Begroetingen zijn de eerste stap in elke conversatie. Leer de belangrijkste ${lang.dutch}e manieren om hallo en tot ziens te zeggen!

<PhraseOfDay
  word="${vocab.hello}"
  translation="Hallo"
  pronunciation="/.../"
  context="De meest gebruikte begroeting in het ${lang.dutch}!"
/>

## Informele Begroetingen

Voor dagelijks gebruik met je partner.

<VocabCard
  word="${vocab.hello}"
  translation="Hallo"
  pronunciation="/.../"
  example="${vocab.hello}, ${vocab.darling}!"
  exampleTranslation="Hallo, schat!"
/>

<VocabCard
  word="${vocab.goodMorning}"
  translation="Goedemorgen"
  pronunciation="/.../"
  example="${vocab.goodMorning}, slaap lekker gehad?"
  exampleTranslation="Goedemorgen, lekker geslapen?"
/>

<CultureTip flag="${lang.flag}" title="Lichaamstaal">
In ${lang.country} hoort bij begroetingen vaak specifieke lichaamstaal. Let op hoe je partner's familie en vrienden elkaar begroeten!
</CultureTip>

## Tijdgebonden Begroetingen

| ${lang.dutch} | Nederlands | Wanneer |
|---------------|------------|---------|
| ${vocab.goodMorning} | Goedemorgen | ochtend |
| Goede middag | Goede middag | middag |
| Goede avond | Goede avond | avond |
| Welterusten | Welterusten | voor het slapen |

## Afscheid Nemen - Informeel

<VocabCard
  word="${vocab.goodbye}"
  translation="Tot ziens / Doei"
  pronunciation="/.../"
  example="${vocab.goodbye}, tot vanavond!"
  exampleTranslation="Doei, tot vanavond!"
/>

## Romantische Begroetingen

| ${lang.dutch} | Nederlands |
|---------------|------------|
| Goedemorgen, ${vocab.darling} | Goedemorgen, schat |
| Fijne dag, ${vocab.myLove} | Fijne dag, mijn liefde |
| Tot straks, ${vocab.sweetheart} | Tot straks, liefje |

<CultureTip flag="${lang.flag}" title="Speciale Momenten">
In ${lang.country} hebben speciale gelegenheden vaak hun eigen begroetingen. Vraag je partner naar feestdagen en tradities!
</CultureTip>

## Hoe Gaat Het?

<VocabCard
  word="Hoe gaat het?"
  translation="Hoe gaat het?"
  pronunciation="/.../"
  example="Hallo! Hoe gaat het met je?"
  exampleTranslation="Hallo! Hoe gaat het met je?"
/>

## Antwoorden

| ${lang.dutch} | Nederlands |
|---------------|------------|
| Goed | Goed |
| Heel goed | Heel goed |
| Niet slecht | Niet slecht |
| Beter nu jij er bent | Beter nu jij er bent |

## Romantisch Afscheid

<VocabCard
  word="Tot vanavond, ${vocab.myLove}"
  translation="Tot vanavond, mijn liefde"
  pronunciation="/.../"
  example="${vocab.iLoveYou}. Tot vanavond!"
  exampleTranslation="Ik hou van je. Tot vanavond!"
/>

## Tips voor Dagelijks Gebruik

1. **Begin de dag goed** - Zeg altijd goedemorgen
2. **Neem écht afscheid** - Niet alleen weglopen
3. **Voeg koosnaampjes toe** - Maakt het persoonlijker
4. **Combineer met gebaren** - Een kus of knuffel erbij

<CTA />
`;

  return { slug, content };
}

function generateDateNight(langCode, lang, vocab) {
  const slug = `${lang.english}-date-night-vocabulary`;
  const title = `${lang.dutch}e Woordenschat voor een Romantisch Avondje`;
  const desc = `Bereid je voor op een perfecte date met deze ${lang.dutch}e romantische woordenschat. Restaurant, bioscoop en meer.`;

  const content = `---
title: "${title}"
description: "${desc}"
category: vocabulary
difficulty: beginner
readTime: 8
date: '${today}'
image: /blog/${slug}-dutch.jpg
tags: ['${lang.dutch.toLowerCase()}', 'date night', 'romantisch', 'restaurant', 'uitgaan']
nativeLanguage: nl
language: ${langCode}
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Een romantisch avondje uit is nog leuker als je de taal spreekt! Hier is alle ${lang.dutch}e woordenschat die je nodig hebt voor de perfecte date.

<PhraseOfDay
  word="${vocab.romantic}"
  translation="romantisch"
  pronunciation="/.../"
  context="Het perfecte woord voor jullie speciale avond!"
/>

## In het Restaurant

<VocabCard
  word="${vocab.dinner}"
  translation="diner/avondeten"
  pronunciation="/.../"
  example="Zullen we ${vocab.dinner} gaan eten?"
  exampleTranslation="Zullen we uit eten gaan?"
/>

<VocabCard
  word="${vocab.wine}"
  translation="wijn"
  pronunciation="/.../"
  example="Een glas ${vocab.wine}, alstublieft."
  exampleTranslation="Een glas wijn, alstublieft."
/>

<CultureTip flag="${lang.flag}" title="Restaurant Etiquette">
In ${lang.country} heeft elk restaurant zijn eigen sfeer en tradities. Vraag je partner om tips over lokale restaurants!
</CultureTip>

## Bestellen

| ${lang.dutch} | Nederlands |
|---------------|------------|
| De menukaart | De menukaart |
| Mag ik bestellen? | Mag ik bestellen? |
| De rekening | De rekening |
| Het voorgerecht | Het voorgerecht |
| Het hoofdgerecht | Het hoofdgerecht |
| Het dessert | Het dessert |

## Complimenten Geven

<VocabCard
  word="Je ziet er ${vocab.beautiful} uit"
  translation="Je ziet er prachtig uit"
  pronunciation="/.../"
  example="Wauw, je ziet er ${vocab.beautiful} uit vanavond!"
  exampleTranslation="Wauw, je ziet er prachtig uit vanavond!"
/>

## Romantische Zinnen

| ${lang.dutch} | Nederlands |
|---------------|------------|
| Dit is ${vocab.romantic} | Dit is romantisch |
| Ik geniet van dit moment | Ik geniet van dit moment |
| ${vocab.iLoveYou} | Ik hou van je |
| Mag ik deze dans? | Mag ik deze dans? |

<CultureTip flag="${lang.flag}" title="Date Tradities">
Elke cultuur heeft eigen date-tradities. In ${lang.country} zijn er misschien tradities die je nog niet kent - vraag ernaar!
</CultureTip>

## In de Bioscoop

| ${lang.dutch} | Nederlands |
|---------------|------------|
| De film | De film |
| Twee kaartjes | Twee kaartjes |
| Popcorn | Popcorn |
| De beste stoelen | De beste stoelen |

## Een Wandeling Maken

<VocabCard
  word="Zullen we wandelen?"
  translation="Zullen we een wandeling maken?"
  pronunciation="/.../"
  example="De sterren zijn ${vocab.beautiful}. Zullen we wandelen?"
  exampleTranslation="De sterren zijn mooi. Zullen we wandelen?"
/>

## De Avond Afsluiten

<VocabCard
  word="Dit was ${vocab.romantic}"
  translation="Dit was romantisch"
  pronunciation="/.../"
  example="Dank je voor deze avond. Dit was echt ${vocab.romantic}."
  exampleTranslation="Dank je voor deze avond. Dit was echt romantisch."
/>

## Checklist voor Date Night

1. ✅ Basisbegroetingen geoefend
2. ✅ Restaurant vocabulaire geleerd
3. ✅ Complimenten paraat
4. ✅ "${vocab.iLoveYou}" geoefend
5. ✅ Koosnaampjes onthouden

## Pro Tips

- **Reserveer van tevoren** - In het ${lang.dutch} als dat kan!
- **Leer het menu** - Vraag je partner om favoriete gerechten
- **Wees niet bang** - Fouten maken is oké en schattig
- **Vraag om hulp** - Je partner helpt je graag

<CTA />
`;

  return { slug, content };
}

// Main execution
function main() {
  const stats = { created: 0, errors: 0 };
  const summary = [];

  const topics = ['100-words', 'pet-names', 'i-love-you', 'greetings', 'date-night'];

  for (const langCode of Object.keys(LANGUAGES)) {
    const langDir = path.join(ARTICLES_DIR, langCode);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    for (const topic of topics) {
      try {
        const { slug, content } = generateArticle(langCode, topic);
        const filePath = path.join(langDir, `${slug}.mdx`);

        fs.writeFileSync(filePath, content, 'utf-8');
        stats.created++;
        summary.push(`✅ ${langCode}/${slug}`);
        console.log(`Created: ${langCode}/${slug}.mdx`);
      } catch (err) {
        stats.errors++;
        summary.push(`❌ ${langCode}/${topic}: ${err.message}`);
        console.error(`Error: ${langCode}/${topic} - ${err.message}`);
      }
    }
  }

  // Write summary
  const summaryContent = `# Dutch (nl) Batch 1 Generation Summary

**Date:** ${today}
**Total Articles:** ${stats.created}
**Errors:** ${stats.errors}

## Topics Generated
1. 100 Most Common Words
2. Pet Names and Endearments
3. How to Say I Love You
4. Greetings and Farewells
5. Date Night Vocabulary

## Target Languages (17)
${Object.entries(LANGUAGES).map(([code, l]) => `- ${l.flag} ${l.dutch} (${code})`).join('\n')}

## Articles Created
${summary.join('\n')}

## Next Steps
- Review generated articles for quality
- Add images where needed
- Build and test: \`cd blog && npm run build\`
`;

  const logDir = path.join(ROOT, 'generation_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.writeFileSync(path.join(logDir, 'nl_batch1.md'), summaryContent);

  console.log(`\n✅ Generation complete: ${stats.created} articles, ${stats.errors} errors`);
  console.log(`Summary saved to: generation_logs/nl_batch1.md`);
}

main();
