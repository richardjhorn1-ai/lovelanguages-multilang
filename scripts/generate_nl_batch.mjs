#!/usr/bin/env node
/**
 * Dutch Articles Batch Generator
 * Generates 5 topics × 17 target languages = 85 articles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'blog/src/content/articles/nl');

// Target languages with Dutch and English names
const LANGUAGES = {
  en: { english: 'english', dutch: 'Engels', flag: '🇬🇧' },
  de: { english: 'german', dutch: 'Duits', flag: '🇩🇪' },
  fr: { english: 'french', dutch: 'Frans', flag: '🇫🇷' },
  es: { english: 'spanish', dutch: 'Spaans', flag: '🇪🇸' },
  it: { english: 'italian', dutch: 'Italiaans', flag: '🇮🇹' },
  pt: { english: 'portuguese', dutch: 'Portugees', flag: '🇵🇹' },
  pl: { english: 'polish', dutch: 'Pools', flag: '🇵🇱' },
  ru: { english: 'russian', dutch: 'Russisch', flag: '🇷🇺' },
  uk: { english: 'ukrainian', dutch: 'Oekraïens', flag: '🇺🇦' },
  tr: { english: 'turkish', dutch: 'Turks', flag: '🇹🇷' },
  ro: { english: 'romanian', dutch: 'Roemeens', flag: '🇷🇴' },
  sv: { english: 'swedish', dutch: 'Zweeds', flag: '🇸🇪' },
  no: { english: 'norwegian', dutch: 'Noors', flag: '🇳🇴' },
  da: { english: 'danish', dutch: 'Deens', flag: '🇩🇰' },
  cs: { english: 'czech', dutch: 'Tsjechisch', flag: '🇨🇿' },
  el: { english: 'greek', dutch: 'Grieks', flag: '🇬🇷' },
  hu: { english: 'hungarian', dutch: 'Hongaars', flag: '🇭🇺' }
};

// Topic templates
const TOPICS = [
  {
    id: '100-words',
    slugTemplate: '100-most-common-{lang}-words',
    titleTemplate: 'De 100 Meest Voorkomende {LANG} Woorden',
    descTemplate: 'Leer de 100 meest gebruikte {LANG} woorden met uitspraak en voorbeelden. Perfect voor koppels die samen {LANG} willen leren.',
    generator: generate100Words
  },
  {
    id: 'pet-names',
    slugTemplate: '{lang}-pet-names-and-endearments',
    titleTemplate: '{LANG} Koosnaampjes en Liefkozingen',
    descTemplate: 'Ontdek de liefste {LANG} koosnaampjes voor je partner. Van schattige bijnamen tot romantische liefkozingen.',
    generator: generatePetNames
  },
  {
    id: 'i-love-you',
    slugTemplate: 'how-to-say-i-love-you-in-{lang}',
    titleTemplate: 'Hoe Zeg Je "Ik Hou Van Je" in het {LANG}?',
    descTemplate: 'Leer alle manieren om "ik hou van je" te zeggen in het {LANG}. Van casual tot diep romantisch.',
    generator: generateILoveYou
  },
  {
    id: 'greetings',
    slugTemplate: '{lang}-greetings-and-farewells',
    titleTemplate: '{LANG} Begroetingen en Afscheid Nemen',
    descTemplate: 'Leer hoe je begroet en afscheid neemt in het {LANG}. Essentiële zinnen voor elke dag met je partner.',
    generator: generateGreetings
  },
  {
    id: 'date-night',
    slugTemplate: '{lang}-date-night-vocabulary',
    titleTemplate: '{LANG} Woordenschat voor een Romantisch Avondje',
    descTemplate: 'Bereid je voor op een perfecte date met deze {LANG} romantische woordenschat. Restaurant, bioscoop en meer.',
    generator: generateDateNight
  }
];

const today = new Date().toISOString().split('T')[0];

function createFrontmatter(topic, langCode) {
  const lang = LANGUAGES[langCode];
  const slug = topic.slugTemplate.replace('{lang}', lang.english);
  const title = topic.titleTemplate.replace('{LANG}', lang.dutch);
  const desc = topic.descTemplate.replace(/{LANG}/g, lang.dutch);

  return {
    frontmatter: `---
title: "${title}"
description: "${desc}"
category: vocabulary
difficulty: beginner
readTime: ${topic.id === '100-words' ? 15 : 8}
date: '${today}'
image: /blog/${slug}-dutch.jpg
tags: ['${lang.dutch.toLowerCase()}', 'woordenschat', 'koppels', 'leren', 'beginners']
nativeLanguage: nl
language: ${langCode}
---`,
    slug,
    langInfo: lang
  };
}

// Content generators for each topic type

function generate100Words(langCode) {
  const lang = LANGUAGES[langCode];
  const words = getCommonWordsForLanguage(langCode);

  return `
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Het ${lang.dutch} leren wordt veel makkelijker als je begint met de meest gebruikte woorden. In dit artikel vind je de 100 meest voorkomende ${lang.dutch}e woorden, compleet met uitspraak en romantische voorbeeldzinnen!

<PhraseOfDay
  word="${words.featured.word}"
  translation="${words.featured.translation}"
  pronunciation="${words.featured.pronunciation}"
  context="${words.featured.context}"
/>

## Persoonlijke Voornaamwoorden

De basis van elke taal begint bij de voornaamwoorden.

${words.pronouns.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Formeel vs Informeel">
${words.cultureTip1}
</CultureTip>

## Essentiële Werkwoorden

De belangrijkste werkwoorden die je dagelijks zult gebruiken.

${words.verbs.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${words.verbsTable.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Veelgebruikte Bijvoeglijke Naamwoorden

Perfect voor complimenten aan je partner!

${words.adjectives.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Taalkundige Tip">
${words.cultureTip2}
</CultureTip>

## Belangrijke Zelfstandige Naamwoorden

${words.nouns.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${words.nounsTable.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Bijwoorden en Nuttige Woorden

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${words.adverbs.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Romantische Zinnen met Deze Woorden

${words.romantic.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Tips om Samen te Leren

1. **Dagelijkse oefening** - Oefen elke dag 10 nieuwe woorden met je partner
2. **Labels in huis** - Plak sticky notes met ${lang.dutch}e woorden op voorwerpen
3. **Films kijken** - Kijk ${lang.dutch}e films met ondertiteling
4. **Koken** - Maak ${lang.dutch}e gerechten en leer het vocabulaire
5. **Spraakberichten** - Stuur elkaar ${lang.dutch}e spraakberichten

<CultureTip flag="${lang.flag}" title="Leuke Weetje">
${words.funFact}
</CultureTip>

<CTA />
`;
}

function generatePetNames(langCode) {
  const lang = LANGUAGES[langCode];
  const pet = getPetNamesForLanguage(langCode);

  return `
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Koosnaampjes zijn een belangrijk onderdeel van elke romantische relatie. Ontdek de liefste en meest gebruikte ${lang.dutch}e koosnaampjes om je partner te laten smelten!

<PhraseOfDay
  word="${pet.featured.word}"
  translation="${pet.featured.translation}"
  pronunciation="${pet.featured.pronunciation}"
  context="${pet.featured.context}"
/>

## Klassieke Koosnaampjes

De tijdloze favorieten die altijd werken.

${pet.classic.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Wanneer Gebruiken">
${pet.cultureTip1}
</CultureTip>

## Schattige Diernamen

In het ${lang.dutch} worden vaak dieren gebruikt als koosnaampjes.

${pet.animal.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Romantische Koosnaampjes

Voor die speciale momenten.

${pet.romantic.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Culturele Context">
${pet.cultureTip2}
</CultureTip>

## Speelse Koosnaampjes

| ${lang.dutch} | Uitspraak | Nederlands | Wanneer Gebruiken |
|---------|-----------|------------|-------------------|
${pet.playful.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} | ${w.usage} |`).join('\n')}

## Koosnaampjes voor Mannen

${pet.forMen.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Koosnaampjes voor Vrouwen

${pet.forWomen.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Tips voor het Gebruiken van Koosnaampjes

1. **Begin voorzichtig** - Introduceer koosnaampjes geleidelijk
2. **Let op de context** - Niet alle koosnaampjes zijn geschikt voor in het openbaar
3. **Vraag je partner** - Sommige mensen vinden bepaalde koosnaampjes kinderachtig
4. **Wees creatief** - Maak jullie eigen unieke koosnaampje
5. **Uitspraak oefenen** - Een goed uitgesproken koosnaampje klinkt veel liever

<CTA />
`;
}

function generateILoveYou(langCode) {
  const lang = LANGUAGES[langCode];
  const love = getILoveYouForLanguage(langCode);

  return `
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

"Ik hou van je" zeggen in de taal van je partner is een van de meest romantische gebaren die er bestaat. Ontdek alle manieren om je liefde uit te drukken in het ${lang.dutch}!

<PhraseOfDay
  word="${love.featured.word}"
  translation="${love.featured.translation}"
  pronunciation="${love.featured.pronunciation}"
  context="${love.featured.context}"
/>

## De Basis: Ik Hou Van Je

${love.basic.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Het Gewicht van Deze Woorden">
${love.cultureTip1}
</CultureTip>

## Intensere Uitdrukkingen

Wanneer je meer wilt zeggen dan alleen "ik hou van je".

${love.intense.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Romantische Variaties

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${love.variations.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

<CultureTip flag="${lang.flag}" title="Culturele Nuance">
${love.cultureTip2}
</CultureTip>

## Liefde Uitdrukken Zonder "Ik Hou Van Je"

Soms zijn andere zinnen net zo krachtig.

${love.alternative.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Eerste Keer Zeggen

Tips voor het eerste "ik hou van je":

1. **Kies het juiste moment** - Niet onder druk of in het openbaar
2. **Wees oprecht** - Je partner zal je accent schattig vinden
3. **Oefen de uitspraak** - Zoek voorbeelden op YouTube
4. **Combineer met een gebaar** - Een knuffel of hand vasthouden
5. **Verwacht geen perfectie** - Het gaat om de bedoeling

## Reacties op "Ik Hou Van Je"

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${love.responses.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Historische en Literaire Uitdrukkingen

${love.literary.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CTA />
`;
}

function generateGreetings(langCode) {
  const lang = LANGUAGES[langCode];
  const greet = getGreetingsForLanguage(langCode);

  return `
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Begroetingen zijn de eerste stap in elke conversatie. Leer hoe je op de juiste manier hallo en tot ziens zegt in het ${lang.dutch} - essentieel voor je dagelijkse gesprekken met je partner!

<PhraseOfDay
  word="${greet.featured.word}"
  translation="${greet.featured.translation}"
  pronunciation="${greet.featured.pronunciation}"
  context="${greet.featured.context}"
/>

## Informele Begroetingen

Voor dagelijks gebruik met je partner.

${greet.informal.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Lichaamstaal">
${greet.cultureTip1}
</CultureTip>

## Formele Begroetingen

Voor familie en formele situaties.

${greet.formal.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Tijdgebonden Begroetingen

| ${lang.dutch} | Uitspraak | Nederlands | Wanneer |
|---------|-----------|------------|---------|
${greet.timeSpecific.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} | ${w.when} |`).join('\n')}

<CultureTip flag="${lang.flag}" title="Etiquette">
${greet.cultureTip2}
</CultureTip>

## Afscheid Nemen - Informeel

${greet.informalBye.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Afscheid Nemen - Formeel

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${greet.formalBye.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Hoe Gaat Het?

${greet.howAreYou.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Antwoorden op "Hoe Gaat Het?"

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${greet.responses.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Speciale Begroetingen

Voor speciale momenten zoals verjaardagen of feestdagen.

${greet.special.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CTA />
`;
}

function generateDateNight(langCode) {
  const lang = LANGUAGES[langCode];
  const date = getDateNightForLanguage(langCode);

  return `
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Bereid je voor op een romantisch avondje uit met de perfecte ${lang.dutch}e woordenschat. Of je nu naar een restaurant gaat, de bioscoop, of gewoon een wandeling maakt - deze woorden en zinnen helpen je indruk te maken!

<PhraseOfDay
  word="${date.featured.word}"
  translation="${date.featured.translation}"
  pronunciation="${date.featured.pronunciation}"
  context="${date.featured.context}"
/>

## In het Restaurant

${date.restaurant.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

<CultureTip flag="${lang.flag}" title="Restaurant Etiquette">
${date.cultureTip1}
</CultureTip>

## Bestellen

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${date.ordering.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Complimenten Geven

${date.compliments.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## In de Bioscoop

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${date.cinema.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

<CultureTip flag="${lang.flag}" title="Date Cultuur">
${date.cultureTip2}
</CultureTip>

## Romantische Zinnen voor de Avond

${date.romantic.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Een Wandeling Maken

| ${lang.dutch} | Uitspraak | Nederlands |
|---------|-----------|------------|
${date.walking.map(w => `| **${w.word}** | ${w.pronunciation} | ${w.translation} |`).join('\n')}

## Drankjes

${date.drinks.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## De Avond Afsluiten

${date.ending.map(w => `<VocabCard
  word="${w.word}"
  translation="${w.translation}"
  pronunciation="${w.pronunciation}"
  example="${w.example}"
  exampleTranslation="${w.exampleTranslation}"
/>`).join('\n\n')}

## Tips voor een Perfecte ${lang.dutch}e Date

1. **Reserveer van tevoren** - Leer de ${lang.dutch}e woorden voor reserveren
2. **Oefen basiswoorden** - Menu-items, betalen, bedanken
3. **Leer complimenten** - Ze zijn altijd welkom!
4. **Bereid gespreksonderwerpen voor** - Simpele vragen in het ${lang.dutch}
5. **Wees niet bang voor fouten** - Je partner waardeert de moeite

<CTA />
`;
}

// Language-specific data generators
function getCommonWordsForLanguage(code) {
  const data = {
    en: {
      featured: { word: "Love", translation: "Liefde", pronunciation: "/lʌv/", context: "Het mooiste woord om je reis te beginnen!" },
      pronouns: [
        { word: "I", translation: "ik", pronunciation: "/aɪ/", example: "I love you.", exampleTranslation: "Ik hou van je." },
        { word: "you", translation: "jij/je", pronunciation: "/juː/", example: "You are beautiful.", exampleTranslation: "Je bent mooi." },
        { word: "we", translation: "wij/we", pronunciation: "/wiː/", example: "We are together.", exampleTranslation: "We zijn samen." }
      ],
      cultureTip1: "In het Engels is er geen verschil tussen formeel en informeel 'je' - 'you' wordt altijd gebruikt.",
      verbs: [
        { word: "to be", translation: "zijn", pronunciation: "/tuː biː/", example: "You are my sunshine.", exampleTranslation: "Jij bent mijn zonneschijn." },
        { word: "to have", translation: "hebben", pronunciation: "/tuː hæv/", example: "I have a surprise for you.", exampleTranslation: "Ik heb een verrassing voor je." },
        { word: "to love", translation: "houden van", pronunciation: "/tuː lʌv/", example: "I love spending time with you.", exampleTranslation: "Ik hou ervan tijd met je door te brengen." }
      ],
      verbsTable: [
        { word: "to go", pronunciation: "/tuː ɡoʊ/", translation: "gaan" },
        { word: "to come", pronunciation: "/tuː kʌm/", translation: "komen" },
        { word: "to see", pronunciation: "/tuː siː/", translation: "zien" },
        { word: "to know", pronunciation: "/tuː noʊ/", translation: "weten/kennen" },
        { word: "to think", pronunciation: "/tuː θɪŋk/", translation: "denken" },
        { word: "to want", pronunciation: "/tuː wɒnt/", translation: "willen" },
        { word: "to take", pronunciation: "/tuː teɪk/", translation: "nemen" },
        { word: "to make", pronunciation: "/tuː meɪk/", translation: "maken" }
      ],
      adjectives: [
        { word: "beautiful", translation: "mooi", pronunciation: "/ˈbjuːtɪfəl/", example: "You look beautiful tonight.", exampleTranslation: "Je ziet er mooi uit vanavond." },
        { word: "happy", translation: "gelukkig", pronunciation: "/ˈhæpi/", example: "You make me happy.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Engelse bijvoeglijke naamwoorden veranderen niet - ze blijven altijd hetzelfde!",
      nouns: [
        { word: "love", translation: "liefde", pronunciation: "/lʌv/", example: "Love is all we need.", exampleTranslation: "Liefde is alles wat we nodig hebben." },
        { word: "heart", translation: "hart", pronunciation: "/hɑːrt/", example: "You have my heart.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "day", pronunciation: "/deɪ/", translation: "dag" },
        { word: "night", pronunciation: "/naɪt/", translation: "nacht" },
        { word: "time", pronunciation: "/taɪm/", translation: "tijd" },
        { word: "life", pronunciation: "/laɪf/", translation: "leven" },
        { word: "world", pronunciation: "/wɜːrld/", translation: "wereld" },
        { word: "home", pronunciation: "/hoʊm/", translation: "thuis" }
      ],
      adverbs: [
        { word: "always", pronunciation: "/ˈɔːlweɪz/", translation: "altijd" },
        { word: "never", pronunciation: "/ˈnevər/", translation: "nooit" },
        { word: "here", pronunciation: "/hɪr/", translation: "hier" },
        { word: "there", pronunciation: "/ðer/", translation: "daar" },
        { word: "now", pronunciation: "/naʊ/", translation: "nu" },
        { word: "today", pronunciation: "/təˈdeɪ/", translation: "vandaag" },
        { word: "very", pronunciation: "/ˈveri/", translation: "zeer/heel" },
        { word: "together", pronunciation: "/təˈɡeðər/", translation: "samen" }
      ],
      romantic: [
        { word: "I think about you always", translation: "Ik denk altijd aan je", pronunciation: "/aɪ θɪŋk əˈbaʊt juː ˈɔːlweɪz/", example: "Even at work, I think about you always.", exampleTranslation: "Zelfs op werk denk ik altijd aan je." },
        { word: "You make me happy", translation: "Jij maakt me gelukkig", pronunciation: "/juː meɪk miː ˈhæpi/", example: "Every day, you make me happy.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Het Engels heeft woorden van over 350 talen geleend, waardoor het een van de meest diverse talen ter wereld is!"
    },
    de: {
      featured: { word: "Liebe", translation: "Liefde", pronunciation: "/ˈliːbə/", context: "Het mooiste Duitse woord om je reis te beginnen!" },
      pronouns: [
        { word: "ich", translation: "ik", pronunciation: "/ɪç/", example: "Ich liebe dich.", exampleTranslation: "Ik hou van je." },
        { word: "du", translation: "jij (informeel)", pronunciation: "/duː/", example: "Du bist wunderbar.", exampleTranslation: "Je bent geweldig." },
        { word: "wir", translation: "wij", pronunciation: "/viːɐ̯/", example: "Wir sind zusammen.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "In het Duits gebruik je 'du' voor vrienden en familie, en 'Sie' (met hoofdletter) in formele situaties. Met je partner altijd 'du'!",
      verbs: [
        { word: "sein", translation: "zijn", pronunciation: "/zaɪ̯n/", example: "Du bist mein Schatz.", exampleTranslation: "Jij bent mijn schat." },
        { word: "haben", translation: "hebben", pronunciation: "/ˈhaːbən/", example: "Ich habe dich lieb.", exampleTranslation: "Ik heb je lief." },
        { word: "lieben", translation: "liefhebben", pronunciation: "/ˈliːbən/", example: "Ich liebe dich über alles.", exampleTranslation: "Ik hou meer van je dan van alles." }
      ],
      verbsTable: [
        { word: "machen", pronunciation: "/ˈmaxən/", translation: "maken/doen" },
        { word: "können", pronunciation: "/ˈkœnən/", translation: "kunnen" },
        { word: "kommen", pronunciation: "/ˈkɔmən/", translation: "komen" },
        { word: "gehen", pronunciation: "/ˈɡeːən/", translation: "gaan" },
        { word: "sehen", pronunciation: "/ˈzeːən/", translation: "zien" },
        { word: "wollen", pronunciation: "/ˈvɔlən/", translation: "willen" },
        { word: "denken", pronunciation: "/ˈdɛŋkən/", translation: "denken" },
        { word: "wissen", pronunciation: "/ˈvɪsən/", translation: "weten" }
      ],
      adjectives: [
        { word: "schön", translation: "mooi", pronunciation: "/ʃøːn/", example: "Du siehst schön aus.", exampleTranslation: "Je ziet er mooi uit." },
        { word: "gut", translation: "goed", pronunciation: "/ɡuːt/", example: "Du bist so gut zu mir.", exampleTranslation: "Je bent zo goed voor me." }
      ],
      cultureTip2: "Duitse bijvoeglijke naamwoorden veranderen afhankelijk van geslacht, naamval en bepaaldheid - maar geen paniek, je leert het vanzelf!",
      nouns: [
        { word: "die Liebe", translation: "de liefde", pronunciation: "/diː ˈliːbə/", example: "Die Liebe ist das Wichtigste.", exampleTranslation: "Liefde is het belangrijkste." },
        { word: "das Herz", translation: "het hart", pronunciation: "/das hɛʁts/", example: "Du hast mein Herz.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "der Tag", pronunciation: "/deːɐ̯ taːk/", translation: "de dag" },
        { word: "die Nacht", pronunciation: "/diː naxt/", translation: "de nacht" },
        { word: "die Zeit", pronunciation: "/diː t͡saɪ̯t/", translation: "de tijd" },
        { word: "das Leben", pronunciation: "/das ˈleːbən/", translation: "het leven" },
        { word: "die Welt", pronunciation: "/diː vɛlt/", translation: "de wereld" },
        { word: "das Haus", pronunciation: "/das haʊ̯s/", translation: "het huis" }
      ],
      adverbs: [
        { word: "immer", pronunciation: "/ˈɪmɐ/", translation: "altijd" },
        { word: "nie", pronunciation: "/niː/", translation: "nooit" },
        { word: "hier", pronunciation: "/hiːɐ̯/", translation: "hier" },
        { word: "da", pronunciation: "/daː/", translation: "daar" },
        { word: "jetzt", pronunciation: "/jɛt͡st/", translation: "nu" },
        { word: "heute", pronunciation: "/ˈhɔɪ̯tə/", translation: "vandaag" },
        { word: "sehr", pronunciation: "/zeːɐ̯/", translation: "zeer/heel" },
        { word: "zusammen", pronunciation: "/t͡suˈzamən/", translation: "samen" }
      ],
      romantic: [
        { word: "Ich denke immer an dich", translation: "Ik denk altijd aan je", pronunciation: "/ɪç ˈdɛŋkə ˈɪmɐ an dɪç/", example: "Bei der Arbeit denke ich immer an dich.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Du machst mich glücklich", translation: "Jij maakt me gelukkig", pronunciation: "/duː maxst mɪç ˈɡlʏklɪç/", example: "Jeden Tag machst du mich glücklich.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Het Duits heeft drie geslachten (der/die/das) en maakt lange woorden door ze aan elkaar te plakken. 'Kühlschrank' (koelkast) = kühl (koel) + Schrank (kast)!"
    },
    fr: {
      featured: { word: "Amour", translation: "Liefde", pronunciation: "/amuʁ/", context: "Het meest romantische woord ter wereld!" },
      pronouns: [
        { word: "je", translation: "ik", pronunciation: "/ʒə/", example: "Je t'aime.", exampleTranslation: "Ik hou van je." },
        { word: "tu", translation: "jij (informeel)", pronunciation: "/ty/", example: "Tu es magnifique.", exampleTranslation: "Je bent prachtig." },
        { word: "nous", translation: "wij", pronunciation: "/nu/", example: "Nous sommes ensemble.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "In het Frans gebruik je 'tu' voor je partner, vrienden en familie. 'Vous' is formeel of voor meerdere personen.",
      verbs: [
        { word: "être", translation: "zijn", pronunciation: "/ɛtʁ/", example: "Tu es mon cœur.", exampleTranslation: "Jij bent mijn hart." },
        { word: "avoir", translation: "hebben", pronunciation: "/avwaʁ/", example: "J'ai de la chance de t'avoir.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "aimer", translation: "houden van", pronunciation: "/eme/", example: "Je t'aime plus que tout.", exampleTranslation: "Ik hou meer van je dan alles." }
      ],
      verbsTable: [
        { word: "faire", pronunciation: "/fɛʁ/", translation: "maken/doen" },
        { word: "pouvoir", pronunciation: "/puvwaʁ/", translation: "kunnen" },
        { word: "venir", pronunciation: "/vəniʁ/", translation: "komen" },
        { word: "aller", pronunciation: "/ale/", translation: "gaan" },
        { word: "voir", pronunciation: "/vwaʁ/", translation: "zien" },
        { word: "vouloir", pronunciation: "/vulwaʁ/", translation: "willen" },
        { word: "penser", pronunciation: "/pɑ̃se/", translation: "denken" },
        { word: "savoir", pronunciation: "/savwaʁ/", translation: "weten" }
      ],
      adjectives: [
        { word: "beau/belle", translation: "mooi", pronunciation: "/bo/ /bɛl/", example: "Tu es belle ce soir.", exampleTranslation: "Je bent mooi vanavond." },
        { word: "heureux/heureuse", translation: "gelukkig", pronunciation: "/øʁø/ /øʁøz/", example: "Tu me rends heureux.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Franse bijvoeglijke naamwoorden veranderen voor mannelijk/vrouwelijk. 'Beau' wordt 'belle' voor een vrouw!",
      nouns: [
        { word: "l'amour", translation: "de liefde", pronunciation: "/lamuʁ/", example: "L'amour est tout.", exampleTranslation: "Liefde is alles." },
        { word: "le cœur", translation: "het hart", pronunciation: "/lə kœʁ/", example: "Tu as mon cœur.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "le jour", pronunciation: "/lə ʒuʁ/", translation: "de dag" },
        { word: "la nuit", pronunciation: "/la nɥi/", translation: "de nacht" },
        { word: "le temps", pronunciation: "/lə tɑ̃/", translation: "de tijd" },
        { word: "la vie", pronunciation: "/la vi/", translation: "het leven" },
        { word: "le monde", pronunciation: "/lə mɔ̃d/", translation: "de wereld" },
        { word: "la maison", pronunciation: "/la mɛzɔ̃/", translation: "het huis" }
      ],
      adverbs: [
        { word: "toujours", pronunciation: "/tuʒuʁ/", translation: "altijd" },
        { word: "jamais", pronunciation: "/ʒamɛ/", translation: "nooit" },
        { word: "ici", pronunciation: "/isi/", translation: "hier" },
        { word: "là", pronunciation: "/la/", translation: "daar" },
        { word: "maintenant", pronunciation: "/mɛ̃tnɑ̃/", translation: "nu" },
        { word: "aujourd'hui", pronunciation: "/oʒuʁdɥi/", translation: "vandaag" },
        { word: "très", pronunciation: "/tʁɛ/", translation: "zeer/heel" },
        { word: "ensemble", pronunciation: "/ɑ̃sɑ̃bl/", translation: "samen" }
      ],
      romantic: [
        { word: "Je pense toujours à toi", translation: "Ik denk altijd aan je", pronunciation: "/ʒə pɑ̃s tuʒuʁ a twa/", example: "Même au travail, je pense toujours à toi.", exampleTranslation: "Zelfs op werk denk ik altijd aan je." },
        { word: "Tu me rends heureux", translation: "Jij maakt me gelukkig", pronunciation: "/ty mə ʁɑ̃ øʁø/", example: "Chaque jour, tu me rends heureux.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Frans staat bekend als de taal van de liefde. De uitdrukking 'amour fou' (gekke liefde) wordt wereldwijd gebruikt!"
    },
    es: {
      featured: { word: "Amor", translation: "Liefde", pronunciation: "/aˈmoɾ/", context: "Het passionele Spaanse woord voor liefde!" },
      pronouns: [
        { word: "yo", translation: "ik", pronunciation: "/ʝo/", example: "Yo te amo.", exampleTranslation: "Ik hou van je." },
        { word: "tú", translation: "jij (informeel)", pronunciation: "/tu/", example: "Tú eres hermosa.", exampleTranslation: "Jij bent mooi." },
        { word: "nosotros", translation: "wij", pronunciation: "/noˈsotɾos/", example: "Nosotros estamos juntos.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "In Spanje gebruik je 'tú' voor informeel en 'usted' voor formeel. In Latijns-Amerika varieert dit per land!",
      verbs: [
        { word: "ser", translation: "zijn (permanent)", pronunciation: "/seɾ/", example: "Tú eres mi vida.", exampleTranslation: "Jij bent mijn leven." },
        { word: "estar", translation: "zijn (tijdelijk)", pronunciation: "/esˈtaɾ/", example: "Estoy enamorado de ti.", exampleTranslation: "Ik ben verliefd op je." },
        { word: "amar", translation: "liefhebben", pronunciation: "/aˈmaɾ/", example: "Te amo con todo mi corazón.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "hacer", pronunciation: "/aˈθeɾ/", translation: "maken/doen" },
        { word: "poder", pronunciation: "/poˈðeɾ/", translation: "kunnen" },
        { word: "venir", pronunciation: "/beˈniɾ/", translation: "komen" },
        { word: "ir", pronunciation: "/iɾ/", translation: "gaan" },
        { word: "ver", pronunciation: "/beɾ/", translation: "zien" },
        { word: "querer", pronunciation: "/keˈɾeɾ/", translation: "willen/liefhebben" },
        { word: "pensar", pronunciation: "/penˈsaɾ/", translation: "denken" },
        { word: "saber", pronunciation: "/saˈβeɾ/", translation: "weten" }
      ],
      adjectives: [
        { word: "hermoso/a", translation: "mooi", pronunciation: "/eɾˈmoso/", example: "Eres hermosa.", exampleTranslation: "Je bent mooi." },
        { word: "feliz", translation: "gelukkig", pronunciation: "/feˈliθ/", example: "Me haces feliz.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Spaanse bijvoeglijke naamwoorden komen meestal NA het zelfstandig naamwoord: 'una mujer hermosa' (een mooie vrouw).",
      nouns: [
        { word: "el amor", translation: "de liefde", pronunciation: "/el aˈmoɾ/", example: "El amor lo puede todo.", exampleTranslation: "Liefde overwint alles." },
        { word: "el corazón", translation: "het hart", pronunciation: "/el koɾaˈθon/", example: "Tienes mi corazón.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "el día", pronunciation: "/el ˈdia/", translation: "de dag" },
        { word: "la noche", pronunciation: "/la ˈnotʃe/", translation: "de nacht" },
        { word: "el tiempo", pronunciation: "/el ˈtjempo/", translation: "de tijd" },
        { word: "la vida", pronunciation: "/la ˈbiða/", translation: "het leven" },
        { word: "el mundo", pronunciation: "/el ˈmundo/", translation: "de wereld" },
        { word: "la casa", pronunciation: "/la ˈkasa/", translation: "het huis" }
      ],
      adverbs: [
        { word: "siempre", pronunciation: "/ˈsjempɾe/", translation: "altijd" },
        { word: "nunca", pronunciation: "/ˈnunka/", translation: "nooit" },
        { word: "aquí", pronunciation: "/aˈki/", translation: "hier" },
        { word: "allí", pronunciation: "/aˈʎi/", translation: "daar" },
        { word: "ahora", pronunciation: "/aˈoɾa/", translation: "nu" },
        { word: "hoy", pronunciation: "/oi/", translation: "vandaag" },
        { word: "muy", pronunciation: "/mui/", translation: "zeer/heel" },
        { word: "juntos", pronunciation: "/ˈxuntos/", translation: "samen" }
      ],
      romantic: [
        { word: "Siempre pienso en ti", translation: "Ik denk altijd aan je", pronunciation: "/ˈsjempɾe ˈpjenso en ti/", example: "En el trabajo siempre pienso en ti.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Me haces feliz", translation: "Jij maakt me gelukkig", pronunciation: "/me ˈaθes feˈliθ/", example: "Cada día me haces feliz.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Spaans heeft twee woorden voor 'zijn': 'ser' voor permanente eigenschappen en 'estar' voor tijdelijke toestanden!"
    },
    it: {
      featured: { word: "Amore", translation: "Liefde", pronunciation: "/aˈmoːre/", context: "Het meest muzikale woord voor liefde!" },
      pronouns: [
        { word: "io", translation: "ik", pronunciation: "/ˈio/", example: "Io ti amo.", exampleTranslation: "Ik hou van je." },
        { word: "tu", translation: "jij (informeel)", pronunciation: "/tu/", example: "Tu sei bellissima.", exampleTranslation: "Jij bent prachtig." },
        { word: "noi", translation: "wij", pronunciation: "/noi/", example: "Noi siamo insieme.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "In het Italiaans gebruik je 'tu' voor je partner en vrienden. 'Lei' is formeel - let op, het lijkt op 'zij'!",
      verbs: [
        { word: "essere", translation: "zijn", pronunciation: "/ˈɛssere/", example: "Tu sei il mio amore.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "avere", translation: "hebben", pronunciation: "/aˈvere/", example: "Ho fortuna ad averti.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "amare", translation: "liefhebben", pronunciation: "/aˈmare/", example: "Ti amo con tutto il cuore.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "fare", pronunciation: "/ˈfare/", translation: "maken/doen" },
        { word: "potere", pronunciation: "/poˈtere/", translation: "kunnen" },
        { word: "venire", pronunciation: "/veˈnire/", translation: "komen" },
        { word: "andare", pronunciation: "/anˈdare/", translation: "gaan" },
        { word: "vedere", pronunciation: "/veˈdere/", translation: "zien" },
        { word: "volere", pronunciation: "/voˈlere/", translation: "willen" },
        { word: "pensare", pronunciation: "/penˈsare/", translation: "denken" },
        { word: "sapere", pronunciation: "/saˈpere/", translation: "weten" }
      ],
      adjectives: [
        { word: "bello/bella", translation: "mooi", pronunciation: "/ˈbɛllo/ /ˈbɛlla/", example: "Sei bella stasera.", exampleTranslation: "Je bent mooi vanavond." },
        { word: "felice", translation: "gelukkig", pronunciation: "/feˈliːtʃe/", example: "Mi rendi felice.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Italiaanse bijvoeglijke naamwoorden moeten overeenkomen met geslacht en getal: bello/bella/belli/belle!",
      nouns: [
        { word: "l'amore", translation: "de liefde", pronunciation: "/laˈmoːre/", example: "L'amore è tutto.", exampleTranslation: "Liefde is alles." },
        { word: "il cuore", translation: "het hart", pronunciation: "/il ˈkwɔːre/", example: "Hai il mio cuore.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "il giorno", pronunciation: "/il ˈdʒorno/", translation: "de dag" },
        { word: "la notte", pronunciation: "/la ˈnɔtte/", translation: "de nacht" },
        { word: "il tempo", pronunciation: "/il ˈtempo/", translation: "de tijd" },
        { word: "la vita", pronunciation: "/la ˈvita/", translation: "het leven" },
        { word: "il mondo", pronunciation: "/il ˈmondo/", translation: "de wereld" },
        { word: "la casa", pronunciation: "/la ˈkaːsa/", translation: "het huis" }
      ],
      adverbs: [
        { word: "sempre", pronunciation: "/ˈsempre/", translation: "altijd" },
        { word: "mai", pronunciation: "/mai/", translation: "nooit" },
        { word: "qui", pronunciation: "/kwi/", translation: "hier" },
        { word: "là", pronunciation: "/la/", translation: "daar" },
        { word: "adesso", pronunciation: "/aˈdesso/", translation: "nu" },
        { word: "oggi", pronunciation: "/ˈɔddʒi/", translation: "vandaag" },
        { word: "molto", pronunciation: "/ˈmolto/", translation: "zeer/heel" },
        { word: "insieme", pronunciation: "/inˈsjɛːme/", translation: "samen" }
      ],
      romantic: [
        { word: "Penso sempre a te", translation: "Ik denk altijd aan je", pronunciation: "/ˈpenso ˈsempre a te/", example: "Al lavoro penso sempre a te.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Mi rendi felice", translation: "Jij maakt me gelukkig", pronunciation: "/mi ˈrendi feˈliːtʃe/", example: "Ogni giorno mi rendi felice.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Italiaans is de taal van de muziek - woorden zoals piano, forte en allegro zijn Italiaans!"
    },
    pt: {
      featured: { word: "Amor", translation: "Liefde", pronunciation: "/ɐˈmoɾ/", context: "Het soulvolle Portugese woord voor liefde!" },
      pronouns: [
        { word: "eu", translation: "ik", pronunciation: "/ew/", example: "Eu te amo.", exampleTranslation: "Ik hou van je." },
        { word: "tu/você", translation: "jij", pronunciation: "/tu/ /voˈse/", example: "Você é linda.", exampleTranslation: "Je bent mooi." },
        { word: "nós", translation: "wij", pronunciation: "/nɔs/", example: "Nós estamos juntos.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "In Brazilië is 'você' standaard, in Portugal gebruik je vaker 'tu'. Met je partner kun je beide gebruiken!",
      verbs: [
        { word: "ser", translation: "zijn (permanent)", pronunciation: "/seɾ/", example: "Tu és o amor da minha vida.", exampleTranslation: "Jij bent de liefde van mijn leven." },
        { word: "estar", translation: "zijn (tijdelijk)", pronunciation: "/ɨʃˈtaɾ/", example: "Estou apaixonado por ti.", exampleTranslation: "Ik ben verliefd op je." },
        { word: "amar", translation: "liefhebben", pronunciation: "/ɐˈmaɾ/", example: "Amo-te com todo o meu coração.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "fazer", pronunciation: "/fɐˈzeɾ/", translation: "maken/doen" },
        { word: "poder", pronunciation: "/puˈdeɾ/", translation: "kunnen" },
        { word: "vir", pronunciation: "/viɾ/", translation: "komen" },
        { word: "ir", pronunciation: "/iɾ/", translation: "gaan" },
        { word: "ver", pronunciation: "/veɾ/", translation: "zien" },
        { word: "querer", pronunciation: "/kɨˈɾeɾ/", translation: "willen" },
        { word: "pensar", pronunciation: "/pẽˈsaɾ/", translation: "denken" },
        { word: "saber", pronunciation: "/sɐˈbeɾ/", translation: "weten" }
      ],
      adjectives: [
        { word: "bonito/a", translation: "mooi", pronunciation: "/buˈnitu/", example: "Estás muito bonita.", exampleTranslation: "Je bent erg mooi." },
        { word: "feliz", translation: "gelukkig", pronunciation: "/fɨˈliʃ/", example: "Tu me fazes feliz.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Portugees heeft ook 'ser' en 'estar' zoals Spaans, maar het gebruik verschilt soms!",
      nouns: [
        { word: "o amor", translation: "de liefde", pronunciation: "/u ɐˈmoɾ/", example: "O amor é tudo.", exampleTranslation: "Liefde is alles." },
        { word: "o coração", translation: "het hart", pronunciation: "/u kuɾɐˈsɐ̃w̃/", example: "Tens o meu coração.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "o dia", pronunciation: "/u ˈdiɐ/", translation: "de dag" },
        { word: "a noite", pronunciation: "/ɐ ˈnojt(ɨ)/", translation: "de nacht" },
        { word: "o tempo", pronunciation: "/u ˈtẽpu/", translation: "de tijd" },
        { word: "a vida", pronunciation: "/ɐ ˈvidɐ/", translation: "het leven" },
        { word: "o mundo", pronunciation: "/u ˈmũdu/", translation: "de wereld" },
        { word: "a casa", pronunciation: "/ɐ ˈkazɐ/", translation: "het huis" }
      ],
      adverbs: [
        { word: "sempre", pronunciation: "/ˈsẽpɾɨ/", translation: "altijd" },
        { word: "nunca", pronunciation: "/ˈnũkɐ/", translation: "nooit" },
        { word: "aqui", pronunciation: "/ɐˈki/", translation: "hier" },
        { word: "ali", pronunciation: "/ɐˈli/", translation: "daar" },
        { word: "agora", pronunciation: "/ɐˈɡɔɾɐ/", translation: "nu" },
        { word: "hoje", pronunciation: "/ˈoʒɨ/", translation: "vandaag" },
        { word: "muito", pronunciation: "/ˈmũjtu/", translation: "zeer/heel" },
        { word: "juntos", pronunciation: "/ˈʒũtuʃ/", translation: "samen" }
      ],
      romantic: [
        { word: "Penso sempre em ti", translation: "Ik denk altijd aan je", pronunciation: "/ˈpẽsu ˈsẽpɾɨ ẽ ti/", example: "No trabalho penso sempre em ti.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Tu me fazes feliz", translation: "Jij maakt me gelukkig", pronunciation: "/tu mɨ ˈfazɨʃ fɨˈliʃ/", example: "Todos os dias tu me fazes feliz.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Portugees is de officiële taal in 9 landen op 4 continenten en heeft meer dan 250 miljoen sprekers!"
    },
    pl: {
      featured: { word: "Miłość", translation: "Liefde", pronunciation: "/ˈmiwɔɕt͡ɕ/", context: "Het diepe Poolse woord voor liefde!" },
      pronouns: [
        { word: "ja", translation: "ik", pronunciation: "/ja/", example: "Ja cię kocham.", exampleTranslation: "Ik hou van je." },
        { word: "ty", translation: "jij", pronunciation: "/tɨ/", example: "Ty jesteś piękna.", exampleTranslation: "Jij bent mooi." },
        { word: "my", translation: "wij", pronunciation: "/mɨ/", example: "My jesteśmy razem.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Pools heeft geen lidwoorden! En het voornaamwoord wordt vaak weggelaten omdat de werkwoordsvorm al aangeeft wie bedoeld wordt.",
      verbs: [
        { word: "być", translation: "zijn", pronunciation: "/bɨt͡ɕ/", example: "Jesteś moim skarbem.", exampleTranslation: "Je bent mijn schat." },
        { word: "mieć", translation: "hebben", pronunciation: "/mjɛt͡ɕ/", example: "Mam szczęście, że cię mam.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "kochać", translation: "liefhebben", pronunciation: "/ˈkɔxat͡ɕ/", example: "Kocham cię całym sercem.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "robić", pronunciation: "/ˈrɔbit͡ɕ/", translation: "maken/doen" },
        { word: "móc", pronunciation: "/mut͡s/", translation: "kunnen" },
        { word: "przychodzić", pronunciation: "/pʂɨˈxɔd͡ʑit͡ɕ/", translation: "komen" },
        { word: "iść", pronunciation: "/iɕt͡ɕ/", translation: "gaan" },
        { word: "widzieć", pronunciation: "/ˈvid͡ʑɛt͡ɕ/", translation: "zien" },
        { word: "chcieć", pronunciation: "/xt͡ɕɛt͡ɕ/", translation: "willen" },
        { word: "myśleć", pronunciation: "/ˈmɨɕlɛt͡ɕ/", translation: "denken" },
        { word: "wiedzieć", pronunciation: "/ˈvjɛd͡ʑɛt͡ɕ/", translation: "weten" }
      ],
      adjectives: [
        { word: "piękny/piękna", translation: "mooi", pronunciation: "/ˈpjɛŋknɨ/ /ˈpjɛŋkna/", example: "Jesteś piękna.", exampleTranslation: "Je bent mooi." },
        { word: "szczęśliwy/a", translation: "gelukkig", pronunciation: "/ʂt͡ʂɛ̃ˈɕlivɨ/", example: "Czynisz mnie szczęśliwym.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Pools heeft 7 naamvallen! Dit klinkt eng, maar je leert de patronen vanzelf door te oefenen.",
      nouns: [
        { word: "miłość", translation: "de liefde", pronunciation: "/ˈmiwɔɕt͡ɕ/", example: "Miłość jest najważniejsza.", exampleTranslation: "Liefde is het belangrijkste." },
        { word: "serce", translation: "het hart", pronunciation: "/ˈsɛrt͡sɛ/", example: "Masz moje serce.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "dzień", pronunciation: "/d͡ʑɛɲ/", translation: "de dag" },
        { word: "noc", pronunciation: "/nɔt͡s/", translation: "de nacht" },
        { word: "czas", pronunciation: "/t͡ʂas/", translation: "de tijd" },
        { word: "życie", pronunciation: "/ˈʐɨt͡ɕɛ/", translation: "het leven" },
        { word: "świat", pronunciation: "/ɕfjat/", translation: "de wereld" },
        { word: "dom", pronunciation: "/dɔm/", translation: "het huis" }
      ],
      adverbs: [
        { word: "zawsze", pronunciation: "/ˈzafʂɛ/", translation: "altijd" },
        { word: "nigdy", pronunciation: "/ˈɲiɡdɨ/", translation: "nooit" },
        { word: "tu/tutaj", pronunciation: "/tu/ /ˈtutaj/", translation: "hier" },
        { word: "tam", pronunciation: "/tam/", translation: "daar" },
        { word: "teraz", pronunciation: "/ˈtɛras/", translation: "nu" },
        { word: "dzisiaj", pronunciation: "/ˈd͡ʑiɕaj/", translation: "vandaag" },
        { word: "bardzo", pronunciation: "/ˈbard͡zɔ/", translation: "zeer/heel" },
        { word: "razem", pronunciation: "/ˈrazɛm/", translation: "samen" }
      ],
      romantic: [
        { word: "Zawsze myślę o tobie", translation: "Ik denk altijd aan je", pronunciation: "/ˈzafʂɛ ˈmɨɕlɛ ɔ ˈtɔbjɛ/", example: "W pracy zawsze myślę o tobie.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Czynisz mnie szczęśliwym", translation: "Jij maakt me gelukkig", pronunciation: "/ˈt͡ʂɨɲiʂ mɲɛ ʂt͡ʂɛ̃ˈɕlivɨm/", example: "Każdego dnia czynisz mnie szczęśliwym.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Het langste Poolse woord is 'Konstantynopolitańczykowianeczka' (54 letters) - een vrouw uit Constantinopel!"
    },
    ru: {
      featured: { word: "Любовь", translation: "Liefde", pronunciation: "/lʲuˈbofʲ/", context: "Het diepe Russische woord voor liefde!" },
      pronouns: [
        { word: "я", translation: "ik", pronunciation: "/ja/", example: "Я тебя люблю.", exampleTranslation: "Ik hou van je." },
        { word: "ты", translation: "jij (informeel)", pronunciation: "/tɨ/", example: "Ты красивая.", exampleTranslation: "Je bent mooi." },
        { word: "мы", translation: "wij", pronunciation: "/mɨ/", example: "Мы вместе.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Russisch heeft 'ты' (informeel) en 'вы' (formeel). Met je partner altijd 'ты'! Het cyrillische alfabet leer je snel.",
      verbs: [
        { word: "быть", translation: "zijn", pronunciation: "/bɨtʲ/", example: "Ты моё счастье.", exampleTranslation: "Jij bent mijn geluk." },
        { word: "иметь", translation: "hebben", pronunciation: "/ɪˈmʲetʲ/", example: "У меня есть ты.", exampleTranslation: "Ik heb jou." },
        { word: "любить", translation: "liefhebben", pronunciation: "/lʲʊˈbʲitʲ/", example: "Я люблю тебя всем сердцем.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "делать", pronunciation: "/ˈdʲelatʲ/", translation: "maken/doen" },
        { word: "мочь", pronunciation: "/mot͡ɕ/", translation: "kunnen" },
        { word: "приходить", pronunciation: "/prʲɪxɐˈdʲitʲ/", translation: "komen" },
        { word: "идти", pronunciation: "/ɪˈtʲːi/", translation: "gaan" },
        { word: "видеть", pronunciation: "/ˈvʲidʲɪtʲ/", translation: "zien" },
        { word: "хотеть", pronunciation: "/xɐˈtʲetʲ/", translation: "willen" },
        { word: "думать", pronunciation: "/ˈdumatʲ/", translation: "denken" },
        { word: "знать", pronunciation: "/znatʲ/", translation: "weten" }
      ],
      adjectives: [
        { word: "красивый/ая", translation: "mooi", pronunciation: "/krɐˈsʲivɨj/ /krɐˈsʲivəjə/", example: "Ты красивая.", exampleTranslation: "Je bent mooi." },
        { word: "счастливый/ая", translation: "gelukkig", pronunciation: "/ɕːɪˈslʲivɨj/", example: "Ты делаешь меня счастливым.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Russisch heeft 6 naamvallen en geen lidwoorden. De woordvolgorde is flexibeler dan in het Nederlands!",
      nouns: [
        { word: "любовь", translation: "de liefde", pronunciation: "/lʲuˈbofʲ/", example: "Любовь — это всё.", exampleTranslation: "Liefde is alles." },
        { word: "сердце", translation: "het hart", pronunciation: "/ˈsʲert͡sə/", example: "Ты в моём сердце.", exampleTranslation: "Jij bent in mijn hart." }
      ],
      nounsTable: [
        { word: "день", pronunciation: "/dʲenʲ/", translation: "de dag" },
        { word: "ночь", pronunciation: "/not͡ɕ/", translation: "de nacht" },
        { word: "время", pronunciation: "/ˈvrʲemʲə/", translation: "de tijd" },
        { word: "жизнь", pronunciation: "/ʐɨzʲnʲ/", translation: "het leven" },
        { word: "мир", pronunciation: "/mʲir/", translation: "de wereld/vrede" },
        { word: "дом", pronunciation: "/dom/", translation: "het huis" }
      ],
      adverbs: [
        { word: "всегда", pronunciation: "/fsʲɪɡˈda/", translation: "altijd" },
        { word: "никогда", pronunciation: "/nʲɪkɐɡˈda/", translation: "nooit" },
        { word: "здесь", pronunciation: "/zdʲesʲ/", translation: "hier" },
        { word: "там", pronunciation: "/tam/", translation: "daar" },
        { word: "сейчас", pronunciation: "/sʲɪˈt͡ɕas/", translation: "nu" },
        { word: "сегодня", pronunciation: "/sʲɪˈvodʲnʲə/", translation: "vandaag" },
        { word: "очень", pronunciation: "/ˈot͡ɕɪnʲ/", translation: "zeer/heel" },
        { word: "вместе", pronunciation: "/ˈvmʲesʲtʲɪ/", translation: "samen" }
      ],
      romantic: [
        { word: "Я всегда думаю о тебе", translation: "Ik denk altijd aan je", pronunciation: "/ja fsʲɪɡˈda ˈdumaju ɐ tʲɪˈbʲe/", example: "На работе я всегда думаю о тебе.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Ты делаешь меня счастливым", translation: "Jij maakt me gelukkig", pronunciation: "/tɨ ˈdʲelaɪʂ mʲɪˈnʲa ɕːɪˈslʲivɨm/", example: "Каждый день ты делаешь меня счастливым.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Het Russische woord 'мир' (mir) betekent zowel 'wereld' als 'vrede' - een mooie gedachte!"
    },
    uk: {
      featured: { word: "Любов", translation: "Liefde", pronunciation: "/lʲuˈbɔw/", context: "Het warme Oekraïense woord voor liefde!" },
      pronouns: [
        { word: "я", translation: "ik", pronunciation: "/jɑ/", example: "Я тебе кохаю.", exampleTranslation: "Ik hou van je." },
        { word: "ти", translation: "jij", pronunciation: "/tɪ/", example: "Ти гарна.", exampleTranslation: "Je bent mooi." },
        { word: "ми", translation: "wij", pronunciation: "/mɪ/", example: "Ми разом.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Oekraïens lijkt op Russisch maar is een aparte taal! Het heeft unieke woorden en een melodieuzer geluid.",
      verbs: [
        { word: "бути", translation: "zijn", pronunciation: "/ˈbutɪ/", example: "Ти моє щастя.", exampleTranslation: "Jij bent mijn geluk." },
        { word: "мати", translation: "hebben", pronunciation: "/ˈmɑtɪ/", example: "Я маю тебе.", exampleTranslation: "Ik heb jou." },
        { word: "кохати", translation: "liefhebben", pronunciation: "/kɔˈxɑtɪ/", example: "Я кохаю тебе всім серцем.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "робити", pronunciation: "/rɔˈbɪtɪ/", translation: "maken/doen" },
        { word: "могти", pronunciation: "/mɔɦˈtɪ/", translation: "kunnen" },
        { word: "приходити", pronunciation: "/prɪxɔˈdɪtɪ/", translation: "komen" },
        { word: "йти", pronunciation: "/jtɪ/", translation: "gaan" },
        { word: "бачити", pronunciation: "/ˈbɑt͡ʃɪtɪ/", translation: "zien" },
        { word: "хотіти", pronunciation: "/xɔˈtʲitɪ/", translation: "willen" },
        { word: "думати", pronunciation: "/ˈdumɑtɪ/", translation: "denken" },
        { word: "знати", pronunciation: "/ˈznɑtɪ/", translation: "weten" }
      ],
      adjectives: [
        { word: "гарний/гарна", translation: "mooi", pronunciation: "/ˈɦɑrnɪj/ /ˈɦɑrnɑ/", example: "Ти гарна.", exampleTranslation: "Je bent mooi." },
        { word: "щасливий/а", translation: "gelukkig", pronunciation: "/ʃt͡ʃɑsˈlɪvɪj/", example: "Ти робиш мене щасливим.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Oekraïens is de op een na meest gesproken Slavische taal. Het heeft een rijke literaire traditie!",
      nouns: [
        { word: "любов", translation: "de liefde", pronunciation: "/lʲuˈbɔw/", example: "Любов — це все.", exampleTranslation: "Liefde is alles." },
        { word: "серце", translation: "het hart", pronunciation: "/ˈsɛrt͡sɛ/", example: "Ти в моєму серці.", exampleTranslation: "Jij bent in mijn hart." }
      ],
      nounsTable: [
        { word: "день", pronunciation: "/dɛnʲ/", translation: "de dag" },
        { word: "ніч", pronunciation: "/nit͡ʃ/", translation: "de nacht" },
        { word: "час", pronunciation: "/t͡ʃɑs/", translation: "de tijd" },
        { word: "життя", pronunciation: "/ʒɪˈtʲːɑ/", translation: "het leven" },
        { word: "світ", pronunciation: "/swit/", translation: "de wereld" },
        { word: "дім", pronunciation: "/dim/", translation: "het huis" }
      ],
      adverbs: [
        { word: "завжди", pronunciation: "/ˈzɑwʒdɪ/", translation: "altijd" },
        { word: "ніколи", pronunciation: "/nʲiˈkɔlɪ/", translation: "nooit" },
        { word: "тут", pronunciation: "/tut/", translation: "hier" },
        { word: "там", pronunciation: "/tɑm/", translation: "daar" },
        { word: "зараз", pronunciation: "/ˈzɑrɑz/", translation: "nu" },
        { word: "сьогодні", pronunciation: "/sʲɔˈɦɔdnʲi/", translation: "vandaag" },
        { word: "дуже", pronunciation: "/ˈduʒɛ/", translation: "zeer/heel" },
        { word: "разом", pronunciation: "/ˈrɑzɔm/", translation: "samen" }
      ],
      romantic: [
        { word: "Я завжди думаю про тебе", translation: "Ik denk altijd aan je", pronunciation: "/jɑ ˈzɑwʒdɪ ˈdumɑju prɔ ˈtɛbɛ/", example: "На роботі я завжди думаю про тебе.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Ти робиш мене щасливим", translation: "Jij maakt me gelukkig", pronunciation: "/tɪ ˈrɔbɪʃ ˈmɛnɛ ʃt͡ʃɑsˈlɪvɪm/", example: "Кожного дня ти робиш мене щасливим.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "De Oekraïense taal heeft een eigen alfabet met letters zoals 'ї' (ji) en 'є' (je) die uniek zijn!"
    },
    tr: {
      featured: { word: "Aşk", translation: "Liefde", pronunciation: "/aʃk/", context: "Het passionele Turkse woord voor liefde!" },
      pronouns: [
        { word: "ben", translation: "ik", pronunciation: "/ben/", example: "Ben seni seviyorum.", exampleTranslation: "Ik hou van je." },
        { word: "sen", translation: "jij (informeel)", pronunciation: "/sen/", example: "Sen güzelsin.", exampleTranslation: "Je bent mooi." },
        { word: "biz", translation: "wij", pronunciation: "/biz/", example: "Biz birlikteyiz.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Turks is een agglutinerende taal - suffixen worden aan woorden toegevoegd. 'Seviyorum' = sev (liefhebben) + iyor (nu) + um (ik).",
      verbs: [
        { word: "olmak", translation: "zijn/worden", pronunciation: "/olˈmak/", example: "Sen benim her şeyimsin.", exampleTranslation: "Jij bent mijn alles." },
        { word: "var/yok", translation: "er zijn/niet zijn", pronunciation: "/var/ /jok/", example: "Sensiz hayat yok.", exampleTranslation: "Zonder jou is er geen leven." },
        { word: "sevmek", translation: "liefhebben", pronunciation: "/sevˈmek/", example: "Seni çok seviyorum.", exampleTranslation: "Ik hou heel veel van je." }
      ],
      verbsTable: [
        { word: "yapmak", pronunciation: "/japˈmak/", translation: "maken/doen" },
        { word: "-ebilmek", pronunciation: "/-ebilˈmek/", translation: "kunnen" },
        { word: "gelmek", pronunciation: "/ɡelˈmek/", translation: "komen" },
        { word: "gitmek", pronunciation: "/ɡitˈmek/", translation: "gaan" },
        { word: "görmek", pronunciation: "/ɡørˈmek/", translation: "zien" },
        { word: "istemek", pronunciation: "/isteˈmek/", translation: "willen" },
        { word: "düşünmek", pronunciation: "/dyʃynˈmek/", translation: "denken" },
        { word: "bilmek", pronunciation: "/bilˈmek/", translation: "weten" }
      ],
      adjectives: [
        { word: "güzel", translation: "mooi", pronunciation: "/ɡyˈzel/", example: "Sen çok güzelsin.", exampleTranslation: "Je bent erg mooi." },
        { word: "mutlu", translation: "gelukkig", pronunciation: "/mutˈlu/", example: "Sen beni mutlu ediyorsun.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "In het Turks komen bijvoeglijke naamwoorden VOOR het zelfstandig naamwoord, net als in het Nederlands!",
      nouns: [
        { word: "aşk", translation: "de liefde", pronunciation: "/aʃk/", example: "Aşk her şeydir.", exampleTranslation: "Liefde is alles." },
        { word: "kalp", translation: "het hart", pronunciation: "/kalp/", example: "Kalbim seninle.", exampleTranslation: "Mijn hart is bij jou." }
      ],
      nounsTable: [
        { word: "gün", pronunciation: "/ɡyn/", translation: "de dag" },
        { word: "gece", pronunciation: "/ɡeˈd͡ʒe/", translation: "de nacht" },
        { word: "zaman", pronunciation: "/zaˈman/", translation: "de tijd" },
        { word: "hayat", pronunciation: "/haˈjat/", translation: "het leven" },
        { word: "dünya", pronunciation: "/dynˈja/", translation: "de wereld" },
        { word: "ev", pronunciation: "/ev/", translation: "het huis" }
      ],
      adverbs: [
        { word: "her zaman", pronunciation: "/her zaˈman/", translation: "altijd" },
        { word: "hiç", pronunciation: "/hit͡ʃ/", translation: "nooit" },
        { word: "burada", pronunciation: "/buˈɾada/", translation: "hier" },
        { word: "orada", pronunciation: "/oˈɾada/", translation: "daar" },
        { word: "şimdi", pronunciation: "/ʃimˈdi/", translation: "nu" },
        { word: "bugün", pronunciation: "/buˈɡyn/", translation: "vandaag" },
        { word: "çok", pronunciation: "/t͡ʃok/", translation: "zeer/heel" },
        { word: "birlikte", pronunciation: "/birlikˈte/", translation: "samen" }
      ],
      romantic: [
        { word: "Seni hep düşünüyorum", translation: "Ik denk altijd aan je", pronunciation: "/seni hep dyʃyˈnyjorum/", example: "İşte bile seni hep düşünüyorum.", exampleTranslation: "Zelfs op werk denk ik altijd aan je." },
        { word: "Sen beni mutlu ediyorsun", translation: "Jij maakt me gelukkig", pronunciation: "/sen beni mutlu edijorsun/", example: "Her gün sen beni mutlu ediyorsun.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Turks heeft klinkerharmonie - alle klinkers in een woord moeten 'passen'. Daarom is het 'evler' (huizen) maar 'kitaplar' (boeken)!"
    },
    ro: {
      featured: { word: "Dragoste", translation: "Liefde", pronunciation: "/draˈɡoste/", context: "Het Roemeense woord voor liefde - vol passie!" },
      pronouns: [
        { word: "eu", translation: "ik", pronunciation: "/jew/", example: "Eu te iubesc.", exampleTranslation: "Ik hou van je." },
        { word: "tu", translation: "jij", pronunciation: "/tu/", example: "Tu ești frumoasă.", exampleTranslation: "Jij bent mooi." },
        { word: "noi", translation: "wij", pronunciation: "/noj/", example: "Noi suntem împreună.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Roemeens is de enige Romaanse taal met 'bepaalde lidwoorden achteraan': 'casa' (huis) wordt 'casa' (het huis)!",
      verbs: [
        { word: "a fi", translation: "zijn", pronunciation: "/a fi/", example: "Tu ești dragostea mea.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "a avea", translation: "hebben", pronunciation: "/a aˈvea/", example: "Am noroc că te am.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "a iubi", translation: "liefhebben", pronunciation: "/a juˈbi/", example: "Te iubesc din toată inima.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "a face", pronunciation: "/a ˈfat͡ʃe/", translation: "maken/doen" },
        { word: "a putea", pronunciation: "/a puˈtea/", translation: "kunnen" },
        { word: "a veni", pronunciation: "/a veˈni/", translation: "komen" },
        { word: "a merge", pronunciation: "/a ˈmerd͡ʒe/", translation: "gaan" },
        { word: "a vedea", pronunciation: "/a veˈdea/", translation: "zien" },
        { word: "a vrea", pronunciation: "/a vrea/", translation: "willen" },
        { word: "a gândi", pronunciation: "/a ɡɨnˈdi/", translation: "denken" },
        { word: "a ști", pronunciation: "/a ʃti/", translation: "weten" }
      ],
      adjectives: [
        { word: "frumos/frumoasă", translation: "mooi", pronunciation: "/fruˈmos/ /fruˈmoasə/", example: "Ești frumoasă.", exampleTranslation: "Je bent mooi." },
        { word: "fericit/ă", translation: "gelukkig", pronunciation: "/feriˈt͡ʃit/", example: "Mă faci fericit.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Roemeens is de dichtstbijzijnde moderne taal bij het Latijn en lijkt op Italiaans, Spaans en Frans!",
      nouns: [
        { word: "dragostea", translation: "de liefde", pronunciation: "/draˈɡostea/", example: "Dragostea e totul.", exampleTranslation: "Liefde is alles." },
        { word: "inima", translation: "het hart", pronunciation: "/ˈinima/", example: "Ai inima mea.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "ziua", pronunciation: "/ˈzjua/", translation: "de dag" },
        { word: "noaptea", pronunciation: "/ˈnwaptea/", translation: "de nacht" },
        { word: "timpul", pronunciation: "/ˈtimpul/", translation: "de tijd" },
        { word: "viața", pronunciation: "/ˈvjat͡sa/", translation: "het leven" },
        { word: "lumea", pronunciation: "/ˈlumea/", translation: "de wereld" },
        { word: "casa", pronunciation: "/ˈkasa/", translation: "het huis" }
      ],
      adverbs: [
        { word: "mereu", pronunciation: "/meˈrew/", translation: "altijd" },
        { word: "niciodată", pronunciation: "/nit͡ʃjoˈdatə/", translation: "nooit" },
        { word: "aici", pronunciation: "/aˈit͡ʃ/", translation: "hier" },
        { word: "acolo", pronunciation: "/aˈkolo/", translation: "daar" },
        { word: "acum", pronunciation: "/aˈkum/", translation: "nu" },
        { word: "azi", pronunciation: "/az/", translation: "vandaag" },
        { word: "foarte", pronunciation: "/ˈfwarte/", translation: "zeer/heel" },
        { word: "împreună", pronunciation: "/ɨmpreuˈnə/", translation: "samen" }
      ],
      romantic: [
        { word: "Mă gândesc mereu la tine", translation: "Ik denk altijd aan je", pronunciation: "/mə ɡɨnˈdesk meˈrew la ˈtine/", example: "La muncă mă gândesc mereu la tine.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Mă faci fericit", translation: "Jij maakt me gelukkig", pronunciation: "/mə fat͡ʃ feriˈt͡ʃit/", example: "În fiecare zi mă faci fericit.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Roemeens heeft unieke letters zoals ă, â, î, ș en ț die je nergens anders vindt!"
    },
    sv: {
      featured: { word: "Kärlek", translation: "Liefde", pronunciation: "/ˈɕæːrlɛk/", context: "Het Zweedse woord voor liefde - warm en oprecht!" },
      pronouns: [
        { word: "jag", translation: "ik", pronunciation: "/jɑː(ɡ)/", example: "Jag älskar dig.", exampleTranslation: "Ik hou van je." },
        { word: "du", translation: "jij", pronunciation: "/dʉː/", example: "Du är vacker.", exampleTranslation: "Je bent mooi." },
        { word: "vi", translation: "wij", pronunciation: "/viː/", example: "Vi är tillsammans.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Zweeds heeft geen formeel 'u' meer - iedereen gebruikt 'du', zelfs tegen de koning!",
      verbs: [
        { word: "vara", translation: "zijn", pronunciation: "/ˈvɑːra/", example: "Du är min kärlek.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "ha", translation: "hebben", pronunciation: "/hɑː/", example: "Jag har tur som har dig.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "älska", translation: "liefhebben", pronunciation: "/ˈɛlska/", example: "Jag älskar dig av hela mitt hjärta.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "göra", pronunciation: "/ˈjøːra/", translation: "maken/doen" },
        { word: "kunna", pronunciation: "/ˈkɵnːa/", translation: "kunnen" },
        { word: "komma", pronunciation: "/ˈkɔmːa/", translation: "komen" },
        { word: "gå", pronunciation: "/ɡoː/", translation: "gaan" },
        { word: "se", pronunciation: "/seː/", translation: "zien" },
        { word: "vilja", pronunciation: "/ˈvɪlja/", translation: "willen" },
        { word: "tänka", pronunciation: "/ˈtɛŋka/", translation: "denken" },
        { word: "veta", pronunciation: "/ˈveːta/", translation: "weten" }
      ],
      adjectives: [
        { word: "vacker", translation: "mooi", pronunciation: "/ˈvakːər/", example: "Du är så vacker.", exampleTranslation: "Je bent zo mooi." },
        { word: "lycklig", translation: "gelukkig", pronunciation: "/ˈlʏkːlɪɡ/", example: "Du gör mig lycklig.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Zweeds heeft twee geslachten: 'en' (gemeenlijk) en 'ett' (onzijdig). 'En katt' (een kat) maar 'ett hus' (een huis).",
      nouns: [
        { word: "kärlek", translation: "de liefde", pronunciation: "/ˈɕæːrlɛk/", example: "Kärlek är allt.", exampleTranslation: "Liefde is alles." },
        { word: "hjärta", translation: "het hart", pronunciation: "/ˈjæːʈa/", example: "Du har mitt hjärta.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "dag", pronunciation: "/dɑːɡ/", translation: "de dag" },
        { word: "natt", pronunciation: "/natː/", translation: "de nacht" },
        { word: "tid", pronunciation: "/tiːd/", translation: "de tijd" },
        { word: "liv", pronunciation: "/liːv/", translation: "het leven" },
        { word: "värld", pronunciation: "/væːrld/", translation: "de wereld" },
        { word: "hus", pronunciation: "/hʉːs/", translation: "het huis" }
      ],
      adverbs: [
        { word: "alltid", pronunciation: "/ˈaltɪd/", translation: "altijd" },
        { word: "aldrig", pronunciation: "/ˈaldrɪɡ/", translation: "nooit" },
        { word: "här", pronunciation: "/hæːr/", translation: "hier" },
        { word: "där", pronunciation: "/dæːr/", translation: "daar" },
        { word: "nu", pronunciation: "/nʉː/", translation: "nu" },
        { word: "idag", pronunciation: "/ɪˈdɑːɡ/", translation: "vandaag" },
        { word: "mycket", pronunciation: "/ˈmʏkːɛt/", translation: "zeer/heel" },
        { word: "tillsammans", pronunciation: "/tɪlˈsamːans/", translation: "samen" }
      ],
      romantic: [
        { word: "Jag tänker alltid på dig", translation: "Ik denk altijd aan je", pronunciation: "/jɑː ˈtɛŋkər ˈaltɪd poː dɛj/", example: "På jobbet tänker jag alltid på dig.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Du gör mig lycklig", translation: "Jij maakt me gelukkig", pronunciation: "/dʉː jøːr mɛj ˈlʏkːlɪɡ/", example: "Varje dag gör du mig lycklig.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Zweeds heeft een speciaal woord 'lagom' dat 'precies genoeg' betekent - een kernwaarde in de Zweedse cultuur!"
    },
    no: {
      featured: { word: "Kjærlighet", translation: "Liefde", pronunciation: "/ˈçæːrlɪɡheːt/", context: "Het warme Noorse woord voor liefde!" },
      pronouns: [
        { word: "jeg", translation: "ik", pronunciation: "/jæɪ/", example: "Jeg elsker deg.", exampleTranslation: "Ik hou van je." },
        { word: "du", translation: "jij", pronunciation: "/dʉː/", example: "Du er vakker.", exampleTranslation: "Je bent mooi." },
        { word: "vi", translation: "wij", pronunciation: "/viː/", example: "Vi er sammen.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Noors heeft twee geschreven vormen: Bokmål (meest gebruikt) en Nynorsk. Wij leren Bokmål!",
      verbs: [
        { word: "være", translation: "zijn", pronunciation: "/ˈvæːrə/", example: "Du er min kjærlighet.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "ha", translation: "hebben", pronunciation: "/hɑː/", example: "Jeg har flaks som har deg.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "elske", translation: "liefhebben", pronunciation: "/ˈɛlskə/", example: "Jeg elsker deg av hele mitt hjerte.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "gjøre", pronunciation: "/ˈjøːrə/", translation: "maken/doen" },
        { word: "kunne", pronunciation: "/ˈkɵnːə/", translation: "kunnen" },
        { word: "komme", pronunciation: "/ˈkɔmːə/", translation: "komen" },
        { word: "gå", pronunciation: "/ɡoː/", translation: "gaan" },
        { word: "se", pronunciation: "/seː/", translation: "zien" },
        { word: "ville", pronunciation: "/ˈvɪlːə/", translation: "willen" },
        { word: "tenke", pronunciation: "/ˈtɛŋkə/", translation: "denken" },
        { word: "vite", pronunciation: "/ˈviːtə/", translation: "weten" }
      ],
      adjectives: [
        { word: "vakker", translation: "mooi", pronunciation: "/ˈvɑkːər/", example: "Du er så vakker.", exampleTranslation: "Je bent zo mooi." },
        { word: "lykkelig", translation: "gelukkig", pronunciation: "/ˈlʏkːəlɪ/", example: "Du gjør meg lykkelig.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Noors lijkt heel erg op Zweeds en Deens - als je één leert, begrijp je de anderen ook!",
      nouns: [
        { word: "kjærlighet", translation: "de liefde", pronunciation: "/ˈçæːrlɪɡheːt/", example: "Kjærlighet er alt.", exampleTranslation: "Liefde is alles." },
        { word: "hjerte", translation: "het hart", pronunciation: "/ˈjærtə/", example: "Du har mitt hjerte.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "dag", pronunciation: "/dɑːɡ/", translation: "de dag" },
        { word: "natt", pronunciation: "/nɑtː/", translation: "de nacht" },
        { word: "tid", pronunciation: "/tiːd/", translation: "de tijd" },
        { word: "liv", pronunciation: "/liːv/", translation: "het leven" },
        { word: "verden", pronunciation: "/ˈværdən/", translation: "de wereld" },
        { word: "hus", pronunciation: "/hʉːs/", translation: "het huis" }
      ],
      adverbs: [
        { word: "alltid", pronunciation: "/ˈɑltɪd/", translation: "altijd" },
        { word: "aldri", pronunciation: "/ˈɑldri/", translation: "nooit" },
        { word: "her", pronunciation: "/hæːr/", translation: "hier" },
        { word: "der", pronunciation: "/dæːr/", translation: "daar" },
        { word: "nå", pronunciation: "/noː/", translation: "nu" },
        { word: "i dag", pronunciation: "/ɪ dɑːɡ/", translation: "vandaag" },
        { word: "veldig", pronunciation: "/ˈvɛldɪ/", translation: "zeer/heel" },
        { word: "sammen", pronunciation: "/ˈsɑmːən/", translation: "samen" }
      ],
      romantic: [
        { word: "Jeg tenker alltid på deg", translation: "Ik denk altijd aan je", pronunciation: "/jæɪ ˈtɛŋkər ˈɑltɪd poː dæɪ/", example: "På jobb tenker jeg alltid på deg.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Du gjør meg lykkelig", translation: "Jij maakt me gelukkig", pronunciation: "/dʉː jøːr mæɪ ˈlʏkːəlɪ/", example: "Hver dag gjør du meg lykkelig.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Noorwegen heeft het begrip 'kos' (gezelligheid) - vergelijkbaar met het Deense 'hygge'!"
    },
    da: {
      featured: { word: "Kærlighed", translation: "Liefde", pronunciation: "/ˈkʰɛːɐ̯liˌheð/", context: "Het Deense woord voor liefde - vol hygge!" },
      pronouns: [
        { word: "jeg", translation: "ik", pronunciation: "/jɑj/", example: "Jeg elsker dig.", exampleTranslation: "Ik hou van je." },
        { word: "du", translation: "jij", pronunciation: "/du/", example: "Du er smuk.", exampleTranslation: "Je bent mooi." },
        { word: "vi", translation: "wij", pronunciation: "/vi/", example: "Vi er sammen.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Deens staat bekend om 'hygge' - gezelligheid. Dit concept is perfect voor romantische avonden!",
      verbs: [
        { word: "være", translation: "zijn", pronunciation: "/ˈvɛːɐ/", example: "Du er min kærlighed.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "have", translation: "hebben", pronunciation: "/ˈhæːʋə/", example: "Jeg er heldig at have dig.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "elske", translation: "liefhebben", pronunciation: "/ˈɛlsgə/", example: "Jeg elsker dig af hele mit hjerte.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "gøre", pronunciation: "/ˈɡøːɐ/", translation: "maken/doen" },
        { word: "kunne", pronunciation: "/ˈkʰɔnə/", translation: "kunnen" },
        { word: "komme", pronunciation: "/ˈkʰɔmə/", translation: "komen" },
        { word: "gå", pronunciation: "/ɡɔː/", translation: "gaan" },
        { word: "se", pronunciation: "/seː/", translation: "zien" },
        { word: "ville", pronunciation: "/ˈvilə/", translation: "willen" },
        { word: "tænke", pronunciation: "/ˈtʰɛŋgə/", translation: "denken" },
        { word: "vide", pronunciation: "/ˈviðə/", translation: "weten" }
      ],
      adjectives: [
        { word: "smuk", translation: "mooi", pronunciation: "/smɔɡ/", example: "Du er så smuk.", exampleTranslation: "Je bent zo mooi." },
        { word: "lykkelig", translation: "gelukkig", pronunciation: "/ˈlyɡəli/", example: "Du gør mig lykkelig.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "De Deense 'd' wordt vaak als een zachte 'ð' uitgesproken - bijna als de Engelse 'th'!",
      nouns: [
        { word: "kærlighed", translation: "de liefde", pronunciation: "/ˈkʰɛːɐ̯liˌheð/", example: "Kærlighed er alt.", exampleTranslation: "Liefde is alles." },
        { word: "hjerte", translation: "het hart", pronunciation: "/ˈjæːdə/", example: "Du har mit hjerte.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "dag", pronunciation: "/dɑː/", translation: "de dag" },
        { word: "nat", pronunciation: "/nɑd/", translation: "de nacht" },
        { word: "tid", pronunciation: "/tiðˀ/", translation: "de tijd" },
        { word: "liv", pronunciation: "/liʋˀ/", translation: "het leven" },
        { word: "verden", pronunciation: "/ˈvɛːɐn/", translation: "de wereld" },
        { word: "hus", pronunciation: "/huːs/", translation: "het huis" }
      ],
      adverbs: [
        { word: "altid", pronunciation: "/ˈɑltiðˀ/", translation: "altijd" },
        { word: "aldrig", pronunciation: "/ˈɑldʁi/", translation: "nooit" },
        { word: "her", pronunciation: "/hɛɐ̯/", translation: "hier" },
        { word: "der", pronunciation: "/dɛɐ̯/", translation: "daar" },
        { word: "nu", pronunciation: "/nu/", translation: "nu" },
        { word: "i dag", pronunciation: "/i ˈdɑː/", translation: "vandaag" },
        { word: "meget", pronunciation: "/ˈmɑːət/", translation: "zeer/heel" },
        { word: "sammen", pronunciation: "/ˈsɑmən/", translation: "samen" }
      ],
      romantic: [
        { word: "Jeg tænker altid på dig", translation: "Ik denk altijd aan je", pronunciation: "/jɑj ˈtʰɛŋgɐ ˈɑltiðˀ pɔ dɑj/", example: "På arbejde tænker jeg altid på dig.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Du gør mig lykkelig", translation: "Jij maakt me gelukkig", pronunciation: "/du ɡøɐ̯ mɑj ˈlyɡəli/", example: "Hver dag gør du mig lykkelig.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Het woord 'hygge' is onvertaalbaar maar betekent zoiets als gezellige warmte en saamhorigheid!"
    },
    cs: {
      featured: { word: "Láska", translation: "Liefde", pronunciation: "/ˈlaːska/", context: "Het Tsjechische woord voor liefde - warm en oprecht!" },
      pronouns: [
        { word: "já", translation: "ik", pronunciation: "/jaː/", example: "Já tě miluji.", exampleTranslation: "Ik hou van je." },
        { word: "ty", translation: "jij", pronunciation: "/tɪ/", example: "Ty jsi krásná.", exampleTranslation: "Je bent mooi." },
        { word: "my", translation: "wij", pronunciation: "/mɪ/", example: "My jsme spolu.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Tsjechisch heeft 'ty' (informeel) en 'vy' (formeel). Met je partner altijd 'ty'!",
      verbs: [
        { word: "být", translation: "zijn", pronunciation: "/biːt/", example: "Ty jsi moje láska.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "mít", translation: "hebben", pronunciation: "/miːt/", example: "Mám štěstí, že tě mám.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "milovat", translation: "liefhebben", pronunciation: "/ˈmɪlovat/", example: "Miluji tě celým srdcem.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "dělat", pronunciation: "/ˈdjɛlat/", translation: "maken/doen" },
        { word: "moci", pronunciation: "/ˈmot͡sɪ/", translation: "kunnen" },
        { word: "přijít", pronunciation: "/ˈpr̝̊ɪjiːt/", translation: "komen" },
        { word: "jít", pronunciation: "/jiːt/", translation: "gaan" },
        { word: "vidět", pronunciation: "/ˈvɪɟɛt/", translation: "zien" },
        { word: "chtít", pronunciation: "/ˈxciːt/", translation: "willen" },
        { word: "myslet", pronunciation: "/ˈmɪslɛt/", translation: "denken" },
        { word: "vědět", pronunciation: "/ˈvjɛɟɛt/", translation: "weten" }
      ],
      adjectives: [
        { word: "krásný/á", translation: "mooi", pronunciation: "/ˈkraːsniː/", example: "Jsi krásná.", exampleTranslation: "Je bent mooi." },
        { word: "šťastný/á", translation: "gelukkig", pronunciation: "/ˈʃcasniː/", example: "Děláš mě šťastným.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "Tsjechisch heeft 7 naamvallen, maar de meeste worden met tijd en oefening vanzelf duidelijk!",
      nouns: [
        { word: "láska", translation: "de liefde", pronunciation: "/ˈlaːska/", example: "Láska je všechno.", exampleTranslation: "Liefde is alles." },
        { word: "srdce", translation: "het hart", pronunciation: "/ˈsr̩t͡sɛ/", example: "Máš moje srdce.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "den", pronunciation: "/dɛn/", translation: "de dag" },
        { word: "noc", pronunciation: "/nɔt͡s/", translation: "de nacht" },
        { word: "čas", pronunciation: "/t͡ʃas/", translation: "de tijd" },
        { word: "život", pronunciation: "/ˈʒɪvɔt/", translation: "het leven" },
        { word: "svět", pronunciation: "/svjɛt/", translation: "de wereld" },
        { word: "dům", pronunciation: "/duːm/", translation: "het huis" }
      ],
      adverbs: [
        { word: "vždy", pronunciation: "/ˈvʒdɪ/", translation: "altijd" },
        { word: "nikdy", pronunciation: "/ˈɲɪɡdɪ/", translation: "nooit" },
        { word: "tady", pronunciation: "/ˈtadɪ/", translation: "hier" },
        { word: "tam", pronunciation: "/tam/", translation: "daar" },
        { word: "teď", pronunciation: "/tɛc/", translation: "nu" },
        { word: "dnes", pronunciation: "/dnɛs/", translation: "vandaag" },
        { word: "velmi", pronunciation: "/ˈvɛlmɪ/", translation: "zeer/heel" },
        { word: "spolu", pronunciation: "/ˈspolu/", translation: "samen" }
      ],
      romantic: [
        { word: "Vždy myslím na tebe", translation: "Ik denk altijd aan je", pronunciation: "/ˈvʒdɪ ˈmɪsliːm na ˈtɛbɛ/", example: "V práci vždy myslím na tebe.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Děláš mě šťastným", translation: "Jij maakt me gelukkig", pronunciation: "/ˈɟɛlaːʃ mɲɛ ˈʃcasniːm/", example: "Každý den mě děláš šťastným.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Tsjechisch heeft de letter 'ř' - een unieke klank die alleen in het Tsjechisch bestaat!"
    },
    el: {
      featured: { word: "Αγάπη", translation: "Liefde", pronunciation: "/aˈɣapi/", context: "Het Griekse woord voor liefde - diep en filosofisch!" },
      pronouns: [
        { word: "εγώ", translation: "ik", pronunciation: "/eˈɣo/", example: "Σ'αγαπώ.", exampleTranslation: "Ik hou van je." },
        { word: "εσύ", translation: "jij", pronunciation: "/eˈsi/", example: "Είσαι όμορφη.", exampleTranslation: "Je bent mooi." },
        { word: "εμείς", translation: "wij", pronunciation: "/eˈmis/", example: "Είμαστε μαζί.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Grieks heeft een eigen alfabet dat je eerst moet leren. Het is de basis van ons Latijnse alfabet!",
      verbs: [
        { word: "είμαι", translation: "zijn", pronunciation: "/ˈime/", example: "Είσαι η αγάπη μου.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "έχω", translation: "hebben", pronunciation: "/ˈexo/", example: "Είμαι τυχερός που σ'έχω.", exampleTranslation: "Ik heb geluk dat ik je heb." },
        { word: "αγαπώ", translation: "liefhebben", pronunciation: "/aɣaˈpo/", example: "Σ'αγαπώ με όλη μου την καρδιά.", exampleTranslation: "Ik hou van je met heel mijn hart." }
      ],
      verbsTable: [
        { word: "κάνω", pronunciation: "/ˈkano/", translation: "maken/doen" },
        { word: "μπορώ", pronunciation: "/boˈro/", translation: "kunnen" },
        { word: "έρχομαι", pronunciation: "/ˈerxome/", translation: "komen" },
        { word: "πάω", pronunciation: "/ˈpao/", translation: "gaan" },
        { word: "βλέπω", pronunciation: "/ˈvlepo/", translation: "zien" },
        { word: "θέλω", pronunciation: "/ˈθelo/", translation: "willen" },
        { word: "σκέφτομαι", pronunciation: "/ˈskeftome/", translation: "denken" },
        { word: "ξέρω", pronunciation: "/ˈksero/", translation: "weten" }
      ],
      adjectives: [
        { word: "όμορφος/η", translation: "mooi", pronunciation: "/ˈomorfos/", example: "Είσαι όμορφη.", exampleTranslation: "Je bent mooi." },
        { word: "ευτυχισμένος/η", translation: "gelukkig", pronunciation: "/eftiçizˈmenos/", example: "Με κάνεις ευτυχισμένο.", exampleTranslation: "Jij maakt me gelukkig." }
      ],
      cultureTip2: "De oude Grieken hadden 4 woorden voor liefde: agape (onvoorwaardelijk), eros (romantisch), philia (vriendschap), storge (familie)!",
      nouns: [
        { word: "η αγάπη", translation: "de liefde", pronunciation: "/i aˈɣapi/", example: "Η αγάπη είναι τα πάντα.", exampleTranslation: "Liefde is alles." },
        { word: "η καρδιά", translation: "het hart", pronunciation: "/i karˈðia/", example: "Έχεις την καρδιά μου.", exampleTranslation: "Jij hebt mijn hart." }
      ],
      nounsTable: [
        { word: "η μέρα", pronunciation: "/i ˈmera/", translation: "de dag" },
        { word: "η νύχτα", pronunciation: "/i ˈnixta/", translation: "de nacht" },
        { word: "ο χρόνος", pronunciation: "/o ˈxronos/", translation: "de tijd" },
        { word: "η ζωή", pronunciation: "/i zoˈi/", translation: "het leven" },
        { word: "ο κόσμος", pronunciation: "/o ˈkozmos/", translation: "de wereld" },
        { word: "το σπίτι", pronunciation: "/to ˈspiti/", translation: "het huis" }
      ],
      adverbs: [
        { word: "πάντα", pronunciation: "/ˈpanda/", translation: "altijd" },
        { word: "ποτέ", pronunciation: "/poˈte/", translation: "nooit" },
        { word: "εδώ", pronunciation: "/eˈðo/", translation: "hier" },
        { word: "εκεί", pronunciation: "/eˈci/", translation: "daar" },
        { word: "τώρα", pronunciation: "/ˈtora/", translation: "nu" },
        { word: "σήμερα", pronunciation: "/ˈsimera/", translation: "vandaag" },
        { word: "πολύ", pronunciation: "/poˈli/", translation: "zeer/heel" },
        { word: "μαζί", pronunciation: "/maˈzi/", translation: "samen" }
      ],
      romantic: [
        { word: "Σκέφτομαι πάντα εσένα", translation: "Ik denk altijd aan je", pronunciation: "/ˈskeftome ˈpanda eˈsena/", example: "Στη δουλειά σκέφτομαι πάντα εσένα.", exampleTranslation: "Op werk denk ik altijd aan je." },
        { word: "Με κάνεις ευτυχισμένο", translation: "Jij maakt me gelukkig", pronunciation: "/me ˈkanis eftiçizˈmeno/", example: "Κάθε μέρα με κάνεις ευτυχισμένο.", exampleTranslation: "Elke dag maak jij me gelukkig." }
      ],
      funFact: "Veel Nederlandse woorden komen uit het Grieks: filosofie, democratie, theater, en zelfs 'alfabet' (alpha + beta)!"
    },
    hu: {
      featured: { word: "Szerelem", translation: "Liefde", pronunciation: "/ˈsɛrɛlɛm/", context: "Het Hongaarse woord voor romantische liefde!" },
      pronouns: [
        { word: "én", translation: "ik", pronunciation: "/eːn/", example: "Én szeretlek.", exampleTranslation: "Ik hou van je." },
        { word: "te", translation: "jij (informeel)", pronunciation: "/tɛ/", example: "Te gyönyörű vagy.", exampleTranslation: "Jij bent prachtig." },
        { word: "mi", translation: "wij", pronunciation: "/mi/", example: "Mi együtt vagyunk.", exampleTranslation: "Wij zijn samen." }
      ],
      cultureTip1: "Hongaars is niet verwant aan de buurlanden! Het is een Fins-Oegrische taal, verwant aan Fins en Estisch.",
      verbs: [
        { word: "lenni", translation: "zijn", pronunciation: "/ˈlɛnːi/", example: "Te vagy a szerelmem.", exampleTranslation: "Jij bent mijn liefde." },
        { word: "van (nekem)", translation:
