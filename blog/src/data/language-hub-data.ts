/**
 * Language Hub Data
 *
 * Comprehensive data for transforming language listing pages into SEO-optimized hub pages.
 * Each language has stats, content blocks, phrases, and FAQs.
 */

export interface LanguageHubData {
  code: string;
  name: string;
  nativeName: string;
  flag: string;

  // Stats
  speakers: string;
  countries: string[];
  difficultyRating: 1 | 2 | 3 | 4 | 5; // 1=easiest, 5=hardest for English speakers
  fsiHours: number; // FSI estimated hours to proficiency
  familyGroup: string;

  // SEO
  primaryKeyword: string;
  secondaryKeywords: string[];

  // Content blocks
  whyLearn: string[];
  grammarHighlights: string[];
  commonMistakes: { mistake: string; explanation: string }[];
  culturalTips: string[];
  couplesTip: string;

  // Phrases preview
  essentialPhrases: {
    phrase: string;
    pronunciation: string;
    translation: string;
  }[];

  // FAQ
  faqs: { question: string; answer: string }[];
}

export const LANGUAGE_HUB_DATA: Record<string, LanguageHubData> = {
  // ============================================
  // POLISH
  // ============================================
  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '\u{1F1F5}\u{1F1F1}',

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
      'learn polish online',
    ],

    whyLearn: [
      'Connect with 45 million native speakers worldwide',
      "Gateway to understanding other Slavic languages like Russian, Czech, and Ukrainian",
      'Rich literary tradition including Nobel Prize winners',
      "Growing business opportunities in Poland's expanding economy",
      'Deeply expressive language perfect for romance and poetry',
    ],

    grammarHighlights: [
      '7 grammatical cases that change word endings based on function',
      '3 genders (masculine, feminine, neuter) affecting adjectives and verbs',
      'Verb conjugation based on person, number, and aspect',
      'Flexible word order thanks to the case system',
      'Aspect system distinguishing perfective and imperfective verbs',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring noun genders',
        explanation:
          'Every Polish noun has a gender that affects adjectives and verb forms. "Dobry" (good) changes to "dobra" or "dobre" depending on the noun.',
      },
      {
        mistake: 'Mispronouncing "rz" and "\u017C"',
        explanation:
          'Both make a "zh" sound (like "measure"). Many learners incorrectly say "rz" as separate letters.',
      },
      {
        mistake: 'Using nominative case everywhere',
        explanation:
          'Polish requires different cases after prepositions. "W domu" (at home) uses locative, not nominative "dom".',
      },
      {
        mistake: 'Forgetting about verb aspects',
        explanation:
          'Polish verbs come in pairs (perfective/imperfective). Using the wrong aspect changes the meaning entirely.',
      },
      {
        mistake: 'Direct translation of English phrases',
        explanation:
          '"I am cold" becomes "Jest mi zimno" (It is cold to me), not a direct word-for-word translation.',
      },
    ],

    culturalTips: [
      'Name days (imieniny) are celebrated as much as birthdays',
      'Offering food three times before accepting is considered polite',
      'Always bring flowers (odd numbers only) when visiting someone',
      'Easter and Christmas traditions are elaborate family affairs',
    ],

    couplesTip:
      "Polish has incredibly expressive terms of endearment\u2014over 50 ways to call your partner something sweet. Learning Polish together opens a whole new vocabulary of affection.",

    essentialPhrases: [
      { phrase: 'Kocham ci\u0119', pronunciation: 'KO-ham cheh', translation: 'I love you' },
      { phrase: 'Dzie\u0144 dobry', pronunciation: 'jen DOB-ri', translation: 'Good day/Hello' },
      { phrase: 'Dzi\u0119kuj\u0119', pronunciation: 'jen-KOO-yeh', translation: 'Thank you' },
      {
        phrase: 'Przepraszam',
        pronunciation: 'psheh-PRAH-shahm',
        translation: "I'm sorry / Excuse me",
      },
      { phrase: 'Tak / Nie', pronunciation: 'tahk / nyeh', translation: 'Yes / No' },
      {
        phrase: 'Prosz\u0119',
        pronunciation: 'PRO-sheh',
        translation: "Please / You're welcome",
      },
      { phrase: 'Cze\u015B\u0107', pronunciation: 'cheshch', translation: 'Hi/Bye (informal)' },
      { phrase: 'Jak si\u0119 masz?', pronunciation: 'yahk sheh mahsh', translation: 'How are you?' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Polish?',
        answer:
          "The U.S. Foreign Service Institute estimates 1,100 class hours for English speakers to reach professional proficiency. With consistent daily practice, expect 2-3 years for conversational fluency. Basic phrases and tourist Polish can be learned in a few months.",
      },
      {
        question: 'Is Polish harder than German?',
        answer:
          "Polish is generally considered harder for English speakers. While German has 4 cases, Polish has 7. However, Polish pronunciation is more consistent once you learn the rules, and Polish doesn't have German's strict word order requirements.",
      },
      {
        question: "What's the best way to learn Polish?",
        answer:
          "Combine structured lessons with immersion. Start with basic phrases and pronunciation, then build vocabulary around topics you care about. Practice speaking with native speakers, watch Polish media with subtitles, and use spaced repetition for vocabulary.",
      },
      {
        question: 'Can I learn Polish if I know Russian?',
        answer:
          "Yes! Polish and Russian share Slavic roots with about 38% lexical similarity. You'll recognize many words and grammatical concepts. However, Polish uses the Latin alphabet and has different pronunciation patterns.",
      },
      {
        question: 'What are the hardest parts of Polish?',
        answer:
          'The 7-case system challenges most learners\u2014noun endings change based on grammatical function. Consonant clusters like "szcz" and "chrz\u0105szcz" require practice. Verb aspects (perfective/imperfective) also take time to master.',
      },
      {
        question: 'Is Polish useful to learn?',
        answer:
          "Absolutely. Polish is the EU's 6th most spoken language with 45 million speakers. Poland has a growing economy, rich culture, and large diaspora communities. It also helps with learning other Slavic languages.",
      },
    ],
  },

  // ============================================
  // SPANISH
  // ============================================
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Espa\u00F1ol',
    flag: '\u{1F1EA}\u{1F1F8}',

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
      'spanish language course',
    ],

    whyLearn: [
      'Second most spoken native language in the world with 500+ million speakers',
      'Official language in 21 countries across 4 continents',
      'One of the easiest languages for English speakers to learn',
      'Opens doors to rich literature, music, and cinema',
      'Increasingly valuable in business and healthcare in the US',
    ],

    grammarHighlights: [
      'Gendered nouns (masculine/feminine) with matching articles',
      'Verb conjugations for 6 persons with regular patterns',
      'Subjunctive mood for emotions, wishes, and uncertainty',
      'Two verbs for "to be" (ser vs estar) with distinct uses',
      'Relatively consistent pronunciation rules',
    ],

    commonMistakes: [
      {
        mistake: 'Confusing ser and estar',
        explanation:
          'Both mean "to be" but ser is for permanent traits, estar for temporary states. "Soy feliz" (I\'m a happy person) vs "Estoy feliz" (I\'m happy right now).',
      },
      {
        mistake: 'Forgetting noun-adjective agreement',
        explanation:
          'Adjectives must match the noun\'s gender and number. "Casa blanca" (white house) but "carro blanco" (white car).',
      },
      {
        mistake: 'Overusing subject pronouns',
        explanation:
          'Spanish verb conjugations show the subject, so "Yo tengo" is redundant\u2014just "Tengo" is natural.',
      },
      {
        mistake: 'False friends with English',
        explanation:
          '"Embarazada" means pregnant, not embarrassed. "Actual" means current, not actual. These false cognates cause confusion.',
      },
      {
        mistake: 'Ignoring the subjunctive mood',
        explanation:
          'The subjunctive is essential for expressing doubt, wishes, and emotions. "Espero que vengas" (I hope you come) requires subjunctive.',
      },
    ],

    culturalTips: [
      'Greetings often include kisses on the cheek (varies by country)',
      'Meals are social events\u2014dinner often starts at 9-10 PM in Spain',
      'Siesta culture affects business hours in some regions',
      'Family is central\u2014expect questions about your family early in relationships',
    ],

    couplesTip:
      'Spanish is the language of passion and romance. Its flowing sounds and expressive vocabulary make it perfect for couples\u2014plus, you can travel together to 21 Spanish-speaking countries.',

    essentialPhrases: [
      {
        phrase: 'Te quiero / Te amo',
        pronunciation: 'teh KYEH-roh / teh AH-moh',
        translation: 'I love you (casual/deep)',
      },
      { phrase: 'Hola', pronunciation: 'OH-lah', translation: 'Hello' },
      { phrase: 'Gracias', pronunciation: 'GRAH-syahs', translation: 'Thank you' },
      { phrase: 'Por favor', pronunciation: 'por fah-VOR', translation: 'Please' },
      {
        phrase: '\u00BFC\u00F3mo est\u00E1s?',
        pronunciation: 'KOH-moh ehs-TAHS',
        translation: 'How are you?',
      },
      { phrase: 'Lo siento', pronunciation: 'loh SYEHN-toh', translation: "I'm sorry" },
      { phrase: 'Buenos d\u00EDas', pronunciation: 'BWEH-nohs DEE-ahs', translation: 'Good morning' },
      { phrase: 'Me llamo...', pronunciation: 'meh YAH-moh', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Spanish?',
        answer:
          'Spanish is one of the easiest languages for English speakers. The FSI estimates 600-750 class hours for proficiency. With daily practice, you can hold basic conversations in 3-6 months and reach intermediate level in 1-2 years.',
      },
      {
        question: 'Should I learn Spanish from Spain or Latin America?',
        answer:
          'Both are valid! Latin American Spanish is more widely spoken (90% of speakers). The main differences are vocabulary, some pronunciation (Spain\'s "th" sound), and use of "vosotros." Start with one, then adapt\u2014they\'re mutually intelligible.',
      },
      {
        question: 'Is Spanish easier than French?',
        answer:
          "For most English speakers, yes. Spanish pronunciation is more consistent, and the spelling is more phonetic. Both share Latin roots and similar grammar structures, but Spanish has fewer silent letters and irregular verbs.",
      },
      {
        question: "What's the hardest part of Spanish?",
        answer:
          "The subjunctive mood challenges most learners\u2014it's used for uncertainty, emotions, and wishes in ways English doesn't require. Ser vs estar and gendered nouns also take practice, but consistent exposure helps.",
      },
      {
        question: 'Can I become fluent in Spanish in a year?',
        answer:
          'Conversational fluency is achievable in a year with intensive study (2+ hours daily) and immersion. Full professional fluency typically takes 2-3 years. Living in a Spanish-speaking country accelerates progress significantly.',
      },
      {
        question: 'Is Duolingo enough to learn Spanish?',
        answer:
          "Duolingo builds vocabulary and basic grammar but isn't sufficient alone. Combine it with conversation practice, listening to native content, and structured grammar study for best results.",
      },
    ],
  },

  // ============================================
  // FRENCH
  // ============================================
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Fran\u00E7ais',
    flag: '\u{1F1EB}\u{1F1F7}',

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
      'french language course',
    ],

    whyLearn: [
      'Official language in 29 countries on 5 continents',
      'Language of diplomacy, cuisine, fashion, and art',
      '30% of English vocabulary has French origins',
      'Second most studied language in the world',
      'Gateway to other Romance languages',
    ],

    grammarHighlights: [
      'Gendered nouns with articles (le/la/les)',
      'Verb conjugations with many irregular verbs',
      'Liaison\u2014connecting words with sounds',
      'Formal (vous) vs informal (tu) address',
      'Complex past tenses (pass\u00E9 compos\u00E9, imparfait)',
    ],

    commonMistakes: [
      {
        mistake: 'Pronouncing silent letters',
        explanation:
          'French has many silent endings. "Petit" is "puh-TEE" not "puh-TEET." Final consonants are usually silent unless followed by a vowel.',
      },
      {
        mistake: 'Forgetting liaisons',
        explanation:
          'French links words together. "Les amis" sounds like "lay-zah-MEE" with the S connecting to the vowel.',
      },
      {
        mistake: 'Mixing up tu and vous',
        explanation:
          'Using "tu" with strangers or elders is rude. When in doubt, use "vous." Wait for the French speaker to suggest "tu."',
      },
      {
        mistake: 'Direct translation of English phrases',
        explanation:
          '"I am 25 years old" becomes "J\'ai 25 ans" (I have 25 years), not "Je suis 25 ans."',
      },
      {
        mistake: 'Ignoring noun genders',
        explanation:
          'Every noun has a gender that affects articles and adjectives. "La table" (feminine) but "le livre" (masculine). Memorize nouns with their articles.',
      },
    ],

    culturalTips: [
      'Always greet with "Bonjour" before any interaction',
      'Cheek kisses (la bise) vary by region\u20142 to 4 kisses',
      'Meals are events\u2014lunch breaks can be 2 hours',
      'Speaking even basic French is deeply appreciated',
    ],

    couplesTip:
      "French is the language of love for good reason. Its melodic sounds and romantic vocabulary make it perfect for couples. Plus, imagine planning trips to Paris, the French Riviera, or Quebec together.",

    essentialPhrases: [
      { phrase: "Je t'aime", pronunciation: 'zhuh TEM', translation: 'I love you' },
      { phrase: 'Bonjour', pronunciation: 'bohn-ZHOOR', translation: 'Hello/Good day' },
      { phrase: 'Merci', pronunciation: 'mehr-SEE', translation: 'Thank you' },
      { phrase: "S'il vous pla\u00EEt", pronunciation: 'seel voo PLEH', translation: 'Please' },
      {
        phrase: 'Comment allez-vous?',
        pronunciation: 'koh-mahn tah-lay VOO',
        translation: 'How are you? (formal)',
      },
      { phrase: 'Excusez-moi', pronunciation: 'eks-kew-zay MWAH', translation: 'Excuse me' },
      { phrase: 'Au revoir', pronunciation: 'oh ruh-VWAHR', translation: 'Goodbye' },
      { phrase: "Je m'appelle...", pronunciation: 'zhuh mah-PEL', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn French?',
        answer:
          'The FSI estimates 600-750 hours for English speakers to reach proficiency. With daily practice, basic conversation takes 6-12 months. Intermediate fluency typically requires 1-2 years of consistent study.',
      },
      {
        question: 'Is French harder than Spanish?',
        answer:
          'Slightly. French has more silent letters, liaison rules, and nasal sounds that challenge English speakers. However, both are Category I languages (easiest for English speakers), and French vocabulary is closer to English.',
      },
      {
        question: "What's the hardest part of French?",
        answer:
          "Pronunciation and listening comprehension challenge most learners. Silent letters, liaisons, and speaking speed make French sound different than it looks. Gender memorization and verb conjugations also require time.",
      },
      {
        question: 'Should I learn Parisian French or Canadian French?',
        answer:
          "Start with standard (Parisian) French\u2014it's more widely understood and has more learning resources. Canadian French (Qu\u00E9b\u00E9cois) has different vocabulary and accent but shares the same grammar. You can adapt later.",
      },
      {
        question: 'Is French useful to learn?',
        answer:
          "Very. French is spoken on 5 continents, is an official UN/EU language, and is the second most studied language globally. It's valuable for careers in diplomacy, fashion, cuisine, and international business.",
      },
      {
        question: 'Can I learn French and Spanish at the same time?',
        answer:
          "It's possible but can cause confusion for beginners due to similarities. Better to reach intermediate level in one first, then start the other. The shared Latin roots will then help rather than confuse.",
      },
    ],
  },

  // ============================================
  // GERMAN
  // ============================================
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '\u{1F1E9}\u{1F1EA}',

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
      'german language course',
    ],

    whyLearn: [
      'Most spoken native language in Europe (95+ million in EU)',
      "Germany has the world's 4th largest economy",
      'Shares roots with English\u2014many recognizable words',
      'Free university education in Germany (even for foreigners)',
      'Rich philosophical, scientific, and musical heritage',
    ],

    grammarHighlights: [
      '4 grammatical cases (nominative, accusative, dative, genitive)',
      '3 genders with articles (der/die/das)',
      'Verb-second rule in main clauses',
      'Separable prefix verbs that split in sentences',
      'Compound nouns creating famously long words',
    ],

    commonMistakes: [
      {
        mistake: 'Wrong word order',
        explanation:
          'German has strict verb placement. In main clauses, the verb is always second. In subordinate clauses, it goes to the end. "Ich wei\u00DF, dass er kommt" (I know that he comes).',
      },
      {
        mistake: 'Mixing up der/die/das',
        explanation:
          'Noun genders seem arbitrary and must be memorized. "Das M\u00E4dchen" (the girl) is neuter, not feminine! Always learn nouns with their article.',
      },
      {
        mistake: 'Forgetting case changes',
        explanation:
          'Articles and adjectives change based on case. "Der Mann" (nominative) becomes "den Mann" (accusative). The case system affects articles, adjectives, and pronouns.',
      },
      {
        mistake: 'Mispronouncing umlauts',
        explanation:
          '\u00C4, \u00F6, \u00FC are distinct sounds, not decorative. "Sch\u00F6n" (beautiful) with proper \u00F6 sounds different from "schon" (already).',
      },
      {
        mistake: 'Forgetting separable prefixes',
        explanation:
          'Some verbs split in sentences. "Aufstehen" (to get up) becomes "Ich stehe auf" (I get up). The prefix goes to the end.',
      },
    ],

    culturalTips: [
      'Punctuality is extremely important\u2014being late is rude',
      "Germans often speak directly; it's honesty, not rudeness",
      'Formal "Sie" is used in professional and new relationships',
      'Sunday is quiet\u2014shops are closed, noise is minimized',
    ],

    couplesTip:
      'German has wonderfully specific words for emotions English lacks\u2014like "Fernweh" (longing to travel) and "Geborgenheit" (feeling of security with someone). Learning German together builds a unique shared vocabulary.',

    essentialPhrases: [
      { phrase: 'Ich liebe dich', pronunciation: 'ikh LEE-buh dikh', translation: 'I love you' },
      { phrase: 'Guten Tag', pronunciation: 'GOO-ten tahk', translation: 'Good day' },
      { phrase: 'Danke', pronunciation: 'DAHN-kuh', translation: 'Thank you' },
      { phrase: 'Bitte', pronunciation: 'BIT-uh', translation: "Please / You're welcome" },
      {
        phrase: 'Wie geht es dir?',
        pronunciation: 'vee gayt es deer',
        translation: 'How are you? (informal)',
      },
      {
        phrase: 'Entschuldigung',
        pronunciation: 'ent-SHOOL-di-goong',
        translation: 'Excuse me / Sorry',
      },
      { phrase: 'Auf Wiedersehen', pronunciation: 'owf VEE-der-zay-en', translation: 'Goodbye' },
      { phrase: 'Ich hei\u00DFe...', pronunciation: 'ikh HY-suh', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn German?',
        answer:
          'The FSI estimates 900 hours for proficiency\u2014longer than Spanish or French but shorter than Polish or Russian. With consistent study, expect basic conversation in 6-12 months and intermediate fluency in 2-3 years.',
      },
      {
        question: 'Is German harder than French?',
        answer:
          'In different ways. German has harder grammar (4 cases, 3 genders, strict word order) but more phonetic pronunciation. French pronunciation challenges most learners more. Both are achievable for English speakers.',
      },
      {
        question: "What's the hardest part of German?",
        answer:
          'The case system challenges most learners\u2014articles and adjectives change based on grammatical function. Word order rules, especially verb placement, also require significant practice. Gender memorization never fully ends.',
      },
      {
        question: 'Is German useful for jobs?',
        answer:
          "Yes, especially in engineering, automotive, finance, and science. Germany has Europe's largest economy. German is also valuable for philosophy, classical music, and academic research in many fields.",
      },
      {
        question: 'Is German similar to English?',
        answer:
          'Yes! Both are Germanic languages. Many words are recognizable: "Wasser" (water), "Haus" (house), "Hand" (hand). English grammar lost cases that German retained, but the word roots often overlap.',
      },
      {
        question: 'Can I study in Germany for free?',
        answer:
          "Yes! Public universities in Germany have no tuition fees for international students (small semester fees of \u20AC100-350 apply). You'll need German proficiency (usually B2-C1 level) for German-taught programs.",
      },
    ],
  },

  // ============================================
  // ITALIAN
  // ============================================
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '\u{1F1EE}\u{1F1F9}',

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
      'italian language course',
    ],

    whyLearn: [
      'Language of art, music, fashion, and cuisine',
      "Most phonetic Romance language\u2014reads as it's written",
      'Gateway to understanding opera and classical music',
      "Italy is the world's 5th most visited country",
      'Strong diaspora communities worldwide',
    ],

    grammarHighlights: [
      'Gendered nouns (masculine/feminine)',
      'Verb conjugations for 6 persons',
      'Double consonants affect pronunciation and meaning',
      'Formal "Lei" vs informal "tu"',
      'Consistent pronunciation rules',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring double consonants',
        explanation:
          '"Penna" (pen) and "pena" (pain) differ only in the double N. Double consonants are held longer\u2014it\'s not optional.',
      },
      {
        mistake: 'Using subject pronouns too much',
        explanation:
          'Like Spanish, Italian verb endings show the subject. "Io parlo" is emphatic\u2014normally just "Parlo" (I speak).',
      },
      {
        mistake: 'Wrong gender agreements',
        explanation:
          'Adjectives must match noun gender and number. "Ragazzo alto" (tall boy) but "ragazza alta" (tall girl).',
      },
      {
        mistake: 'Mispronouncing "c" and "g"',
        explanation:
          'Before e/i, C sounds like "ch" and G sounds like "j." "Ciao" is "chow," "gelato" is "jeh-LAH-toh."',
      },
      {
        mistake: 'Forgetting articles with possessives',
        explanation:
          'Unlike English, Italian uses articles with possessives: "la mia casa" (the my house), except with singular family members.',
      },
    ],

    culturalTips: [
      'Hand gestures are essential to Italian communication',
      'Coffee culture has strict rules\u2014cappuccino only in the morning',
      'Lunch is the main meal; dinner is often lighter',
      '"La bella figura" (making a good impression) matters greatly',
    ],

    couplesTip:
      "Italian is considered one of the most romantic languages in the world. Its musical quality and expressive vocabulary make everything sound beautiful\u2014perfect for couples who appreciate art, food, and passion.",

    essentialPhrases: [
      { phrase: 'Ti amo', pronunciation: 'tee AH-moh', translation: 'I love you' },
      { phrase: 'Ciao', pronunciation: 'chow', translation: 'Hi/Bye (informal)' },
      { phrase: 'Grazie', pronunciation: 'GRAH-tsyeh', translation: 'Thank you' },
      { phrase: 'Per favore', pronunciation: 'pehr fah-VOH-reh', translation: 'Please' },
      {
        phrase: 'Come stai?',
        pronunciation: 'KOH-meh stai',
        translation: 'How are you? (informal)',
      },
      { phrase: 'Mi scusi', pronunciation: 'mee SKOO-zee', translation: 'Excuse me (formal)' },
      { phrase: 'Arrivederci', pronunciation: 'ah-ree-veh-DEHR-chee', translation: 'Goodbye' },
      { phrase: 'Mi chiamo...', pronunciation: 'mee KYAH-moh', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Italian?',
        answer:
          'Italian is among the easiest languages for English speakers. The FSI estimates 600-750 hours for proficiency. Basic conversation is achievable in 3-6 months; intermediate fluency typically takes 1-2 years.',
      },
      {
        question: 'Is Italian easier than Spanish?',
        answer:
          "They're comparable. Italian has slightly more consistent pronunciation, while Spanish is more widely spoken (more practice opportunities). Both are Category I languages for English speakers. Choose based on your interests.",
      },
      {
        question: 'Is Italian useful to learn?',
        answer:
          "For culture, absolutely\u2014Italian unlocks art, opera, fashion, and cuisine at a deeper level. For business, it's valuable in design, automotive, and food industries. Italy is also a top tourist destination.",
      },
      {
        question: "What's the hardest part of Italian?",
        answer:
          'Double consonants and their effect on meaning challenge most learners. The subjunctive mood, while less used than in Spanish, also requires practice. Verb conjugations have many irregular forms to memorize.',
      },
      {
        question: 'Can I learn Italian from watching movies?',
        answer:
          "Movies help with listening skills and cultural context but shouldn't be your only method. Combine them with structured grammar study, vocabulary practice, and conversation. Start with subtitles in Italian, not English.",
      },
      {
        question: 'Is Italian dying out?',
        answer:
          "No. While Italian has fewer speakers than Spanish or French, it's stable as Italy's official language and is actively taught worldwide. It's the 4th most studied language globally.",
      },
    ],
  },

  // ============================================
  // PORTUGUESE
  // ============================================
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Portugu\u00EAs',
    flag: '\u{1F1F5}\u{1F1F9}',

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
      'portuguese language course',
    ],

    whyLearn: [
      '6th most spoken language in the world (260+ million)',
      "Brazil has the world's 9th largest economy",
      'Growing importance in business and diplomacy',
      'Rich musical traditions (Bossa Nova, Fado, Samba)',
      'Often overlooked\u2014fewer learners means you stand out',
    ],

    grammarHighlights: [
      'Gendered nouns like other Romance languages',
      'Personal infinitive (unique to Portuguese)',
      'Nasal vowels (\u00E3o, \u00E3e, \u00F5e)',
      'Two verbs for "to be" (ser/estar)',
      'Formal voc\u00EA vs informal tu',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring nasal sounds',
        explanation:
          'The tildes (\u00E3, \u00F5) indicate nasal vowels. "N\u00E3o" (no) and "nao" sound completely different. Practice nasal sounds early.',
      },
      {
        mistake: 'Using Spanish pronunciation',
        explanation:
          'Portuguese sounds different despite similar spelling. "De" is "jee" in Brazilian Portuguese, not "deh." Many vowels reduce to almost nothing.',
      },
      {
        mistake: 'Confusing ser and estar',
        explanation:
          'Like Spanish, Portuguese has two "to be" verbs. "Sou feliz" (I\'m a happy person) vs "Estou feliz" (I\'m happy now).',
      },
      {
        mistake: 'Forgetting contractions',
        explanation:
          'Portuguese contracts prepositions with articles: "de + o = do," "em + a = na." These are mandatory, not optional.',
      },
      {
        mistake: 'Mixing Brazilian and European Portuguese',
        explanation:
          'Vocabulary, pronunciation, and even grammar differ. "\u00D4nibus" (Brazil) vs "autocarro" (Portugal) for bus. Pick one variety to start.',
      },
    ],

    culturalTips: [
      'Brazilians are warm and physical\u2014expect hugs and closeness',
      'Portuguese culture is more reserved but equally hospitable',
      '"Saudade" expresses a uniquely Portuguese longing/nostalgia',
      'Food is central to socializing in both cultures',
    ],

    couplesTip:
      'Portuguese has "saudade"\u2014a word for the deep longing you feel for someone you love. Learning Portuguese together gives you access to one of the world\'s most emotionally expressive languages.',

    essentialPhrases: [
      {
        phrase: 'Eu te amo',
        pronunciation: 'eh-oo chee AH-moo',
        translation: 'I love you (Brazilian)',
      },
      { phrase: 'Ol\u00E1', pronunciation: 'oh-LAH', translation: 'Hello' },
      {
        phrase: 'Obrigado/a',
        pronunciation: 'oh-bree-GAH-doo/dah',
        translation: 'Thank you (m/f)',
      },
      { phrase: 'Por favor', pronunciation: 'por fah-VOR', translation: 'Please' },
      {
        phrase: 'Tudo bem?',
        pronunciation: 'TOO-doo beng',
        translation: 'How are you? / All good?',
      },
      { phrase: 'Desculpa', pronunciation: 'desh-KOOL-pah', translation: 'Sorry' },
      { phrase: 'Tchau', pronunciation: 'chow', translation: 'Bye (informal)' },
      { phrase: 'Meu nome \u00E9...', pronunciation: 'meh-oo NOH-mee eh', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Portuguese?',
        answer:
          'The FSI estimates 600-750 hours for proficiency\u2014similar to Spanish and French. Basic conversation is achievable in 6-12 months with regular practice. Brazilian Portuguese is often considered slightly easier due to clearer pronunciation.',
      },
      {
        question: 'Should I learn Brazilian or European Portuguese?',
        answer:
          "Brazilian Portuguese has more speakers (210 million vs 10 million) and more learning resources. European Portuguese is more similar to other European languages. Choose based on your goals\u2014they're mutually intelligible.",
      },
      {
        question: 'Is Portuguese harder than Spanish?',
        answer:
          'Slightly. Portuguese pronunciation is more complex with nasal sounds and vowel reductions. However, if you know Spanish, Portuguese is much easier\u2014expect to understand 90% of written Portuguese immediately.',
      },
      {
        question: 'Can Spanish speakers understand Portuguese?',
        answer:
          'Partially. Written Portuguese is highly understandable for Spanish speakers (70-90%). Spoken Portuguese is harder due to different pronunciation. Portuguese speakers generally understand Spanish better than vice versa.',
      },
      {
        question: 'Is Portuguese useful for business?',
        answer:
          "Increasingly so. Brazil's large economy and growing African markets (Angola, Mozambique) make Portuguese valuable. It's an official language in 9 countries and one of the EU's official languages.",
      },
      {
        question: 'Why does Portuguese sound so different from Spanish?',
        answer:
          'Portuguese has more vowel sounds, nasal vowels, and vowel reduction (unstressed vowels nearly disappear). It also has different rhythm\u2014more syllable-timed like French, while Spanish is more evenly paced.',
      },
    ],
  },

  // ============================================
  // RUSSIAN
  // ============================================
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
    flag: '\u{1F1F7}\u{1F1FA}',

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
      'russian language course',
    ],

    whyLearn: [
      '8th most spoken language in the world',
      'Key language for science, literature, and space exploration',
      'Opens doors to understanding other Slavic languages',
      'Rich literary tradition (Tolstoy, Dostoevsky, Chekhov)',
      'Strategic importance in international relations',
    ],

    grammarHighlights: [
      'Cyrillic alphabet (33 letters)',
      '6 grammatical cases',
      'Verb aspects (perfective/imperfective)',
      'No articles (a, the)',
      'Flexible word order due to case system',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring case endings',
        explanation:
          'Russian has 6 cases that change word endings. "\u041A\u043D\u0438\u0433\u0430" (book, nominative) becomes "\u043A\u043D\u0438\u0433\u0443" (accusative), "\u043A\u043D\u0438\u0433\u0438" (genitive). Cases are essential for meaning.',
      },
      {
        mistake: 'Wrong stress placement',
        explanation:
          'Russian stress is unpredictable and changes word meaning. "\u0417\u0430\u043C\u043E\u043A" (ZAH-mok) means castle, but "\u0437\u0430\u043C\u043E\u043A" (zah-MOK) means lock. Stress must be memorized.',
      },
      {
        mistake: 'Confusing verb aspects',
        explanation:
          'Every Russian verb has two aspects. "\u0427\u0438\u0442\u0430\u0442\u044C" (to read, ongoing) vs "\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C" (to read, completed). Using the wrong aspect changes the meaning significantly.',
      },
      {
        mistake: 'Pronouncing Cyrillic like Latin',
        explanation:
          'Some Cyrillic letters look like Latin but sound different. "\u0420" is "R" not "P," "\u041D" is "N" not "H," "\u0412" is "V" not "B."',
      },
      {
        mistake: 'Adding articles',
        explanation:
          'Russian has no articles. Don\'t translate "the book" as two words\u2014just "\u043A\u043D\u0438\u0433\u0430." Context shows definiteness.',
      },
    ],

    culturalTips: [
      'Russians may seem reserved initially but are warm once you know them',
      'Bringing flowers? Always odd numbers (even numbers are for funerals)',
      'Refusing food or drink three times before accepting is polite',
      "Smiling at strangers is uncommon\u2014it doesn't mean unfriendliness",
    ],

    couplesTip:
      'Russian has incredibly tender diminutives\u2014you can add affectionate endings to almost any word, including your partner\'s name. Learning Russian together opens up a world of unique expressions of love.',

    essentialPhrases: [
      {
        phrase: '\u042F \u0442\u0435\u0431\u044F \u043B\u044E\u0431\u043B\u044E',
        pronunciation: 'ya tee-BYA lyoo-BLYOO',
        translation: 'I love you',
      },
      {
        phrase: '\u041F\u0440\u0438\u0432\u0435\u0442',
        pronunciation: 'pree-VYET',
        translation: 'Hi (informal)',
      },
      {
        phrase: '\u0421\u043F\u0430\u0441\u0438\u0431\u043E',
        pronunciation: 'spah-SEE-bah',
        translation: 'Thank you',
      },
      {
        phrase: '\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430',
        pronunciation: 'pah-ZHAHL-stah',
        translation: "Please / You're welcome",
      },
      {
        phrase: '\u041A\u0430\u043A \u0434\u0435\u043B\u0430?',
        pronunciation: 'kahk dee-LAH',
        translation: 'How are you?',
      },
      {
        phrase: '\u0418\u0437\u0432\u0438\u043D\u0438\u0442\u0435',
        pronunciation: 'eez-vee-NEE-tyeh',
        translation: 'Excuse me / Sorry',
      },
      {
        phrase: '\u0414\u043E \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F',
        pronunciation: 'dah svee-DAH-nyah',
        translation: 'Goodbye',
      },
      {
        phrase: '\u041C\u0435\u043D\u044F \u0437\u043E\u0432\u0443\u0442...',
        pronunciation: 'mee-NYA zah-VOOT',
        translation: 'My name is...',
      },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Russian?',
        answer:
          'The FSI estimates 1,100 hours for proficiency\u2014about 2-3 years of consistent study. The Cyrillic alphabet takes 2-4 weeks to learn. Basic conversation is achievable in 6-12 months; intermediate fluency takes 2-3 years.',
      },
      {
        question: 'Is Russian hard to learn?',
        answer:
          "Russian is challenging but achievable. The Cyrillic alphabet is learnable in weeks. Cases and verb aspects require significant practice. However, pronunciation is more consistent than English, and there are no articles to worry about.",
      },
      {
        question: 'Should I learn the alphabet first?',
        answer:
          "Yes, absolutely. Spend 2-4 weeks mastering Cyrillic before anything else. It's not as hard as it looks\u2014many letters are similar to Latin or Greek. This foundation makes everything else easier.",
      },
      {
        question: 'Is Russian harder than Polish?',
        answer:
          "They're similarly difficult. Russian has Cyrillic (extra learning curve) but 6 cases; Polish has 7 cases but uses Latin script. Both have complex grammar and verb aspects. Russian has more speakers and resources.",
      },
      {
        question: 'Can I learn Russian if I know Polish?',
        answer:
          'Yes! Polish and Russian share Slavic roots with significant vocabulary overlap. The case system concepts transfer directly. Main challenge is learning Cyrillic and adjusting to different pronunciation patterns.',
      },
      {
        question: 'Is Russian useful to learn?',
        answer:
          "Russian opens access to 255+ million speakers across many countries. It's valuable for careers in translation, international relations, aerospace, and energy. It's also essential for Russian literature, music, and film.",
      },
    ],
  },

  // ============================================
  // UKRAINIAN
  // ============================================
  uk: {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: '\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430',
    flag: '\u{1F1FA}\u{1F1E6}',

    speakers: '45 million',
    countries: ['Ukraine', 'diaspora worldwide'],
    difficultyRating: 4,
    fsiHours: 1100,
    familyGroup: 'Slavic',

    primaryKeyword: 'learn ukrainian',
    secondaryKeywords: [
      'ukrainian for beginners',
      'learn ukrainian online',
      'ukrainian language',
      'how to speak ukrainian',
      'ukrainian lessons',
    ],

    whyLearn: [
      'Show solidarity and connect with Ukrainian culture',
      'Distinct language from Russian with unique beauty',
      'Growing diaspora communities worldwide',
      'Rich folk traditions and modern culture',
      'Increasingly important in international context',
    ],

    grammarHighlights: [
      'Cyrillic alphabet (33 letters, different from Russian)',
      '7 grammatical cases',
      'Verb aspects like other Slavic languages',
      'Vocative case still actively used',
      'Melodic, song-like intonation',
    ],

    commonMistakes: [
      {
        mistake: 'Confusing Ukrainian with Russian',
        explanation:
          "They're distinct languages with different vocabulary, pronunciation, and some grammar. Ukrainian has softer sounds and different letters (\u0456, \u0457, \u0454, \u0491).",
      },
      {
        mistake: 'Wrong case endings',
        explanation:
          'Ukrainian has 7 cases affecting all nouns, adjectives, and pronouns. The vocative case is used when addressing someone directly.',
      },
      {
        mistake: 'Mispronouncing \u0433',
        explanation:
          'Ukrainian \u0433 is a voiced "h" sound, not a hard "g" like in Russian. This is one of the most distinctive differences.',
      },
      {
        mistake: 'Using Russian words',
        explanation:
          "Many words differ significantly. \"Thank you\" is \"\u0414\u044F\u043A\u0443\u044E\" (dyakuyu) in Ukrainian, not \"\u0441\u043F\u0430\u0441\u0438\u0431\u043E.\"",
      },
      {
        mistake: 'Ignoring the vocative case',
        explanation:
          'Unlike Russian, Ukrainian actively uses vocative for addressing people. "\u041C\u0430\u0440\u0456\u044F" becomes "\u041C\u0430\u0440\u0456\u0454" when calling someone.',
      },
    ],

    culturalTips: [
      'Ukrainians deeply value their distinct cultural identity',
      'Traditional embroidery (vyshyvanka) is a source of national pride',
      'Hospitality is central\u2014guests are treated generously',
      'Folk music and dance traditions remain vibrant',
    ],

    couplesTip:
      "Ukrainian is known for its melodic, song-like quality. Learning it together connects you to a resilient culture with deep traditions of love, family, and beautiful folk songs.",

    essentialPhrases: [
      {
        phrase: '\u042F \u0442\u0435\u0431\u0435 \u043A\u043E\u0445\u0430\u044E',
        pronunciation: 'ya teh-BEH ko-HA-yu',
        translation: 'I love you',
      },
      {
        phrase: '\u041F\u0440\u0438\u0432\u0456\u0442',
        pronunciation: 'pry-VEET',
        translation: 'Hello (informal)',
      },
      {
        phrase: '\u0414\u044F\u043A\u0443\u044E',
        pronunciation: 'DYA-koo-yu',
        translation: 'Thank you',
      },
      {
        phrase: '\u0411\u0443\u0434\u044C \u043B\u0430\u0441\u043A\u0430',
        pronunciation: 'bood\' LAHS-kah',
        translation: 'Please',
      },
      {
        phrase: '\u042F\u043A \u0441\u043F\u0440\u0430\u0432\u0438?',
        pronunciation: 'yak SPRAH-vy',
        translation: 'How are you?',
      },
      {
        phrase: '\u0412\u0438\u0431\u0430\u0447\u0442\u0435',
        pronunciation: 'vy-BAHCH-teh',
        translation: 'Excuse me / Sorry',
      },
      {
        phrase: '\u0414\u043E \u043F\u043E\u0431\u0430\u0447\u0435\u043D\u043D\u044F',
        pronunciation: 'do po-BAH-chen-nya',
        translation: 'Goodbye',
      },
      {
        phrase: '\u041C\u0435\u043D\u0435 \u0437\u0432\u0430\u0442\u0438...',
        pronunciation: 'meh-NEH ZVAH-ty',
        translation: 'My name is...',
      },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Ukrainian?',
        answer:
          'Similar to Russian, the FSI estimates about 1,100 hours for proficiency. If you know Russian or Polish, you can learn faster due to shared Slavic roots. Basic conversation is achievable in 6-12 months.',
      },
      {
        question: 'Is Ukrainian similar to Russian?',
        answer:
          "They share Slavic roots and Cyrillic script, but they're distinct languages. Ukrainian has unique letters, different vocabulary (about 62% lexical similarity), and softer pronunciation. Think of them like Spanish and Portuguese.",
      },
      {
        question: 'Should I learn Ukrainian or Russian?',
        answer:
          "Choose based on your goals. Ukrainian connects you to Ukrainian culture and people specifically. If you want to communicate in Ukraine, Ukrainian is increasingly preferred and appreciated. Russian is more widely spoken globally.",
      },
      {
        question: 'Is the Ukrainian alphabet hard?',
        answer:
          "If you know Russian Cyrillic, Ukrainian is easy\u2014just learn the few different letters (\u0456, \u0457, \u0454, \u0491). From scratch, expect 2-4 weeks to read comfortably. The alphabet is phonetic, so reading follows pronunciation rules.",
      },
      {
        question: 'Can Russians understand Ukrainian?',
        answer:
          'Partially. Due to historical contact, many Russians understand basic Ukrainian, especially written. However, unique vocabulary and pronunciation can cause confusion. Ukrainians typically understand Russian better than vice versa.',
      },
      {
        question: 'Where can I practice Ukrainian?',
        answer:
          "Online communities have grown significantly. Try language exchange apps, Ukrainian YouTube channels, and diaspora cultural centers. Many Ukrainians appreciate foreigners learning their language and are happy to help.",
      },
    ],
  },

  // ============================================
  // CZECH
  // ============================================
  cs: {
    code: 'cs',
    name: 'Czech',
    nativeName: '\u010Ce\u0161tina',
    flag: '\u{1F1E8}\u{1F1FF}',

    speakers: '13 million',
    countries: ['Czech Republic', 'Slovakia (understood)'],
    difficultyRating: 4,
    fsiHours: 1100,
    familyGroup: 'Slavic',

    primaryKeyword: 'learn czech',
    secondaryKeywords: [
      'czech for beginners',
      'learn czech online',
      'czech language',
      'how to speak czech',
      'czech lessons',
    ],

    whyLearn: [
      'Gateway to Central European culture and history',
      'Prague is a major tourist and business hub',
      'Rich beer and culinary traditions',
      'Easier Slavic language (no Cyrillic alphabet)',
      'Mutually intelligible with Slovak',
    ],

    grammarHighlights: [
      '7 grammatical cases',
      'No Cyrillic\u2014uses Latin alphabet with diacritics',
      'Unique \u0159 sound found almost only in Czech',
      'Complex consonant clusters',
      'Formal/informal distinctions (vy/ty)',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring the 7 cases',
        explanation:
          "Czech cases change word endings dramatically. Learning patterns by declension type helps, but memorization is unavoidable.",
      },
      {
        mistake: 'Mispronouncing \u0159',
        explanation:
          "This sound (like \u017E and r combined) exists almost only in Czech. It takes practice but is essential for being understood.",
      },
      {
        mistake: 'Wrong vowel length',
        explanation:
          'Accents (\u00E1, \u00E9, \u00ED, \u00F3, \u00FA) mark long vowels. "Rada" (council) vs "r\u00E1da" (glad) have different meanings.',
      },
      {
        mistake: 'Using ty with strangers',
        explanation:
          '"Ty" is informal\u2014use "vy" with strangers, elders, and in professional settings until invited to use "ty."',
      },
      {
        mistake: 'Assuming Slovak knowledge',
        explanation:
          "Czech and Slovak are similar but not identical. Don't assume words are the same\u2014there are false friends.",
      },
    ],

    culturalTips: [
      'Czech Republic has the highest beer consumption per capita globally',
      "Prague's history spans over 1,000 years",
      'Czechs tend to be reserved but warm up over time',
      'Removing shoes when entering homes is expected',
    ],

    couplesTip:
      "Czech has charming diminutives for everything\u2014including your partner. It's perfect for couples who love Prague's romantic atmosphere, castles, and Central European culture.",

    essentialPhrases: [
      { phrase: 'Miluji t\u011B', pronunciation: 'MI-lu-yi tyeh', translation: 'I love you' },
      { phrase: 'Ahoj', pronunciation: 'AH-hoy', translation: 'Hi/Bye (informal)' },
      { phrase: 'D\u011Bkuji', pronunciation: 'DYEH-ku-yi', translation: 'Thank you' },
      { phrase: 'Pros\u00EDm', pronunciation: 'PRO-seem', translation: "Please / You're welcome" },
      { phrase: 'Jak se m\u00E1\u0161?', pronunciation: 'yahk seh mahsh', translation: 'How are you?' },
      { phrase: 'Promi\u0148te', pronunciation: 'PRO-min-teh', translation: 'Excuse me / Sorry' },
      { phrase: 'Na shledanou', pronunciation: 'nah SKHLE-dah-noh', translation: 'Goodbye' },
      { phrase: 'Jmenuji se...', pronunciation: 'YME-nu-yi seh', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Czech?',
        answer:
          'The FSI estimates about 1,100 hours for proficiency. The Latin alphabet helps compared to Russian, but 7 cases and complex pronunciation take time. Basic conversation is achievable in 6-12 months.',
      },
      {
        question: 'Is Czech harder than German?',
        answer:
          'Generally yes. Czech has 7 cases vs German\'s 4, and the \u0159 sound is notoriously difficult. However, Czech pronunciation is more consistent once learned. Both require significant study.',
      },
      {
        question: 'Can I understand Slovak if I learn Czech?',
        answer:
          'Largely yes! Czech and Slovak have about 95% mutual intelligibility. Most Czechs and Slovaks understand each other with minimal difficulty. Learning one makes the other much easier.',
      },
      {
        question: 'Is Czech useful to learn?',
        answer:
          'For Central Europe, yes. Czech Republic has a strong economy and Prague is a major business and tourist hub. Czech also helps with understanding Slovak and gives insight into other Slavic languages.',
      },
      {
        question: 'What makes Czech pronunciation hard?',
        answer:
          'The \u0159 sound (a rolled r combined with \u017E) is unique to Czech. Consonant clusters like "str\u010D" challenge beginners. However, spelling is phonetic\u2014once you know the rules, pronunciation is consistent.',
      },
      {
        question: 'Should I learn Czech or Polish?',
        answer:
          'Choose based on your interests. Czech has fewer speakers but uses Latin script. Polish has 45 million speakers but harder pronunciation. Both have 7 cases and complex grammar.',
      },
    ],
  },

  // ============================================
  // GREEK
  // ============================================
  el: {
    code: 'el',
    name: 'Greek',
    nativeName: '\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC',
    flag: '\u{1F1EC}\u{1F1F7}',

    speakers: '13 million',
    countries: ['Greece', 'Cyprus', 'diaspora'],
    difficultyRating: 3,
    fsiHours: 1100,
    familyGroup: 'Hellenic',

    primaryKeyword: 'learn greek',
    secondaryKeywords: [
      'greek for beginners',
      'learn greek online',
      'greek alphabet',
      'modern greek',
      'greek language course',
    ],

    whyLearn: [
      'Connect with 3,000+ years of continuous culture',
      'Many English words have Greek roots',
      'Beautiful island destinations await',
      'Unique alphabet but consistent pronunciation',
      'Gateway to understanding ancient texts',
    ],

    grammarHighlights: [
      'Greek alphabet (24 letters)',
      '4 grammatical cases (simpler than ancient Greek)',
      'Verb aspects similar to Slavic languages',
      'Definite articles for all nouns',
      'Different pronunciation than ancient Greek',
    ],

    commonMistakes: [
      {
        mistake: 'Reading Greek like ancient Greek',
        explanation:
          'Modern Greek pronunciation differs significantly. "\u03B2" is "v" not "b," "\u03B7" is "ee" not "eh." Learn modern sounds first.',
      },
      {
        mistake: 'Ignoring stress marks',
        explanation:
          'Every Greek word has a stress mark showing which syllable is emphasized. Wrong stress can change meaning or sound strange.',
      },
      {
        mistake: 'Using ancient vocabulary',
        explanation:
          "Modern Greek has evolved significantly. Using ancient words is like speaking Shakespearean English\u2014understandable but odd.",
      },
      {
        mistake: 'Forgetting article genders',
        explanation:
          'Greek has three genders (masculine, feminine, neuter) with articles that must match. Memorize nouns with their articles.',
      },
      {
        mistake: 'Wrong verb aspect',
        explanation:
          'Like Slavic languages, Greek distinguishes perfective and imperfective aspects. The distinction affects meaning.',
      },
    ],

    culturalTips: [
      'Greeks are warm and hospitable\u2014expect generous hospitality',
      'Meals are social events that can last hours',
      'Name days are celebrated as much as birthdays',
      'Greeks often stand closer when talking than Anglophones expect',
    ],

    couplesTip:
      'Greek gave us the word "eros" for romantic love. Learning Greek together connects you to the birthplace of Western philosophy and some of history\'s greatest love stories.',

    essentialPhrases: [
      {
        phrase: "\u03A3'\u03B1\u03B3\u03B1\u03C0\u03CE",
        pronunciation: 'sah-gah-POH',
        translation: 'I love you',
      },
      { phrase: '\u0393\u03B5\u03B9\u03B1 \u03C3\u03BF\u03C5', pronunciation: 'YAH soo', translation: 'Hello (informal)' },
      {
        phrase: '\u0395\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03CE',
        pronunciation: 'ef-hah-ree-STOH',
        translation: 'Thank you',
      },
      {
        phrase: '\u03A0\u03B1\u03C1\u03B1\u03BA\u03B1\u03BB\u03CE',
        pronunciation: 'pah-rah-kah-LOH',
        translation: "Please / You're welcome",
      },
      {
        phrase: '\u03A4\u03B9 \u03BA\u03AC\u03BD\u03B5\u03B9\u03C2;',
        pronunciation: 'tee KAH-nees',
        translation: 'How are you?',
      },
      {
        phrase: '\u03A3\u03C5\u03B3\u03BD\u03CE\u03BC\u03B7',
        pronunciation: 'see-GHNO-mee',
        translation: 'Excuse me / Sorry',
      },
      {
        phrase: '\u0391\u03BD\u03C4\u03AF\u03BF',
        pronunciation: 'AHN-dee-oh',
        translation: 'Goodbye',
      },
      {
        phrase: '\u039C\u03B5 \u03BB\u03AD\u03BD\u03B5...',
        pronunciation: 'meh LEH-neh',
        translation: 'My name is...',
      },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Greek?',
        answer:
          'The FSI estimates about 1,100 hours for proficiency. The alphabet takes 1-2 weeks to learn. Basic conversation is achievable in 6-12 months with consistent practice.',
      },
      {
        question: 'Is the Greek alphabet hard?',
        answer:
          "Not really! It has only 24 letters, and many are familiar from math or science (\u03C0, \u03A3, \u0394). You can learn to read in 1-2 weeks. The alphabet is mostly phonetic, making pronunciation predictable.",
      },
      {
        question: 'Is modern Greek different from ancient Greek?',
        answer:
          "Yes, significantly. Pronunciation, vocabulary, and some grammar have evolved over 2,000+ years. It's like comparing modern English to Old English. However, learning modern Greek helps with ancient texts.",
      },
      {
        question: 'Will Greek help me learn other languages?',
        answer:
          "Indirectly, yes. Many English words have Greek roots (40% of academic vocabulary). Understanding Greek prefixes and roots helps with medical, scientific, and academic terminology in any language.",
      },
      {
        question: 'Is Greek worth learning for travel?',
        answer:
          'Absolutely! While many Greeks speak English in tourist areas, speaking Greek transforms your experience. Greeks deeply appreciate the effort and will welcome you more warmly.',
      },
      {
        question: 'How similar are Greek and Latin?',
        answer:
          "They're not closely related but influenced each other. Greek is Hellenic; Latin is Italic. Both contributed heavily to English vocabulary but through different word families.",
      },
    ],
  },

  // ============================================
  // DUTCH
  // ============================================
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '\u{1F1F3}\u{1F1F1}',

    speakers: '25 million',
    countries: ['Netherlands', 'Belgium', 'Suriname'],
    difficultyRating: 2,
    fsiHours: 600,
    familyGroup: 'Germanic',

    primaryKeyword: 'learn dutch',
    secondaryKeywords: [
      'dutch for beginners',
      'learn dutch online',
      'dutch language',
      'how to speak dutch',
      'dutch lessons',
    ],

    whyLearn: [
      'Closest major language to English',
      'Netherlands has excellent work-life balance',
      'Gateway to German and Scandinavian languages',
      'High English proficiency means patient practice partners',
      'Strong expat community and international business hub',
    ],

    grammarHighlights: [
      'Very similar to English structure',
      'Two genders (common and neuter) with de/het',
      'Verb conjugation simpler than German',
      'Word order rules similar to German',
      'Many cognates with English',
    ],

    commonMistakes: [
      {
        mistake: 'Wrong de/het usage',
        explanation:
          'Dutch has two genders but which nouns use "de" vs "het" must be memorized. About 2/3 use "de." Get this right for natural speech.',
      },
      {
        mistake: 'English word order',
        explanation:
          'Dutch has V2 word order like German. "Tomorrow I go" becomes "Morgen ga ik" (Tomorrow go I). Verbs must be second.',
      },
      {
        mistake: 'Pronouncing "g" softly',
        explanation:
          'Dutch "g" is guttural, from the throat. "Goed" sounds like you\'re clearing your throat. This takes practice.',
      },
      {
        mistake: 'Assuming Dutch = German',
        explanation:
          "While related, Dutch has different vocabulary, pronunciation, and simpler grammar. Don't apply German rules directly.",
      },
      {
        mistake: 'Speaking English by default',
        explanation:
          "Dutch people speak excellent English and often switch. Politely insist on practicing Dutch\u2014they'll understand.",
      },
    ],

    culturalTips: [
      'Dutch directness is normal, not rude',
      'Cycling is the primary transportation mode',
      '"Gezellig" (cozy togetherness) is a core cultural value',
      'Going Dutch (splitting bills) is expected',
    ],

    couplesTip:
      'Dutch is the easiest language for English speakers to learn. Its "gezellig" concept (cozy togetherness) perfectly captures what couples seek in shared activities.',

    essentialPhrases: [
      { phrase: 'Ik hou van jou', pronunciation: 'ik how vahn yow', translation: 'I love you' },
      { phrase: 'Hallo', pronunciation: 'HAH-loh', translation: 'Hello' },
      { phrase: 'Dank je wel', pronunciation: 'dahnk yuh vel', translation: 'Thank you' },
      { phrase: 'Alsjeblieft', pronunciation: 'AHL-shuh-bleeft', translation: "Please / You're welcome" },
      { phrase: 'Hoe gaat het?', pronunciation: 'hoo gaht het', translation: 'How are you?' },
      { phrase: 'Sorry', pronunciation: 'SOR-ree', translation: 'Sorry' },
      { phrase: 'Tot ziens', pronunciation: 'toht zeens', translation: 'Goodbye' },
      { phrase: 'Ik heet...', pronunciation: 'ik hayt', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Dutch?',
        answer:
          'Dutch is one of the easiest languages for English speakers! The FSI estimates just 575-600 hours for proficiency. Basic conversation is achievable in 3-6 months with regular practice.',
      },
      {
        question: 'Is Dutch easier than German?',
        answer:
          "Yes! Dutch has simpler grammar (2 genders vs 3, no cases), and vocabulary is even closer to English. If you can learn German, Dutch will feel like a shortcut.",
      },
      {
        question: "Can I practice Dutch if everyone speaks English?",
        answer:
          "This is a real challenge! Dutch people's excellent English can make practice hard. Be direct: ask them to speak Dutch with you. Most will happily help if you express genuine interest.",
      },
      {
        question: 'Is Dutch useful to learn?',
        answer:
          "For living in the Netherlands, absolutely. While you can survive with English, Dutch integration\u2014jobs, friendships, bureaucracy\u2014requires Dutch. It's also a gateway to German and Afrikaans.",
      },
      {
        question: 'What about Flemish (Belgian Dutch)?',
        answer:
          "Flemish is a Dutch dialect spoken in Belgium. The differences are like American vs British English\u2014different vocabulary and accent but mutually intelligible. Standard Dutch works in both countries.",
      },
      {
        question: 'Will Dutch help me learn German?',
        answer:
          'Definitely! Dutch is structurally between English and German. Learning Dutch first makes German grammar more intuitive, and many words are cognates.',
      },
    ],
  },

  // ============================================
  // SWEDISH
  // ============================================
  sv: {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '\u{1F1F8}\u{1F1EA}',

    speakers: '10 million',
    countries: ['Sweden', 'Finland (minority)'],
    difficultyRating: 2,
    fsiHours: 600,
    familyGroup: 'Germanic',

    primaryKeyword: 'learn swedish',
    secondaryKeywords: [
      'swedish for beginners',
      'learn swedish online',
      'swedish language',
      'how to speak swedish',
      'swedish lessons',
    ],

    whyLearn: [
      'Sweden consistently ranks among happiest countries',
      'Strong tech and design industry',
      'Beautiful nature and culture',
      'Relatively simple grammar for English speakers',
      'Gateway to Norwegian and Danish',
    ],

    grammarHighlights: [
      'Two genders (common and neuter) with en/ett',
      'No grammatical cases',
      'Pitch accent (tonal patterns)',
      'Definite articles attached as suffixes',
      'Simple verb conjugation (no person agreement)',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring pitch accent',
        explanation:
          'Swedish has tonal patterns that distinguish words. "Anden" with one tone means "the duck," with another means "the spirit." Listen carefully to native speakers.',
      },
      {
        mistake: 'Wrong en/ett',
        explanation:
          'About 75% of nouns are "en" words, 25% are "ett." There\'s no rule\u2014you must memorize which is which.',
      },
      {
        mistake: 'Mispronouncing sj-sound',
        explanation:
          "Swedish has a unique \"sj\" sound (like a hushed \"sh\"). \"Sj\u00F6\" (lake) and \"skj\u00F6\" require this sound. It takes practice.",
      },
      {
        mistake: 'Using English word order always',
        explanation:
          'Swedish has V2 word order. "Yesterday I went" becomes "Ig\u00E5r gick jag" (Yesterday went I). Time expressions often trigger inversion.',
      },
      {
        mistake: 'Not learning definite suffixes',
        explanation:
          '"A house" is "ett hus," but "the house" is "huset" (suffix -et attached). This pattern is essential.',
      },
    ],

    culturalTips: [
      '"Lagom" (just right, not too much) is a core Swedish value',
      '"Fika" (coffee break with treats) is sacred daily ritual',
      'Swedes respect personal space and quiet',
      'Nature access is a right ("allemansr\u00E4tten")',
    ],

    couplesTip:
      'Swedish concepts like "lagom" (just the right amount) and "fika" (coffee break ritual) embody balanced, quality time together\u2014perfect values for couples.',

    essentialPhrases: [
      { phrase: 'Jag \u00E4lskar dig', pronunciation: 'yah EL-skar day', translation: 'I love you' },
      { phrase: 'Hej', pronunciation: 'hay', translation: 'Hi' },
      { phrase: 'Tack', pronunciation: 'tahk', translation: 'Thank you' },
      { phrase: 'Tack s\u00E5 mycket', pronunciation: 'tahk soh MYU-keh', translation: 'Thank you very much' },
      { phrase: 'Hur m\u00E5r du?', pronunciation: 'hoor mohr doo', translation: 'How are you?' },
      { phrase: 'Urs\u00E4kta', pronunciation: 'oor-SEK-tah', translation: 'Excuse me / Sorry' },
      { phrase: 'Hej d\u00E5', pronunciation: 'hay DOH', translation: 'Goodbye' },
      { phrase: 'Jag heter...', pronunciation: 'yah HEH-ter', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Swedish?',
        answer:
          'Swedish is one of the easier languages for English speakers. The FSI estimates 575-600 hours for proficiency. Basic conversation is achievable in 4-6 months with consistent practice.',
      },
      {
        question: 'Is Swedish easier than German?',
        answer:
          "Yes! Swedish has no grammatical cases and simpler verb conjugations. No person agreement on verbs (I go, you go, he goes all use \"g\u00E5r\"). The main challenges are pitch accent and the sj-sound.",
      },
      {
        question: 'Can I understand Norwegian and Danish if I learn Swedish?',
        answer:
          "Largely yes! The Scandinavian languages are mutually intelligible, especially written. Norwegian is closest to Swedish. Danish pronunciation differs more but written Danish is understandable.",
      },
      {
        question: 'What about Swedish pitch accent?',
        answer:
          "Swedish has two tonal patterns that distinguish some words. While getting it wrong rarely causes misunderstanding, it affects your accent. Think of it like stress in English but with melody.",
      },
      {
        question: 'Is Swedish useful to learn?',
        answer:
          "For living in Sweden, absolutely. While most Swedes speak excellent English, integration requires Swedish. It's also the key to Scandinavian culture and helps with Norwegian and Danish.",
      },
      {
        question: 'Will Swedes practice Swedish with me?',
        answer:
          "Swedes have excellent English and may switch to it. Be persistent but polite about wanting to practice Swedish. Many appreciate the effort and will help once they understand your goal.",
      },
    ],
  },

  // ============================================
  // NORWEGIAN
  // ============================================
  no: {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: '\u{1F1F3}\u{1F1F4}',

    speakers: '5 million',
    countries: ['Norway'],
    difficultyRating: 2,
    fsiHours: 600,
    familyGroup: 'Germanic',

    primaryKeyword: 'learn norwegian',
    secondaryKeywords: [
      'norwegian for beginners',
      'learn norwegian online',
      'norwegian language',
      'how to speak norwegian',
      'norwegian lessons',
    ],

    whyLearn: [
      'Often ranked easiest language for English speakers',
      'Norway has stunning natural beauty',
      'High standard of living and work-life balance',
      'Mutually intelligible with Swedish and Danish',
      'Rich Viking and folk traditions',
    ],

    grammarHighlights: [
      'Very similar structure to English',
      'Two written standards (Bokm\u00E5l and Nynorsk)',
      'No grammatical cases',
      'Simple verb conjugation',
      'Pitch accent like Swedish',
    ],

    commonMistakes: [
      {
        mistake: 'Confusing Bokm\u00E5l and Nynorsk',
        explanation:
          "Norway has two official written standards. Bokm\u00E5l (book language) is more common and recommended for learners. Nynorsk is more used in rural western Norway.",
      },
      {
        mistake: 'Ignoring definite suffixes',
        explanation:
          '"A house" is "et hus," but "the house" is "huset." Like Swedish, Norwegian attaches definite articles as suffixes.',
      },
      {
        mistake: 'V2 word order errors',
        explanation:
          'Like other Germanic languages, Norwegian has verb-second rule. "Yesterday I went" = "I g\u00E5r gikk jeg" (Yesterday went I).',
      },
      {
        mistake: 'Wrong en/ei/et gender',
        explanation:
          'Norwegian has three genders: masculine (en), feminine (ei), and neuter (et). Masculine is most common; feminine is sometimes merged with masculine.',
      },
      {
        mistake: 'Expecting one dialect',
        explanation:
          'Norwegian has significant dialect variation. The "standard" you learn may sound different from locals. This is normal!',
      },
    ],

    culturalTips: [
      '"Friluftsliv" (outdoor life) is a core Norwegian value',
      '"Koselig" is the Norwegian version of hygge',
      'Norwegians value equality and modesty',
      'Nature and cabin culture are essential to Norwegian life',
    ],

    couplesTip:
      'Norwegian\'s "koselig" is their version of hygge\u2014the art of creating warmth and connection. Learning Norwegian together embraces this cozy philosophy.',

    essentialPhrases: [
      { phrase: 'Jeg elsker deg', pronunciation: 'yay EL-sker day', translation: 'I love you' },
      { phrase: 'Hei', pronunciation: 'hay', translation: 'Hi' },
      { phrase: 'Takk', pronunciation: 'tahk', translation: 'Thank you' },
      { phrase: 'V\u00E6r s\u00E5 snill', pronunciation: 'vehr soh snil', translation: 'Please' },
      { phrase: 'Hvordan har du det?', pronunciation: 'VOOR-dahn hahr doo deh', translation: 'How are you?' },
      { phrase: 'Unnskyld', pronunciation: 'OON-shil', translation: 'Excuse me / Sorry' },
      { phrase: 'Ha det', pronunciation: 'hah deh', translation: 'Goodbye' },
      { phrase: 'Jeg heter...', pronunciation: 'yay HEH-ter', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Norwegian?',
        answer:
          'Norwegian is often cited as the easiest language for English speakers. The FSI estimates 575-600 hours. Basic conversation is achievable in 3-6 months with regular practice.',
      },
      {
        question: 'Should I learn Bokm\u00E5l or Nynorsk?',
        answer:
          'Learn Bokm\u00E5l first. It\'s used by about 85% of Norwegians and has more learning resources. Nynorsk is also official but more regional. You can explore Nynorsk later if interested.',
      },
      {
        question: 'Will understanding Norwegian help with Swedish and Danish?',
        answer:
          'Absolutely! Norwegian is often considered the "middle" Scandinavian language. Swedish speakers find Norwegian easy, and Norwegian pronunciation is clearer than Danish. Learning any one helps with the others.',
      },
      {
        question: 'What about Norwegian dialects?',
        answer:
          "Norwegian has significant dialect variation. Don't worry if locals sound different from your lessons. Standard Bokm\u00E5l will be understood everywhere, and exposure helps you adapt.",
      },
      {
        question: 'Is Norwegian useful?',
        answer:
          "For living in Norway, essential. Norway's economy is strong (oil, tech, fishing), and while English is widely spoken, integration requires Norwegian. It also unlocks Swedish and Danish comprehension.",
      },
      {
        question: 'What makes Norwegian easy for English speakers?',
        answer:
          'Similar vocabulary (many cognates), no grammatical cases, simple verb conjugation, and similar sentence structure. The main challenges are pitch accent and the suffixed definite articles.',
      },
    ],
  },

  // ============================================
  // DANISH
  // ============================================
  da: {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    flag: '\u{1F1E9}\u{1F1F0}',

    speakers: '6 million',
    countries: ['Denmark', 'Greenland', 'Faroe Islands'],
    difficultyRating: 2,
    fsiHours: 600,
    familyGroup: 'Germanic',

    primaryKeyword: 'learn danish',
    secondaryKeywords: [
      'danish for beginners',
      'learn danish online',
      'danish language',
      'how to speak danish',
      'danish lessons',
    ],

    whyLearn: [
      'Home of "hygge" (cozy contentment)',
      'Denmark consistently ranks happiest country',
      'Gateway to Scandinavian languages',
      'Simple grammar despite tricky pronunciation',
      'Strong design and sustainability culture',
    ],

    grammarHighlights: [
      'Very simple grammar structure',
      'Two genders (common and neuter) with en/et',
      'No grammatical cases',
      'Definite articles as suffixes',
      'The st\u00F8d (glottal stop) is distinctive',
    ],

    commonMistakes: [
      {
        mistake: 'Pronouncing written letters',
        explanation:
          "Danish pronunciation is notoriously different from spelling. Many letters are soft or silent. \"Jeg\" (I) sounds like \"yay,\" not \"yeg.\"",
      },
      {
        mistake: 'Missing the st\u00F8d',
        explanation:
          'The st\u00F8d is a glottal stop unique to Danish. It\'s like a brief catch in your throat. "Hun" (she) without st\u00F8d becomes "hund" (dog)!',
      },
      {
        mistake: 'Wrong en/et articles',
        explanation:
          'About 75% of nouns are "en" (common gender), 25% are "et" (neuter). Must be memorized like Dutch de/het.',
      },
      {
        mistake: 'Applying Swedish/Norwegian pronunciation',
        explanation:
          'While grammar is similar, Danish pronunciation is very different. Soft consonants and vowel reductions make Danish distinct.',
      },
      {
        mistake: 'Ignoring soft d',
        explanation:
          'Danish "d" after vowels becomes a soft "th" or disappears entirely. "Made" (food) sounds like "meh-theh."',
      },
    ],

    culturalTips: [
      '"Hygge" (cozy contentment) is Denmark\'s cultural essence',
      'Cycling is the main transportation in cities',
      'Work-life balance is highly valued',
      'Danes are direct but friendly once you know them',
    ],

    couplesTip:
      'Danish gave the world "hygge"\u2014the art of cozy togetherness. What better language to learn as a couple than one built around warmth, candles, and quality time?',

    essentialPhrases: [
      { phrase: 'Jeg elsker dig', pronunciation: 'yay EL-ska day', translation: 'I love you' },
      { phrase: 'Hej', pronunciation: 'hay', translation: 'Hi' },
      { phrase: 'Tak', pronunciation: 'tahk', translation: 'Thank you' },
      { phrase: 'V\u00E6r s\u00E5 venlig', pronunciation: 'vehr soh VEN-lee', translation: 'Please' },
      { phrase: 'Hvordan har du det?', pronunciation: 'VOOR-dan hah doo deh', translation: 'How are you?' },
      { phrase: 'Undskyld', pronunciation: 'OON-skyl', translation: 'Excuse me / Sorry' },
      { phrase: 'Farvel', pronunciation: 'fah-VEL', translation: 'Goodbye' },
      { phrase: 'Jeg hedder...', pronunciation: 'yay HETH-ah', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Danish?',
        answer:
          'The FSI estimates 575-600 hours for proficiency, similar to other Scandinavian languages. However, Danish pronunciation is notoriously challenging. Basic conversation takes 6-12 months; pronunciation takes longer to master.',
      },
      {
        question: 'Is Danish pronunciation really that hard?',
        answer:
          "Yes, Danish pronunciation is considered the hardest part. Many sounds are soft, swallowed, or merged. Even Norwegians and Swedes sometimes struggle to understand spoken Danish. Written Danish is much easier.",
      },
      {
        question: 'Should I learn Danish, Swedish, or Norwegian?',
        answer:
          "If targeting Denmark specifically, learn Danish. For general Scandinavian access, Norwegian is often recommended as the \"middle\" option. Swedish has more speakers. All three are mutually intelligible to varying degrees.",
      },
      {
        question: 'What is hygge exactly?',
        answer:
          "Hygge (HOO-guh) is a Danish concept of cozy contentment\u2014candles, warm drinks, close friends, comfortable settings. It's a cultural practice, not just a word. Learning Danish connects you to this philosophy.",
      },
      {
        question: 'Can Danes understand Swedish and Norwegian?',
        answer:
          'Danes generally understand Swedish and Norwegian, especially written. However, other Scandinavians often find Danish harder to understand due to its pronunciation. Written comprehension is high across all three.',
      },
      {
        question: 'Is Danish useful to learn?',
        answer:
          "For living in Denmark, essential. Denmark has a strong economy, high quality of life, and integration requires Danish. It also opens doors to Swedish and Norwegian comprehension.",
      },
    ],
  },

  // ============================================
  // HUNGARIAN
  // ============================================
  hu: {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    flag: '\u{1F1ED}\u{1F1FA}',

    speakers: '13 million',
    countries: ['Hungary', 'Romania', 'Slovakia', 'Serbia'],
    difficultyRating: 5,
    fsiHours: 1100,
    familyGroup: 'Uralic',

    primaryKeyword: 'learn hungarian',
    secondaryKeywords: [
      'hungarian for beginners',
      'learn hungarian online',
      'hungarian language',
      'how to speak hungarian',
      'magyar lessons',
    ],

    whyLearn: [
      'Unique language unrelated to neighbors',
      'Budapest is a romantic European gem',
      'Rich thermal bath and caf\u00E9 culture',
      'Challenging but incredibly rewarding',
      'Distinctive literature and music tradition',
    ],

    grammarHighlights: [
      '18 grammatical cases (really!)',
      'Agglutinative structure (suffixes pile up)',
      'Vowel harmony affects suffixes',
      'No grammatical gender',
      'Definite vs indefinite conjugation',
    ],

    commonMistakes: [
      {
        mistake: 'Underestimating the cases',
        explanation:
          'Hungarian has 18 cases, expressed through suffixes. "H\u00E1z" (house) becomes "h\u00E1zban" (in house), "h\u00E1zhoz" (to house), etc. This is the core challenge.',
      },
      {
        mistake: 'Ignoring vowel harmony',
        explanation:
          'Suffixes change based on the vowels in the word. "Back" vowels (a, \u00E1, o, \u00F3, u, \u00FA) and "front" vowels (e, \u00E9, i, \u00ED, \u00F6, \u0151, \u00FC, \u0171) require matching suffixes.',
      },
      {
        mistake: 'Wrong definite/indefinite conjugation',
        explanation:
          'Hungarian verbs conjugate differently depending on whether the object is definite or indefinite. "I read a book" vs "I read the book" use different verb forms.',
      },
      {
        mistake: 'Assuming Latin roots',
        explanation:
          "Hungarian isn't related to neighboring languages. It's Uralic, distantly related to Finnish and Estonian. Don't expect familiar vocabulary.",
      },
      {
        mistake: 'Giving up too early',
        explanation:
          'Hungarian is genuinely difficult but very logical. The rules are consistent once learned. Many learners give up before patterns click.',
      },
    ],

    culturalTips: [
      'Hungarians are proud of their unique language and culture',
      'Thermal bath culture is central to Hungarian life',
      'Coffee house tradition rivals Vienna',
      'Paprika is the soul of Hungarian cuisine',
    ],

    couplesTip:
      'Hungarian has 18 cases and is famously difficult\u2014conquering it together is a serious bonding experience. Plus, Budapest is one of Europe\'s most romantic cities.',

    essentialPhrases: [
      { phrase: 'Szeretlek', pronunciation: 'SEH-ret-lek', translation: 'I love you' },
      { phrase: 'Szia', pronunciation: 'SEE-yah', translation: 'Hi/Bye (informal)' },
      { phrase: 'K\u00F6sz\u00F6n\u00F6m', pronunciation: 'KUH-suh-nuhm', translation: 'Thank you' },
      { phrase: 'K\u00E9rem', pronunciation: 'KAY-rem', translation: 'Please' },
      { phrase: 'Hogy vagy?', pronunciation: 'hodj vahj', translation: 'How are you?' },
      { phrase: 'Bocs\u00E1nat', pronunciation: 'BO-chah-naht', translation: 'Excuse me / Sorry' },
      { phrase: 'Viszl\u00E1t', pronunciation: 'VIS-laht', translation: 'Goodbye' },
      { phrase: 'A nevem...', pronunciation: 'ah NEH-vem', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Hungarian?',
        answer:
          'Hungarian is one of the hardest languages for English speakers. The FSI doesn\'t give a specific estimate, but expect 1,100+ hours. Basic conversation takes at least a year of dedicated study.',
      },
      {
        question: 'Is Hungarian really that hard?',
        answer:
          "Yes, for English speakers it's genuinely challenging. The 18 cases, vowel harmony, and completely different vocabulary make it unique. However, it's completely logical\u2014rules are consistent once you learn them.",
      },
      {
        question: 'Is Hungarian related to Finnish?',
        answer:
          "Distantly! Both are Uralic languages, but they diverged thousands of years ago. They share some grammatical features but aren't mutually intelligible. It's like English and Persian (both Indo-European but very different).",
      },
      {
        question: 'Why learn Hungarian?',
        answer:
          'For the challenge, for love, or for Hungary itself. Budapest is magnificent, Hungarian culture is rich, and mastering Hungarian is a genuine achievement. It also provides a unique window into non-Indo-European linguistics.',
      },
      {
        question: 'What makes Hungarian difficult?',
        answer:
          'The 18 cases (suffixes expressing relationships), vowel harmony (suffixes change based on word vowels), no familiar vocabulary (unlike German or French), and definite/indefinite verb conjugations.',
      },
      {
        question: 'Will any other language help me learn Hungarian?',
        answer:
          "Finnish and Estonian share some grammatical concepts (agglutination, cases) but vocabulary is different. Turkish's agglutinative structure is somewhat similar. Mostly, you're starting fresh\u2014but that's also exciting!",
      },
    ],
  },

  // ============================================
  // TURKISH
  // ============================================
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'T\u00FCrk\u00E7e',
    flag: '\u{1F1F9}\u{1F1F7}',

    speakers: '80 million',
    countries: ['Turkey', 'Cyprus', 'Germany', 'Netherlands'],
    difficultyRating: 4,
    fsiHours: 1100,
    familyGroup: 'Turkic',

    primaryKeyword: 'learn turkish',
    secondaryKeywords: [
      'turkish for beginners',
      'learn turkish online',
      'turkish language',
      'how to speak turkish',
      'turkish lessons',
    ],

    whyLearn: [
      'Bridge between Europe and Asia',
      'Turkey is a top tourist destination',
      'Agglutinative grammar is logical once understood',
      'Rich culinary and cultural traditions',
      '80+ million speakers worldwide',
    ],

    grammarHighlights: [
      'Agglutinative (suffixes stack on words)',
      'Vowel harmony affects all suffixes',
      'Subject-Object-Verb word order',
      'No grammatical gender',
      'No articles (a, the)',
    ],

    commonMistakes: [
      {
        mistake: 'Ignoring vowel harmony',
        explanation:
          'Turkish suffixes change based on the last vowel of the word. "Evde" (at home) but "okulda" (at school). Four vowel harmony patterns must be learned.',
      },
      {
        mistake: 'Using SVO word order',
        explanation:
          'Turkish is SOV: subject-object-verb. "I apple eat" not "I eat apple." The verb comes last in basic sentences.',
      },
      {
        mistake: 'Pronouncing like English',
        explanation:
          'Turkish letters have consistent sounds. "C" is always "j" sound, "\u00C7" is "ch," "\u015E" is "sh," "\u011E" is silent/lengthens preceding vowel.',
      },
      {
        mistake: 'Adding articles',
        explanation:
          'Turkish has no articles. Don\'t add "the" or "a"\u2014context and suffixes show definiteness.',
      },
      {
        mistake: 'Forgetting suffix order',
        explanation:
          "Suffixes must attach in a specific order. Getting this wrong creates meaningless words. Learn the suffix order rules early.",
      },
    ],

    culturalTips: [
      'Turkish hospitality is legendary\u2014tea is constantly offered',
      'Family and respect for elders are central values',
      'Haggling is expected in bazaars',
      '\u00C7ay (tea) culture is essential to social life',
    ],

    couplesTip:
      'Turkish has elaborate terms of endearment and a culture that deeply values hospitality and family. Learning it opens doors to one of the world\'s most welcoming cultures.',

    essentialPhrases: [
      { phrase: 'Seni seviyorum', pronunciation: 'SEH-nee seh-vee-YOR-um', translation: 'I love you' },
      { phrase: 'Merhaba', pronunciation: 'mehr-HAH-bah', translation: 'Hello' },
      { phrase: 'Te\u015Fekk\u00FCr ederim', pronunciation: 'teh-shek-KOOR eh-deh-REEM', translation: 'Thank you' },
      { phrase: 'L\u00FCtfen', pronunciation: 'LOOT-fen', translation: 'Please' },
      { phrase: 'Nas\u0131ls\u0131n?', pronunciation: 'NAH-suhl-suhn', translation: 'How are you?' },
      { phrase: 'Pardon', pronunciation: 'pahr-DON', translation: 'Excuse me / Sorry' },
      { phrase: 'Ho\u015F\u00E7a kal', pronunciation: 'HOSH-cha kahl', translation: 'Goodbye (to one staying)' },
      { phrase: 'Benim ad\u0131m...', pronunciation: 'beh-NEEM ah-DUHM', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Turkish?',
        answer:
          'The FSI estimates about 1,100 hours for proficiency. The agglutinative structure and vowel harmony take time, but the grammar is very regular. Basic conversation is achievable in 6-12 months.',
      },
      {
        question: 'Is Turkish grammar hard?',
        answer:
          "It's different but logical. Once you understand suffixes and vowel harmony, patterns are very consistent. No irregular verbs, no grammatical gender, no articles. The challenge is the unfamiliar structure.",
      },
      {
        question: 'Does Turkish use the Arabic alphabet?',
        answer:
          'Not anymore! Turkish has used the Latin alphabet since 1928. It has a few extra letters (\u00C7, \u011E, \u0130, \u00D6, \u015E, \u00DC) but is mostly familiar. The alphabet is fully phonetic.',
      },
      {
        question: 'What is vowel harmony?',
        answer:
          'Vowel harmony means suffixes change based on the last vowel of the word. Front vowels (e, i, \u00F6, \u00FC) and back vowels (a, \u0131, o, u) must match in suffixes. It\'s like musical harmony for words.',
      },
      {
        question: 'Will Turkish help me learn other languages?',
        answer:
          'Turkish is the gateway to Turkic languages (Azerbaijani, Kazakh, Uzbek, etc.)\u2014about 200 million speakers across Central Asia. Grammar concepts also help with Japanese and Korean (similar SOV structure).',
      },
      {
        question: 'Is Turkish useful to learn?',
        answer:
          "Very! Turkey is a major economy, top tourist destination, and bridge between Europe and Asia. Turkish is also useful for understanding Ottoman history and Islamic civilization. Large diaspora in Germany.",
      },
    ],
  },

  // ============================================
  // ROMANIAN
  // ============================================
  ro: {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Rom\u00E2n\u0103',
    flag: '\u{1F1F7}\u{1F1F4}',

    speakers: '26 million',
    countries: ['Romania', 'Moldova', 'diaspora'],
    difficultyRating: 2,
    fsiHours: 600,
    familyGroup: 'Romance',

    primaryKeyword: 'learn romanian',
    secondaryKeywords: [
      'romanian for beginners',
      'learn romanian online',
      'romanian language',
      'how to speak romanian',
      'romanian lessons',
    ],

    whyLearn: [
      'Romance language with unique character',
      'Romania has stunning castles and nature',
      'Growing tech hub in Eastern Europe',
      'Easier than it looks for Romance speakers',
      'Gateway to Moldova and Romanian culture',
    ],

    grammarHighlights: [
      'Romance language with Slavic influences',
      'Definite article attached as suffix',
      '3 genders (masculine, feminine, neuter)',
      'Case system (but simpler than Slavic)',
      'Maintains Latin structure more than others',
    ],

    commonMistakes: [
      {
        mistake: 'Expecting Spanish/Italian pronunciation',
        explanation:
          "Romanian has Slavic influences. Some sounds (\u0103, \u00E2/\u00EE) don't exist in other Romance languages. Don't assume Italian pronunciation rules.",
      },
      {
        mistake: 'Forgetting definite suffixes',
        explanation:
          'Like Scandinavian languages, Romanian attaches definite articles as suffixes. "Cas\u0103" (house) becomes "casa" (the house). Position matters.',
      },
      {
        mistake: 'Wrong gender (neuter confusion)',
        explanation:
          'Romanian has three genders, and neuter nouns act masculine in singular, feminine in plural. "Un scaun" but "dou\u0103 scaune" (one chair, two chairs).',
      },
      {
        mistake: 'Ignoring case changes',
        explanation:
          'Romanian maintains a case system\u2014articles and adjectives change for genitive/dative. "Cartea fetei" (the girl\'s book) shows genitive.',
      },
      {
        mistake: 'Assuming Spanish cognates',
        explanation:
          "Many words differ from other Romance languages due to Slavic influence. \"Da\" (yes), \"a iubi\" (to love) aren't Spanish-like.",
      },
    ],

    culturalTips: [
      'Romanian hospitality is warm and generous',
      'Orthodox traditions shape many holidays',
      'Folk traditions remain vibrant, especially in villages',
      'Dracula\'s castle is a real tourist destination',
    ],

    couplesTip:
      "Romanian blends Latin romance with Eastern European charm. The country's fairy-tale castles, mountains, and Black Sea coast make it a dreamy destination for couples.",

    essentialPhrases: [
      { phrase: 'Te iubesc', pronunciation: 'teh yoo-BESK', translation: 'I love you' },
      { phrase: 'Bun\u0103 ziua', pronunciation: 'BOO-nuh ZEE-wah', translation: 'Good day/Hello' },
      { phrase: 'Mul\u021Bumesc', pronunciation: 'moolt-soo-MESK', translation: 'Thank you' },
      { phrase: 'V\u0103 rog', pronunciation: 'vuh ROG', translation: 'Please' },
      { phrase: 'Ce mai faci?', pronunciation: 'cheh my FAHCH', translation: 'How are you?' },
      { phrase: 'Scuza\u021Bi', pronunciation: 'skoo-ZAH-tsee', translation: 'Excuse me' },
      { phrase: 'La revedere', pronunciation: 'lah reh-veh-DEH-reh', translation: 'Goodbye' },
      { phrase: 'M\u0103 numesc...', pronunciation: 'muh noo-MESK', translation: 'My name is...' },
    ],

    faqs: [
      {
        question: 'How long does it take to learn Romanian?',
        answer:
          'Romanian is a Category I language for English speakers (easiest group). The FSI estimates 575-600 hours. If you know another Romance language, you can progress even faster. Basic conversation in 4-8 months.',
      },
      {
        question: 'Is Romanian similar to Italian?',
        answer:
          "Yes, in grammar and much vocabulary. Romanian retained more Latin structure than other Romance languages. However, Slavic loanwords and unique sounds make it distinct. Italian speakers find Romanian easier than others.",
      },
      {
        question: 'Does Romanian use Cyrillic?',
        answer:
          'Not anymore. Romanian used Cyrillic until the 19th century but now uses Latin script. Moldova used Cyrillic during Soviet times but has also switched to Latin. The alphabet is familiar with a few extra characters.',
      },
      {
        question: 'What makes Romanian unique among Romance languages?',
        answer:
          "Definite articles as suffixes (like Scandinavian), significant Slavic vocabulary, maintained neuter gender, and preserved Latin case system. It's the most \"Eastern\" Romance language.",
      },
      {
        question: 'Is Romanian useful to learn?',
        answer:
          "For Romania and Moldova, essential. Romania is an EU country with a growing tech sector. Romanian also provides insight into how Latin evolved differently from Spanish, French, and Italian.",
      },
      {
        question: 'Can Spanish speakers understand Romanian?',
        answer:
          "Partially. Written Romanian is more understandable than spoken due to Slavic-influenced pronunciation. Spanish speakers often understand 40-60% of written Romanian. The grammar feels familiar.",
      },
    ],
  },
};

/**
 * Get hub data for a specific language
 */
export function getLanguageHubData(code: string): LanguageHubData | undefined {
  return LANGUAGE_HUB_DATA[code];
}

/**
 * Get all language codes with hub data
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(LANGUAGE_HUB_DATA);
}

/**
 * Get languages grouped by family
 */
export function getLanguagesByFamily(): Record<string, LanguageHubData[]> {
  const families: Record<string, LanguageHubData[]> = {};

  for (const lang of Object.values(LANGUAGE_HUB_DATA)) {
    if (!families[lang.familyGroup]) {
      families[lang.familyGroup] = [];
    }
    families[lang.familyGroup].push(lang);
  }

  return families;
}

/**
 * Get languages sorted by difficulty
 */
export function getLanguagesByDifficulty(): LanguageHubData[] {
  return Object.values(LANGUAGE_HUB_DATA).sort(
    (a, b) => a.difficultyRating - b.difficultyRating
  );
}
