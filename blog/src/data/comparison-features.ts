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

// German content
const DE_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Die Einzige App für Paare",
    description: "Erfahren Sie, warum Paare Love Languages statt {competitor} wählen. KI-Gespräche, Hörmodus, Partner-Challenges und 18 Sprachen für gemeinsames Lernen.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Eine ist für Paare gemacht. Die andere nicht. Das bedeutet das für Ihre Sprachreise.",
    whatMakesDifferent: "Warum Paare zu Love Languages Wechseln",
    featureComparison: "Direkter Vergleich",
    builtForLearning: "Funktionen, die Wirklich für Paare Funktionieren",
    readyToLearn: "Gemeinsam Lernen Starten",
    otherComparisons: "Andere Vergleiche",
    allComparisons: "Alle Vergleiche",
    bestForCouples: "Für Paare entwickelt",
    ctaTitle: "Die Sprache Ihres Partners, Gemeinsam",
    ctaSubtitle: "18 Sprachen. KI, die sich anpasst. Funktionen für zwei. So lernen Paare wirklich.",
    ctaButton: "Kostenlos Testen",
    ctaFooter: "Schließen Sie sich über 10.000 Paaren an, die zusammen lernen",
    footerTagline: "Die Sprach-App für Paare",
    blog: "Blog",
    tools: "Werkzeuge",
    compare: "Vergleichen",
    terms: "AGB",
    privacy: "Datenschutz"
  },
  loveLanguagesSummary: [
    { text: "18 Sprachen, jede Richtung", positive: true },
    { text: "KI-Gespräche, die sich anpassen", positive: true },
    { text: "Hörmodus erfasst echte Gespräche", positive: true },
    { text: "Challenge- und Geschenk-Funktionen für Paare", positive: true }
  ],
  chooseLoveLanguages: [
    "Sie lernen die Muttersprache Ihres Partners",
    "Sie wollen wirklich sprechen, nicht nur Antworten tippen",
    "Sie lernen besser mit jemandem an Ihrer Seite",
    "Sie treffen die Familie oder ziehen ins Ausland",
    "Sie wollen Sprachenlernen zu einer gemeinsamen Aktivität machen"
  ],
  chooseLoveLanguagesTitle: "Love Languages ist für Sie, wenn...",

  // Duolingo
  duolingoFeatures: [
    { name: "Sprachen", loveLanguages: { value: "18 (jede Kombination)", highlight: true }, competitor: { value: "40+ (eine Richtung)", highlight: false } },
    { name: "Paar-Funktionen", loveLanguages: { value: "Challenges, Geschenke, geteilter Fortschritt", highlight: true }, competitor: { value: "Keine", highlight: false } },
    { name: "KI-Gespräche", loveLanguages: { value: "Echtzeit mit Gemini AI", highlight: true }, competitor: { value: "Vorgefertigte Antworten", highlight: false } },
    { name: "Sprachübung", loveLanguages: { value: "Natürlich mit KI sprechen", highlight: true }, competitor: { value: "Feste Phrasen wiederholen", highlight: false } },
    { name: "Hörmodus", loveLanguages: { value: "Erfasst & übersetzt Live-Sprache", highlight: true }, competitor: { value: "Nein", highlight: false } },
    { name: "Lernstil", loveLanguages: { value: "Gesprächsorientiert", highlight: true }, competitor: { value: "Übersetzungsübungen", highlight: false } },
    { name: "Vokabular", loveLanguages: { value: "Persönliches Love Log", highlight: true }, competitor: { value: "Kursgebunden", highlight: false } },
    { name: "Ideal für", loveLanguages: { value: "Paare, echte Gespräche", highlight: true }, competitor: { value: "Solo, lockeres Lernen", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Kostenloses Level mit Werbung", positive: true },
    { text: "Streak-basierte Motivation", positive: true },
    { text: "Gleiches Format für alle Sprachen", positive: false },
    { text: "Keine Paar-Funktionen", positive: false }
  ],
  duolingoSubtitle: "Gamifiziertes Solo-Lernen",
  chooseDuolingo: [
    "Sie wollen kostenlos und Werbung stört nicht",
    "Sie lernen alleine",
    "Sie sammeln lieber Streaks als zu sprechen",
    "5 Minuten pro Tag ist Ihr Maximum"
  ],
  chooseDuolingoTitle: "Duolingo könnte passen, wenn...",
  duolingoFaqs: [
    { question: "Kann Duolingo mir helfen, mit der Familie meines Partners zu sprechen?", answer: "Duolingo lehrt Sie, Sätze zu übersetzen. Love Languages lehrt Sie, Gespräche zu führen. Wenn Sie wirklich mit der Familie Ihres Partners sprechen müssen, brauchen Sie Sprechübung - keine Zuordnungsübungen." },
    { question: "Warum ist Love Languages besser für Paare?", answer: "Weil es für Paare gemacht ist. Senden Sie Ihrem Partner Vokabel-Geschenke. Fordern Sie sich gegenseitig in Spielen heraus. Lernen Sie beim Abwaschen mit dem Hörmodus. Verfolgen Sie den Fortschritt gemeinsam. Duolingo hat nichts davon." },
    { question: "Reicht das kostenlose Level von Duolingo?", answer: "Für lockeres Vokabular, ja. Um die Sprache Ihres Partners wirklich zu sprechen? Sie brauchen echte Gesprächsübung. Love Languages nutzt KI für echte Gespräche - in 18 Sprachen." },
    { question: "Sollte ich beide Apps nutzen?", answer: "Manche tun das. Nutzen Sie Duolingo für 5-Minuten-Pausen. Nutzen Sie Love Languages, wenn Sie ernsthaft sprechen wollen. Eine gibt Ihnen Streaks. Die andere gibt Ihnen Fähigkeiten." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Sprachen", loveLanguages: { value: "18 (jede Kombination)", highlight: true }, competitor: { value: "14 (begrenzte Paare)", highlight: false } },
    { name: "Paar-Funktionen", loveLanguages: { value: "Challenges, Geschenke, geteilter Fortschritt", highlight: true }, competitor: { value: "Keine", highlight: false } },
    { name: "KI-Gespräche", loveLanguages: { value: "Echtzeit mit Gemini AI", highlight: true }, competitor: { value: "Voraufgezeichnete Lektionen", highlight: false } },
    { name: "Sprachübung", loveLanguages: { value: "Natürlich mit KI sprechen", highlight: true }, competitor: { value: "Ausspracheübungen", highlight: false } },
    { name: "Hörmodus", loveLanguages: { value: "Erfasst & übersetzt Live-Sprache", highlight: true }, competitor: { value: "Nur Podcasts", highlight: false } },
    { name: "Personalisierung", loveLanguages: { value: "KI passt sich in Echtzeit an", highlight: true }, competitor: { value: "Feste Lektionsreihenfolge", highlight: false } },
    { name: "Lernstil", loveLanguages: { value: "Gespräch zuerst", highlight: true }, competitor: { value: "Grammatik zuerst", highlight: false } },
    { name: "Ideal für", loveLanguages: { value: "Paare, echte Gespräche", highlight: true }, competitor: { value: "Solo, strukturiertes Lernen", highlight: false } }
  ],
  babbelSummary: [
    { text: "Von Linguisten entwickelte Kurse", positive: true },
    { text: "Strukturierter Fortschritt", positive: true },
    { text: "Nur 14 Sprachen", positive: false },
    { text: "Keine Paar-Funktionen", positive: false }
  ],
  babbelSubtitle: "Strukturierte Solo-Kurse",
  chooseBabbel: [
    "Sie bevorzugen einen festen Lehrplan",
    "Sie lernen alleine für die Arbeit",
    "Sie mögen Lehrbuch-Progression",
    "Sie wollen lebenslangen Zugang für einen Preis"
  ],
  chooseBabbelTitle: "Babbel könnte passen, wenn...",
  babbelFaqs: [
    { question: "Ist Babbel gut zum Lernen mit meinem Partner?", answer: "Babbel ist für eine Person mit einem Lehrplan konzipiert. Keine geteilten Funktionen, keine Challenges, keine Möglichkeit zusammen zu lernen. Love Languages ist speziell für Paare gemacht." },
    { question: "Was unterscheidet Love Languages von Babbel?", answer: "Babbel gibt Ihnen Lektionen. Love Languages gibt Ihnen Gespräche. Unsere KI passt sich Ihrem Niveau in Echtzeit an. Senden Sie Ihrem Partner Wort-Geschenke. Fordern Sie ihn zu Vokabel-Kämpfen heraus. Lernen Sie freihändig mit dem Hörmodus." },
    { question: "Welche hat bessere Gesprächsübung?", answer: "Love Languages, bei weitem. Babbel hat vorgefertigte Dialoge. Wir haben KI, die wirklich auf das antwortet, was Sie sagen, Ihre Fehler korrigiert und Ihnen hilft, natürlich zu sprechen." },
    { question: "Kann ich von Babbel wechseln?", answer: "Ja. Viele Paare wechseln, wenn sie merken, dass sie eine Speisekarte lesen, aber kein Gespräch führen können. Love Languages konzentriert sich vom ersten Tag an aufs Sprechen." }
  ],

  // Feature cards
  listenMode: { title: "Hörmodus", description: "Erfassen Sie echte Gespräche um Sie herum. Hören Sie Ihren Partner sprechen, erhalten Sie sofortige Übersetzungen und Erklärungen. Lernen Sie von der Sprache in Ihrem Leben." },
  partnerChallenges: { title: "Partner-Challenges", description: "Senden Sie Vokabel-Challenges an Ihren Partner. Testen Sie sich gegenseitig, sammeln Sie gemeinsam Punkte, machen Sie Lernen zu einer Teamaktivität." },
  wordGifts: { title: "Wort-Geschenke", description: "Senden Sie Ihrem Partner ein schönes Wort oder eine Phrase. Eine kleine Überraschung, die zeigt, dass Sie an ihn denken - und an seine Sprache." },
  gameModes: { title: "5 Spielmodi", description: "Karteikarten, Hörspiele, Sprech-Challenges. Für zwei Personen konzipiert, nicht für eine Person mit einem Streak." },
  loveLog: { title: "Love Log", description: "Jedes Wort, das Sie lernen, gespeichert. Gemeinsam wiederholen, sich gegenseitig testen, Ihr gemeinsames Vokabular wachsen sehen." },
  progressXP: { title: "Fortschritt & XP", description: "Gemeinsam aufsteigen. Sehen, wer sich anstrengt. Ein bisschen Wettbewerb hilft beim Lernen." },
  languages18: { title: "18 Sprachen", description: "Lernen Sie Polnisch von Spanisch. Koreanisch von Französisch. Jede Sprache, jede Richtung. Ihre Beziehung, Ihre Wahl." }
};

// Italian content
const IT_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - L'Unica App per Coppie",
    description: "Scopri perché le coppie scelgono Love Languages invece di {competitor}. Conversazioni IA, Modalità Ascolto, sfide di coppia e 18 lingue per imparare insieme.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Una è fatta per le coppie. L'altra no. Ecco cosa significa per il tuo percorso linguistico.",
    whatMakesDifferent: "Perché le Coppie Scelgono Love Languages",
    featureComparison: "Confronto Diretto",
    builtForLearning: "Funzionalità che Funzionano Davvero per le Coppie",
    readyToLearn: "Inizia a Imparare Insieme",
    otherComparisons: "Altri Confronti",
    allComparisons: "Tutti i Confronti",
    bestForCouples: "Progettato per le coppie",
    ctaTitle: "La Lingua del Tuo Partner, Insieme",
    ctaSubtitle: "18 lingue. IA che si adatta. Funzionalità per due. È così che le coppie imparano davvero.",
    ctaButton: "Prova Gratis",
    ctaFooter: "Unisciti a oltre 10.000 coppie che imparano insieme",
    footerTagline: "L'app di lingue per le coppie",
    blog: "Blog",
    tools: "Strumenti",
    compare: "Confronta",
    terms: "Termini",
    privacy: "Privacy"
  },
  loveLanguagesSummary: [
    { text: "18 lingue, qualsiasi direzione", positive: true },
    { text: "Conversazioni IA che si adattano", positive: true },
    { text: "Modalità Ascolto cattura conversazioni reali", positive: true },
    { text: "Funzionalità sfide e regali per coppie", positive: true }
  ],
  chooseLoveLanguages: [
    "Stai imparando la lingua madre del tuo partner",
    "Vuoi parlare davvero, non solo toccare risposte",
    "Impari meglio con qualcuno al tuo fianco",
    "Stai incontrando la famiglia o trasferendoti all'estero",
    "Vuoi rendere l'apprendimento un'attività condivisa"
  ],
  chooseLoveLanguagesTitle: "Love Languages fa per te se...",

  // Duolingo
  duolingoFeatures: [
    { name: "Lingue", loveLanguages: { value: "18 (qualsiasi combinazione)", highlight: true }, competitor: { value: "40+ (una direzione)", highlight: false } },
    { name: "Funzionalità Coppia", loveLanguages: { value: "Sfide, regali, progresso condiviso", highlight: true }, competitor: { value: "Nessuna", highlight: false } },
    { name: "Conversazioni IA", loveLanguages: { value: "Tempo reale con Gemini AI", highlight: true }, competitor: { value: "Risposte predefinite", highlight: false } },
    { name: "Pratica Vocale", loveLanguages: { value: "Parla naturalmente con l'IA", highlight: true }, competitor: { value: "Ripeti frasi fisse", highlight: false } },
    { name: "Modalità Ascolto", loveLanguages: { value: "Cattura e traduce voce dal vivo", highlight: true }, competitor: { value: "No", highlight: false } },
    { name: "Stile di Apprendimento", loveLanguages: { value: "Focalizzato sulla conversazione", highlight: true }, competitor: { value: "Esercizi di traduzione", highlight: false } },
    { name: "Vocabolario", loveLanguages: { value: "Love Log personale", highlight: true }, competitor: { value: "Bloccato per corso", highlight: false } },
    { name: "Ideale Per", loveLanguages: { value: "Coppie, conversazioni reali", highlight: true }, competitor: { value: "Solo, apprendimento casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Livello gratuito con pubblicità", positive: true },
    { text: "Motivazione basata su streak", positive: true },
    { text: "Stesso formato per tutte le lingue", positive: false },
    { text: "Zero funzionalità per coppie", positive: false }
  ],
  duolingoSubtitle: "Apprendimento solo gamificato",
  chooseDuolingo: [
    "Vuoi gratis e la pubblicità non ti disturba",
    "Impari da solo/a",
    "Preferisci collezionare streak che parlare",
    "5 minuti al giorno è il tuo massimo"
  ],
  chooseDuolingoTitle: "Duolingo potrebbe andare se...",
  duolingoFaqs: [
    { question: "Duolingo può aiutarmi a parlare con la famiglia del mio partner?", answer: "Duolingo ti insegna a tradurre frasi. Love Languages ti insegna a conversare. Se devi parlare con la famiglia del tuo partner, hai bisogno di pratica parlata - non esercizi di abbinamento." },
    { question: "Perché Love Languages è meglio per le coppie?", answer: "Perché è fatto per le coppie. Invia regali di vocabolario al tuo partner. Sfidatevi nei giochi. Impara mentre lavi i piatti con la Modalità Ascolto. Monitora i progressi insieme. Duolingo non ha niente di questo." },
    { question: "Il livello gratuito di Duolingo è sufficiente?", answer: "Per vocabolario casual, sì. Per parlare la lingua del tuo partner? Hai bisogno di pratica di conversazione reale. Love Languages usa l'IA per conversazioni reali - in 18 lingue." },
    { question: "Dovrei usare entrambe le app?", answer: "Alcuni lo fanno. Usa Duolingo per pause di 5 minuti. Usa Love Languages quando vuoi parlare seriamente. Una ti dà streak. L'altra ti dà competenze." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Lingue", loveLanguages: { value: "18 (qualsiasi combinazione)", highlight: true }, competitor: { value: "14 (coppie limitate)", highlight: false } },
    { name: "Funzionalità Coppia", loveLanguages: { value: "Sfide, regali, progresso condiviso", highlight: true }, competitor: { value: "Nessuna", highlight: false } },
    { name: "Conversazioni IA", loveLanguages: { value: "Tempo reale con Gemini AI", highlight: true }, competitor: { value: "Lezioni preregistrate", highlight: false } },
    { name: "Pratica Vocale", loveLanguages: { value: "Parla naturalmente con l'IA", highlight: true }, competitor: { value: "Esercizi di pronuncia", highlight: false } },
    { name: "Modalità Ascolto", loveLanguages: { value: "Cattura e traduce voce dal vivo", highlight: true }, competitor: { value: "Solo podcast", highlight: false } },
    { name: "Personalizzazione", loveLanguages: { value: "L'IA si adatta in tempo reale", highlight: true }, competitor: { value: "Ordine lezioni fisso", highlight: false } },
    { name: "Stile di Apprendimento", loveLanguages: { value: "Conversazione prima", highlight: true }, competitor: { value: "Grammatica prima", highlight: false } },
    { name: "Ideale Per", loveLanguages: { value: "Coppie, conversazioni reali", highlight: true }, competitor: { value: "Solo, studio strutturato", highlight: false } }
  ],
  babbelSummary: [
    { text: "Corsi progettati da linguisti", positive: true },
    { text: "Progressione strutturata", positive: true },
    { text: "Solo 14 lingue", positive: false },
    { text: "Zero funzionalità per coppie", positive: false }
  ],
  babbelSubtitle: "Corsi strutturati per singoli",
  chooseBabbel: [
    "Preferisci seguire un curriculum fisso",
    "Impari da solo/a per lavoro",
    "Ti piace la progressione stile libro",
    "Vuoi accesso a vita con un solo pagamento"
  ],
  chooseBabbelTitle: "Babbel potrebbe andare se...",
  babbelFaqs: [
    { question: "Babbel va bene per imparare con il mio partner?", answer: "Babbel è progettato per una persona che segue un curriculum. Nessuna funzionalità condivisa, nessuna sfida, nessun modo di imparare insieme. Love Languages è fatto specificamente per le coppie." },
    { question: "Cosa rende Love Languages diverso da Babbel?", answer: "Babbel ti dà lezioni. Love Languages ti dà conversazioni. La nostra IA si adatta al tuo livello in tempo reale. Invia regali di parole al tuo partner. Sfidalo a battaglie di vocabolario. Impara a mani libere con la Modalità Ascolto." },
    { question: "Quale ha migliore pratica di conversazione?", answer: "Love Languages, di gran lunga. Babbel ha dialoghi predefiniti. Noi abbiamo IA che risponde davvero a ciò che dici, corregge i tuoi errori e ti aiuta a parlare naturalmente." },
    { question: "Posso passare da Babbel?", answer: "Sì. Molte coppie cambiano quando si rendono conto che possono leggere un menu ma non sostenere una conversazione. Love Languages si concentra sul parlare dal primo giorno." }
  ],

  // Feature cards
  listenMode: { title: "Modalità Ascolto", description: "Cattura conversazioni reali intorno a te. Ascolta il tuo partner parlare, ottieni traduzioni e spiegazioni istantanee. Impara dalla lingua che accade nella tua vita." },
  partnerChallenges: { title: "Sfide di Coppia", description: "Invia sfide di vocabolario al tuo partner. Interrogatevi a vicenda, guadagnate punti insieme, rendete l'apprendimento un'attività di squadra." },
  wordGifts: { title: "Regali di Parole", description: "Invia al tuo partner una bella parola o frase. Una piccola sorpresa che mostra che pensi a lui/lei - e alla sua lingua." },
  gameModes: { title: "5 Modalità di Gioco", description: "Flashcard, giochi di ascolto, sfide di conversazione. Progettati per due persone, non per una con uno streak." },
  loveLog: { title: "Love Log", description: "Ogni parola che impari, salvata. Ripassate insieme, interrogatevi, guardate crescere il vostro vocabolario condiviso." },
  progressXP: { title: "Progressi e XP", description: "Salite di livello insieme. Vedete chi si impegna. Un po' di competizione aiuta l'apprendimento a restare." },
  languages18: { title: "18 Lingue", description: "Impara il polacco dallo spagnolo. Il coreano dal francese. Qualsiasi lingua, qualsiasi direzione. La vostra relazione, la vostra scelta." }
};

// Portuguese content
const PT_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - O Único App para Casais",
    description: "Descubra por que casais escolhem Love Languages em vez de {competitor}. Conversas com IA, Modo Escuta, desafios de casal e 18 idiomas para aprender juntos.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Um é feito para casais. O outro não. Veja o que isso significa para sua jornada de idiomas.",
    whatMakesDifferent: "Por Que Casais Mudam para Love Languages",
    featureComparison: "Comparação Direta",
    builtForLearning: "Recursos que Realmente Funcionam para Casais",
    readyToLearn: "Começar a Aprender Juntos",
    otherComparisons: "Outras Comparações",
    allComparisons: "Todas as Comparações",
    bestForCouples: "Feito para casais",
    ctaTitle: "O Idioma do Seu Parceiro, Juntos",
    ctaSubtitle: "18 idiomas. IA que se adapta. Recursos para dois. É assim que casais realmente aprendem.",
    ctaButton: "Experimente Grátis",
    ctaFooter: "Junte-se a mais de 10.000 casais aprendendo juntos",
    footerTagline: "O app de idiomas para casais",
    blog: "Blog",
    tools: "Ferramentas",
    compare: "Comparar",
    terms: "Termos",
    privacy: "Privacidade"
  },
  loveLanguagesSummary: [
    { text: "18 idiomas, qualquer direção", positive: true },
    { text: "Conversas com IA que se adaptam", positive: true },
    { text: "Modo Escuta captura conversas reais", positive: true },
    { text: "Recursos de desafio e presente para casais", positive: true }
  ],
  chooseLoveLanguages: [
    "Você está aprendendo o idioma nativo do seu parceiro",
    "Você quer realmente falar, não apenas tocar respostas",
    "Você aprende melhor com alguém ao seu lado",
    "Você vai conhecer a família ou se mudar para o exterior",
    "Você quer fazer do aprendizado uma atividade compartilhada"
  ],
  chooseLoveLanguagesTitle: "Love Languages é para você se...",

  // Duolingo
  duolingoFeatures: [
    { name: "Idiomas", loveLanguages: { value: "18 (qualquer combinação)", highlight: true }, competitor: { value: "40+ (uma direção)", highlight: false } },
    { name: "Recursos de Casal", loveLanguages: { value: "Desafios, presentes, progresso compartilhado", highlight: true }, competitor: { value: "Nenhum", highlight: false } },
    { name: "Conversas com IA", loveLanguages: { value: "Tempo real com Gemini AI", highlight: true }, competitor: { value: "Respostas programadas", highlight: false } },
    { name: "Prática de Voz", loveLanguages: { value: "Fale naturalmente com a IA", highlight: true }, competitor: { value: "Repita frases fixas", highlight: false } },
    { name: "Modo Escuta", loveLanguages: { value: "Captura e traduz voz ao vivo", highlight: true }, competitor: { value: "Não", highlight: false } },
    { name: "Estilo de Aprendizado", loveLanguages: { value: "Focado em conversação", highlight: true }, competitor: { value: "Exercícios de tradução", highlight: false } },
    { name: "Vocabulário", loveLanguages: { value: "Love Log pessoal", highlight: true }, competitor: { value: "Bloqueado por curso", highlight: false } },
    { name: "Ideal Para", loveLanguages: { value: "Casais, conversas reais", highlight: true }, competitor: { value: "Solo, aprendizado casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Nível grátis com anúncios", positive: true },
    { text: "Motivação baseada em sequência", positive: true },
    { text: "Mesmo formato para todos os idiomas", positive: false },
    { text: "Zero recursos para casais", positive: false }
  ],
  duolingoSubtitle: "Aprendizado solo gamificado",
  chooseDuolingo: [
    "Você quer grátis e anúncios não incomodam",
    "Você aprende sozinho/a",
    "Você prefere colecionar sequências do que falar",
    "5 minutos por dia é seu máximo"
  ],
  chooseDuolingoTitle: "Duolingo pode servir se...",
  duolingoFaqs: [
    { question: "O Duolingo pode me ajudar a falar com a família do meu parceiro?", answer: "Duolingo ensina você a traduzir frases. Love Languages ensina você a conversar. Se você precisa falar com a família do seu parceiro, precisa praticar fala - não exercícios de correspondência." },
    { question: "Por que Love Languages é melhor para casais?", answer: "Porque é feito para casais. Envie presentes de vocabulário para seu parceiro. Desafiem-se em jogos. Aprenda enquanto lava a louça com o Modo Escuta. Acompanhe o progresso juntos. Duolingo não tem nada disso." },
    { question: "O nível grátis do Duolingo é suficiente?", answer: "Para vocabulário casual, sim. Para realmente falar o idioma do seu parceiro? Você precisa de prática de conversação real. Love Languages usa IA para conversas reais - em 18 idiomas." },
    { question: "Devo usar os dois apps?", answer: "Alguns fazem isso. Use Duolingo para pausas de 5 minutos. Use Love Languages quando quiser falar de verdade. Um te dá sequências. O outro te dá habilidades." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Idiomas", loveLanguages: { value: "18 (qualquer combinação)", highlight: true }, competitor: { value: "14 (pares limitados)", highlight: false } },
    { name: "Recursos de Casal", loveLanguages: { value: "Desafios, presentes, progresso compartilhado", highlight: true }, competitor: { value: "Nenhum", highlight: false } },
    { name: "Conversas com IA", loveLanguages: { value: "Tempo real com Gemini AI", highlight: true }, competitor: { value: "Aulas pré-gravadas", highlight: false } },
    { name: "Prática de Voz", loveLanguages: { value: "Fale naturalmente com a IA", highlight: true }, competitor: { value: "Exercícios de pronúncia", highlight: false } },
    { name: "Modo Escuta", loveLanguages: { value: "Captura e traduz voz ao vivo", highlight: true }, competitor: { value: "Apenas podcasts", highlight: false } },
    { name: "Personalização", loveLanguages: { value: "IA se adapta em tempo real", highlight: true }, competitor: { value: "Ordem de aulas fixa", highlight: false } },
    { name: "Estilo de Aprendizado", loveLanguages: { value: "Conversação primeiro", highlight: true }, competitor: { value: "Gramática primeiro", highlight: false } },
    { name: "Ideal Para", loveLanguages: { value: "Casais, conversas reais", highlight: true }, competitor: { value: "Solo, estudo estruturado", highlight: false } }
  ],
  babbelSummary: [
    { text: "Cursos desenvolvidos por linguistas", positive: true },
    { text: "Progressão estruturada", positive: true },
    { text: "Apenas 14 idiomas", positive: false },
    { text: "Zero recursos para casais", positive: false }
  ],
  babbelSubtitle: "Cursos estruturados solo",
  chooseBabbel: [
    "Você prefere seguir um currículo fixo",
    "Você aprende sozinho/a para trabalho",
    "Você gosta de progressão estilo livro",
    "Você quer acesso vitalício por um preço"
  ],
  chooseBabbelTitle: "Babbel pode servir se...",
  babbelFaqs: [
    { question: "Babbel é bom para aprender com meu parceiro?", answer: "Babbel é projetado para uma pessoa seguindo um currículo. Sem recursos compartilhados, sem desafios, sem forma de aprender juntos. Love Languages é feito especificamente para casais." },
    { question: "O que diferencia Love Languages do Babbel?", answer: "Babbel te dá aulas. Love Languages te dá conversas. Nossa IA se adapta ao seu nível em tempo real. Envie presentes de palavras para seu parceiro. Desafie-o a batalhas de vocabulário. Aprenda sem as mãos com o Modo Escuta." },
    { question: "Qual tem melhor prática de conversação?", answer: "Love Languages, de longe. Babbel tem diálogos programados. Nós temos IA que realmente responde ao que você diz, corrige seus erros e ajuda você a falar naturalmente." },
    { question: "Posso trocar do Babbel?", answer: "Sim. Muitos casais trocam quando percebem que conseguem ler um menu, mas não conseguem manter uma conversa. Love Languages foca em falar desde o primeiro dia." }
  ],

  // Feature cards
  listenMode: { title: "Modo Escuta", description: "Capture conversas reais ao seu redor. Ouça seu parceiro falar, obtenha traduções e explicações instantâneas. Aprenda com o idioma que acontece na sua vida." },
  partnerChallenges: { title: "Desafios de Casal", description: "Envie desafios de vocabulário para seu parceiro. Testem-se mutuamente, ganhem pontos juntos, façam do aprendizado uma atividade de equipe." },
  wordGifts: { title: "Presentes de Palavras", description: "Envie ao seu parceiro uma bela palavra ou frase. Uma pequena surpresa que mostra que você pensa nele/a - e no idioma dele/a." },
  gameModes: { title: "5 Modos de Jogo", description: "Flashcards, jogos de escuta, desafios de fala. Projetados para duas pessoas, não para uma pessoa com uma sequência." },
  loveLog: { title: "Love Log", description: "Cada palavra que você aprende, salva. Revisem juntos, testem-se, vejam seu vocabulário compartilhado crescer." },
  progressXP: { title: "Progresso e XP", description: "Subam de nível juntos. Vejam quem está se esforçando. Um pouco de competição ajuda o aprendizado a fixar." },
  languages18: { title: "18 Idiomas", description: "Aprenda polonês do espanhol. Coreano do francês. Qualquer idioma, qualquer direção. Seu relacionamento, sua escolha." }
};

// Content map
const CONTENT_MAP: Record<string, ComparisonContent> = {
  en: EN_CONTENT,
  es: ES_CONTENT,
  fr: FR_CONTENT,
  de: DE_CONTENT,
  it: IT_CONTENT,
  pt: PT_CONTENT
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
