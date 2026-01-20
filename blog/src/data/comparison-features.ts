// Shared feature data for comparison pages
// Ensures consistency across all competitor comparison pages
// Supports multiple languages: en, es, fr

export interface Feature {
  name: string;
  loveLanguages: { value: string; highlight: boolean };
  competitor: { value: string; highlight: boolean };
}

export interface SummaryItem {
  text: string;
  positive: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ComparisonPageContent {
  // Page metadata
  title: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;

  // Section headings
  whatMakesDifferent: string;
  featureComparison: string;
  builtForLearning: string;
  readyToLearn: string;
  otherComparisons: string;
  allComparisons: string;

  // Labels
  bestForCouples: string;

  // CTA
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  ctaFooter: string;

  // Footer
  footerTagline: string;
  blog: string;
  tools: string;
  compare: string;
  terms: string;
  privacy: string;
}

export interface ComparisonContent {
  page: ComparisonPageContent;
  loveLanguagesSummary: SummaryItem[];
  chooseLoveLanguages: string[];

  // Duolingo specific
  duolingoFeatures: Feature[];
  duolingoSummary: SummaryItem[];
  duolingoSubtitle: string;
  chooseDuolingo: string[];
  duolingoFaqs: FAQItem[];

  // Babbel specific
  babbelFeatures: Feature[];
  babbelSummary: SummaryItem[];
  babbelSubtitle: string;
  chooseBabbel: string[];
  babbelFaqs: FAQItem[];

  // Feature cards
  listenMode: { title: string; description: string };
  partnerChallenges: { title: string; description: string };
  wordGifts: { title: string; description: string };
  gameModes: { title: string; description: string };
  loveLog: { title: string; description: string };
  progressXP: { title: string; description: string };
  languages18: { title: string; description: string };

  // Choose sections
  chooseLoveLanguagesTitle: string;
  chooseDuolingoTitle: string;
  chooseBabbelTitle: string;
}

// English content
const EN_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - The Only App Built for Couples",
    description: "See why couples choose Love Languages over {competitor}. AI conversations, Listen Mode, partner challenges, and 18 languages designed for learning together.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "One is built for couples. One isn't. Here's what that means for your language journey.",
    whatMakesDifferent: "Why Couples Switch to Love Languages",
    featureComparison: "Side-by-Side Comparison",
    builtForLearning: "Features That Actually Work for Couples",
    readyToLearn: "Start Learning Together",
    otherComparisons: "Other Comparisons",
    allComparisons: "All Comparisons",
    bestForCouples: "Built for couples",
    ctaTitle: "Your Partner's Language, Together",
    ctaSubtitle: "18 languages. AI that adapts to you. Features designed for two. This is how couples actually learn.",
    ctaButton: "Try It Free",
    ctaFooter: "Join 10,000+ couples learning together",
    footerTagline: "The language app for couples",
    blog: "Blog",
    tools: "Tools",
    compare: "Compare",
    terms: "Terms",
    privacy: "Privacy"
  },
  loveLanguagesSummary: [
    { text: "18 languages, any direction", positive: true },
    { text: "AI conversations that adapt to you", positive: true },
    { text: "Listen Mode captures real conversations", positive: true },
    { text: "Challenge and gift features for couples", positive: true }
  ],
  chooseLoveLanguages: [
    "You're learning your partner's native language",
    "You want to actually speak, not just tap answers",
    "You learn better with someone by your side",
    "You're meeting the family or moving abroad",
    "You want to make language learning a shared activity"
  ],
  chooseLoveLanguagesTitle: "Love Languages is for you if...",

  // Duolingo
  duolingoFeatures: [
    { name: "Languages", loveLanguages: { value: "18 (any combination)", highlight: true }, competitor: { value: "40+ (one direction)", highlight: false } },
    { name: "Couple Features", loveLanguages: { value: "Challenges, gifts, shared progress", highlight: true }, competitor: { value: "None", highlight: false } },
    { name: "AI Conversations", loveLanguages: { value: "Real-time with Gemini AI", highlight: true }, competitor: { value: "Scripted responses", highlight: false } },
    { name: "Voice Practice", loveLanguages: { value: "Speak naturally with AI", highlight: true }, competitor: { value: "Repeat set phrases", highlight: false } },
    { name: "Listen Mode", loveLanguages: { value: "Capture & translate live speech", highlight: true }, competitor: { value: "No", highlight: false } },
    { name: "Learning Style", loveLanguages: { value: "Conversation-focused", highlight: true }, competitor: { value: "Translation drills", highlight: false } },
    { name: "Vocabulary", loveLanguages: { value: "Personal Love Log", highlight: true }, competitor: { value: "Course-locked", highlight: false } },
    { name: "Best For", loveLanguages: { value: "Couples, real conversations", highlight: true }, competitor: { value: "Solo, casual learning", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Free tier with ads", positive: true },
    { text: "Streak-based motivation", positive: true },
    { text: "Same format for every language", positive: false },
    { text: "Zero couple features", positive: false }
  ],
  duolingoSubtitle: "Solo gamified learning",
  chooseDuolingo: [
    "You want free and don't mind ads",
    "You learn alone",
    "You like collecting streaks more than speaking",
    "5 minutes a day is your max commitment"
  ],
  chooseDuolingoTitle: "Duolingo might work if...",
  duolingoFaqs: [
    { question: "Can Duolingo help me talk to my partner's family?", answer: "Duolingo teaches you to translate sentences. Love Languages teaches you to have conversations. If you need to actually speak with your partner's family, you need practice speaking - not matching exercises." },
    { question: "Why is Love Languages better for couples?", answer: "Because it's built for couples. Send your partner vocabulary gifts. Challenge each other to games. Learn while doing dishes with Listen Mode. Track progress together. Duolingo has none of this." },
    { question: "Is the free tier of Duolingo enough?", answer: "For casual vocabulary, sure. For actually speaking your partner's language? You need real conversation practice. Love Languages uses AI to have real conversations with you - in 18 languages." },
    { question: "Should I use both apps?", answer: "Some people do. Use Duolingo for 5-minute breaks. Use Love Languages when you're serious about speaking. One gives you streaks. One gives you skills." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Languages", loveLanguages: { value: "18 (any combination)", highlight: true }, competitor: { value: "14 (limited pairs)", highlight: false } },
    { name: "Couple Features", loveLanguages: { value: "Challenges, gifts, shared progress", highlight: true }, competitor: { value: "None", highlight: false } },
    { name: "AI Conversations", loveLanguages: { value: "Real-time with Gemini AI", highlight: true }, competitor: { value: "Pre-recorded lessons", highlight: false } },
    { name: "Voice Practice", loveLanguages: { value: "Speak naturally with AI", highlight: true }, competitor: { value: "Pronunciation drills", highlight: false } },
    { name: "Listen Mode", loveLanguages: { value: "Capture & translate live speech", highlight: true }, competitor: { value: "Podcasts only", highlight: false } },
    { name: "Personalization", loveLanguages: { value: "AI adapts in real-time", highlight: true }, competitor: { value: "Fixed lesson order", highlight: false } },
    { name: "Learning Style", loveLanguages: { value: "Conversation-first", highlight: true }, competitor: { value: "Grammar-first", highlight: false } },
    { name: "Best For", loveLanguages: { value: "Couples, real conversations", highlight: true }, competitor: { value: "Solo, structured study", highlight: false } }
  ],
  babbelSummary: [
    { text: "Linguist-designed courses", positive: true },
    { text: "Structured progression", positive: true },
    { text: "Only 14 languages", positive: false },
    { text: "Zero couple features", positive: false }
  ],
  babbelSubtitle: "Solo structured courses",
  chooseBabbel: [
    "You prefer following a fixed curriculum",
    "You're learning alone for work",
    "You like textbook-style progression",
    "You want lifetime access for one price"
  ],
  chooseBabbelTitle: "Babbel might work if...",
  babbelFaqs: [
    { question: "Is Babbel good for learning with my partner?", answer: "Babbel is designed for one person following one curriculum. No shared features, no challenges, no way to learn together. Love Languages is built specifically for couples." },
    { question: "What makes Love Languages different from Babbel?", answer: "Babbel gives you lessons. Love Languages gives you conversations. Our AI adapts to your level in real-time. Send your partner word gifts. Challenge them to vocabulary battles. Learn hands-free with Listen Mode." },
    { question: "Which has better conversation practice?", answer: "Love Languages, by far. Babbel has scripted dialogues. We have AI that actually responds to what you say, corrects your mistakes, and helps you speak naturally." },
    { question: "Can I switch from Babbel?", answer: "Yes. Many couples switch when they realize they can read a menu but can't have a conversation. Love Languages focuses on speaking from day one." }
  ],

  // Feature cards
  listenMode: { title: "Listen Mode", description: "Capture real conversations around you. Hear your partner speak, get instant translations and explanations. Learn from the language happening in your life." },
  partnerChallenges: { title: "Partner Challenges", description: "Send vocabulary challenges to your partner. Quiz each other, earn points together, make learning something you do as a team." },
  wordGifts: { title: "Word Gifts", description: "Send your partner a beautiful word or phrase. A small surprise that shows you're thinking of them - and their language." },
  gameModes: { title: "5 Game Modes", description: "Flashcards, listening games, speaking challenges. Designed for two people, not one person with a streak." },
  loveLog: { title: "Love Log", description: "Every word you learn, saved. Review together, quiz each other, watch your shared vocabulary grow." },
  progressXP: { title: "Progress & XP", description: "Level up together. See who's putting in the work. A little competition makes learning stick." },
  languages18: { title: "18 Languages", description: "Learn Polish from Spanish. Korean from French. Any language, any direction. Your relationship, your choice." }
};

// Spanish content
const ES_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - La Única App Hecha para Parejas",
    description: "Descubre por qué las parejas eligen Love Languages sobre {competitor}. Conversaciones con IA, Modo Escucha, desafíos de pareja y 18 idiomas diseñados para aprender juntos.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Una está hecha para parejas. La otra no. Esto es lo que significa para tu viaje lingüístico.",
    whatMakesDifferent: "Por Qué las Parejas Eligen Love Languages",
    featureComparison: "Comparación Directa",
    builtForLearning: "Funciones Que Realmente Sirven para Parejas",
    readyToLearn: "Empezar a Aprender Juntos",
    otherComparisons: "Otras Comparaciones",
    allComparisons: "Todas las Comparaciones",
    bestForCouples: "Hecha para parejas",
    ctaTitle: "El Idioma de Tu Pareja, Juntos",
    ctaSubtitle: "18 idiomas. IA que se adapta a ti. Funciones diseñadas para dos. Así es como las parejas realmente aprenden.",
    ctaButton: "Pruébalo Gratis",
    ctaFooter: "Únete a más de 10,000 parejas aprendiendo juntas",
    footerTagline: "La app de idiomas para parejas",
    blog: "Blog",
    tools: "Herramientas",
    compare: "Comparar",
    terms: "Términos",
    privacy: "Privacidad"
  },
  loveLanguagesSummary: [
    { text: "18 idiomas, cualquier dirección", positive: true },
    { text: "Conversaciones con IA que se adaptan a ti", positive: true },
    { text: "Modo Escucha captura conversaciones reales", positive: true },
    { text: "Desafíos y regalos para parejas", positive: true }
  ],
  chooseLoveLanguages: [
    "Estás aprendiendo el idioma nativo de tu pareja",
    "Quieres hablar de verdad, no solo tocar respuestas",
    "Aprendes mejor con alguien a tu lado",
    "Vas a conocer a la familia o mudarte al extranjero",
    "Quieres hacer del aprendizaje una actividad compartida"
  ],
  chooseLoveLanguagesTitle: "Love Languages es para ti si...",

  // Duolingo
  duolingoFeatures: [
    { name: "Idiomas", loveLanguages: { value: "18 (cualquier combinación)", highlight: true }, competitor: { value: "40+ (una dirección)", highlight: false } },
    { name: "Funciones de Pareja", loveLanguages: { value: "Desafíos, regalos, progreso compartido", highlight: true }, competitor: { value: "Ninguna", highlight: false } },
    { name: "Conversaciones IA", loveLanguages: { value: "Tiempo real con Gemini AI", highlight: true }, competitor: { value: "Respuestas programadas", highlight: false } },
    { name: "Práctica de Voz", loveLanguages: { value: "Habla naturalmente con IA", highlight: true }, competitor: { value: "Repite frases fijas", highlight: false } },
    { name: "Modo Escucha", loveLanguages: { value: "Captura y traduce voz en vivo", highlight: true }, competitor: { value: "No", highlight: false } },
    { name: "Estilo de Aprendizaje", loveLanguages: { value: "Enfocado en conversación", highlight: true }, competitor: { value: "Ejercicios de traducción", highlight: false } },
    { name: "Vocabulario", loveLanguages: { value: "Love Log personal", highlight: true }, competitor: { value: "Bloqueado por curso", highlight: false } },
    { name: "Ideal Para", loveLanguages: { value: "Parejas, conversaciones reales", highlight: true }, competitor: { value: "Individual, aprendizaje casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Nivel gratis con anuncios", positive: true },
    { text: "Motivación por rachas", positive: true },
    { text: "Mismo formato para todos los idiomas", positive: false },
    { text: "Cero funciones para parejas", positive: false }
  ],
  duolingoSubtitle: "Aprendizaje individual gamificado",
  chooseDuolingo: [
    "Quieres gratis y no te importan los anuncios",
    "Aprendes solo/a",
    "Te gusta más coleccionar rachas que hablar",
    "5 minutos al día es tu máximo compromiso"
  ],
  chooseDuolingoTitle: "Duolingo podría servir si...",
  duolingoFaqs: [
    { question: "¿Puede Duolingo ayudarme a hablar con la familia de mi pareja?", answer: "Duolingo te enseña a traducir oraciones. Love Languages te enseña a tener conversaciones. Si necesitas hablar con la familia de tu pareja, necesitas practicar hablando - no ejercicios de emparejar." },
    { question: "¿Por qué Love Languages es mejor para parejas?", answer: "Porque está hecha para parejas. Envía regalos de vocabulario a tu pareja. Desafíense en juegos. Aprende mientras lavas los platos con Modo Escucha. Sigue el progreso juntos. Duolingo no tiene nada de esto." },
    { question: "¿Es suficiente el nivel gratis de Duolingo?", answer: "Para vocabulario casual, sí. ¿Para hablar el idioma de tu pareja? Necesitas práctica de conversación real. Love Languages usa IA para tener conversaciones reales contigo - en 18 idiomas." },
    { question: "¿Debería usar ambas apps?", answer: "Algunos lo hacen. Usa Duolingo para descansos de 5 minutos. Usa Love Languages cuando quieras hablar en serio. Una te da rachas. La otra te da habilidades." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Idiomas", loveLanguages: { value: "18 (cualquier combinación)", highlight: true }, competitor: { value: "14 (pares limitados)", highlight: false } },
    { name: "Funciones de Pareja", loveLanguages: { value: "Desafíos, regalos, progreso compartido", highlight: true }, competitor: { value: "Ninguna", highlight: false } },
    { name: "Conversaciones IA", loveLanguages: { value: "Tiempo real con Gemini AI", highlight: true }, competitor: { value: "Lecciones pregrabadas", highlight: false } },
    { name: "Práctica de Voz", loveLanguages: { value: "Habla naturalmente con IA", highlight: true }, competitor: { value: "Ejercicios de pronunciación", highlight: false } },
    { name: "Modo Escucha", loveLanguages: { value: "Captura y traduce voz en vivo", highlight: true }, competitor: { value: "Solo podcasts", highlight: false } },
    { name: "Personalización", loveLanguages: { value: "IA se adapta en tiempo real", highlight: true }, competitor: { value: "Orden de lecciones fijo", highlight: false } },
    { name: "Estilo de Aprendizaje", loveLanguages: { value: "Conversación primero", highlight: true }, competitor: { value: "Gramática primero", highlight: false } },
    { name: "Ideal Para", loveLanguages: { value: "Parejas, conversaciones reales", highlight: true }, competitor: { value: "Individual, estudio estructurado", highlight: false } }
  ],
  babbelSummary: [
    { text: "Cursos diseñados por lingüistas", positive: true },
    { text: "Progresión estructurada", positive: true },
    { text: "Solo 14 idiomas", positive: false },
    { text: "Cero funciones para parejas", positive: false }
  ],
  babbelSubtitle: "Cursos estructurados individuales",
  chooseBabbel: [
    "Prefieres seguir un currículum fijo",
    "Aprendes solo/a para trabajo",
    "Te gusta la progresión estilo libro de texto",
    "Quieres acceso de por vida por un solo pago"
  ],
  chooseBabbelTitle: "Babbel podría servir si...",
  babbelFaqs: [
    { question: "¿Es Babbel bueno para aprender con mi pareja?", answer: "Babbel está diseñado para una persona siguiendo un currículum. Sin funciones compartidas, sin desafíos, sin forma de aprender juntos. Love Languages está hecho específicamente para parejas." },
    { question: "¿Qué hace diferente a Love Languages de Babbel?", answer: "Babbel te da lecciones. Love Languages te da conversaciones. Nuestra IA se adapta a tu nivel en tiempo real. Envía regalos de palabras a tu pareja. Desafíale a batallas de vocabulario. Aprende sin manos con Modo Escucha." },
    { question: "¿Cuál tiene mejor práctica de conversación?", answer: "Love Languages, sin duda. Babbel tiene diálogos programados. Nosotros tenemos IA que realmente responde a lo que dices, corrige tus errores y te ayuda a hablar naturalmente." },
    { question: "¿Puedo cambiar de Babbel?", answer: "Sí. Muchas parejas cambian cuando se dan cuenta de que pueden leer un menú pero no mantener una conversación. Love Languages se enfoca en hablar desde el día uno." }
  ],

  // Feature cards
  listenMode: { title: "Modo Escucha", description: "Captura conversaciones reales a tu alrededor. Escucha a tu pareja hablar, obtén traducciones y explicaciones instantáneas. Aprende del idioma que ocurre en tu vida." },
  partnerChallenges: { title: "Desafíos de Pareja", description: "Envía desafíos de vocabulario a tu pareja. Pregúntense mutuamente, ganen puntos juntos, hagan del aprendizaje algo que hacen en equipo." },
  wordGifts: { title: "Regalos de Palabras", description: "Envía a tu pareja una palabra o frase hermosa. Una pequeña sorpresa que muestra que piensas en ellos - y en su idioma." },
  gameModes: { title: "5 Modos de Juego", description: "Tarjetas, juegos de escucha, desafíos de habla. Diseñados para dos personas, no para una persona con una racha." },
  loveLog: { title: "Love Log", description: "Cada palabra que aprendes, guardada. Repasa juntos, pregúntense, vean crecer su vocabulario compartido." },
  progressXP: { title: "Progreso y XP", description: "Sube de nivel juntos. Ve quién está poniendo el esfuerzo. Un poco de competencia hace que el aprendizaje se quede." },
  languages18: { title: "18 Idiomas", description: "Aprende polaco desde español. Coreano desde francés. Cualquier idioma, cualquier dirección. Tu relación, tu elección." }
};

// French content
const FR_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - La Seule App Conçue pour les Couples",
    description: "Découvrez pourquoi les couples choisissent Love Languages plutôt que {competitor}. Conversations IA, Mode Écoute, défis de couple et 18 langues conçus pour apprendre ensemble.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "L'une est conçue pour les couples. L'autre non. Voici ce que ça change pour votre apprentissage.",
    whatMakesDifferent: "Pourquoi les Couples Choisissent Love Languages",
    featureComparison: "Comparaison Directe",
    builtForLearning: "Fonctionnalités Qui Marchent Vraiment pour les Couples",
    readyToLearn: "Commencer à Apprendre Ensemble",
    otherComparisons: "Autres Comparaisons",
    allComparisons: "Toutes les Comparaisons",
    bestForCouples: "Conçue pour les couples",
    ctaTitle: "La Langue de Votre Partenaire, Ensemble",
    ctaSubtitle: "18 langues. Une IA qui s'adapte à vous. Des fonctionnalités pour deux. C'est comme ça que les couples apprennent vraiment.",
    ctaButton: "Essayer Gratuitement",
    ctaFooter: "Rejoignez plus de 10 000 couples qui apprennent ensemble",
    footerTagline: "L'app de langues pour les couples",
    blog: "Blog",
    tools: "Outils",
    compare: "Comparer",
    terms: "Conditions",
    privacy: "Confidentialité"
  },
  loveLanguagesSummary: [
    { text: "18 langues, toutes directions", positive: true },
    { text: "Conversations IA qui s'adaptent à vous", positive: true },
    { text: "Mode Écoute capture les vraies conversations", positive: true },
    { text: "Défis et cadeaux pour couples", positive: true }
  ],
  chooseLoveLanguages: [
    "Vous apprenez la langue maternelle de votre partenaire",
    "Vous voulez vraiment parler, pas juste taper des réponses",
    "Vous apprenez mieux avec quelqu'un à vos côtés",
    "Vous allez rencontrer la famille ou déménager à l'étranger",
    "Vous voulez faire de l'apprentissage une activité partagée"
  ],
  chooseLoveLanguagesTitle: "Love Languages est pour vous si...",

  // Duolingo
  duolingoFeatures: [
    { name: "Langues", loveLanguages: { value: "18 (toute combinaison)", highlight: true }, competitor: { value: "40+ (une direction)", highlight: false } },
    { name: "Fonctionnalités Couple", loveLanguages: { value: "Défis, cadeaux, progrès partagé", highlight: true }, competitor: { value: "Aucune", highlight: false } },
    { name: "Conversations IA", loveLanguages: { value: "Temps réel avec Gemini AI", highlight: true }, competitor: { value: "Réponses scriptées", highlight: false } },
    { name: "Pratique Orale", loveLanguages: { value: "Parlez naturellement avec l'IA", highlight: true }, competitor: { value: "Répétez des phrases fixes", highlight: false } },
    { name: "Mode Écoute", loveLanguages: { value: "Capture et traduit la voix en direct", highlight: true }, competitor: { value: "Non", highlight: false } },
    { name: "Style d'Apprentissage", loveLanguages: { value: "Axé sur la conversation", highlight: true }, competitor: { value: "Exercices de traduction", highlight: false } },
    { name: "Vocabulaire", loveLanguages: { value: "Love Log personnel", highlight: true }, competitor: { value: "Bloqué par cours", highlight: false } },
    { name: "Idéal Pour", loveLanguages: { value: "Couples, vraies conversations", highlight: true }, competitor: { value: "Solo, apprentissage casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Niveau gratuit avec pubs", positive: true },
    { text: "Motivation par séries", positive: true },
    { text: "Même format pour toutes les langues", positive: false },
    { text: "Zéro fonctionnalité couple", positive: false }
  ],
  duolingoSubtitle: "Apprentissage solo gamifié",
  chooseDuolingo: [
    "Vous voulez gratuit et les pubs ne vous dérangent pas",
    "Vous apprenez seul(e)",
    "Vous préférez collectionner des séries plutôt que parler",
    "5 minutes par jour c'est votre max"
  ],
  chooseDuolingoTitle: "Duolingo peut convenir si...",
  duolingoFaqs: [
    { question: "Duolingo peut-il m'aider à parler avec la famille de mon/ma partenaire ?", answer: "Duolingo vous apprend à traduire des phrases. Love Languages vous apprend à avoir des conversations. Si vous devez vraiment parler avec la famille de votre partenaire, vous avez besoin de pratiquer la parole - pas des exercices d'association." },
    { question: "Pourquoi Love Languages est-il meilleur pour les couples ?", answer: "Parce qu'il est conçu pour les couples. Envoyez des cadeaux de vocabulaire à votre partenaire. Défiez-vous dans des jeux. Apprenez en faisant la vaisselle avec le Mode Écoute. Suivez votre progression ensemble. Duolingo n'a rien de tout ça." },
    { question: "Le niveau gratuit de Duolingo suffit-il ?", answer: "Pour du vocabulaire casual, oui. Pour vraiment parler la langue de votre partenaire ? Vous avez besoin de vraie pratique de conversation. Love Languages utilise l'IA pour avoir de vraies conversations avec vous - dans 18 langues." },
    { question: "Devrais-je utiliser les deux apps ?", answer: "Certains le font. Utilisez Duolingo pour des pauses de 5 minutes. Utilisez Love Languages quand vous voulez vraiment parler. L'une vous donne des séries. L'autre vous donne des compétences." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Langues", loveLanguages: { value: "18 (toute combinaison)", highlight: true }, competitor: { value: "14 (paires limitées)", highlight: false } },
    { name: "Fonctionnalités Couple", loveLanguages: { value: "Défis, cadeaux, progrès partagé", highlight: true }, competitor: { value: "Aucune", highlight: false } },
    { name: "Conversations IA", loveLanguages: { value: "Temps réel avec Gemini AI", highlight: true }, competitor: { value: "Leçons préenregistrées", highlight: false } },
    { name: "Pratique Orale", loveLanguages: { value: "Parlez naturellement avec l'IA", highlight: true }, competitor: { value: "Exercices de prononciation", highlight: false } },
    { name: "Mode Écoute", loveLanguages: { value: "Capture et traduit la voix en direct", highlight: true }, competitor: { value: "Podcasts seulement", highlight: false } },
    { name: "Personnalisation", loveLanguages: { value: "L'IA s'adapte en temps réel", highlight: true }, competitor: { value: "Ordre de leçons fixe", highlight: false } },
    { name: "Style d'Apprentissage", loveLanguages: { value: "Conversation d'abord", highlight: true }, competitor: { value: "Grammaire d'abord", highlight: false } },
    { name: "Idéal Pour", loveLanguages: { value: "Couples, vraies conversations", highlight: true }, competitor: { value: "Solo, étude structurée", highlight: false } }
  ],
  babbelSummary: [
    { text: "Cours conçus par des linguistes", positive: true },
    { text: "Progression structurée", positive: true },
    { text: "Seulement 14 langues", positive: false },
    { text: "Zéro fonctionnalité couple", positive: false }
  ],
  babbelSubtitle: "Cours structurés solo",
  chooseBabbel: [
    "Vous préférez suivre un programme fixe",
    "Vous apprenez seul(e) pour le travail",
    "Vous aimez la progression style manuel",
    "Vous voulez un accès à vie pour un seul paiement"
  ],
  chooseBabbelTitle: "Babbel peut convenir si...",
  babbelFaqs: [
    { question: "Babbel est-il bon pour apprendre avec mon/ma partenaire ?", answer: "Babbel est conçu pour une personne suivant un programme. Pas de fonctionnalités partagées, pas de défis, pas de moyen d'apprendre ensemble. Love Languages est fait spécifiquement pour les couples." },
    { question: "Qu'est-ce qui différencie Love Languages de Babbel ?", answer: "Babbel vous donne des leçons. Love Languages vous donne des conversations. Notre IA s'adapte à votre niveau en temps réel. Envoyez des cadeaux de mots à votre partenaire. Défiez-le/la à des batailles de vocabulaire. Apprenez mains libres avec le Mode Écoute." },
    { question: "Lequel a la meilleure pratique de conversation ?", answer: "Love Languages, de loin. Babbel a des dialogues scriptés. Nous avons une IA qui répond vraiment à ce que vous dites, corrige vos erreurs et vous aide à parler naturellement." },
    { question: "Puis-je passer de Babbel à Love Languages ?", answer: "Oui. Beaucoup de couples changent quand ils réalisent qu'ils peuvent lire un menu mais pas tenir une conversation. Love Languages se concentre sur parler dès le premier jour." }
  ],

  // Feature cards
  listenMode: { title: "Mode Écoute", description: "Capturez les vraies conversations autour de vous. Écoutez votre partenaire parler, obtenez des traductions et explications instantanées. Apprenez de la langue qui se passe dans votre vie." },
  partnerChallenges: { title: "Défis de Couple", description: "Envoyez des défis de vocabulaire à votre partenaire. Interrogez-vous mutuellement, gagnez des points ensemble, faites de l'apprentissage quelque chose que vous faites en équipe." },
  wordGifts: { title: "Cadeaux de Mots", description: "Envoyez à votre partenaire un beau mot ou une phrase. Une petite surprise qui montre que vous pensez à lui/elle - et à sa langue." },
  gameModes: { title: "5 Modes de Jeu", description: "Flashcards, jeux d'écoute, défis de parole. Conçus pour deux personnes, pas pour une personne avec une série." },
  loveLog: { title: "Love Log", description: "Chaque mot que vous apprenez, sauvegardé. Révisez ensemble, interrogez-vous, regardez votre vocabulaire partagé grandir." },
  progressXP: { title: "Progrès et XP", description: "Montez de niveau ensemble. Voyez qui fait des efforts. Un peu de compétition aide l'apprentissage à rester." },
  languages18: { title: "18 Langues", description: "Apprenez le polonais depuis l'espagnol. Le coréen depuis le français. N'importe quelle langue, n'importe quelle direction. Votre relation, votre choix." }
};

// Content map
const CONTENT_MAP: Record<string, ComparisonContent> = {
  en: EN_CONTENT,
  es: ES_CONTENT,
  fr: FR_CONTENT
};

// Get content for a specific language
export function getComparisonContent(lang: string = 'en'): ComparisonContent {
  return CONTENT_MAP[lang] || EN_CONTENT;
}

// Legacy exports for backwards compatibility (English)
export const LOVE_LANGUAGES_HIGHLIGHTS = {
  languages: "18 languages supported",
  languageDetail: "Any native language → any target language",
  couples: "Built for couples learning together",
  ai: "Advanced AI tutor (Google Gemini)",
  voice: "Real-time voice conversations",
  listenMode: "Listen Mode for passive learning",
  partnerChallenges: "Partner challenges & competitions",
  wordGifts: "Send word gifts to your partner",
  games: "5 interactive game modes",
  loveLog: "Personal Love Log vocabulary tracker",
  progress: "XP system, levels & achievements",
  culture: "Deep cultural context for each language"
};

export const LOVE_LANGUAGES_SUMMARY = EN_CONTENT.loveLanguagesSummary;
export const CHOOSE_LOVE_LANGUAGES = EN_CONTENT.chooseLoveLanguages;
export const DUOLINGO_FEATURES = EN_CONTENT.duolingoFeatures;
export const DUOLINGO_SUMMARY = EN_CONTENT.duolingoSummary;
export const CHOOSE_DUOLINGO = EN_CONTENT.chooseDuolingo;
export const DUOLINGO_FAQS = EN_CONTENT.duolingoFaqs;
export const BABBEL_FEATURES = EN_CONTENT.babbelFeatures;
export const BABBEL_SUMMARY = EN_CONTENT.babbelSummary;
export const CHOOSE_BABBEL = EN_CONTENT.chooseBabbel;
export const BABBEL_FAQS = EN_CONTENT.babbelFaqs;
