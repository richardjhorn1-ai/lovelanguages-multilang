# Hub Page Template System

A comprehensive template system for transforming language listing pages into SEO-optimized hub pages.

## Overview

Each `/learn/[native]/[target]/` page should be transformed from a simple article listing into a content-rich hub page with 1,500-2,500 words of unique content.

---

## Hub Page Structure

Every language hub page follows this 10-section structure:

```
┌─────────────────────────────────────────────────────────────┐
│  1. HERO SECTION                                            │
│     - Language flag + "Learn [Language]" H1                 │
│     - Compelling subtitle                                   │
│     - Key stats bar (speakers, difficulty, time to learn)   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  2. WHY LEARN SECTION (~200 words)                          │
│     - 4-5 compelling reasons                                │
│     - Links to culture articles                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  3. LEARNING ROADMAP                                        │
│     - Visual step-by-step path                              │
│     - Links to beginner → intermediate → advanced articles  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  4. ESSENTIAL PHRASES PREVIEW                               │
│     - Top 5-8 phrases with pronunciation                    │
│     - Link to full phrases article                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  5. GRAMMAR OVERVIEW (~200 words)                           │
│     - Key grammar concepts                                  │
│     - What makes this language unique                       │
│     - Links to grammar articles                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  6. CULTURAL INSIGHTS (~150 words)                          │
│     - Dating/relationship culture                           │
│     - Important traditions                                  │
│     - Links to culture articles                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  7. COMMON MISTAKES                                         │
│     - 5-7 mistakes English speakers make                    │
│     - Brief explanation for each                            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  8. FOR COUPLES SECTION                                     │
│     - Why learn this language together                      │
│     - Romantic phrases preview                              │
│     - Link to couples-focused articles                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  9. ARTICLE GRID (existing)                                 │
│     - Categorized by: Phrases, Vocabulary, Grammar, Culture │
│     - Category filters                                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  10. FAQ SECTION                                            │
│      - 6-8 questions with schema markup                     │
│      - Targets long-tail keywords                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Language Data Structure

Store this in `/blog/src/data/language-hub-data.ts`:

```typescript
export interface LanguageHubData {
  code: string;
  name: string;
  nativeName: string;
  flag: string;

  // Stats
  speakers: string;           // "45 million"
  countries: string[];        // ["Poland", "USA", "Germany"]
  difficultRating: 1 | 2 | 3 | 4 | 5;  // 1=easiest, 5=hardest
  fsiHours: number;          // FSI estimated hours to proficiency
  familyGroup: string;       // "Slavic", "Romance", "Germanic"

  // SEO
  primaryKeyword: string;    // "learn polish"
  secondaryKeywords: string[];

  // Content blocks
  whyLearn: string[];        // 4-5 bullet points
  grammarHighlights: string[]; // Key grammar features
  commonMistakes: { mistake: string; explanation: string }[];
  culturalTips: string[];
  couplesTip: string;        // Why couples should learn this

  // Phrases preview
  essentialPhrases: {
    phrase: string;
    pronunciation: string;
    translation: string;
  }[];

  // FAQ
  faqs: { question: string; answer: string }[];
}
```

---

## Complete Language Data

### Polish (pl)

```typescript
{
  code: 'pl',
  name: 'Polish',
  nativeName: 'Polski',
  flag: '🇵🇱',

  speakers: '45 million',
  countries: ['Poland', 'USA', 'Germany', 'UK', 'Canada'],
  difficultyRating: 4,
  fsiHours: 1100,
  familyGroup: 'Slavic',

  primaryKeyword: 'learn polish',
  secondaryKeywords: [
    'polish for beginners',
    'polish language',
    'how to speak polish',
    'polish lessons',
    'learn polish online'
  ],

  whyLearn: [
    'Connect with 45 million native speakers worldwide',
    'Gateway to understanding other Slavic languages (Russian, Czech, Ukrainian)',
    'Rich literary tradition including Nobel Prize winners',
    'Growing business opportunities in Poland\'s expanding economy',
    'Deeply expressive language for romance and poetry'
  ],

  grammarHighlights: [
    '7 grammatical cases that change word endings',
    '3 genders (masculine, feminine, neuter)',
    'Verb conjugation based on person and number',
    'Flexible word order thanks to the case system',
    'Aspect system (perfective vs imperfective verbs)'
  ],

  commonMistakes: [
    {
      mistake: 'Ignoring noun genders',
      explanation: 'Every Polish noun has a gender that affects adjectives and verb forms. "Dobry" (good) changes to "dobra" or "dobre" depending on the noun.'
    },
    {
      mistake: 'Mispronouncing "rz" and "ż"',
      explanation: 'Both make a "zh" sound (like "measure"). Many learners say "rz" as separate letters.'
    },
    {
      mistake: 'Using nominative case everywhere',
      explanation: 'Polish requires different cases after prepositions. "W domu" (at home) uses locative, not nominative "dom".'
    },
    {
      mistake: 'Forgetting about verb aspects',
      explanation: 'Polish verbs come in pairs (perfective/imperfective). Using the wrong aspect changes the meaning.'
    },
    {
      mistake: 'Direct translation of English phrases',
      explanation: '"I am cold" becomes "Jest mi zimno" (It is cold to me), not a direct translation.'
    }
  ],

  culturalTips: [
    'Name days (imieniny) are celebrated as much as birthdays',
    'Offering food three times before accepting is polite',
    'Always bring flowers (odd numbers only) when visiting',
    'Easter and Christmas traditions are elaborate family affairs'
  ],

  couplesTip: 'Polish has incredibly expressive terms of endearment—over 50 ways to call your partner "sweetie." Learning Polish together opens a whole new vocabulary of affection.',

  essentialPhrases: [
    { phrase: 'Kocham cię', pronunciation: 'KO-ham cheh', translation: 'I love you' },
    { phrase: 'Dzień dobry', pronunciation: 'jen DOB-ri', translation: 'Good day/Hello' },
    { phrase: 'Dziękuję', pronunciation: 'jen-KOO-yeh', translation: 'Thank you' },
    { phrase: 'Przepraszam', pronunciation: 'psheh-PRAH-shahm', translation: 'I\'m sorry / Excuse me' },
    { phrase: 'Tak / Nie', pronunciation: 'tahk / nyeh', translation: 'Yes / No' },
    { phrase: 'Proszę', pronunciation: 'PRO-sheh', translation: 'Please / You\'re welcome' },
    { phrase: 'Cześć', pronunciation: 'cheshch', translation: 'Hi/Bye (informal)' },
    { phrase: 'Jak się masz?', pronunciation: 'yahk sheh mahsh', translation: 'How are you?' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn Polish?',
      answer: 'The U.S. Foreign Service Institute estimates 1,100 class hours for English speakers to reach professional proficiency. With consistent daily practice, expect 2-3 years for conversational fluency. Basic phrases and tourist Polish can be learned in a few months.'
    },
    {
      question: 'Is Polish harder than German?',
      answer: 'Polish is generally considered harder for English speakers. While German has 4 cases, Polish has 7. However, Polish pronunciation is more consistent once you learn the rules, and Polish doesn\'t have German\'s strict word order requirements.'
    },
    {
      question: 'What\'s the best way to learn Polish?',
      answer: 'Combine structured lessons with immersion. Start with basic phrases and pronunciation, then build vocabulary around topics you care about. Practice speaking with native speakers, watch Polish media with subtitles, and use spaced repetition for vocabulary.'
    },
    {
      question: 'Can I learn Polish if I know Russian?',
      answer: 'Yes! Polish and Russian share Slavic roots with about 38% lexical similarity. You\'ll recognize many words and grammatical concepts. However, Polish uses the Latin alphabet and has different pronunciation patterns.'
    },
    {
      question: 'What are the hardest parts of Polish?',
      answer: 'The 7-case system challenges most learners—noun endings change based on grammatical function. Consonant clusters like "szcz" and "chrząszcz" require practice. Verb aspects (perfective/imperfective) also take time to master.'
    },
    {
      question: 'Is Polish useful to learn?',
      answer: 'Absolutely. Polish is the EU\'s 6th most spoken language with 45 million speakers. Poland has a growing economy, rich culture, and large diaspora communities. It also helps with learning other Slavic languages.'
    }
  ]
}
```

### Spanish (es)

```typescript
{
  code: 'es',
  name: 'Spanish',
  nativeName: 'Español',
  flag: '🇪🇸',

  speakers: '500 million',
  countries: ['Spain', 'Mexico', 'USA', 'Colombia', 'Argentina', '20+ countries'],
  difficultyRating: 1,
  fsiHours: 600,
  familyGroup: 'Romance',

  primaryKeyword: 'learn spanish',
  secondaryKeywords: [
    'spanish for beginners',
    'learn spanish online',
    'spanish lessons',
    'how to speak spanish',
    'spanish language course'
  ],

  whyLearn: [
    'Second most spoken native language in the world (500+ million speakers)',
    'Official language in 21 countries across 4 continents',
    'One of the easiest languages for English speakers to learn',
    'Opens doors to rich literature, music, and cinema',
    'Increasingly valuable in business and healthcare in the US'
  ],

  grammarHighlights: [
    'Gendered nouns (masculine/feminine)',
    'Verb conjugations for 6 persons',
    'Subjunctive mood for emotions and uncertainty',
    'Ser vs estar (two verbs for "to be")',
    'Relatively consistent pronunciation rules'
  ],

  commonMistakes: [
    {
      mistake: 'Confusing ser and estar',
      explanation: 'Both mean "to be" but ser is for permanent traits, estar for temporary states. "Soy feliz" (I\'m a happy person) vs "Estoy feliz" (I\'m happy right now).'
    },
    {
      mistake: 'Forgetting noun-adjective agreement',
      explanation: 'Adjectives must match the noun\'s gender and number. "Casa blanca" (white house) but "carro blanco" (white car).'
    },
    {
      mistake: 'Overusing subject pronouns',
      explanation: 'Spanish verb conjugations show the subject, so "Yo tengo" is redundant—just "Tengo" is natural.'
    },
    {
      mistake: 'False friends with English',
      explanation: '"Embarazada" means pregnant, not embarrassed. "Actual" means current, not actual. These false cognates cause confusion.'
    },
    {
      mistake: 'Ignoring the subjunctive mood',
      explanation: 'The subjunctive is essential for expressing doubt, wishes, and emotions. "Espero que vengas" (I hope you come) requires subjunctive.'
    }
  ],

  culturalTips: [
    'Greetings often include kisses on the cheek (varies by country)',
    'Meals are social events—dinner often starts at 9-10 PM in Spain',
    'Siesta culture affects business hours in some regions',
    'Family is central—expect questions about your family early in relationships'
  ],

  couplesTip: 'Spanish is the language of passion and romance. Its flowing sounds and expressive vocabulary make it perfect for couples—plus, you can travel together to 21 Spanish-speaking countries.',

  essentialPhrases: [
    { phrase: 'Te quiero / Te amo', pronunciation: 'teh KYEH-roh / teh AH-moh', translation: 'I love you (casual/deep)' },
    { phrase: 'Hola', pronunciation: 'OH-lah', translation: 'Hello' },
    { phrase: 'Gracias', pronunciation: 'GRAH-syahs', translation: 'Thank you' },
    { phrase: 'Por favor', pronunciation: 'por fah-VOR', translation: 'Please' },
    { phrase: '¿Cómo estás?', pronunciation: 'KOH-moh ehs-TAHS', translation: 'How are you?' },
    { phrase: 'Lo siento', pronunciation: 'loh SYEHN-toh', translation: 'I\'m sorry' },
    { phrase: 'Buenos días', pronunciation: 'BWEH-nohs DEE-ahs', translation: 'Good morning' },
    { phrase: 'Me llamo...', pronunciation: 'meh YAH-moh', translation: 'My name is...' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn Spanish?',
      answer: 'Spanish is one of the easiest languages for English speakers. The FSI estimates 600-750 class hours for proficiency. With daily practice, you can hold basic conversations in 3-6 months and reach intermediate level in 1-2 years.'
    },
    {
      question: 'Should I learn Spanish from Spain or Latin America?',
      answer: 'Both are valid! Latin American Spanish is more widely spoken (90% of speakers). The main differences are vocabulary, some pronunciation (Spain\'s "th" sound), and use of "vosotros." Start with one, then adapt—they\'re mutually intelligible.'
    },
    {
      question: 'Is Spanish easier than French?',
      answer: 'For most English speakers, yes. Spanish pronunciation is more consistent, and the spelling is more phonetic. Both share Latin roots and similar grammar structures, but Spanish has fewer silent letters and irregular verbs.'
    },
    {
      question: 'What\'s the hardest part of Spanish?',
      answer: 'The subjunctive mood challenges most learners—it\'s used for uncertainty, emotions, and wishes in ways English doesn\'t require. Ser vs estar and gendered nouns also take practice, but consistent exposure helps.'
    },
    {
      question: 'Can I become fluent in Spanish in a year?',
      answer: 'Conversational fluency is achievable in a year with intensive study (2+ hours daily) and immersion. Full professional fluency typically takes 2-3 years. Living in a Spanish-speaking country accelerates progress significantly.'
    },
    {
      question: 'Is Duolingo enough to learn Spanish?',
      answer: 'Duolingo builds vocabulary and basic grammar but isn\'t sufficient alone. Combine it with conversation practice, listening to native content, and structured grammar study for best results.'
    }
  ]
}
```

### French (fr)

```typescript
{
  code: 'fr',
  name: 'French',
  nativeName: 'Français',
  flag: '🇫🇷',

  speakers: '300 million',
  countries: ['France', 'Canada', 'Belgium', 'Switzerland', '29 countries'],
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Romance',

  primaryKeyword: 'learn french',
  secondaryKeywords: [
    'french for beginners',
    'learn french online',
    'french lessons',
    'how to speak french',
    'french language course'
  ],

  whyLearn: [
    'Official language in 29 countries on 5 continents',
    'Language of diplomacy, cuisine, fashion, and art',
    '30% of English vocabulary has French origins',
    'Second most studied language in the world',
    'Gateway to other Romance languages'
  ],

  grammarHighlights: [
    'Gendered nouns with articles (le/la/les)',
    'Verb conjugations with many irregular verbs',
    'Liaison—connecting words with sounds',
    'Formal (vous) vs informal (tu) address',
    'Complex past tenses (passé composé, imparfait)'
  ],

  commonMistakes: [
    {
      mistake: 'Pronouncing silent letters',
      explanation: 'French has many silent endings. "Petit" is "puh-TEE" not "puh-TEET." Final consonants are usually silent unless followed by a vowel.'
    },
    {
      mistake: 'Forgetting liaisons',
      explanation: 'French links words together. "Les amis" sounds like "lay-zah-MEE" with the S connecting to the vowel.'
    },
    {
      mistake: 'Mixing up tu and vous',
      explanation: 'Using "tu" with strangers or elders is rude. When in doubt, use "vous." Wait for the French speaker to suggest "tu."'
    },
    {
      mistake: 'Direct translation of English phrases',
      explanation: '"I am 25 years old" becomes "J\'ai 25 ans" (I have 25 years), not "Je suis 25 ans."'
    },
    {
      mistake: 'Ignoring noun genders',
      explanation: 'Every noun has a gender that affects articles and adjectives. "La table" (feminine) but "le livre" (masculine). Memorize nouns with their articles.'
    }
  ],

  culturalTips: [
    'Always greet with "Bonjour" before any interaction',
    'Cheek kisses (la bise) vary by region—2 to 4 kisses',
    'Meals are events—lunch breaks can be 2 hours',
    'Speaking even basic French is deeply appreciated'
  ],

  couplesTip: 'French is the language of love for good reason. Its melodic sounds and romantic vocabulary make it perfect for couples. Plus, imagine planning trips to Paris, the French Riviera, or Quebec together.',

  essentialPhrases: [
    { phrase: 'Je t\'aime', pronunciation: 'zhuh TEM', translation: 'I love you' },
    { phrase: 'Bonjour', pronunciation: 'bohn-ZHOOR', translation: 'Hello/Good day' },
    { phrase: 'Merci', pronunciation: 'mehr-SEE', translation: 'Thank you' },
    { phrase: 'S\'il vous plaît', pronunciation: 'seel voo PLEH', translation: 'Please' },
    { phrase: 'Comment allez-vous?', pronunciation: 'koh-mahn tah-lay VOO', translation: 'How are you? (formal)' },
    { phrase: 'Excusez-moi', pronunciation: 'eks-kew-zay MWAH', translation: 'Excuse me' },
    { phrase: 'Au revoir', pronunciation: 'oh ruh-VWAHR', translation: 'Goodbye' },
    { phrase: 'Je m\'appelle...', pronunciation: 'zhuh mah-PEL', translation: 'My name is...' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn French?',
      answer: 'The FSI estimates 600-750 hours for English speakers to reach proficiency. With daily practice, basic conversation takes 6-12 months. Intermediate fluency typically requires 1-2 years of consistent study.'
    },
    {
      question: 'Is French harder than Spanish?',
      answer: 'Slightly. French has more silent letters, liaison rules, and nasal sounds that challenge English speakers. However, both are Category I languages (easiest for English speakers), and French vocabulary is closer to English.'
    },
    {
      question: 'What\'s the hardest part of French?',
      answer: 'Pronunciation and listening comprehension challenge most learners. Silent letters, liaisons, and speaking speed make French sound different than it looks. Gender memorization and verb conjugations also require time.'
    },
    {
      question: 'Should I learn Parisian French or Canadian French?',
      answer: 'Start with standard (Parisian) French—it\'s more widely understood and has more learning resources. Canadian French (Québécois) has different vocabulary and accent but shares the same grammar. You can adapt later.'
    },
    {
      question: 'Is French useful to learn?',
      answer: 'Very. French is spoken on 5 continents, is an official UN/EU language, and is the second most studied language globally. It\'s valuable for careers in diplomacy, fashion, cuisine, and international business.'
    },
    {
      question: 'Can I learn French and Spanish at the same time?',
      answer: 'It\'s possible but can cause confusion for beginners due to similarities. Better to reach intermediate level in one first, then start the other. The shared Latin roots will then help rather than confuse.'
    }
  ]
}
```

### German (de)

```typescript
{
  code: 'de',
  name: 'German',
  nativeName: 'Deutsch',
  flag: '🇩🇪',

  speakers: '130 million',
  countries: ['Germany', 'Austria', 'Switzerland', 'Luxembourg', 'Liechtenstein'],
  difficultyRating: 3,
  fsiHours: 900,
  familyGroup: 'Germanic',

  primaryKeyword: 'learn german',
  secondaryKeywords: [
    'german for beginners',
    'learn german online',
    'german lessons',
    'how to speak german',
    'german language course'
  ],

  whyLearn: [
    'Most spoken native language in Europe (95+ million in EU)',
    'Germany has the world\'s 4th largest economy',
    'Shares roots with English—many recognizable words',
    'Free university education in Germany (even for foreigners)',
    'Rich philosophical, scientific, and musical heritage'
  ],

  grammarHighlights: [
    '4 grammatical cases (nominative, accusative, dative, genitive)',
    '3 genders with articles (der/die/das)',
    'Verb-second rule in main clauses',
    'Separable prefix verbs',
    'Compound nouns (famously long words)'
  ],

  commonMistakes: [
    {
      mistake: 'Wrong word order',
      explanation: 'German has strict verb placement. In main clauses, the verb is always second. In subordinate clauses, it goes to the end. "Ich weiß, dass er kommt" (I know that he comes).'
    },
    {
      mistake: 'Mixing up der/die/das',
      explanation: 'Noun genders seem arbitrary and must be memorized. "Das Mädchen" (the girl) is neuter, not feminine! Always learn nouns with their article.'
    },
    {
      mistake: 'Forgetting case changes',
      explanation: 'Articles and adjectives change based on case. "Der Mann" (nominative) becomes "den Mann" (accusative). The case system affects articles, adjectives, and pronouns.'
    },
    {
      mistake: 'Mispronouncing umlauts',
      explanation: 'Ä, ö, ü are distinct sounds, not decorative. "Schön" (beautiful) with proper ö sounds different from "schon" (already).'
    },
    {
      mistake: 'Forgetting separable prefixes',
      explanation: 'Some verbs split in sentences. "Aufstehen" (to get up) becomes "Ich stehe auf" (I get up). The prefix goes to the end.'
    }
  ],

  culturalTips: [
    'Punctuality is extremely important—being late is rude',
    'Germans often speak directly; it\'s honesty, not rudeness',
    'Formal "Sie" is used in professional and new relationships',
    'Sunday is quiet—shops are closed, noise is minimized'
  ],

  couplesTip: 'German has wonderfully specific words for emotions English lacks—like "Fernweh" (longing to travel) and "Geborgenheit" (feeling of security with someone). Learning German together builds a unique shared vocabulary.',

  essentialPhrases: [
    { phrase: 'Ich liebe dich', pronunciation: 'ikh LEE-buh dikh', translation: 'I love you' },
    { phrase: 'Guten Tag', pronunciation: 'GOO-ten tahk', translation: 'Good day' },
    { phrase: 'Danke', pronunciation: 'DAHN-kuh', translation: 'Thank you' },
    { phrase: 'Bitte', pronunciation: 'BIT-uh', translation: 'Please / You\'re welcome' },
    { phrase: 'Wie geht es dir?', pronunciation: 'vee gayt es deer', translation: 'How are you? (informal)' },
    { phrase: 'Entschuldigung', pronunciation: 'ent-SHOOL-di-goong', translation: 'Excuse me / Sorry' },
    { phrase: 'Auf Wiedersehen', pronunciation: 'owf VEE-der-zay-en', translation: 'Goodbye' },
    { phrase: 'Ich heiße...', pronunciation: 'ikh HY-suh', translation: 'My name is...' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn German?',
      answer: 'The FSI estimates 900 hours for proficiency—longer than Spanish or French but shorter than Polish or Russian. With consistent study, expect basic conversation in 6-12 months and intermediate fluency in 2-3 years.'
    },
    {
      question: 'Is German harder than French?',
      answer: 'In different ways. German has harder grammar (4 cases, 3 genders, strict word order) but more phonetic pronunciation. French pronunciation challenges most learners more. Both are achievable for English speakers.'
    },
    {
      question: 'What\'s the hardest part of German?',
      answer: 'The case system challenges most learners—articles and adjectives change based on grammatical function. Word order rules, especially verb placement, also require significant practice. Gender memorization never fully ends.'
    },
    {
      question: 'Is German useful for jobs?',
      answer: 'Yes, especially in engineering, automotive, finance, and science. Germany has Europe\'s largest economy. German is also valuable for philosophy, classical music, and academic research in many fields.'
    },
    {
      question: 'Is German similar to English?',
      answer: 'Yes! Both are Germanic languages. Many words are recognizable: "Wasser" (water), "Haus" (house), "Hand" (hand). English grammar lost cases that German retained, but the word roots often overlap.'
    },
    {
      question: 'Can I study in Germany for free?',
      answer: 'Yes! Public universities in Germany have no tuition fees for international students (small semester fees of €100-350 apply). You\'ll need German proficiency (usually B2-C1 level) for German-taught programs.'
    }
  ]
}
```

### Italian (it)

```typescript
{
  code: 'it',
  name: 'Italian',
  nativeName: 'Italiano',
  flag: '🇮🇹',

  speakers: '85 million',
  countries: ['Italy', 'Switzerland', 'San Marino', 'Vatican City'],
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Romance',

  primaryKeyword: 'learn italian',
  secondaryKeywords: [
    'italian for beginners',
    'learn italian online',
    'italian lessons',
    'how to speak italian',
    'italian language course'
  ],

  whyLearn: [
    'Language of art, music, fashion, and cuisine',
    'Most phonetic Romance language—reads as it\'s written',
    'Gateway to understanding opera and classical music',
    'Italy is the world\'s 5th most visited country',
    'Strong diaspora communities worldwide'
  ],

  grammarHighlights: [
    'Gendered nouns (masculine/feminine)',
    'Verb conjugations for 6 persons',
    'Double consonants affect pronunciation and meaning',
    'Formal "Lei" vs informal "tu"',
    'Consistent pronunciation rules'
  ],

  commonMistakes: [
    {
      mistake: 'Ignoring double consonants',
      explanation: '"Penna" (pen) and "pena" (pain) differ only in the double N. Double consonants are held longer—it\'s not optional.'
    },
    {
      mistake: 'Using subject pronouns too much',
      explanation: 'Like Spanish, Italian verb endings show the subject. "Io parlo" is emphatic—normally just "Parlo" (I speak).'
    },
    {
      mistake: 'Wrong gender agreements',
      explanation: 'Adjectives must match noun gender and number. "Ragazzo alto" (tall boy) but "ragazza alta" (tall girl).'
    },
    {
      mistake: 'Mispronouncing "c" and "g"',
      explanation: 'Before e/i, C sounds like "ch" and G sounds like "j." "Ciao" is "chow," "gelato" is "jeh-LAH-toh."'
    },
    {
      mistake: 'Forgetting articles with possessives',
      explanation: 'Unlike English, Italian uses articles with possessives: "la mia casa" (the my house), except with singular family members.'
    }
  ],

  culturalTips: [
    'Hand gestures are essential to Italian communication',
    'Coffee culture has strict rules—cappuccino only in the morning',
    'Lunch is the main meal; dinner is often lighter',
    '"La bella figura" (making a good impression) matters greatly'
  ],

  couplesTip: 'Italian is considered one of the most romantic languages in the world. Its musical quality and expressive vocabulary make everything sound beautiful—perfect for couples who appreciate art, food, and passion.',

  essentialPhrases: [
    { phrase: 'Ti amo', pronunciation: 'tee AH-moh', translation: 'I love you' },
    { phrase: 'Ciao', pronunciation: 'chow', translation: 'Hi/Bye (informal)' },
    { phrase: 'Grazie', pronunciation: 'GRAH-tsyeh', translation: 'Thank you' },
    { phrase: 'Per favore', pronunciation: 'pehr fah-VOH-reh', translation: 'Please' },
    { phrase: 'Come stai?', pronunciation: 'KOH-meh stai', translation: 'How are you? (informal)' },
    { phrase: 'Mi scusi', pronunciation: 'mee SKOO-zee', translation: 'Excuse me (formal)' },
    { phrase: 'Arrivederci', pronunciation: 'ah-ree-veh-DEHR-chee', translation: 'Goodbye' },
    { phrase: 'Mi chiamo...', pronunciation: 'mee KYAH-moh', translation: 'My name is...' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn Italian?',
      answer: 'Italian is among the easiest languages for English speakers. The FSI estimates 600-750 hours for proficiency. Basic conversation is achievable in 3-6 months; intermediate fluency typically takes 1-2 years.'
    },
    {
      question: 'Is Italian easier than Spanish?',
      answer: 'They\'re comparable. Italian has slightly more consistent pronunciation, while Spanish is more widely spoken (more practice opportunities). Both are Category I languages for English speakers. Choose based on your interests.'
    },
    {
      question: 'Is Italian useful to learn?',
      answer: 'For culture, absolutely—Italian unlocks art, opera, fashion, and cuisine at a deeper level. For business, it\'s valuable in design, automotive, and food industries. Italy is also a top tourist destination.'
    },
    {
      question: 'What\'s the hardest part of Italian?',
      answer: 'Double consonants and their effect on meaning challenge most learners. The subjunctive mood, while less used than in Spanish, also requires practice. Verb conjugations have many irregular forms to memorize.'
    },
    {
      question: 'Can I learn Italian from watching movies?',
      answer: 'Movies help with listening skills and cultural context but shouldn\'t be your only method. Combine them with structured grammar study, vocabulary practice, and conversation. Start with subtitles in Italian, not English.'
    },
    {
      question: 'Is Italian dying out?',
      answer: 'No. While Italian has fewer speakers than Spanish or French, it\'s stable as Italy\'s official language and is actively taught worldwide. It\'s the 4th most studied language globally.'
    }
  ]
}
```

### Portuguese (pt)

```typescript
{
  code: 'pt',
  name: 'Portuguese',
  nativeName: 'Português',
  flag: '🇵🇹',

  speakers: '260 million',
  countries: ['Brazil', 'Portugal', 'Mozambique', 'Angola', '9 countries'],
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Romance',

  primaryKeyword: 'learn portuguese',
  secondaryKeywords: [
    'portuguese for beginners',
    'learn brazilian portuguese',
    'portuguese lessons',
    'learn portuguese online',
    'portuguese language course'
  ],

  whyLearn: [
    '6th most spoken language in the world (260+ million)',
    'Brazil has the world\'s 9th largest economy',
    'Growing importance in business and diplomacy',
    'Rich musical traditions (Bossa Nova, Fado, Samba)',
    'Often overlooked—fewer learners means you stand out'
  ],

  grammarHighlights: [
    'Gendered nouns like other Romance languages',
    'Personal infinitive (unique to Portuguese)',
    'Nasal vowels (ão, ãe, õe)',
    'Two verbs for "to be" (ser/estar)',
    'Formal você vs informal tu'
  ],

  commonMistakes: [
    {
      mistake: 'Ignoring nasal sounds',
      explanation: 'The tildes (ã, õ) indicate nasal vowels. "Não" (no) and "nao" sound completely different. Practice nasal sounds early.'
    },
    {
      mistake: 'Using Spanish pronunciation',
      explanation: 'Portuguese sounds different despite similar spelling. "De" is "jee" in Brazilian Portuguese, not "deh." Many vowels reduce to almost nothing.'
    },
    {
      mistake: 'Confusing ser and estar',
      explanation: 'Like Spanish, Portuguese has two "to be" verbs. "Sou feliz" (I\'m a happy person) vs "Estou feliz" (I\'m happy now).'
    },
    {
      mistake: 'Forgetting contractions',
      explanation: 'Portuguese contracts prepositions with articles: "de + o = do," "em + a = na." These are mandatory, not optional.'
    },
    {
      mistake: 'Mixing Brazilian and European Portuguese',
      explanation: 'Vocabulary, pronunciation, and even grammar differ. "Ônibus" (Brazil) vs "autocarro" (Portugal) for bus. Pick one variety to start.'
    }
  ],

  culturalTips: [
    'Brazilians are warm and physical—expect hugs and closeness',
    'Portuguese culture is more reserved but equally hospitable',
    '"Saudade" expresses a uniquely Portuguese longing/nostalgia',
    'Food is central to socializing in both cultures'
  ],

  couplesTip: 'Portuguese has "saudade"—a word for the deep longing you feel for someone you love. Learning Portuguese together gives you access to one of the world\'s most emotionally expressive languages.',

  essentialPhrases: [
    { phrase: 'Eu te amo', pronunciation: 'eh-oo chee AH-moo', translation: 'I love you (Brazilian)' },
    { phrase: 'Olá', pronunciation: 'oh-LAH', translation: 'Hello' },
    { phrase: 'Obrigado/a', pronunciation: 'oh-bree-GAH-doo/dah', translation: 'Thank you (m/f)' },
    { phrase: 'Por favor', pronunciation: 'por fah-VOR', translation: 'Please' },
    { phrase: 'Tudo bem?', pronunciation: 'TOO-doo beng', translation: 'How are you? / All good?' },
    { phrase: 'Desculpa', pronunciation: 'desh-KOOL-pah', translation: 'Sorry' },
    { phrase: 'Tchau', pronunciation: 'chow', translation: 'Bye (informal)' },
    { phrase: 'Meu nome é...', pronunciation: 'meh-oo NOH-mee eh', translation: 'My name is...' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn Portuguese?',
      answer: 'The FSI estimates 600-750 hours for proficiency—similar to Spanish and French. Basic conversation is achievable in 6-12 months with regular practice. Brazilian Portuguese is often considered slightly easier due to clearer pronunciation.'
    },
    {
      question: 'Should I learn Brazilian or European Portuguese?',
      answer: 'Brazilian Portuguese has more speakers (210 million vs 10 million) and more learning resources. European Portuguese is more similar to other European languages. Choose based on your goals—they\'re mutually intelligible.'
    },
    {
      question: 'Is Portuguese harder than Spanish?',
      answer: 'Slightly. Portuguese pronunciation is more complex with nasal sounds and vowel reductions. However, if you know Spanish, Portuguese is much easier—expect to understand 90% of written Portuguese immediately.'
    },
    {
      question: 'Can Spanish speakers understand Portuguese?',
      answer: 'Partially. Written Portuguese is highly understandable for Spanish speakers (70-90%). Spoken Portuguese is harder due to different pronunciation. Portuguese speakers generally understand Spanish better than vice versa.'
    },
    {
      question: 'Is Portuguese useful for business?',
      answer: 'Increasingly so. Brazil\'s large economy and growing African markets (Angola, Mozambique) make Portuguese valuable. It\'s an official language in 9 countries and one of the EU\'s official languages.'
    },
    {
      question: 'Why does Portuguese sound so different from Spanish?',
      answer: 'Portuguese has more vowel sounds, nasal vowels, and vowel reduction (unstressed vowels nearly disappear). It also has different rhythm—more syllable-timed like French, while Spanish is more evenly paced.'
    }
  ]
}
```

### Russian (ru)

```typescript
{
  code: 'ru',
  name: 'Russian',
  nativeName: 'Русский',
  flag: '🇷🇺',

  speakers: '255 million',
  countries: ['Russia', 'Belarus', 'Kazakhstan', 'Kyrgyzstan', 'many former USSR'],
  difficultyRating: 4,
  fsiHours: 1100,
  familyGroup: 'Slavic',

  primaryKeyword: 'learn russian',
  secondaryKeywords: [
    'russian for beginners',
    'learn russian online',
    'russian alphabet',
    'how to speak russian',
    'russian language course'
  ],

  whyLearn: [
    '8th most spoken language in the world',
    'Key language for science, literature, and space exploration',
    'Opens doors to understanding other Slavic languages',
    'Rich literary tradition (Tolstoy, Dostoevsky, Chekhov)',
    'Strategic importance in international relations'
  ],

  grammarHighlights: [
    'Cyrillic alphabet (33 letters)',
    '6 grammatical cases',
    'Verb aspects (perfective/imperfective)',
    'No articles (a, the)',
    'Flexible word order due to case system'
  ],

  commonMistakes: [
    {
      mistake: 'Ignoring case endings',
      explanation: 'Russian has 6 cases that change word endings. "Книга" (book, nominative) becomes "книгу" (accusative), "книги" (genitive). Cases are essential for meaning.'
    },
    {
      mistake: 'Wrong stress placement',
      explanation: 'Russian stress is unpredictable and changes word meaning. "Замок" (ZAH-mok) means castle, but "замок" (zah-MOK) means lock. Stress must be memorized.'
    },
    {
      mistake: 'Confusing verb aspects',
      explanation: 'Every Russian verb has two aspects. "Читать" (to read, ongoing) vs "прочитать" (to read, completed). Using the wrong aspect changes the meaning significantly.'
    },
    {
      mistake: 'Pronouncing Cyrillic like Latin',
      explanation: 'Some Cyrillic letters look like Latin but sound different. "Р" is "R" not "P," "Н" is "N" not "H," "В" is "V" not "B."'
    },
    {
      mistake: 'Adding articles',
      explanation: 'Russian has no articles. Don\'t translate "the book" as two words—just "книга." Context shows definiteness.'
    }
  ],

  culturalTips: [
    'Russians may seem reserved initially but are warm once you know them',
    'Bringing flowers? Always odd numbers (even numbers are for funerals)',
    'Refusing food or drink three times before accepting is polite',
    'Smiling at strangers is uncommon—it doesn\'t mean unfriendliness'
  ],

  couplesTip: 'Russian has incredibly tender diminutives—you can add affectionate endings to almost any word, including your partner\'s name. Learning Russian together opens up a world of unique expressions of love.',

  essentialPhrases: [
    { phrase: 'Я тебя люблю', pronunciation: 'ya tee-BYA lyoo-BLYOO', translation: 'I love you' },
    { phrase: 'Привет', pronunciation: 'pree-VYET', translation: 'Hi (informal)' },
    { phrase: 'Спасибо', pronunciation: 'spah-SEE-bah', translation: 'Thank you' },
    { phrase: 'Пожалуйста', pronunciation: 'pah-ZHAHL-stah', translation: 'Please / You\'re welcome' },
    { phrase: 'Как дела?', pronunciation: 'kahk dee-LAH', translation: 'How are you?' },
    { phrase: 'Извините', pronunciation: 'eez-vee-NEE-tyeh', translation: 'Excuse me / Sorry' },
    { phrase: 'До свидания', pronunciation: 'dah svee-DAH-nyah', translation: 'Goodbye' },
    { phrase: 'Меня зовут...', pronunciation: 'mee-NYA zah-VOOT', translation: 'My name is...' }
  ],

  faqs: [
    {
      question: 'How long does it take to learn Russian?',
      answer: 'The FSI estimates 1,100 hours for proficiency—about 2-3 years of consistent study. The Cyrillic alphabet takes 2-4 weeks to learn. Basic conversation is achievable in 6-12 months; intermediate fluency takes 2-3 years.'
    },
    {
      question: 'Is Russian hard to learn?',
      answer: 'Russian is challenging but achievable. The Cyrillic alphabet is learnable in weeks. Cases and verb aspects require significant practice. However, pronunciation is more consistent than English, and there are no articles to worry about.'
    },
    {
      question: 'Should I learn the alphabet first?',
      answer: 'Yes, absolutely. Spend 2-4 weeks mastering Cyrillic before anything else. It\'s not as hard as it looks—many letters are similar to Latin or Greek. This foundation makes everything else easier.'
    },
    {
      question: 'Is Russian harder than Polish?',
      answer: 'They\'re similarly difficult. Russian has Cyrillic (extra learning curve) but 6 cases; Polish has 7 cases but uses Latin script. Both have complex grammar and verb aspects. Russian has more speakers and resources.'
    },
    {
      question: 'Can I learn Russian if I know Polish?',
      answer: 'Yes! Polish and Russian share Slavic roots with significant vocabulary overlap. The case system concepts transfer directly. Main challenge is learning Cyrillic and adjusting to different pronunciation patterns.'
    },
    {
      question: 'Is Russian useful to learn?',
      answer: 'Russian opens access to 255+ million speakers across many countries. It\'s valuable for careers in translation, international relations, aerospace, and energy. It\'s also essential for Russian literature, music, and film.'
    }
  ]
}
```

---

## Additional Language Data (Abbreviated)

### Ukrainian (uk)

```typescript
{
  code: 'uk',
  speakers: '45 million',
  difficultyRating: 4,
  fsiHours: 1100,
  familyGroup: 'Slavic',
  primaryKeyword: 'learn ukrainian',
  whyLearn: [
    'Show solidarity and connect with Ukrainian culture',
    'Distinct language from Russian with unique beauty',
    'Growing diaspora communities worldwide',
    'Rich folk traditions and modern culture'
  ],
  couplesTip: 'Ukrainian is known for its melodic, song-like quality. Learning it together connects you to a resilient culture with deep traditions of love and family.'
}
```

### Czech (cs)

```typescript
{
  code: 'cs',
  speakers: '13 million',
  difficultyRating: 4,
  fsiHours: 1100,
  familyGroup: 'Slavic',
  primaryKeyword: 'learn czech',
  whyLearn: [
    'Gateway to Central European culture',
    'Prague is a major tourist and business hub',
    'Rich beer and culinary traditions',
    'Easier Slavic language (no Cyrillic)'
  ],
  couplesTip: 'Czech has charming diminutives for everything—including your partner. It\'s perfect for couples who love Prague\'s romantic atmosphere and Central European culture.'
}
```

### Greek (el)

```typescript
{
  code: 'el',
  speakers: '13 million',
  difficultyRating: 3,
  fsiHours: 1100,
  familyGroup: 'Hellenic',
  primaryKeyword: 'learn greek',
  whyLearn: [
    'Connect with 3,000+ years of continuous culture',
    'Many English words have Greek roots',
    'Beautiful island destinations',
    'Unique alphabet but consistent pronunciation'
  ],
  couplesTip: 'Greek gave us the word "eros" for romantic love. Learning Greek together connects you to the birthplace of Western philosophy and some of history\'s greatest love stories.'
}
```

### Dutch (nl)

```typescript
{
  code: 'nl',
  speakers: '25 million',
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Germanic',
  primaryKeyword: 'learn dutch',
  whyLearn: [
    'Closest major language to English',
    'Netherlands has excellent work-life balance',
    'Gateway to German and Scandinavian languages',
    'High English proficiency means patient practice partners'
  ],
  couplesTip: 'Dutch is the easiest language for English speakers to learn. Its "gezellig" concept (cozy togetherness) perfectly captures what couples seek in shared activities.'
}
```

### Swedish (sv)

```typescript
{
  code: 'sv',
  speakers: '10 million',
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Germanic',
  primaryKeyword: 'learn swedish',
  whyLearn: [
    'Sweden consistently ranks among happiest countries',
    'Strong tech and design industry',
    'Beautiful nature and culture',
    'Relatively simple grammar for English speakers'
  ],
  couplesTip: 'Swedish concepts like "lagom" (just the right amount) and "fika" (coffee break ritual) embody balanced, quality time together—perfect values for couples.'
}
```

### Norwegian (no)

```typescript
{
  code: 'no',
  speakers: '5 million',
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Germanic',
  primaryKeyword: 'learn norwegian',
  whyLearn: [
    'Often ranked easiest language for English speakers',
    'Norway has stunning natural beauty',
    'High standard of living and work-life balance',
    'Mutually intelligible with Swedish and Danish'
  ],
  couplesTip: 'Norwegian\'s "koselig" is their version of hygge—the art of creating warmth and connection. Learning Norwegian together embraces this cozy philosophy.'
}
```

### Danish (da)

```typescript
{
  code: 'da',
  speakers: '6 million',
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Germanic',
  primaryKeyword: 'learn danish',
  whyLearn: [
    'Home of "hygge" (cozy contentment)',
    'Denmark consistently ranks happiest country',
    'Gateway to Scandinavian languages',
    'Simple grammar despite tricky pronunciation'
  ],
  couplesTip: 'Danish gave the world "hygge"—the art of cozy togetherness. What better language to learn as a couple than one built around warmth, candles, and quality time?'
}
```

### Hungarian (hu)

```typescript
{
  code: 'hu',
  speakers: '13 million',
  difficultyRating: 5,
  fsiHours: 1100,
  familyGroup: 'Uralic',
  primaryKeyword: 'learn hungarian',
  whyLearn: [
    'Unique language unrelated to neighbors',
    'Budapest is a romantic European gem',
    'Rich thermal bath and café culture',
    'Challenging but incredibly rewarding'
  ],
  couplesTip: 'Hungarian has 18 cases and is famously difficult—conquering it together is a serious bonding experience. Plus, Budapest is one of Europe\'s most romantic cities.'
}
```

### Turkish (tr)

```typescript
{
  code: 'tr',
  speakers: '80 million',
  difficultyRating: 4,
  fsiHours: 1100,
  familyGroup: 'Turkic',
  primaryKeyword: 'learn turkish',
  whyLearn: [
    'Bridge between Europe and Asia',
    'Turkey is a top tourist destination',
    'Agglutinative grammar is logical once understood',
    'Rich culinary and cultural traditions'
  ],
  couplesTip: 'Turkish has elaborate terms of endearment and a culture that deeply values hospitality and family. Learning it opens doors to one of the world\'s most welcoming cultures.'
}
```

### Romanian (ro)

```typescript
{
  code: 'ro',
  speakers: '26 million',
  difficultyRating: 2,
  fsiHours: 600,
  familyGroup: 'Romance',
  primaryKeyword: 'learn romanian',
  whyLearn: [
    'Romance language with unique character',
    'Romania has stunning castles and nature',
    'Growing tech hub in Eastern Europe',
    'Easier than it looks for Romance language speakers'
  ],
  couplesTip: 'Romanian blends Latin romance with Slavic influences, creating a unique sound. The country\'s fairy-tale castles make it a dreamy destination for couples.'
}
```

---

## Dynamic Content Mapping

### How to Link to Existing Articles

The hub page should dynamically pull article links based on category. Here's the mapping logic:

```typescript
// In the hub page component
const articlesByCategory = {
  phrases: articles.filter(a => a.data.category === 'phrases'),
  vocabulary: articles.filter(a => a.data.category === 'vocabulary'),
  grammar: articles.filter(a => a.data.category === 'grammar'),
  culture: articles.filter(a => a.data.category === 'culture'),
  situations: articles.filter(a => a.data.category === 'situations'),
  pronunciation: articles.filter(a => a.data.category === 'pronunciation'),
};

// Featured articles for roadmap (prioritize by difficulty)
const beginnerArticles = articles.filter(a => a.data.difficulty === 'beginner').slice(0, 3);
const intermediateArticles = articles.filter(a => a.data.difficulty === 'intermediate').slice(0, 3);
const advancedArticles = articles.filter(a => a.data.difficulty === 'advanced').slice(0, 3);
```

### Article Title Patterns to Look For

When building hub sections, link to articles matching these patterns:

| Section | Look for Article Titles Containing |
|---------|-----------------------------------|
| Essential Phrases | "how to say", "basic phrases", "greetings" |
| Grammar | "grammar", "cases", "verbs", "conjugation" |
| Culture | "culture", "traditions", "customs", "holidays" |
| Romance | "love", "romantic", "pet names", "terms of endearment" |
| Pronunciation | "pronunciation", "sounds", "alphabet" |

---

## Section Templates

### Section 1: Hero

```astro
<header class="bg-gradient-to-b from-accent/10 to-white">
  <div class="max-w-6xl mx-auto px-4 py-12">
    <div class="text-center max-w-3xl mx-auto">
      <span class="text-6xl mb-4 block">{languageData.flag}</span>
      <h1 class="text-4xl md:text-5xl font-black text-gray-900 mb-4">
        Learn {languageData.name}: Complete Guide for {nativeLanguageData.name} Speakers
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Everything you need to start your {languageData.name} learning journey—from essential phrases to cultural insights.
      </p>

      <!-- Stats Bar -->
      <div class="flex justify-center gap-8 text-sm">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{languageData.speakers}</div>
          <div class="text-gray-500">Speakers</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{languageData.fsiHours}h</div>
          <div class="text-gray-500">To Fluency</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-accent">
            {'⭐'.repeat(languageData.difficultyRating)}{'☆'.repeat(5 - languageData.difficultyRating)}
          </div>
          <div class="text-gray-500">Difficulty</div>
        </div>
      </div>
    </div>
  </div>
</header>
```

### Section 2: Why Learn

```astro
<section class="py-12 bg-white">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-6">
      Why Learn {languageData.name}?
    </h2>
    <div class="grid md:grid-cols-2 gap-4">
      {languageData.whyLearn.map((reason, i) => (
        <div class="flex gap-3 p-4 bg-gray-50 rounded-lg">
          <span class="text-2xl">{['🌍', '💼', '📚', '❤️', '🎯'][i]}</span>
          <p class="text-gray-700">{reason}</p>
        </div>
      ))}
    </div>

    {articlesByCategory.culture.length > 0 && (
      <p class="mt-6 text-gray-600">
        Dive deeper into {languageData.name} culture →
        <a href={`/learn/${articlesByCategory.culture[0].slug}/`} class="text-accent hover:underline ml-1">
          {articlesByCategory.culture[0].data.title}
        </a>
      </p>
    )}
  </div>
</section>
```

### Section 3: Learning Roadmap

```astro
<section class="py-12 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
      Your {languageData.name} Learning Roadmap
    </h2>

    <div class="relative">
      <!-- Vertical line -->
      <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-accent/20 hidden md:block"></div>

      <!-- Beginner -->
      <div class="relative flex gap-6 mb-8">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 z-10">
          <span class="text-2xl">🌱</span>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Beginner</h3>
          <p class="text-gray-600 mb-3">Master the basics: alphabet, greetings, and essential phrases.</p>
          <div class="flex flex-wrap gap-2">
            {beginnerArticles.map(article => (
              <a href={`/learn/${article.slug}/`} class="text-sm bg-white px-3 py-1 rounded-full border border-gray-200 hover:border-accent hover:text-accent transition-colors">
                {article.data.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <!-- Intermediate -->
      <div class="relative flex gap-6 mb-8">
        <div class="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 z-10">
          <span class="text-2xl">🌿</span>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Intermediate</h3>
          <p class="text-gray-600 mb-3">Build fluency with grammar patterns and expanded vocabulary.</p>
          <div class="flex flex-wrap gap-2">
            {intermediateArticles.map(article => (
              <a href={`/learn/${article.slug}/`} class="text-sm bg-white px-3 py-1 rounded-full border border-gray-200 hover:border-accent hover:text-accent transition-colors">
                {article.data.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <!-- Advanced -->
      <div class="relative flex gap-6">
        <div class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 z-10">
          <span class="text-2xl">🌳</span>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Advanced</h3>
          <p class="text-gray-600 mb-3">Perfect your skills with nuanced expressions and cultural depth.</p>
          <div class="flex flex-wrap gap-2">
            {advancedArticles.map(article => (
              <a href={`/learn/${article.slug}/`} class="text-sm bg-white px-3 py-1 rounded-full border border-gray-200 hover:border-accent hover:text-accent transition-colors">
                {article.data.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Section 4: Essential Phrases

```astro
<section class="py-12 bg-white">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      Essential {languageData.name} Phrases
    </h2>
    <p class="text-gray-600 mb-8">Start speaking from day one with these must-know phrases.</p>

    <div class="grid md:grid-cols-2 gap-4">
      {languageData.essentialPhrases.map(phrase => (
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div class="text-xl font-bold text-gray-900 mb-1">{phrase.phrase}</div>
          <div class="text-sm text-accent mb-2">/{phrase.pronunciation}/</div>
          <div class="text-gray-600">{phrase.translation}</div>
        </div>
      ))}
    </div>

    {articlesByCategory.phrases.length > 0 && (
      <div class="mt-8 text-center">
        <a href={`/learn/${articlesByCategory.phrases[0].slug}/`} class="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors">
          <span>See all {languageData.name} phrases</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    )}
  </div>
</section>
```

### Section 5: Grammar Overview

```astro
<section class="py-12 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      {languageData.name} Grammar: What to Expect
    </h2>
    <p class="text-gray-600 mb-8">
      Understanding the structure helps you learn faster. Here's what makes {languageData.name} unique.
    </p>

    <div class="bg-white rounded-xl p-6 border border-gray-200">
      <h3 class="font-bold text-gray-900 mb-4">Key Grammar Features</h3>
      <ul class="space-y-3">
        {languageData.grammarHighlights.map(highlight => (
          <li class="flex gap-3">
            <span class="text-accent">✓</span>
            <span class="text-gray-700">{highlight}</span>
          </li>
        ))}
      </ul>
    </div>

    {articlesByCategory.grammar.length > 0 && (
      <div class="mt-6 flex flex-wrap gap-3">
        <span class="text-gray-500">Grammar guides:</span>
        {articlesByCategory.grammar.slice(0, 4).map(article => (
          <a href={`/learn/${article.slug}/`} class="text-accent hover:underline">
            {article.data.title}
          </a>
        ))}
      </div>
    )}
  </div>
</section>
```

### Section 6: Cultural Insights

```astro
<section class="py-12 bg-white">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      {languageData.name} Cultural Tips
    </h2>
    <p class="text-gray-600 mb-8">
      Language is culture. Understanding these nuances will help you connect more authentically.
    </p>

    <div class="grid md:grid-cols-2 gap-4">
      {languageData.culturalTips.map((tip, i) => (
        <div class="flex gap-3 p-4 bg-accent/5 rounded-lg border border-accent/10">
          <span class="text-2xl">{['💡', '🤝', '🍽️', '🎉'][i]}</span>
          <p class="text-gray-700">{tip}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### Section 7: Common Mistakes

```astro
<section class="py-12 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      Common Mistakes {nativeLanguageData.name} Speakers Make
    </h2>
    <p class="text-gray-600 mb-8">
      Avoid these pitfalls to accelerate your learning.
    </p>

    <div class="space-y-4">
      {languageData.commonMistakes.map((item, i) => (
        <div class="bg-white rounded-lg p-5 border border-gray-200">
          <div class="flex gap-3 items-start">
            <span class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
              {i + 1}
            </span>
            <div>
              <h3 class="font-bold text-gray-900 mb-1">{item.mistake}</h3>
              <p class="text-gray-600">{item.explanation}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### Section 8: For Couples

```astro
<section class="py-12 bg-gradient-to-r from-pink-50 to-accent/10">
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-8">
      <span class="text-4xl mb-4 block">💕</span>
      <h2 class="text-3xl font-bold text-gray-900 mb-2">
        Learn {languageData.name} Together
      </h2>
      <p class="text-gray-600 max-w-2xl mx-auto">
        {languageData.couplesTip}
      </p>
    </div>

    <!-- Romantic phrases preview -->
    {languageData.essentialPhrases.filter(p =>
      p.translation.toLowerCase().includes('love')
    ).length > 0 && (
      <div class="bg-white rounded-xl p-6 max-w-md mx-auto text-center">
        <div class="text-2xl font-bold text-accent mb-1">
          {languageData.essentialPhrases.find(p => p.translation.toLowerCase().includes('love'))?.phrase}
        </div>
        <div class="text-gray-600">
          {languageData.essentialPhrases.find(p => p.translation.toLowerCase().includes('love'))?.translation}
        </div>
      </div>
    )}

    <div class="mt-8 text-center">
      <a href="/" class="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors">
        <span>Start Learning Together</span>
        <span>→</span>
      </a>
    </div>
  </div>
</section>
```

### Section 9: FAQ (with Schema)

```astro
<section class="py-12 bg-white">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
      Frequently Asked Questions
    </h2>

    <div class="space-y-4">
      {languageData.faqs.map(faq => (
        <details class="group bg-gray-50 rounded-lg">
          <summary class="p-5 cursor-pointer font-bold text-gray-900 flex justify-between items-center">
            {faq.question}
            <svg class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div class="px-5 pb-5 text-gray-600">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  </div>
</section>

<!-- FAQ Schema Markup -->
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": languageData.faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
})} />
```

---

## Implementation Checklist

### Phase 1: Data Structure (Week 1)
- [ ] Create `/blog/src/data/language-hub-data.ts`
- [ ] Add complete data for top 6 languages (PL, ES, FR, DE, IT, PT)
- [ ] Add abbreviated data for remaining 12 languages

### Phase 2: Components (Week 2)
- [ ] Create `HubHero.astro` component
- [ ] Create `WhyLearnSection.astro` component
- [ ] Create `LearningRoadmap.astro` component
- [ ] Create `PhrasesPreview.astro` component
- [ ] Create `GrammarOverview.astro` component
- [ ] Create `CultureTips.astro` component
- [ ] Create `CommonMistakes.astro` component
- [ ] Create `CouplesSection.astro` component
- [ ] Create `FAQSection.astro` component

### Phase 3: Page Integration (Week 3)
- [ ] Update `/learn/[nativeLang]/[targetLang]/index.astro`
- [ ] Import and compose all hub sections
- [ ] Add dynamic article linking
- [ ] Add JSON-LD schema for FAQ

### Phase 4: Testing & Launch
- [ ] Test all 51 language pair pages
- [ ] Verify internal links work
- [ ] Check mobile responsiveness
- [ ] Submit updated sitemap to Google Search Console

---

## Expected SEO Impact

| Metric | Before | After |
|--------|--------|-------|
| Words per hub page | ~50 | 1,500-2,500 |
| Target keywords per page | 1 | 8-12 |
| Internal links per page | 3-5 | 20-40 |
| FAQ schema pages | 0 | 51 |
| Long-tail keyword coverage | Low | High |

Based on the Twitter example (3x impressions with 32 hub pages), expect **2-4x impression growth** within 30-60 days of implementation.
