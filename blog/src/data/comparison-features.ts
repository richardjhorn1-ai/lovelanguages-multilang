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

// Russian content
const RU_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Единственное приложение для пар",
    description: "Узнайте, почему пары выбирают Love Languages вместо {competitor}. ИИ-разговоры, режим прослушивания, парные задания и 18 языков для совместного обучения.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Одно создано для пар. Другое нет. Вот что это значит для вашего изучения языка.",
    whatMakesDifferent: "Почему пары переходят на Love Languages",
    featureComparison: "Сравнение",
    builtForLearning: "Функции для пар",
    readyToLearn: "Начать учиться вместе",
    otherComparisons: "Другие сравнения",
    allComparisons: "Все сравнения",
    bestForCouples: "Создано для пар",
    ctaTitle: "Язык вашего партнёра, вместе",
    ctaSubtitle: "18 языков. ИИ, который адаптируется. Функции для двоих.",
    ctaButton: "Попробовать бесплатно",
    ctaFooter: "Присоединяйтесь к 10,000+ пар",
    footerTagline: "Языковое приложение для пар",
    blog: "Блог",
    tools: "Инструменты",
    compare: "Сравнить",
    terms: "Условия",
    privacy: "Конфиденциальность"
  },
  loveLanguagesSummary: [
    { text: "18 языков, любое направление", positive: true },
    { text: "ИИ-разговоры, которые адаптируются", positive: true },
    { text: "Режим прослушивания захватывает реальные разговоры", positive: true },
    { text: "Функции вызовов и подарков для пар", positive: true }
  ],
  chooseLoveLanguages: [
    "Вы учите родной язык партнёра",
    "Вы хотите говорить, а не просто нажимать ответы",
    "Вы лучше учитесь с кем-то рядом",
    "Вы знакомитесь с семьёй или переезжаете",
    "Вы хотите сделать изучение языка общим делом"
  ],
  chooseLoveLanguagesTitle: "Love Languages для вас, если...",
  duolingoFeatures: [
    { name: "Языки", loveLanguages: { value: "18 (любая комбинация)", highlight: true }, competitor: { value: "40+ (одно направление)", highlight: false } },
    { name: "Функции для пар", loveLanguages: { value: "Вызовы, подарки, общий прогресс", highlight: true }, competitor: { value: "Нет", highlight: false } },
    { name: "ИИ-разговоры", loveLanguages: { value: "В реальном времени с Gemini AI", highlight: true }, competitor: { value: "Скриптовые ответы", highlight: false } },
    { name: "Голосовая практика", loveLanguages: { value: "Естественная речь с ИИ", highlight: true }, competitor: { value: "Повтор фраз", highlight: false } },
    { name: "Режим прослушивания", loveLanguages: { value: "Захват и перевод живой речи", highlight: true }, competitor: { value: "Нет", highlight: false } },
    { name: "Стиль обучения", loveLanguages: { value: "Фокус на разговоре", highlight: true }, competitor: { value: "Упражнения на перевод", highlight: false } },
    { name: "Словарь", loveLanguages: { value: "Личный Love Log", highlight: true }, competitor: { value: "Привязан к курсу", highlight: false } },
    { name: "Лучше для", loveLanguages: { value: "Пары, реальные разговоры", highlight: true }, competitor: { value: "Одиночки, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Бесплатный уровень с рекламой", positive: true },
    { text: "Мотивация через серии", positive: true },
    { text: "Одинаковый формат для всех языков", positive: false },
    { text: "Нет функций для пар", positive: false }
  ],
  duolingoSubtitle: "Геймифицированное solo-обучение",
  chooseDuolingo: [
    "Вы хотите бесплатно и не против рекламы",
    "Вы учитесь в одиночку",
    "Вам нравятся серии больше, чем разговоры",
    "5 минут в день — ваш максимум"
  ],
  chooseDuolingoTitle: "Duolingo может подойти, если...",
  duolingoFaqs: [
    { question: "Может ли Duolingo помочь общаться с семьёй партнёра?", answer: "Duolingo учит переводить предложения. Love Languages учит вести разговоры. Если вам нужно общаться с семьёй партнёра, нужна практика речи." },
    { question: "Почему Love Languages лучше для пар?", answer: "Потому что создано для пар. Отправляйте словарные подарки, бросайте вызовы в играх, учитесь в режиме прослушивания." },
    { question: "Достаточно ли бесплатного уровня Duolingo?", answer: "Для базового словаря — да. Для реального общения нужна практика разговоров." },
    { question: "Стоит ли использовать оба приложения?", answer: "Некоторые так делают. Duolingo для 5-минутных перерывов, Love Languages для серьёзной практики." }
  ],
  babbelFeatures: [
    { name: "Языки", loveLanguages: { value: "18 (любая комбинация)", highlight: true }, competitor: { value: "14 (ограниченные пары)", highlight: false } },
    { name: "Функции для пар", loveLanguages: { value: "Вызовы, подарки, общий прогресс", highlight: true }, competitor: { value: "Нет", highlight: false } },
    { name: "ИИ-разговоры", loveLanguages: { value: "В реальном времени с Gemini AI", highlight: true }, competitor: { value: "Записанные уроки", highlight: false } },
    { name: "Голосовая практика", loveLanguages: { value: "Естественная речь с ИИ", highlight: true }, competitor: { value: "Упражнения на произношение", highlight: false } },
    { name: "Режим прослушивания", loveLanguages: { value: "Захват и перевод живой речи", highlight: true }, competitor: { value: "Только подкасты", highlight: false } },
    { name: "Персонализация", loveLanguages: { value: "ИИ адаптируется в реальном времени", highlight: true }, competitor: { value: "Фиксированный порядок уроков", highlight: false } },
    { name: "Стиль обучения", loveLanguages: { value: "Сначала разговор", highlight: true }, competitor: { value: "Сначала грамматика", highlight: false } },
    { name: "Лучше для", loveLanguages: { value: "Пары, реальные разговоры", highlight: true }, competitor: { value: "Одиночки, структурированное обучение", highlight: false } }
  ],
  babbelSummary: [
    { text: "Курсы от лингвистов", positive: true },
    { text: "Структурированный прогресс", positive: true },
    { text: "Только 14 языков", positive: false },
    { text: "Нет функций для пар", positive: false }
  ],
  babbelSubtitle: "Структурированные solo-курсы",
  chooseBabbel: [
    "Вы предпочитаете фиксированную программу",
    "Вы учитесь в одиночку для работы",
    "Вам нравится прогресс как в учебнике",
    "Вы хотите пожизненный доступ за одну цену"
  ],
  chooseBabbelTitle: "Babbel может подойти, если...",
  babbelFaqs: [
    { question: "Babbel хорош для обучения с партнёром?", answer: "Babbel создан для одного человека. Нет общих функций, нет способа учиться вместе. Love Languages создан специально для пар." },
    { question: "Чем Love Languages отличается от Babbel?", answer: "Babbel даёт уроки. Love Languages даёт разговоры. Наш ИИ адаптируется к вашему уровню в реальном времени." },
    { question: "Где лучше практика разговора?", answer: "Love Languages, безусловно. Babbel имеет скриптовые диалоги. У нас ИИ, который реально отвечает на ваши слова." },
    { question: "Можно ли перейти с Babbel?", answer: "Да. Многие пары переходят, когда понимают, что могут читать меню, но не могут вести разговор." }
  ],
  listenMode: { title: "Режим прослушивания", description: "Захватывайте реальные разговоры вокруг вас. Слушайте партнёра, получайте мгновенные переводы и объяснения." },
  partnerChallenges: { title: "Парные задания", description: "Отправляйте словарные вызовы партнёру. Проверяйте друг друга, зарабатывайте очки вместе." },
  wordGifts: { title: "Подарки слов", description: "Отправляйте партнёру красивое слово или фразу. Маленький сюрприз, показывающий вашу заботу." },
  gameModes: { title: "5 игровых режимов", description: "Карточки, игры на слух, разговорные вызовы. Созданы для двоих." },
  loveLog: { title: "Love Log", description: "Каждое слово сохраняется. Повторяйте вместе, проверяйте друг друга." },
  progressXP: { title: "Прогресс и XP", description: "Повышайте уровень вместе. Видьте, кто старается. Немного соревнования помогает учиться." },
  languages18: { title: "18 языков", description: "Учите польский с испанского. Корейский с французского. Любой язык, любое направление." }
};

// Polish content
const PL_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Jedyna aplikacja dla par",
    description: "Dowiedz się, dlaczego pary wybierają Love Languages zamiast {competitor}. Rozmowy z AI, tryb słuchania, wyzwania dla par i 18 języków do wspólnej nauki.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Jedna jest stworzona dla par. Druga nie. Oto co to oznacza dla Twojej nauki języka.",
    whatMakesDifferent: "Dlaczego pary przechodzą na Love Languages",
    featureComparison: "Porównanie",
    builtForLearning: "Funkcje dla par",
    readyToLearn: "Zacznij uczyć się razem",
    otherComparisons: "Inne porównania",
    allComparisons: "Wszystkie porównania",
    bestForCouples: "Stworzone dla par",
    ctaTitle: "Język Twojego partnera, razem",
    ctaSubtitle: "18 języków. AI, które się dostosowuje. Funkcje dla dwojga.",
    ctaButton: "Wypróbuj za darmo",
    ctaFooter: "Dołącz do 10 000+ par",
    footerTagline: "Aplikacja językowa dla par",
    blog: "Blog",
    tools: "Narzędzia",
    compare: "Porównaj",
    terms: "Warunki",
    privacy: "Prywatność"
  },
  loveLanguagesSummary: [
    { text: "18 języków, każdy kierunek", positive: true },
    { text: "Rozmowy z AI, które się dostosowują", positive: true },
    { text: "Tryb słuchania przechwytuje prawdziwe rozmowy", positive: true },
    { text: "Funkcje wyzwań i prezentów dla par", positive: true }
  ],
  chooseLoveLanguages: [
    "Uczysz się ojczystego języka partnera",
    "Chcesz naprawdę mówić, nie tylko klikać odpowiedzi",
    "Uczysz się lepiej z kimś u boku",
    "Poznajesz rodzinę lub przeprowadzasz się za granicę",
    "Chcesz uczynić naukę języka wspólną aktywnością"
  ],
  chooseLoveLanguagesTitle: "Love Languages jest dla Ciebie, jeśli...",
  duolingoFeatures: [
    { name: "Języki", loveLanguages: { value: "18 (każda kombinacja)", highlight: true }, competitor: { value: "40+ (jeden kierunek)", highlight: false } },
    { name: "Funkcje dla par", loveLanguages: { value: "Wyzwania, prezenty, wspólny postęp", highlight: true }, competitor: { value: "Brak", highlight: false } },
    { name: "Rozmowy z AI", loveLanguages: { value: "W czasie rzeczywistym z Gemini AI", highlight: true }, competitor: { value: "Skryptowe odpowiedzi", highlight: false } },
    { name: "Praktyka mówienia", loveLanguages: { value: "Naturalna mowa z AI", highlight: true }, competitor: { value: "Powtarzanie fraz", highlight: false } },
    { name: "Tryb słuchania", loveLanguages: { value: "Przechwytuje i tłumaczy na żywo", highlight: true }, competitor: { value: "Nie", highlight: false } },
    { name: "Styl nauki", loveLanguages: { value: "Skupiony na rozmowie", highlight: true }, competitor: { value: "Ćwiczenia tłumaczeniowe", highlight: false } },
    { name: "Słownictwo", loveLanguages: { value: "Osobisty Love Log", highlight: true }, competitor: { value: "Przypisane do kursu", highlight: false } },
    { name: "Najlepsze dla", loveLanguages: { value: "Pary, prawdziwe rozmowy", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Darmowy poziom z reklamami", positive: true },
    { text: "Motywacja przez serie", positive: true },
    { text: "Ten sam format dla wszystkich języków", positive: false },
    { text: "Brak funkcji dla par", positive: false }
  ],
  duolingoSubtitle: "Zgrywalizowana nauka solo",
  chooseDuolingo: [
    "Chcesz za darmo i nie przeszkadzają Ci reklamy",
    "Uczysz się sam/a",
    "Wolisz zbierać serie niż mówić",
    "5 minut dziennie to Twoje maksimum"
  ],
  chooseDuolingoTitle: "Duolingo może pasować, jeśli...",
  duolingoFaqs: [
    { question: "Czy Duolingo pomoże mi rozmawiać z rodziną partnera?", answer: "Duolingo uczy tłumaczyć zdania. Love Languages uczy prowadzić rozmowy. Jeśli musisz rozmawiać z rodziną partnera, potrzebujesz praktyki mówienia." },
    { question: "Dlaczego Love Languages jest lepsze dla par?", answer: "Bo jest stworzone dla par. Wysyłaj prezenty słowne, rzucaj wyzwania w grach, ucz się w trybie słuchania." },
    { question: "Czy darmowy poziom Duolingo wystarczy?", answer: "Do podstawowego słownictwa — tak. Do prawdziwych rozmów potrzebujesz praktyki konwersacji." },
    { question: "Czy powinienem używać obu aplikacji?", answer: "Niektórzy tak robią. Duolingo na 5-minutowe przerwy, Love Languages do poważnej praktyki." }
  ],
  babbelFeatures: [
    { name: "Języki", loveLanguages: { value: "18 (każda kombinacja)", highlight: true }, competitor: { value: "14 (ograniczone pary)", highlight: false } },
    { name: "Funkcje dla par", loveLanguages: { value: "Wyzwania, prezenty, wspólny postęp", highlight: true }, competitor: { value: "Brak", highlight: false } },
    { name: "Rozmowy z AI", loveLanguages: { value: "W czasie rzeczywistym z Gemini AI", highlight: true }, competitor: { value: "Nagrane lekcje", highlight: false } },
    { name: "Praktyka mówienia", loveLanguages: { value: "Naturalna mowa z AI", highlight: true }, competitor: { value: "Ćwiczenia wymowy", highlight: false } },
    { name: "Tryb słuchania", loveLanguages: { value: "Przechwytuje i tłumaczy na żywo", highlight: true }, competitor: { value: "Tylko podcasty", highlight: false } },
    { name: "Personalizacja", loveLanguages: { value: "AI dostosowuje się w czasie rzeczywistym", highlight: true }, competitor: { value: "Stała kolejność lekcji", highlight: false } },
    { name: "Styl nauki", loveLanguages: { value: "Najpierw rozmowa", highlight: true }, competitor: { value: "Najpierw gramatyka", highlight: false } },
    { name: "Najlepsze dla", loveLanguages: { value: "Pary, prawdziwe rozmowy", highlight: true }, competitor: { value: "Solo, strukturalna nauka", highlight: false } }
  ],
  babbelSummary: [
    { text: "Kursy od lingwistów", positive: true },
    { text: "Strukturalny postęp", positive: true },
    { text: "Tylko 14 języków", positive: false },
    { text: "Brak funkcji dla par", positive: false }
  ],
  babbelSubtitle: "Strukturalne kursy solo",
  chooseBabbel: [
    "Wolisz stały program",
    "Uczysz się sam/a do pracy",
    "Lubisz postęp jak w podręczniku",
    "Chcesz dożywotni dostęp za jedną cenę"
  ],
  chooseBabbelTitle: "Babbel może pasować, jeśli...",
  babbelFaqs: [
    { question: "Czy Babbel jest dobry do nauki z partnerem?", answer: "Babbel jest stworzony dla jednej osoby. Brak wspólnych funkcji, brak sposobu na wspólną naukę. Love Languages jest specjalnie dla par." },
    { question: "Czym Love Languages różni się od Babbel?", answer: "Babbel daje lekcje. Love Languages daje rozmowy. Nasze AI dostosowuje się do Twojego poziomu w czasie rzeczywistym." },
    { question: "Gdzie lepsza praktyka rozmowy?", answer: "Love Languages, zdecydowanie. Babbel ma skryptowe dialogi. My mamy AI, które naprawdę odpowiada na to, co mówisz." },
    { question: "Czy mogę przejść z Babbel?", answer: "Tak. Wiele par przechodzi, gdy zdają sobie sprawę, że mogą czytać menu, ale nie mogą prowadzić rozmowy." }
  ],
  listenMode: { title: "Tryb słuchania", description: "Przechwytuj prawdziwe rozmowy wokół siebie. Słuchaj partnera, otrzymuj natychmiastowe tłumaczenia i wyjaśnienia." },
  partnerChallenges: { title: "Wyzwania dla par", description: "Wysyłaj wyzwania słownikowe partnerowi. Sprawdzajcie się nawzajem, zdobywajcie punkty razem." },
  wordGifts: { title: "Prezenty słów", description: "Wyślij partnerowi piękne słowo lub frazę. Mała niespodzianka pokazująca Twoją troskę." },
  gameModes: { title: "5 trybów gry", description: "Fiszki, gry słuchowe, wyzwania mówienia. Stworzone dla dwojga." },
  loveLog: { title: "Love Log", description: "Każde słowo jest zapisywane. Powtarzajcie razem, sprawdzajcie się nawzajem." },
  progressXP: { title: "Postęp i XP", description: "Awansujcie razem. Zobaczcie, kto się stara. Trochę rywalizacji pomaga w nauce." },
  languages18: { title: "18 języków", description: "Ucz się polskiego z hiszpańskiego. Koreańskiego z francuskiego. Każdy język, każdy kierunek." }
};

// Turkish content
const TR_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Çiftler için tek uygulama",
    description: "Çiftlerin neden {competitor} yerine Love Languages'ı seçtiğini öğrenin. AI sohbetleri, dinleme modu, çift meydan okumaları ve birlikte öğrenmek için 18 dil.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Biri çiftler için yapılmış. Diğeri değil. İşte bu dil öğrenme yolculuğunuz için ne anlama geliyor.",
    whatMakesDifferent: "Çiftler neden Love Languages'a geçiyor",
    featureComparison: "Karşılaştırma",
    builtForLearning: "Çiftler için özellikler",
    readyToLearn: "Birlikte öğrenmeye başla",
    otherComparisons: "Diğer karşılaştırmalar",
    allComparisons: "Tüm karşılaştırmalar",
    bestForCouples: "Çiftler için yapılmış",
    ctaTitle: "Partnerinizin dili, birlikte",
    ctaSubtitle: "18 dil. Uyum sağlayan AI. İkisi için özellikler.",
    ctaButton: "Ücretsiz dene",
    ctaFooter: "10.000+ çifte katılın",
    footerTagline: "Çiftler için dil uygulaması",
    blog: "Blog",
    tools: "Araçlar",
    compare: "Karşılaştır",
    terms: "Koşullar",
    privacy: "Gizlilik"
  },
  loveLanguagesSummary: [
    { text: "18 dil, her yön", positive: true },
    { text: "Uyum sağlayan AI sohbetleri", positive: true },
    { text: "Dinleme modu gerçek konuşmaları yakalar", positive: true },
    { text: "Çiftler için meydan okuma ve hediye özellikleri", positive: true }
  ],
  chooseLoveLanguages: [
    "Partnerinizin ana dilini öğreniyorsunuz",
    "Sadece yanıtlara dokunmak değil, gerçekten konuşmak istiyorsunuz",
    "Yanınızda biriyle daha iyi öğreniyorsunuz",
    "Aileyle tanışacak veya yurt dışına taşınacaksınız",
    "Dil öğrenmeyi ortak bir aktivite yapmak istiyorsunuz"
  ],
  chooseLoveLanguagesTitle: "Love Languages sizin için...",
  duolingoFeatures: [
    { name: "Diller", loveLanguages: { value: "18 (her kombinasyon)", highlight: true }, competitor: { value: "40+ (tek yön)", highlight: false } },
    { name: "Çift özellikleri", loveLanguages: { value: "Meydan okumalar, hediyeler, ortak ilerleme", highlight: true }, competitor: { value: "Yok", highlight: false } },
    { name: "AI sohbetleri", loveLanguages: { value: "Gemini AI ile gerçek zamanlı", highlight: true }, competitor: { value: "Komut dosyalı yanıtlar", highlight: false } },
    { name: "Ses pratiği", loveLanguages: { value: "AI ile doğal konuşma", highlight: true }, competitor: { value: "Kalıp tekrarı", highlight: false } },
    { name: "Dinleme modu", loveLanguages: { value: "Canlı konuşmayı yakalar ve çevirir", highlight: true }, competitor: { value: "Hayır", highlight: false } },
    { name: "Öğrenme stili", loveLanguages: { value: "Konuşma odaklı", highlight: true }, competitor: { value: "Çeviri alıştırmaları", highlight: false } },
    { name: "Kelime hazinesi", loveLanguages: { value: "Kişisel Love Log", highlight: true }, competitor: { value: "Kursa bağlı", highlight: false } },
    { name: "En iyi", loveLanguages: { value: "Çiftler, gerçek konuşmalar", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Reklamlı ücretsiz seviye", positive: true },
    { text: "Seri motivasyonu", positive: true },
    { text: "Tüm diller için aynı format", positive: false },
    { text: "Çift özellikleri yok", positive: false }
  ],
  duolingoSubtitle: "Oyunlaştırılmış solo öğrenme",
  chooseDuolingo: [
    "Ücretsiz istiyorsunuz ve reklamlar sorun değil",
    "Yalnız öğreniyorsunuz",
    "Konuşmaktan çok seri toplamayı tercih ediyorsunuz",
    "Günde 5 dakika maksimumunuz"
  ],
  chooseDuolingoTitle: "Duolingo uygun olabilir...",
  duolingoFaqs: [
    { question: "Duolingo partnerimin ailesiyle konuşmama yardımcı olabilir mi?", answer: "Duolingo cümle çevirmeyi öğretir. Love Languages konuşma yapmayı öğretir. Partnerinizin ailesiyle konuşmanız gerekiyorsa, konuşma pratiğine ihtiyacınız var." },
    { question: "Love Languages neden çiftler için daha iyi?", answer: "Çünkü çiftler için yapılmış. Kelime hediyeleri gönderin, oyunlarda meydan okuyun, dinleme modunda öğrenin." },
    { question: "Duolingo'nun ücretsiz seviyesi yeterli mi?", answer: "Temel kelime hazinesi için evet. Gerçek konuşmalar için konuşma pratiğine ihtiyacınız var." },
    { question: "Her iki uygulamayı da kullanmalı mıyım?", answer: "Bazıları öyle yapıyor. Duolingo 5 dakikalık molalar için, Love Languages ciddi pratik için." }
  ],
  babbelFeatures: [
    { name: "Diller", loveLanguages: { value: "18 (her kombinasyon)", highlight: true }, competitor: { value: "14 (sınırlı çiftler)", highlight: false } },
    { name: "Çift özellikleri", loveLanguages: { value: "Meydan okumalar, hediyeler, ortak ilerleme", highlight: true }, competitor: { value: "Yok", highlight: false } },
    { name: "AI sohbetleri", loveLanguages: { value: "Gemini AI ile gerçek zamanlı", highlight: true }, competitor: { value: "Kaydedilmiş dersler", highlight: false } },
    { name: "Ses pratiği", loveLanguages: { value: "AI ile doğal konuşma", highlight: true }, competitor: { value: "Telaffuz alıştırmaları", highlight: false } },
    { name: "Dinleme modu", loveLanguages: { value: "Canlı konuşmayı yakalar ve çevirir", highlight: true }, competitor: { value: "Sadece podcast", highlight: false } },
    { name: "Kişiselleştirme", loveLanguages: { value: "AI gerçek zamanlı uyum sağlar", highlight: true }, competitor: { value: "Sabit ders sırası", highlight: false } },
    { name: "Öğrenme stili", loveLanguages: { value: "Önce konuşma", highlight: true }, competitor: { value: "Önce gramer", highlight: false } },
    { name: "En iyi", loveLanguages: { value: "Çiftler, gerçek konuşmalar", highlight: true }, competitor: { value: "Solo, yapılandırılmış", highlight: false } }
  ],
  babbelSummary: [
    { text: "Dilbilimcilerden kurslar", positive: true },
    { text: "Yapılandırılmış ilerleme", positive: true },
    { text: "Sadece 14 dil", positive: false },
    { text: "Çift özellikleri yok", positive: false }
  ],
  babbelSubtitle: "Yapılandırılmış solo kurslar",
  chooseBabbel: [
    "Sabit bir müfredatı tercih ediyorsunuz",
    "İş için yalnız öğreniyorsunuz",
    "Ders kitabı tarzı ilerlemeyi seviyorsunuz",
    "Tek fiyata ömür boyu erişim istiyorsunuz"
  ],
  chooseBabbelTitle: "Babbel uygun olabilir...",
  babbelFaqs: [
    { question: "Babbel partnerimle öğrenmek için iyi mi?", answer: "Babbel tek kişi için tasarlanmış. Ortak özellik yok, birlikte öğrenme yolu yok. Love Languages özellikle çiftler için." },
    { question: "Love Languages Babbel'den nasıl farklı?", answer: "Babbel ders verir. Love Languages konuşma verir. AI'mız gerçek zamanlı seviyenize uyum sağlar." },
    { question: "Hangisinde konuşma pratiği daha iyi?", answer: "Love Languages, kesinlikle. Babbel'in komut dosyalı diyalogları var. Bizde söylediklerinize gerçekten yanıt veren AI var." },
    { question: "Babbel'den geçebilir miyim?", answer: "Evet. Birçok çift menü okuyabildiklerini ama konuşma yapamadıklarını fark ettiklerinde geçiyor." }
  ],
  listenMode: { title: "Dinleme modu", description: "Etrafınızdaki gerçek konuşmaları yakalayın. Partnerinizi dinleyin, anında çeviriler ve açıklamalar alın." },
  partnerChallenges: { title: "Çift meydan okumaları", description: "Partnerinize kelime meydan okumaları gönderin. Birbirinizi test edin, birlikte puan kazanın." },
  wordGifts: { title: "Kelime hediyeleri", description: "Partnerinize güzel bir kelime veya ifade gönderin. İlginizi gösteren küçük bir sürpriz." },
  gameModes: { title: "5 oyun modu", description: "Flash kartlar, dinleme oyunları, konuşma meydan okumaları. İkisi için tasarlanmış." },
  loveLog: { title: "Love Log", description: "Her kelime kaydedilir. Birlikte tekrarlayın, birbirinizi test edin." },
  progressXP: { title: "İlerleme ve XP", description: "Birlikte seviye atlayın. Kimin çalıştığını görün. Biraz rekabet öğrenmeye yardımcı olur." },
  languages18: { title: "18 dil", description: "İspanyolca'dan Lehçe öğrenin. Fransızca'dan Korece. Her dil, her yön." }
};

// Ukrainian content
const UK_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Єдиний додаток для пар",
    description: "Дізнайтеся, чому пари обирають Love Languages замість {competitor}. ШІ-розмови, режим прослуховування, парні завдання та 18 мов для спільного навчання.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Один створений для пар. Інший ні. Ось що це означає для вашого вивчення мови.",
    whatMakesDifferent: "Чому пари переходять на Love Languages",
    featureComparison: "Порівняння",
    builtForLearning: "Функції для пар",
    readyToLearn: "Почати вчитися разом",
    otherComparisons: "Інші порівняння",
    allComparisons: "Всі порівняння",
    bestForCouples: "Створено для пар",
    ctaTitle: "Мова вашого партнера, разом",
    ctaSubtitle: "18 мов. ШІ, що адаптується. Функції для двох.",
    ctaButton: "Спробувати безкоштовно",
    ctaFooter: "Приєднуйтесь до 10 000+ пар",
    footerTagline: "Мовний додаток для пар",
    blog: "Блог",
    tools: "Інструменти",
    compare: "Порівняти",
    terms: "Умови",
    privacy: "Конфіденційність"
  },
  loveLanguagesSummary: [
    { text: "18 мов, будь-який напрямок", positive: true },
    { text: "ШІ-розмови, що адаптуються", positive: true },
    { text: "Режим прослуховування захоплює реальні розмови", positive: true },
    { text: "Функції викликів та подарунків для пар", positive: true }
  ],
  chooseLoveLanguages: [
    "Ви вивчаєте рідну мову партнера",
    "Ви хочете говорити, а не просто натискати відповіді",
    "Ви краще вчитеся з кимось поруч",
    "Ви знайомитесь із сім'єю або переїжджаєте",
    "Ви хочете зробити вивчення мови спільною справою"
  ],
  chooseLoveLanguagesTitle: "Love Languages для вас, якщо...",
  duolingoFeatures: [
    { name: "Мови", loveLanguages: { value: "18 (будь-яка комбінація)", highlight: true }, competitor: { value: "40+ (один напрямок)", highlight: false } },
    { name: "Функції для пар", loveLanguages: { value: "Виклики, подарунки, спільний прогрес", highlight: true }, competitor: { value: "Немає", highlight: false } },
    { name: "ШІ-розмови", loveLanguages: { value: "У реальному часі з Gemini AI", highlight: true }, competitor: { value: "Скриптові відповіді", highlight: false } },
    { name: "Голосова практика", loveLanguages: { value: "Природне мовлення з ШІ", highlight: true }, competitor: { value: "Повтор фраз", highlight: false } },
    { name: "Режим прослуховування", loveLanguages: { value: "Захоплює та перекладає живе мовлення", highlight: true }, competitor: { value: "Ні", highlight: false } },
    { name: "Стиль навчання", loveLanguages: { value: "Фокус на розмові", highlight: true }, competitor: { value: "Вправи на переклад", highlight: false } },
    { name: "Словник", loveLanguages: { value: "Особистий Love Log", highlight: true }, competitor: { value: "Прив'язаний до курсу", highlight: false } },
    { name: "Найкраще для", loveLanguages: { value: "Пари, реальні розмови", highlight: true }, competitor: { value: "Одинаки, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Безкоштовний рівень з рекламою", positive: true },
    { text: "Мотивація через серії", positive: true },
    { text: "Однаковий формат для всіх мов", positive: false },
    { text: "Немає функцій для пар", positive: false }
  ],
  duolingoSubtitle: "Гейміфіковане solo-навчання",
  chooseDuolingo: [
    "Ви хочете безкоштовно і не проти реклами",
    "Ви вчитеся на самоті",
    "Вам подобаються серії більше, ніж розмови",
    "5 хвилин на день — ваш максимум"
  ],
  chooseDuolingoTitle: "Duolingo може підійти, якщо...",
  duolingoFaqs: [
    { question: "Чи може Duolingo допомогти спілкуватися із сім'єю партнера?", answer: "Duolingo вчить перекладати речення. Love Languages вчить вести розмови. Якщо вам потрібно спілкуватися із сім'єю партнера, потрібна практика мовлення." },
    { question: "Чому Love Languages краще для пар?", answer: "Бо створено для пар. Надсилайте словникові подарунки, кидайте виклики в іграх, вчіться в режимі прослуховування." },
    { question: "Чи достатньо безкоштовного рівня Duolingo?", answer: "Для базового словника — так. Для реального спілкування потрібна практика розмов." },
    { question: "Чи варто використовувати обидва додатки?", answer: "Дехто так робить. Duolingo для 5-хвилинних перерв, Love Languages для серйозної практики." }
  ],
  babbelFeatures: [
    { name: "Мови", loveLanguages: { value: "18 (будь-яка комбінація)", highlight: true }, competitor: { value: "14 (обмежені пари)", highlight: false } },
    { name: "Функції для пар", loveLanguages: { value: "Виклики, подарунки, спільний прогрес", highlight: true }, competitor: { value: "Немає", highlight: false } },
    { name: "ШІ-розмови", loveLanguages: { value: "У реальному часі з Gemini AI", highlight: true }, competitor: { value: "Записані уроки", highlight: false } },
    { name: "Голосова практика", loveLanguages: { value: "Природне мовлення з ШІ", highlight: true }, competitor: { value: "Вправи на вимову", highlight: false } },
    { name: "Режим прослуховування", loveLanguages: { value: "Захоплює та перекладає живе мовлення", highlight: true }, competitor: { value: "Тільки подкасти", highlight: false } },
    { name: "Персоналізація", loveLanguages: { value: "ШІ адаптується в реальному часі", highlight: true }, competitor: { value: "Фіксований порядок уроків", highlight: false } },
    { name: "Стиль навчання", loveLanguages: { value: "Спочатку розмова", highlight: true }, competitor: { value: "Спочатку граматика", highlight: false } },
    { name: "Найкраще для", loveLanguages: { value: "Пари, реальні розмови", highlight: true }, competitor: { value: "Одинаки, структуроване навчання", highlight: false } }
  ],
  babbelSummary: [
    { text: "Курси від лінгвістів", positive: true },
    { text: "Структурований прогрес", positive: true },
    { text: "Тільки 14 мов", positive: false },
    { text: "Немає функцій для пар", positive: false }
  ],
  babbelSubtitle: "Структуровані solo-курси",
  chooseBabbel: [
    "Ви віддаєте перевагу фіксованій програмі",
    "Ви вчитеся на самоті для роботи",
    "Вам подобається прогрес як у підручнику",
    "Ви хочете довічний доступ за одну ціну"
  ],
  chooseBabbelTitle: "Babbel може підійти, якщо...",
  babbelFaqs: [
    { question: "Babbel добрий для навчання з партнером?", answer: "Babbel створений для однієї людини. Немає спільних функцій, немає способу вчитися разом. Love Languages створений спеціально для пар." },
    { question: "Чим Love Languages відрізняється від Babbel?", answer: "Babbel дає уроки. Love Languages дає розмови. Наш ШІ адаптується до вашого рівня в реальному часі." },
    { question: "Де краща практика розмови?", answer: "Love Languages, безумовно. Babbel має скриптові діалоги. У нас ШІ, що реально відповідає на ваші слова." },
    { question: "Чи можна перейти з Babbel?", answer: "Так. Багато пар переходять, коли розуміють, що можуть читати меню, але не можуть вести розмову." }
  ],
  listenMode: { title: "Режим прослуховування", description: "Захоплюйте реальні розмови навколо вас. Слухайте партнера, отримуйте миттєві переклади та пояснення." },
  partnerChallenges: { title: "Парні завдання", description: "Надсилайте словникові виклики партнеру. Перевіряйте одне одного, заробляйте очки разом." },
  wordGifts: { title: "Подарунки слів", description: "Надішліть партнеру гарне слово чи фразу. Маленький сюрприз, що показує вашу турботу." },
  gameModes: { title: "5 ігрових режимів", description: "Картки, ігри на слух, розмовні виклики. Створені для двох." },
  loveLog: { title: "Love Log", description: "Кожне слово зберігається. Повторюйте разом, перевіряйте одне одного." },
  progressXP: { title: "Прогрес і XP", description: "Підвищуйте рівень разом. Бачте, хто старається. Трохи змагання допомагає вчитися." },
  languages18: { title: "18 мов", description: "Вивчайте польську з іспанської. Корейську з французької. Будь-яка мова, будь-який напрямок." }
};

// Romanian content
const RO_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Singura aplicație pentru cupluri",
    description: "Descoperiți de ce cuplurile aleg Love Languages în loc de {competitor}. Conversații AI, mod ascultare, provocări pentru cupluri și 18 limbi pentru a învăța împreună.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Una este făcută pentru cupluri. Cealaltă nu. Iată ce înseamnă asta pentru călătoria ta lingvistică.",
    whatMakesDifferent: "De ce cuplurile trec la Love Languages",
    featureComparison: "Comparație",
    builtForLearning: "Funcții pentru cupluri",
    readyToLearn: "Începe să înveți împreună",
    otherComparisons: "Alte comparații",
    allComparisons: "Toate comparațiile",
    bestForCouples: "Făcut pentru cupluri",
    ctaTitle: "Limba partenerului tău, împreună",
    ctaSubtitle: "18 limbi. AI care se adaptează. Funcții pentru doi.",
    ctaButton: "Încearcă gratuit",
    ctaFooter: "Alătură-te la 10.000+ cupluri",
    footerTagline: "Aplicația de limbi pentru cupluri",
    blog: "Blog",
    tools: "Instrumente",
    compare: "Compară",
    terms: "Termeni",
    privacy: "Confidențialitate"
  },
  loveLanguagesSummary: [
    { text: "18 limbi, orice direcție", positive: true },
    { text: "Conversații AI care se adaptează", positive: true },
    { text: "Modul ascultare captează conversații reale", positive: true },
    { text: "Funcții de provocare și cadou pentru cupluri", positive: true }
  ],
  chooseLoveLanguages: [
    "Înveți limba maternă a partenerului",
    "Vrei să vorbești cu adevărat, nu doar să atingi răspunsuri",
    "Înveți mai bine cu cineva alături",
    "Vei cunoaște familia sau te muți în străinătate",
    "Vrei să faci învățarea limbii o activitate comună"
  ],
  chooseLoveLanguagesTitle: "Love Languages este pentru tine dacă...",
  duolingoFeatures: [
    { name: "Limbi", loveLanguages: { value: "18 (orice combinație)", highlight: true }, competitor: { value: "40+ (o direcție)", highlight: false } },
    { name: "Funcții pentru cupluri", loveLanguages: { value: "Provocări, cadouri, progres comun", highlight: true }, competitor: { value: "Nu", highlight: false } },
    { name: "Conversații AI", loveLanguages: { value: "În timp real cu Gemini AI", highlight: true }, competitor: { value: "Răspunsuri scriptate", highlight: false } },
    { name: "Practică vocală", loveLanguages: { value: "Vorbire naturală cu AI", highlight: true }, competitor: { value: "Repetare fraze", highlight: false } },
    { name: "Mod ascultare", loveLanguages: { value: "Captează și traduce vorbirea live", highlight: true }, competitor: { value: "Nu", highlight: false } },
    { name: "Stil de învățare", loveLanguages: { value: "Focalizat pe conversație", highlight: true }, competitor: { value: "Exerciții de traducere", highlight: false } },
    { name: "Vocabular", loveLanguages: { value: "Love Log personal", highlight: true }, competitor: { value: "Legat de curs", highlight: false } },
    { name: "Cel mai bun pentru", loveLanguages: { value: "Cupluri, conversații reale", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Nivel gratuit cu reclame", positive: true },
    { text: "Motivație prin serii", positive: true },
    { text: "Același format pentru toate limbile", positive: false },
    { text: "Fără funcții pentru cupluri", positive: false }
  ],
  duolingoSubtitle: "Învățare solo gamificată",
  chooseDuolingo: [
    "Vrei gratuit și reclamele nu te deranjează",
    "Înveți singur/ă",
    "Preferi să colectezi serii decât să vorbești",
    "5 minute pe zi e maximul tău"
  ],
  chooseDuolingoTitle: "Duolingo poate fi potrivit dacă...",
  duolingoFaqs: [
    { question: "Poate Duolingo să mă ajute să vorbesc cu familia partenerului?", answer: "Duolingo te învață să traduci propoziții. Love Languages te învață să porți conversații. Dacă trebuie să vorbești cu familia partenerului, ai nevoie de practică de vorbire." },
    { question: "De ce Love Languages e mai bun pentru cupluri?", answer: "Pentru că e făcut pentru cupluri. Trimite cadouri de vocabular, provocări în jocuri, învață în modul ascultare." },
    { question: "E suficient nivelul gratuit Duolingo?", answer: "Pentru vocabular de bază — da. Pentru conversații reale ai nevoie de practică de conversație." },
    { question: "Ar trebui să folosesc ambele aplicații?", answer: "Unii o fac. Duolingo pentru pauze de 5 minute, Love Languages pentru practică serioasă." }
  ],
  babbelFeatures: [
    { name: "Limbi", loveLanguages: { value: "18 (orice combinație)", highlight: true }, competitor: { value: "14 (perechi limitate)", highlight: false } },
    { name: "Funcții pentru cupluri", loveLanguages: { value: "Provocări, cadouri, progres comun", highlight: true }, competitor: { value: "Nu", highlight: false } },
    { name: "Conversații AI", loveLanguages: { value: "În timp real cu Gemini AI", highlight: true }, competitor: { value: "Lecții înregistrate", highlight: false } },
    { name: "Practică vocală", loveLanguages: { value: "Vorbire naturală cu AI", highlight: true }, competitor: { value: "Exerciții de pronunție", highlight: false } },
    { name: "Mod ascultare", loveLanguages: { value: "Captează și traduce vorbirea live", highlight: true }, competitor: { value: "Doar podcasturi", highlight: false } },
    { name: "Personalizare", loveLanguages: { value: "AI se adaptează în timp real", highlight: true }, competitor: { value: "Ordine fixă a lecțiilor", highlight: false } },
    { name: "Stil de învățare", loveLanguages: { value: "Mai întâi conversația", highlight: true }, competitor: { value: "Mai întâi gramatica", highlight: false } },
    { name: "Cel mai bun pentru", loveLanguages: { value: "Cupluri, conversații reale", highlight: true }, competitor: { value: "Solo, învățare structurată", highlight: false } }
  ],
  babbelSummary: [
    { text: "Cursuri de la lingviști", positive: true },
    { text: "Progres structurat", positive: true },
    { text: "Doar 14 limbi", positive: false },
    { text: "Fără funcții pentru cupluri", positive: false }
  ],
  babbelSubtitle: "Cursuri solo structurate",
  chooseBabbel: [
    "Preferi un curriculum fix",
    "Înveți singur/ă pentru muncă",
    "Îți place progresul stil manual",
    "Vrei acces pe viață la un singur preț"
  ],
  chooseBabbelTitle: "Babbel poate fi potrivit dacă...",
  babbelFaqs: [
    { question: "Babbel e bun pentru a învăța cu partenerul?", answer: "Babbel e conceput pentru o persoană. Fără funcții comune, fără mod de a învăța împreună. Love Languages e special pentru cupluri." },
    { question: "Cu ce diferă Love Languages de Babbel?", answer: "Babbel dă lecții. Love Languages dă conversații. AI-ul nostru se adaptează nivelului tău în timp real." },
    { question: "Unde e mai bună practica de conversație?", answer: "Love Languages, cu siguranță. Babbel are dialoguri scriptate. Noi avem AI care răspunde la ce spui." },
    { question: "Pot trece de la Babbel?", answer: "Da. Multe cupluri trec când realizează că pot citi un meniu dar nu pot purta o conversație." }
  ],
  listenMode: { title: "Mod ascultare", description: "Captează conversațiile reale din jurul tău. Ascultă-ți partenerul, primește traduceri și explicații instantanee." },
  partnerChallenges: { title: "Provocări pentru cupluri", description: "Trimite provocări de vocabular partenerului. Testați-vă reciproc, câștigați puncte împreună." },
  wordGifts: { title: "Cadouri de cuvinte", description: "Trimite partenerului un cuvânt sau o frază frumoasă. O mică surpriză care arată că îți pasă." },
  gameModes: { title: "5 moduri de joc", description: "Carduri, jocuri de ascultare, provocări de vorbire. Concepute pentru doi." },
  loveLog: { title: "Love Log", description: "Fiecare cuvânt e salvat. Repetați împreună, testați-vă reciproc." },
  progressXP: { title: "Progres și XP", description: "Avansați împreună. Vedeți cine se străduiește. Puțină competiție ajută la învățare." },
  languages18: { title: "18 limbi", description: "Învață poloneză din spaniolă. Coreeană din franceză. Orice limbă, orice direcție." }
};

// Dutch content
const NL_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - De enige app voor koppels",
    description: "Ontdek waarom koppels Love Languages kiezen boven {competitor}. AI-gesprekken, luistermodus, koppel-uitdagingen en 18 talen om samen te leren.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "De ene is gemaakt voor koppels. De andere niet. Dit betekent het voor je taalreis.",
    whatMakesDifferent: "Waarom koppels overstappen naar Love Languages",
    featureComparison: "Vergelijking",
    builtForLearning: "Functies voor koppels",
    readyToLearn: "Begin samen te leren",
    otherComparisons: "Andere vergelijkingen",
    allComparisons: "Alle vergelijkingen",
    bestForCouples: "Gemaakt voor koppels",
    ctaTitle: "De taal van je partner, samen",
    ctaSubtitle: "18 talen. AI die zich aanpast. Functies voor twee.",
    ctaButton: "Probeer gratis",
    ctaFooter: "Sluit je aan bij 10.000+ koppels",
    footerTagline: "De taal-app voor koppels",
    blog: "Blog",
    tools: "Gereedschap",
    compare: "Vergelijk",
    terms: "Voorwaarden",
    privacy: "Privacy"
  },
  loveLanguagesSummary: [
    { text: "18 talen, elke richting", positive: true },
    { text: "AI-gesprekken die zich aanpassen", positive: true },
    { text: "Luistermodus vangt echte gesprekken", positive: true },
    { text: "Uitdaging- en cadeau-functies voor koppels", positive: true }
  ],
  chooseLoveLanguages: [
    "Je leert de moedertaal van je partner",
    "Je wilt echt spreken, niet alleen antwoorden aantikken",
    "Je leert beter met iemand naast je",
    "Je ontmoet de familie of verhuist naar het buitenland",
    "Je wilt taal leren een gedeelde activiteit maken"
  ],
  chooseLoveLanguagesTitle: "Love Languages is voor jou als...",
  duolingoFeatures: [
    { name: "Talen", loveLanguages: { value: "18 (elke combinatie)", highlight: true }, competitor: { value: "40+ (één richting)", highlight: false } },
    { name: "Koppel-functies", loveLanguages: { value: "Uitdagingen, cadeaus, gedeelde voortgang", highlight: true }, competitor: { value: "Geen", highlight: false } },
    { name: "AI-gesprekken", loveLanguages: { value: "Realtime met Gemini AI", highlight: true }, competitor: { value: "Gescripte antwoorden", highlight: false } },
    { name: "Spreekpraktijk", loveLanguages: { value: "Natuurlijk spreken met AI", highlight: true }, competitor: { value: "Zinnen herhalen", highlight: false } },
    { name: "Luistermodus", loveLanguages: { value: "Vangt en vertaalt live spraak", highlight: true }, competitor: { value: "Nee", highlight: false } },
    { name: "Leerstijl", loveLanguages: { value: "Gespreksgericht", highlight: true }, competitor: { value: "Vertaaloefeningen", highlight: false } },
    { name: "Woordenschat", loveLanguages: { value: "Persoonlijk Love Log", highlight: true }, competitor: { value: "Cursusgebonden", highlight: false } },
    { name: "Het beste voor", loveLanguages: { value: "Koppels, echte gesprekken", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Gratis niveau met advertenties", positive: true },
    { text: "Streak-motivatie", positive: true },
    { text: "Zelfde formaat voor alle talen", positive: false },
    { text: "Geen koppel-functies", positive: false }
  ],
  duolingoSubtitle: "Gegamificeerd solo leren",
  chooseDuolingo: [
    "Je wilt gratis en advertenties storen niet",
    "Je leert alleen",
    "Je verzamelt liever streaks dan praten",
    "5 minuten per dag is je maximum"
  ],
  chooseDuolingoTitle: "Duolingo kan passen als...",
  duolingoFaqs: [
    { question: "Kan Duolingo me helpen met de familie van mijn partner te praten?", answer: "Duolingo leert je zinnen vertalen. Love Languages leert je gesprekken voeren. Als je met de familie van je partner moet praten, heb je spreekpraktijk nodig." },
    { question: "Waarom is Love Languages beter voor koppels?", answer: "Omdat het voor koppels is gemaakt. Stuur woordcadeaus, daag uit in spelletjes, leer in luistermodus." },
    { question: "Is het gratis niveau van Duolingo genoeg?", answer: "Voor basiswoordenschat — ja. Voor echte gesprekken heb je gesprekspraktijk nodig." },
    { question: "Moet ik beide apps gebruiken?", answer: "Sommigen doen dat. Duolingo voor 5-minuten pauzes, Love Languages voor serieuze praktijk." }
  ],
  babbelFeatures: [
    { name: "Talen", loveLanguages: { value: "18 (elke combinatie)", highlight: true }, competitor: { value: "14 (beperkte paren)", highlight: false } },
    { name: "Koppel-functies", loveLanguages: { value: "Uitdagingen, cadeaus, gedeelde voortgang", highlight: true }, competitor: { value: "Geen", highlight: false } },
    { name: "AI-gesprekken", loveLanguages: { value: "Realtime met Gemini AI", highlight: true }, competitor: { value: "Opgenomen lessen", highlight: false } },
    { name: "Spreekpraktijk", loveLanguages: { value: "Natuurlijk spreken met AI", highlight: true }, competitor: { value: "Uitspraakoefeningen", highlight: false } },
    { name: "Luistermodus", loveLanguages: { value: "Vangt en vertaalt live spraak", highlight: true }, competitor: { value: "Alleen podcasts", highlight: false } },
    { name: "Personalisatie", loveLanguages: { value: "AI past zich realtime aan", highlight: true }, competitor: { value: "Vaste lesvolgorde", highlight: false } },
    { name: "Leerstijl", loveLanguages: { value: "Eerst gesprek", highlight: true }, competitor: { value: "Eerst grammatica", highlight: false } },
    { name: "Het beste voor", loveLanguages: { value: "Koppels, echte gesprekken", highlight: true }, competitor: { value: "Solo, gestructureerd leren", highlight: false } }
  ],
  babbelSummary: [
    { text: "Cursussen van taalkundigen", positive: true },
    { text: "Gestructureerde voortgang", positive: true },
    { text: "Slechts 14 talen", positive: false },
    { text: "Geen koppel-functies", positive: false }
  ],
  babbelSubtitle: "Gestructureerde solo-cursussen",
  chooseBabbel: [
    "Je geeft de voorkeur aan een vast curriculum",
    "Je leert alleen voor werk",
    "Je houdt van lesboek-voortgang",
    "Je wilt levenslange toegang voor één prijs"
  ],
  chooseBabbelTitle: "Babbel kan passen als...",
  babbelFaqs: [
    { question: "Is Babbel goed om met mijn partner te leren?", answer: "Babbel is ontworpen voor één persoon. Geen gedeelde functies, geen manier om samen te leren. Love Languages is speciaal voor koppels." },
    { question: "Hoe verschilt Love Languages van Babbel?", answer: "Babbel geeft lessen. Love Languages geeft gesprekken. Onze AI past zich aan je niveau aan in realtime." },
    { question: "Waar is de gesprekspraktijk beter?", answer: "Love Languages, absoluut. Babbel heeft gescripte dialogen. Wij hebben AI die echt reageert op wat je zegt." },
    { question: "Kan ik overstappen van Babbel?", answer: "Ja. Veel koppels stappen over als ze beseffen dat ze een menu kunnen lezen maar geen gesprek kunnen voeren." }
  ],
  listenMode: { title: "Luistermodus", description: "Vang echte gesprekken om je heen. Luister naar je partner, krijg directe vertalingen en uitleg." },
  partnerChallenges: { title: "Koppel-uitdagingen", description: "Stuur woordenschat-uitdagingen naar je partner. Test elkaar, verdien samen punten." },
  wordGifts: { title: "Woordcadeaus", description: "Stuur je partner een mooi woord of zin. Een kleine verrassing die laat zien dat je om ze geeft." },
  gameModes: { title: "5 spelmodi", description: "Flashcards, luisterspellen, spreek-uitdagingen. Ontworpen voor twee." },
  loveLog: { title: "Love Log", description: "Elk woord wordt opgeslagen. Herhaal samen, test elkaar." },
  progressXP: { title: "Voortgang en XP", description: "Ga samen omhoog. Zie wie zijn best doet. Een beetje competitie helpt bij leren." },
  languages18: { title: "18 talen", description: "Leer Pools vanuit Spaans. Koreaans vanuit Frans. Elke taal, elke richting." }
};

// Swedish content
const SV_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Den enda appen för par",
    description: "Se varför par väljer Love Languages framför {competitor}. AI-samtal, lyssningsläge, parutmaningar och 18 språk att lära sig tillsammans.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Den ena är byggd för par. Den andra inte. Så här påverkar det din språkresa.",
    whatMakesDifferent: "Varför par byter till Love Languages",
    featureComparison: "Jämförelse",
    builtForLearning: "Funktioner för par",
    readyToLearn: "Börja lära tillsammans",
    otherComparisons: "Andra jämförelser",
    allComparisons: "Alla jämförelser",
    bestForCouples: "Byggt för par",
    ctaTitle: "Din partners språk, tillsammans",
    ctaSubtitle: "18 språk. AI som anpassar sig. Funktioner för två.",
    ctaButton: "Prova gratis",
    ctaFooter: "Gå med 10 000+ par",
    footerTagline: "Språkappen för par",
    blog: "Blogg",
    tools: "Verktyg",
    compare: "Jämför",
    terms: "Villkor",
    privacy: "Integritet"
  },
  loveLanguagesSummary: [
    { text: "18 språk, alla riktningar", positive: true },
    { text: "AI-samtal som anpassar sig", positive: true },
    { text: "Lyssningsläge fångar riktiga samtal", positive: true },
    { text: "Utmanings- och presentfunktioner för par", positive: true }
  ],
  chooseLoveLanguages: [
    "Du lär dig din partners modersmål",
    "Du vill verkligen prata, inte bara trycka på svar",
    "Du lär dig bättre med någon vid din sida",
    "Du träffar familjen eller flyttar utomlands",
    "Du vill göra språkinlärning till en gemensam aktivitet"
  ],
  chooseLoveLanguagesTitle: "Love Languages passar dig om...",
  duolingoFeatures: [
    { name: "Språk", loveLanguages: { value: "18 (alla kombinationer)", highlight: true }, competitor: { value: "40+ (en riktning)", highlight: false } },
    { name: "Parfunktioner", loveLanguages: { value: "Utmaningar, presenter, delad framsteg", highlight: true }, competitor: { value: "Inga", highlight: false } },
    { name: "AI-samtal", loveLanguages: { value: "Realtid med Gemini AI", highlight: true }, competitor: { value: "Skriptade svar", highlight: false } },
    { name: "Talövning", loveLanguages: { value: "Naturligt tal med AI", highlight: true }, competitor: { value: "Upprepa meningar", highlight: false } },
    { name: "Lyssningsläge", loveLanguages: { value: "Fångar och översätter live", highlight: true }, competitor: { value: "Nej", highlight: false } },
    { name: "Inlärningsstil", loveLanguages: { value: "Samtalsfokuserad", highlight: true }, competitor: { value: "Översättningsövningar", highlight: false } },
    { name: "Ordförråd", loveLanguages: { value: "Personlig Love Log", highlight: true }, competitor: { value: "Kursbunden", highlight: false } },
    { name: "Bäst för", loveLanguages: { value: "Par, riktiga samtal", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Gratisnivå med annonser", positive: true },
    { text: "Streak-motivation", positive: true },
    { text: "Samma format för alla språk", positive: false },
    { text: "Inga parfunktioner", positive: false }
  ],
  duolingoSubtitle: "Spelifierat solo-lärande",
  chooseDuolingo: [
    "Du vill ha gratis och stör dig inte på annonser",
    "Du lär dig ensam",
    "Du föredrar att samla streaks framför att prata",
    "5 minuter om dagen är ditt max"
  ],
  chooseDuolingoTitle: "Duolingo kan passa om...",
  duolingoFaqs: [
    { question: "Kan Duolingo hjälpa mig prata med min partners familj?", answer: "Duolingo lär dig översätta meningar. Love Languages lär dig föra samtal. Om du behöver prata med din partners familj behöver du talövning." },
    { question: "Varför är Love Languages bättre för par?", answer: "För att det är byggt för par. Skicka ordpresenter, utmana i spel, lär i lyssningsläge." },
    { question: "Räcker Duolingos gratisnivå?", answer: "För grundläggande ordförråd — ja. För riktiga samtal behöver du samtalsövning." },
    { question: "Ska jag använda båda apparna?", answer: "Vissa gör det. Duolingo för 5-minuters pauser, Love Languages för seriös övning." }
  ],
  babbelFeatures: [
    { name: "Språk", loveLanguages: { value: "18 (alla kombinationer)", highlight: true }, competitor: { value: "14 (begränsade par)", highlight: false } },
    { name: "Parfunktioner", loveLanguages: { value: "Utmaningar, presenter, delad framsteg", highlight: true }, competitor: { value: "Inga", highlight: false } },
    { name: "AI-samtal", loveLanguages: { value: "Realtid med Gemini AI", highlight: true }, competitor: { value: "Inspelade lektioner", highlight: false } },
    { name: "Talövning", loveLanguages: { value: "Naturligt tal med AI", highlight: true }, competitor: { value: "Uttalsövningar", highlight: false } },
    { name: "Lyssningsläge", loveLanguages: { value: "Fångar och översätter live", highlight: true }, competitor: { value: "Endast podcasts", highlight: false } },
    { name: "Anpassning", loveLanguages: { value: "AI anpassar sig i realtid", highlight: true }, competitor: { value: "Fast lektionsordning", highlight: false } },
    { name: "Inlärningsstil", loveLanguages: { value: "Samtal först", highlight: true }, competitor: { value: "Grammatik först", highlight: false } },
    { name: "Bäst för", loveLanguages: { value: "Par, riktiga samtal", highlight: true }, competitor: { value: "Solo, strukturerat", highlight: false } }
  ],
  babbelSummary: [
    { text: "Kurser av språkvetare", positive: true },
    { text: "Strukturerad framsteg", positive: true },
    { text: "Endast 14 språk", positive: false },
    { text: "Inga parfunktioner", positive: false }
  ],
  babbelSubtitle: "Strukturerade solo-kurser",
  chooseBabbel: [
    "Du föredrar en fast läroplan",
    "Du lär dig ensam för arbete",
    "Du gillar läroboksframsteg",
    "Du vill ha livstidsåtkomst för ett pris"
  ],
  chooseBabbelTitle: "Babbel kan passa om...",
  babbelFaqs: [
    { question: "Är Babbel bra för att lära sig med min partner?", answer: "Babbel är designat för en person. Inga delade funktioner. Love Languages är speciellt för par." },
    { question: "Hur skiljer sig Love Languages från Babbel?", answer: "Babbel ger lektioner. Love Languages ger samtal. Vår AI anpassar sig till din nivå i realtid." },
    { question: "Var är samtalsövningen bättre?", answer: "Love Languages, definitivt. Babbel har skriptade dialoger. Vi har AI som verkligen svarar." },
    { question: "Kan jag byta från Babbel?", answer: "Ja. Många par byter när de inser att de kan läsa en meny men inte föra ett samtal." }
  ],
  listenMode: { title: "Lyssningsläge", description: "Fånga riktiga samtal omkring dig. Lyssna på din partner, få direkta översättningar." },
  partnerChallenges: { title: "Parutmaningar", description: "Skicka ordförrådsutmaningar till din partner. Testa varandra, tjäna poäng tillsammans." },
  wordGifts: { title: "Ordpresenter", description: "Skicka ett vackert ord eller fras till din partner. En liten överraskning som visar att du bryr dig." },
  gameModes: { title: "5 spellägen", description: "Flashcards, lyssnaspel, talutmaningar. Designat för två." },
  loveLog: { title: "Love Log", description: "Varje ord sparas. Repetera tillsammans, testa varandra." },
  progressXP: { title: "Framsteg och XP", description: "Gå uppåt tillsammans. Se vem som anstränger sig mest. Lite tävling hjälper inlärningen." },
  languages18: { title: "18 språk", description: "Lär dig polska från spanska. Koreanska från franska. Alla språk, alla riktningar." }
};

// Norwegian content
const NO_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Den eneste appen for par",
    description: "Se hvorfor par velger Love Languages fremfor {competitor}. AI-samtaler, lyttemodus, parutfordringer og 18 språk å lære sammen.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Den ene er bygget for par. Den andre ikke. Slik påvirker det språkreisen din.",
    whatMakesDifferent: "Hvorfor par bytter til Love Languages",
    featureComparison: "Sammenligning",
    builtForLearning: "Funksjoner for par",
    readyToLearn: "Begynn å lære sammen",
    otherComparisons: "Andre sammenligninger",
    allComparisons: "Alle sammenligninger",
    bestForCouples: "Bygget for par",
    ctaTitle: "Partnerens språk, sammen",
    ctaSubtitle: "18 språk. AI som tilpasser seg. Funksjoner for to.",
    ctaButton: "Prøv gratis",
    ctaFooter: "Bli med 10 000+ par",
    footerTagline: "Språkappen for par",
    blog: "Blogg",
    tools: "Verktøy",
    compare: "Sammenlign",
    terms: "Vilkår",
    privacy: "Personvern"
  },
  loveLanguagesSummary: [
    { text: "18 språk, alle retninger", positive: true },
    { text: "AI-samtaler som tilpasser seg", positive: true },
    { text: "Lyttemodus fanger ekte samtaler", positive: true },
    { text: "Utfordrings- og gavefunksjoner for par", positive: true }
  ],
  chooseLoveLanguages: [
    "Du lærer partnerens morsmål",
    "Du vil virkelig snakke, ikke bare trykke på svar",
    "Du lærer bedre med noen ved din side",
    "Du møter familien eller flytter utenlands",
    "Du vil gjøre språklæring til en felles aktivitet"
  ],
  chooseLoveLanguagesTitle: "Love Languages passer deg hvis...",
  duolingoFeatures: [
    { name: "Språk", loveLanguages: { value: "18 (alle kombinasjoner)", highlight: true }, competitor: { value: "40+ (én retning)", highlight: false } },
    { name: "Parfunksjoner", loveLanguages: { value: "Utfordringer, gaver, delt fremgang", highlight: true }, competitor: { value: "Ingen", highlight: false } },
    { name: "AI-samtaler", loveLanguages: { value: "Sanntid med Gemini AI", highlight: true }, competitor: { value: "Skriptede svar", highlight: false } },
    { name: "Taleøvelse", loveLanguages: { value: "Naturlig tale med AI", highlight: true }, competitor: { value: "Gjenta setninger", highlight: false } },
    { name: "Lyttemodus", loveLanguages: { value: "Fanger og oversetter live", highlight: true }, competitor: { value: "Nei", highlight: false } },
    { name: "Læringsstil", loveLanguages: { value: "Samtalefokusert", highlight: true }, competitor: { value: "Oversettelsesøvelser", highlight: false } },
    { name: "Ordforråd", loveLanguages: { value: "Personlig Love Log", highlight: true }, competitor: { value: "Kursbundet", highlight: false } },
    { name: "Best for", loveLanguages: { value: "Par, ekte samtaler", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Gratisnivå med annonser", positive: true },
    { text: "Streak-motivasjon", positive: true },
    { text: "Samme format for alle språk", positive: false },
    { text: "Ingen parfunksjoner", positive: false }
  ],
  duolingoSubtitle: "Spillifisert solo-læring",
  chooseDuolingo: [
    "Du vil ha gratis og bryr deg ikke om annonser",
    "Du lærer alene",
    "Du foretrekker å samle streaks fremfor å snakke",
    "5 minutter om dagen er maks"
  ],
  chooseDuolingoTitle: "Duolingo kan passe hvis...",
  duolingoFaqs: [
    { question: "Kan Duolingo hjelpe meg snakke med partnerens familie?", answer: "Duolingo lærer deg å oversette setninger. Love Languages lærer deg å føre samtaler. Hvis du trenger å snakke med partnerens familie, trenger du taleøvelse." },
    { question: "Hvorfor er Love Languages bedre for par?", answer: "Fordi det er bygget for par. Send ordgaver, utfordr i spill, lær i lyttemodus." },
    { question: "Er Duolingos gratisnivå nok?", answer: "For grunnleggende ordforråd — ja. For ekte samtaler trenger du samtaleøvelse." },
    { question: "Bør jeg bruke begge appene?", answer: "Noen gjør det. Duolingo for 5-minutters pauser, Love Languages for seriøs øvelse." }
  ],
  babbelFeatures: [
    { name: "Språk", loveLanguages: { value: "18 (alle kombinasjoner)", highlight: true }, competitor: { value: "14 (begrensede par)", highlight: false } },
    { name: "Parfunksjoner", loveLanguages: { value: "Utfordringer, gaver, delt fremgang", highlight: true }, competitor: { value: "Ingen", highlight: false } },
    { name: "AI-samtaler", loveLanguages: { value: "Sanntid med Gemini AI", highlight: true }, competitor: { value: "Innspilte leksjoner", highlight: false } },
    { name: "Taleøvelse", loveLanguages: { value: "Naturlig tale med AI", highlight: true }, competitor: { value: "Uttaleøvelser", highlight: false } },
    { name: "Lyttemodus", loveLanguages: { value: "Fanger og oversetter live", highlight: true }, competitor: { value: "Kun podcaster", highlight: false } },
    { name: "Tilpasning", loveLanguages: { value: "AI tilpasser seg i sanntid", highlight: true }, competitor: { value: "Fast leksjonsrekkefølge", highlight: false } },
    { name: "Læringsstil", loveLanguages: { value: "Samtale først", highlight: true }, competitor: { value: "Grammatikk først", highlight: false } },
    { name: "Best for", loveLanguages: { value: "Par, ekte samtaler", highlight: true }, competitor: { value: "Solo, strukturert", highlight: false } }
  ],
  babbelSummary: [
    { text: "Kurs av språkforskere", positive: true },
    { text: "Strukturert fremgang", positive: true },
    { text: "Kun 14 språk", positive: false },
    { text: "Ingen parfunksjoner", positive: false }
  ],
  babbelSubtitle: "Strukturerte solo-kurs",
  chooseBabbel: [
    "Du foretrekker en fast læreplan",
    "Du lærer alene for jobb",
    "Du liker lærebokfremgang",
    "Du vil ha livstidstilgang for én pris"
  ],
  chooseBabbelTitle: "Babbel kan passe hvis...",
  babbelFaqs: [
    { question: "Er Babbel bra for å lære med partneren min?", answer: "Babbel er designet for én person. Ingen delte funksjoner. Love Languages er spesielt for par." },
    { question: "Hvordan skiller Love Languages seg fra Babbel?", answer: "Babbel gir leksjoner. Love Languages gir samtaler. Vår AI tilpasser seg nivået ditt i sanntid." },
    { question: "Hvor er samtaleøvelsen bedre?", answer: "Love Languages, definitivt. Babbel har skriptede dialoger. Vi har AI som virkelig svarer." },
    { question: "Kan jeg bytte fra Babbel?", answer: "Ja. Mange par bytter når de innser at de kan lese en meny men ikke føre en samtale." }
  ],
  listenMode: { title: "Lyttemodus", description: "Fang ekte samtaler rundt deg. Lytt til partneren, få direkte oversettelser." },
  partnerChallenges: { title: "Parutfordringer", description: "Send ordforrådsutfordringer til partneren. Test hverandre, tjen poeng sammen." },
  wordGifts: { title: "Ordgaver", description: "Send et vakkert ord eller frase til partneren. En liten overraskelse som viser at du bryr deg." },
  gameModes: { title: "5 spillmoduser", description: "Flashcards, lyttespill, taleutfordringer. Designet for to." },
  loveLog: { title: "Love Log", description: "Hvert ord lagres. Repeter sammen, test hverandre." },
  progressXP: { title: "Fremgang og XP", description: "Gå oppover sammen. Se hvem som jobber hardest. Litt konkurranse hjelper læringen." },
  languages18: { title: "18 språk", description: "Lær polsk fra spansk. Koreansk fra fransk. Alle språk, alle retninger." }
};

// Danish content
const DA_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Den eneste app til par",
    description: "Se hvorfor par vælger Love Languages frem for {competitor}. AI-samtaler, lyttetilstand, parudfordringer og 18 sprog at lære sammen.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Den ene er bygget til par. Den anden ikke. Sådan påvirker det din sprogrejse.",
    whatMakesDifferent: "Hvorfor par skifter til Love Languages",
    featureComparison: "Sammenligning",
    builtForLearning: "Funktioner til par",
    readyToLearn: "Begynd at lære sammen",
    otherComparisons: "Andre sammenligninger",
    allComparisons: "Alle sammenligninger",
    bestForCouples: "Bygget til par",
    ctaTitle: "Din partners sprog, sammen",
    ctaSubtitle: "18 sprog. AI der tilpasser sig. Funktioner til to.",
    ctaButton: "Prøv gratis",
    ctaFooter: "Slut dig til 10.000+ par",
    footerTagline: "Sprogappen til par",
    blog: "Blog",
    tools: "Værktøjer",
    compare: "Sammenlign",
    terms: "Vilkår",
    privacy: "Privatlivspolitik"
  },
  loveLanguagesSummary: [
    { text: "18 sprog, alle retninger", positive: true },
    { text: "AI-samtaler der tilpasser sig", positive: true },
    { text: "Lyttetilstand fanger ægte samtaler", positive: true },
    { text: "Udfordrings- og gavefunktioner til par", positive: true }
  ],
  chooseLoveLanguages: [
    "Du lærer din partners modersmål",
    "Du vil virkelig tale, ikke bare trykke på svar",
    "Du lærer bedre med nogen ved din side",
    "Du møder familien eller flytter til udlandet",
    "Du vil gøre sproglæring til en fælles aktivitet"
  ],
  chooseLoveLanguagesTitle: "Love Languages passer til dig hvis...",
  duolingoFeatures: [
    { name: "Sprog", loveLanguages: { value: "18 (alle kombinationer)", highlight: true }, competitor: { value: "40+ (én retning)", highlight: false } },
    { name: "Parfunktioner", loveLanguages: { value: "Udfordringer, gaver, delt fremgang", highlight: true }, competitor: { value: "Ingen", highlight: false } },
    { name: "AI-samtaler", loveLanguages: { value: "Realtid med Gemini AI", highlight: true }, competitor: { value: "Scriptede svar", highlight: false } },
    { name: "Taleøvelse", loveLanguages: { value: "Naturlig tale med AI", highlight: true }, competitor: { value: "Gentag sætninger", highlight: false } },
    { name: "Lyttetilstand", loveLanguages: { value: "Fanger og oversætter live", highlight: true }, competitor: { value: "Nej", highlight: false } },
    { name: "Læringsstil", loveLanguages: { value: "Samtalefokuseret", highlight: true }, competitor: { value: "Oversættelsesøvelser", highlight: false } },
    { name: "Ordforråd", loveLanguages: { value: "Personlig Love Log", highlight: true }, competitor: { value: "Kursusbundet", highlight: false } },
    { name: "Bedst til", loveLanguages: { value: "Par, ægte samtaler", highlight: true }, competitor: { value: "Solo, casual", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Gratis niveau med reklamer", positive: true },
    { text: "Streak-motivation", positive: true },
    { text: "Samme format til alle sprog", positive: false },
    { text: "Ingen parfunktioner", positive: false }
  ],
  duolingoSubtitle: "Gamificeret solo-læring",
  chooseDuolingo: [
    "Du vil have gratis og er ligeglad med reklamer",
    "Du lærer alene",
    "Du foretrækker at samle streaks frem for at tale",
    "5 minutter om dagen er dit maks"
  ],
  chooseDuolingoTitle: "Duolingo kan passe hvis...",
  duolingoFaqs: [
    { question: "Kan Duolingo hjælpe mig med at tale med min partners familie?", answer: "Duolingo lærer dig at oversætte sætninger. Love Languages lærer dig at føre samtaler. Hvis du skal tale med din partners familie, har du brug for taleøvelse." },
    { question: "Hvorfor er Love Languages bedre til par?", answer: "Fordi det er bygget til par. Send ordgaver, udfordr i spil, lær i lyttetilstand." },
    { question: "Er Duolingos gratis niveau nok?", answer: "Til grundlæggende ordforråd — ja. Til ægte samtaler har du brug for samtaleøvelse." },
    { question: "Skal jeg bruge begge apps?", answer: "Nogle gør det. Duolingo til 5-minutters pauser, Love Languages til seriøs øvelse." }
  ],
  babbelFeatures: [
    { name: "Sprog", loveLanguages: { value: "18 (alle kombinationer)", highlight: true }, competitor: { value: "14 (begrænsede par)", highlight: false } },
    { name: "Parfunktioner", loveLanguages: { value: "Udfordringer, gaver, delt fremgang", highlight: true }, competitor: { value: "Ingen", highlight: false } },
    { name: "AI-samtaler", loveLanguages: { value: "Realtid med Gemini AI", highlight: true }, competitor: { value: "Indspillede lektioner", highlight: false } },
    { name: "Taleøvelse", loveLanguages: { value: "Naturlig tale med AI", highlight: true }, competitor: { value: "Udtaleøvelser", highlight: false } },
    { name: "Lyttetilstand", loveLanguages: { value: "Fanger og oversætter live", highlight: true }, competitor: { value: "Kun podcasts", highlight: false } },
    { name: "Tilpasning", loveLanguages: { value: "AI tilpasser sig i realtid", highlight: true }, competitor: { value: "Fast lektionsrækkefølge", highlight: false } },
    { name: "Læringsstil", loveLanguages: { value: "Samtale først", highlight: true }, competitor: { value: "Grammatik først", highlight: false } },
    { name: "Bedst til", loveLanguages: { value: "Par, ægte samtaler", highlight: true }, competitor: { value: "Solo, struktureret", highlight: false } }
  ],
  babbelSummary: [
    { text: "Kurser af sprogforskere", positive: true },
    { text: "Struktureret fremgang", positive: true },
    { text: "Kun 14 sprog", positive: false },
    { text: "Ingen parfunktioner", positive: false }
  ],
  babbelSubtitle: "Strukturerede solo-kurser",
  chooseBabbel: [
    "Du foretrækker en fast læseplan",
    "Du lærer alene til arbejde",
    "Du kan lide lærebogsfremgang",
    "Du vil have livstidsadgang for én pris"
  ],
  chooseBabbelTitle: "Babbel kan passe hvis...",
  babbelFaqs: [
    { question: "Er Babbel godt til at lære med min partner?", answer: "Babbel er designet til én person. Ingen delte funktioner. Love Languages er specielt til par." },
    { question: "Hvordan adskiller Love Languages sig fra Babbel?", answer: "Babbel giver lektioner. Love Languages giver samtaler. Vores AI tilpasser sig dit niveau i realtid." },
    { question: "Hvor er samtaleøvelsen bedre?", answer: "Love Languages, helt klart. Babbel har scriptede dialoger. Vi har AI der virkelig svarer." },
    { question: "Kan jeg skifte fra Babbel?", answer: "Ja. Mange par skifter når de indser at de kan læse en menu men ikke føre en samtale." }
  ],
  listenMode: { title: "Lyttetilstand", description: "Fang ægte samtaler omkring dig. Lyt til din partner, få direkte oversættelser." },
  partnerChallenges: { title: "Parudfordringer", description: "Send ordforrådsudfordringer til din partner. Test hinanden, tjen point sammen." },
  wordGifts: { title: "Ordgaver", description: "Send et smukt ord eller sætning til din partner. En lille overraskelse der viser at du holder af dem." },
  gameModes: { title: "5 spiltilstande", description: "Flashcards, lyttespil, taleudfordringer. Designet til to." },
  loveLog: { title: "Love Log", description: "Hvert ord gemmes. Gentag sammen, test hinanden." },
  progressXP: { title: "Fremgang og XP", description: "Gå opad sammen. Se hvem der arbejder hårdest. Lidt konkurrence hjælper læringen." },
  languages18: { title: "18 sprog", description: "Lær polsk fra spansk. Koreansk fra fransk. Alle sprog, alle retninger." }
};

// Czech content
const CS_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Jediná aplikace pro páry",
    description: "Podívejte se, proč páry volí Love Languages před {competitor}. AI konverzace, režim poslechu, párové výzvy a 18 jazyků k učení společně.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Jedna je postavena pro páry. Druhá ne. Takto to ovlivní vaši jazykovou cestu.",
    whatMakesDifferent: "Proč páry přecházejí na Love Languages",
    featureComparison: "Srovnání",
    builtForLearning: "Funkce pro páry",
    readyToLearn: "Začněte se učit společně",
    otherComparisons: "Další srovnání",
    allComparisons: "Všechna srovnání",
    bestForCouples: "Postaveno pro páry",
    ctaTitle: "Jazyk vašeho partnera, společně",
    ctaSubtitle: "18 jazyků. AI, která se přizpůsobuje. Funkce pro dva.",
    ctaButton: "Vyzkoušejte zdarma",
    ctaFooter: "Připojte se k 10 000+ párům",
    footerTagline: "Jazyková aplikace pro páry",
    blog: "Blog",
    tools: "Nástroje",
    compare: "Srovnání",
    terms: "Podmínky",
    privacy: "Soukromí"
  },
  loveLanguagesSummary: [
    { text: "18 jazyků, všechny směry", positive: true },
    { text: "AI konverzace, které se přizpůsobují", positive: true },
    { text: "Režim poslechu zachycuje skutečné rozhovory", positive: true },
    { text: "Funkce výzev a dárků pro páry", positive: true }
  ],
  chooseLoveLanguages: [
    "Učíte se mateřský jazyk svého partnera",
    "Chcete skutečně mluvit, ne jen ťukat na odpovědi",
    "Učíte se lépe s někým po boku",
    "Potkáváte rodinu nebo se stěhujete do zahraničí",
    "Chcete udělat z učení jazyků společnou aktivitu"
  ],
  chooseLoveLanguagesTitle: "Love Languages je pro vás, pokud...",
  duolingoFeatures: [
    { name: "Jazyky", loveLanguages: { value: "18 (všechny kombinace)", highlight: true }, competitor: { value: "40+ (jeden směr)", highlight: false } },
    { name: "Párové funkce", loveLanguages: { value: "Výzvy, dárky, sdílený pokrok", highlight: true }, competitor: { value: "Žádné", highlight: false } },
    { name: "AI konverzace", loveLanguages: { value: "Reálný čas s Gemini AI", highlight: true }, competitor: { value: "Skriptované odpovědi", highlight: false } },
    { name: "Mluvení", loveLanguages: { value: "Přirozená řeč s AI", highlight: true }, competitor: { value: "Opakování vět", highlight: false } },
    { name: "Režim poslechu", loveLanguages: { value: "Zachycuje a překládá živě", highlight: true }, competitor: { value: "Ne", highlight: false } },
    { name: "Styl učení", loveLanguages: { value: "Zaměřeno na konverzaci", highlight: true }, competitor: { value: "Překladová cvičení", highlight: false } },
    { name: "Slovní zásoba", loveLanguages: { value: "Osobní Love Log", highlight: true }, competitor: { value: "Vázáno na kurz", highlight: false } },
    { name: "Nejlepší pro", loveLanguages: { value: "Páry, skutečné rozhovory", highlight: true }, competitor: { value: "Solo, příležitostné", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Bezplatná úroveň s reklamami", positive: true },
    { text: "Streak motivace", positive: true },
    { text: "Stejný formát pro všechny jazyky", positive: false },
    { text: "Žádné párové funkce", positive: false }
  ],
  duolingoSubtitle: "Gamifikované solo učení",
  chooseDuolingo: [
    "Chcete zdarma a nevadí vám reklamy",
    "Učíte se sami",
    "Raději sbíráte streaky než mluvíte",
    "5 minut denně je vaše maximum"
  ],
  chooseDuolingoTitle: "Duolingo může vyhovovat, pokud...",
  duolingoFaqs: [
    { question: "Může mi Duolingo pomoct mluvit s rodinou partnera?", answer: "Duolingo vás učí překládat věty. Love Languages vás učí vést konverzace. Pokud potřebujete mluvit s rodinou partnera, potřebujete konverzační praxi." },
    { question: "Proč je Love Languages lepší pro páry?", answer: "Protože je postaveno pro páry. Posílejte slovní dárky, vyzývejte ve hrách, učte se v režimu poslechu." },
    { question: "Stačí bezplatná úroveň Duolinga?", answer: "Pro základní slovní zásobu — ano. Pro skutečné konverzace potřebujete konverzační praxi." },
    { question: "Měl bych používat obě aplikace?", answer: "Někteří to dělají. Duolingo na 5minutové přestávky, Love Languages na seriózní praxi." }
  ],
  babbelFeatures: [
    { name: "Jazyky", loveLanguages: { value: "18 (všechny kombinace)", highlight: true }, competitor: { value: "14 (omezené páry)", highlight: false } },
    { name: "Párové funkce", loveLanguages: { value: "Výzvy, dárky, sdílený pokrok", highlight: true }, competitor: { value: "Žádné", highlight: false } },
    { name: "AI konverzace", loveLanguages: { value: "Reálný čas s Gemini AI", highlight: true }, competitor: { value: "Nahrané lekce", highlight: false } },
    { name: "Mluvení", loveLanguages: { value: "Přirozená řeč s AI", highlight: true }, competitor: { value: "Cvičení výslovnosti", highlight: false } },
    { name: "Režim poslechu", loveLanguages: { value: "Zachycuje a překládá živě", highlight: true }, competitor: { value: "Pouze podcasty", highlight: false } },
    { name: "Přizpůsobení", loveLanguages: { value: "AI se přizpůsobuje v reálném čase", highlight: true }, competitor: { value: "Pevné pořadí lekcí", highlight: false } },
    { name: "Styl učení", loveLanguages: { value: "Nejprve konverzace", highlight: true }, competitor: { value: "Nejprve gramatika", highlight: false } },
    { name: "Nejlepší pro", loveLanguages: { value: "Páry, skutečné rozhovory", highlight: true }, competitor: { value: "Solo, strukturované", highlight: false } }
  ],
  babbelSummary: [
    { text: "Kurzy od jazykovědců", positive: true },
    { text: "Strukturovaný pokrok", positive: true },
    { text: "Pouze 14 jazyků", positive: false },
    { text: "Žádné párové funkce", positive: false }
  ],
  babbelSubtitle: "Strukturované solo kurzy",
  chooseBabbel: [
    "Dáváte přednost pevnému učebnímu plánu",
    "Učíte se sami pro práci",
    "Máte rádi pokrok jako v učebnici",
    "Chcete doživotní přístup za jednu cenu"
  ],
  chooseBabbelTitle: "Babbel může vyhovovat, pokud...",
  babbelFaqs: [
    { question: "Je Babbel dobrý pro učení s partnerem?", answer: "Babbel je navržen pro jednu osobu. Žádné sdílené funkce. Love Languages je speciálně pro páry." },
    { question: "Jak se Love Languages liší od Babbelu?", answer: "Babbel dává lekce. Love Languages dává konverzace. Naše AI se přizpůsobuje vaší úrovni v reálném čase." },
    { question: "Kde je konverzační praxe lepší?", answer: "Love Languages, rozhodně. Babbel má skriptované dialogy. My máme AI, která skutečně odpovídá." },
    { question: "Mohu přejít z Babbelu?", answer: "Ano. Mnoho párů přechází, když si uvědomí, že umí přečíst menu, ale neumí vést konverzaci." }
  ],
  listenMode: { title: "Režim poslechu", description: "Zachyťte skutečné rozhovory kolem vás. Poslouchejte partnera, získejte okamžité překlady." },
  partnerChallenges: { title: "Párové výzvy", description: "Posílejte slovníkové výzvy partnerovi. Testujte se, získávejte body společně." },
  wordGifts: { title: "Slovní dárky", description: "Pošlete krásné slovo nebo frázi partnerovi. Malé překvapení, které ukazuje, že vám záleží." },
  gameModes: { title: "5 herních režimů", description: "Flashcards, poslechové hry, mluvní výzvy. Navrženo pro dva." },
  loveLog: { title: "Love Log", description: "Každé slovo se ukládá. Opakujte společně, testujte se navzájem." },
  progressXP: { title: "Pokrok a XP", description: "Stoupejte společně. Sledujte, kdo se snaží nejvíc. Trocha soutěže pomáhá učení." },
  languages18: { title: "18 jazyků", description: "Učte se polsky ze španělštiny. Korejsky z francouzštiny. Všechny jazyky, všechny směry." }
};

// Greek content
const EL_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Η μόνη εφαρμογή για ζευγάρια",
    description: "Δείτε γιατί τα ζευγάρια επιλέγουν το Love Languages αντί του {competitor}. AI συνομιλίες, λειτουργία ακρόασης, προκλήσεις ζευγαριών και 18 γλώσσες για να μάθετε μαζί.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Η μία είναι φτιαγμένη για ζευγάρια. Η άλλη όχι. Δείτε πώς αυτό επηρεάζει το γλωσσικό σας ταξίδι.",
    whatMakesDifferent: "Γιατί τα ζευγάρια αλλάζουν στο Love Languages",
    featureComparison: "Σύγκριση",
    builtForLearning: "Λειτουργίες για ζευγάρια",
    readyToLearn: "Ξεκινήστε να μαθαίνετε μαζί",
    otherComparisons: "Άλλες συγκρίσεις",
    allComparisons: "Όλες οι συγκρίσεις",
    bestForCouples: "Φτιαγμένο για ζευγάρια",
    ctaTitle: "Η γλώσσα του συντρόφου σας, μαζί",
    ctaSubtitle: "18 γλώσσες. AI που προσαρμόζεται. Λειτουργίες για δύο.",
    ctaButton: "Δοκιμάστε δωρεάν",
    ctaFooter: "Γίνετε μέλος 10.000+ ζευγαριών",
    footerTagline: "Η εφαρμογή γλωσσών για ζευγάρια",
    blog: "Blog",
    tools: "Εργαλεία",
    compare: "Σύγκριση",
    terms: "Όροι",
    privacy: "Απόρρητο"
  },
  loveLanguagesSummary: [
    { text: "18 γλώσσες, όλες οι κατευθύνσεις", positive: true },
    { text: "AI συνομιλίες που προσαρμόζονται", positive: true },
    { text: "Λειτουργία ακρόασης για αληθινές συνομιλίες", positive: true },
    { text: "Προκλήσεις και δώρα για ζευγάρια", positive: true }
  ],
  chooseLoveLanguages: [
    "Μαθαίνετε τη μητρική γλώσσα του συντρόφου σας",
    "Θέλετε πραγματικά να μιλάτε, όχι απλά να πατάτε απαντήσεις",
    "Μαθαίνετε καλύτερα με κάποιον δίπλα σας",
    "Θα συναντήσετε την οικογένεια ή θα μετακομίσετε",
    "Θέλετε η εκμάθηση γλωσσών να γίνει κοινή δραστηριότητα"
  ],
  chooseLoveLanguagesTitle: "Το Love Languages είναι για εσάς αν...",
  duolingoFeatures: [
    { name: "Γλώσσες", loveLanguages: { value: "18 (όλοι οι συνδυασμοί)", highlight: true }, competitor: { value: "40+ (μία κατεύθυνση)", highlight: false } },
    { name: "Λειτουργίες ζευγαριών", loveLanguages: { value: "Προκλήσεις, δώρα, κοινή πρόοδος", highlight: true }, competitor: { value: "Καμία", highlight: false } },
    { name: "AI συνομιλίες", loveLanguages: { value: "Σε πραγματικό χρόνο με Gemini AI", highlight: true }, competitor: { value: "Σεναριακές απαντήσεις", highlight: false } },
    { name: "Εξάσκηση ομιλίας", loveLanguages: { value: "Φυσική ομιλία με AI", highlight: true }, competitor: { value: "Επανάληψη προτάσεων", highlight: false } },
    { name: "Λειτουργία ακρόασης", loveLanguages: { value: "Καταγράφει και μεταφράζει ζωντανά", highlight: true }, competitor: { value: "Όχι", highlight: false } },
    { name: "Στυλ μάθησης", loveLanguages: { value: "Εστίαση στη συνομιλία", highlight: true }, competitor: { value: "Ασκήσεις μετάφρασης", highlight: false } },
    { name: "Λεξιλόγιο", loveLanguages: { value: "Προσωπικό Love Log", highlight: true }, competitor: { value: "Δεσμευμένο στο μάθημα", highlight: false } },
    { name: "Καλύτερο για", loveLanguages: { value: "Ζευγάρια, αληθινές συνομιλίες", highlight: true }, competitor: { value: "Solo, χαλαρό", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Δωρεάν επίπεδο με διαφημίσεις", positive: true },
    { text: "Κίνητρο streak", positive: true },
    { text: "Ίδια μορφή για όλες τις γλώσσες", positive: false },
    { text: "Καμία λειτουργία ζευγαριών", positive: false }
  ],
  duolingoSubtitle: "Gamified solo μάθηση",
  chooseDuolingo: [
    "Θέλετε δωρεάν και δεν σας πειράζουν οι διαφημίσεις",
    "Μαθαίνετε μόνοι",
    "Προτιμάτε να μαζεύετε streaks παρά να μιλάτε",
    "5 λεπτά την ημέρα είναι το μέγιστο"
  ],
  chooseDuolingoTitle: "Το Duolingo μπορεί να ταιριάζει αν...",
  duolingoFaqs: [
    { question: "Μπορεί το Duolingo να με βοηθήσει να μιλήσω με την οικογένεια του συντρόφου μου;", answer: "Το Duolingo σας μαθαίνει να μεταφράζετε προτάσεις. Το Love Languages σας μαθαίνει να κάνετε συνομιλίες. Αν πρέπει να μιλήσετε με την οικογένεια του συντρόφου σας, χρειάζεστε εξάσκηση ομιλίας." },
    { question: "Γιατί είναι καλύτερο το Love Languages για ζευγάρια;", answer: "Επειδή είναι φτιαγμένο για ζευγάρια. Στείλτε δώρα λέξεων, προκαλέστε σε παιχνίδια, μάθετε σε λειτουργία ακρόασης." },
    { question: "Αρκεί το δωρεάν επίπεδο του Duolingo;", answer: "Για βασικό λεξιλόγιο — ναι. Για αληθινές συνομιλίες χρειάζεστε εξάσκηση συνομιλίας." },
    { question: "Πρέπει να χρησιμοποιώ και τις δύο εφαρμογές;", answer: "Μερικοί το κάνουν. Duolingo για διαλείμματα 5 λεπτών, Love Languages για σοβαρή εξάσκηση." }
  ],
  babbelFeatures: [
    { name: "Γλώσσες", loveLanguages: { value: "18 (όλοι οι συνδυασμοί)", highlight: true }, competitor: { value: "14 (περιορισμένα ζεύγη)", highlight: false } },
    { name: "Λειτουργίες ζευγαριών", loveLanguages: { value: "Προκλήσεις, δώρα, κοινή πρόοδος", highlight: true }, competitor: { value: "Καμία", highlight: false } },
    { name: "AI συνομιλίες", loveLanguages: { value: "Σε πραγματικό χρόνο με Gemini AI", highlight: true }, competitor: { value: "Ηχογραφημένα μαθήματα", highlight: false } },
    { name: "Εξάσκηση ομιλίας", loveLanguages: { value: "Φυσική ομιλία με AI", highlight: true }, competitor: { value: "Ασκήσεις προφοράς", highlight: false } },
    { name: "Λειτουργία ακρόασης", loveLanguages: { value: "Καταγράφει και μεταφράζει ζωντανά", highlight: true }, competitor: { value: "Μόνο podcasts", highlight: false } },
    { name: "Προσαρμογή", loveLanguages: { value: "AI προσαρμόζεται σε πραγματικό χρόνο", highlight: true }, competitor: { value: "Σταθερή σειρά μαθημάτων", highlight: false } },
    { name: "Στυλ μάθησης", loveLanguages: { value: "Πρώτα συνομιλία", highlight: true }, competitor: { value: "Πρώτα γραμματική", highlight: false } },
    { name: "Καλύτερο για", loveLanguages: { value: "Ζευγάρια, αληθινές συνομιλίες", highlight: true }, competitor: { value: "Solo, δομημένο", highlight: false } }
  ],
  babbelSummary: [
    { text: "Μαθήματα από γλωσσολόγους", positive: true },
    { text: "Δομημένη πρόοδος", positive: true },
    { text: "Μόνο 14 γλώσσες", positive: false },
    { text: "Καμία λειτουργία ζευγαριών", positive: false }
  ],
  babbelSubtitle: "Δομημένα solo μαθήματα",
  chooseBabbel: [
    "Προτιμάτε σταθερό πρόγραμμα σπουδών",
    "Μαθαίνετε μόνοι για δουλειά",
    "Σας αρέσει η πρόοδος τύπου βιβλίου",
    "Θέλετε πρόσβαση εφ' όρου ζωής για μία τιμή"
  ],
  chooseBabbelTitle: "Το Babbel μπορεί να ταιριάζει αν...",
  babbelFaqs: [
    { question: "Είναι καλό το Babbel για μάθηση με τον σύντροφό μου;", answer: "Το Babbel είναι σχεδιασμένο για ένα άτομο. Χωρίς κοινές λειτουργίες. Το Love Languages είναι ειδικά για ζευγάρια." },
    { question: "Πώς διαφέρει το Love Languages από το Babbel;", answer: "Το Babbel δίνει μαθήματα. Το Love Languages δίνει συνομιλίες. Η AI μας προσαρμόζεται στο επίπεδό σας σε πραγματικό χρόνο." },
    { question: "Πού είναι καλύτερη η εξάσκηση συνομιλίας;", answer: "Love Languages, σίγουρα. Το Babbel έχει σεναριακούς διαλόγους. Εμείς έχουμε AI που πραγματικά απαντά." },
    { question: "Μπορώ να αλλάξω από το Babbel;", answer: "Ναι. Πολλά ζευγάρια αλλάζουν όταν συνειδητοποιούν ότι μπορούν να διαβάσουν ένα μενού αλλά όχι να κάνουν συνομιλία." }
  ],
  listenMode: { title: "Λειτουργία ακρόασης", description: "Καταγράψτε αληθινές συνομιλίες γύρω σας. Ακούστε τον σύντροφό σας, λάβετε άμεσες μεταφράσεις." },
  partnerChallenges: { title: "Προκλήσεις ζευγαριών", description: "Στείλτε προκλήσεις λεξιλογίου στον σύντροφό σας. Τεστάρετε ο ένας τον άλλον, κερδίστε πόντους μαζί." },
  wordGifts: { title: "Δώρα λέξεων", description: "Στείλτε μια όμορφη λέξη ή φράση στον σύντροφό σας. Μια μικρή έκπληξη που δείχνει ότι νοιάζεστε." },
  gameModes: { title: "5 λειτουργίες παιχνιδιού", description: "Flashcards, παιχνίδια ακρόασης, προκλήσεις ομιλίας. Σχεδιασμένο για δύο." },
  loveLog: { title: "Love Log", description: "Κάθε λέξη αποθηκεύεται. Επαναλάβετε μαζί, τεστάρετε ο ένας τον άλλον." },
  progressXP: { title: "Πρόοδος και XP", description: "Ανεβείτε μαζί. Δείτε ποιος προσπαθεί περισσότερο. Λίγος ανταγωνισμός βοηθά τη μάθηση." },
  languages18: { title: "18 γλώσσες", description: "Μάθετε πολωνικά από ισπανικά. Κορεατικά από γαλλικά. Όλες οι γλώσσες, όλες οι κατευθύνσεις." }
};

// Hungarian content
const HU_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} (2025) - Az egyetlen app pároknak",
    description: "Nézze meg, miért választják a párok a Love Languages-t a {competitor} helyett. AI beszélgetések, hallgatási mód, páros kihívások és 18 nyelv, amit együtt tanulhatnak.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Az egyik pároknak készült. A másik nem. Így befolyásolja ez a nyelvi utazást.",
    whatMakesDifferent: "Miért váltanak a párok Love Languages-re",
    featureComparison: "Összehasonlítás",
    builtForLearning: "Funkciók pároknak",
    readyToLearn: "Kezdjék el együtt tanulni",
    otherComparisons: "Más összehasonlítások",
    allComparisons: "Összes összehasonlítás",
    bestForCouples: "Pároknak készült",
    ctaTitle: "Partnere nyelve, együtt",
    ctaSubtitle: "18 nyelv. Alkalmazkodó AI. Funkciók kettőnek.",
    ctaButton: "Próbálja ki ingyen",
    ctaFooter: "Csatlakozzon 10 000+ párhoz",
    footerTagline: "A nyelvtanuló app pároknak",
    blog: "Blog",
    tools: "Eszközök",
    compare: "Összehasonlítás",
    terms: "Feltételek",
    privacy: "Adatvédelem"
  },
  loveLanguagesSummary: [
    { text: "18 nyelv, minden irány", positive: true },
    { text: "Alkalmazkodó AI beszélgetések", positive: true },
    { text: "Hallgatási mód valódi beszélgetésekhez", positive: true },
    { text: "Kihívás és ajándék funkciók pároknak", positive: true }
  ],
  chooseLoveLanguages: [
    "Partnere anyanyelvét tanulja",
    "Valóban beszélni akar, nem csak válaszokat pötyögni",
    "Jobban tanul valakivel az oldalán",
    "Találkozik a családdal vagy külföldre költözik",
    "A nyelvtanulást közös tevékenységgé akarja tenni"
  ],
  chooseLoveLanguagesTitle: "A Love Languages Önnek való, ha...",
  duolingoFeatures: [
    { name: "Nyelvek", loveLanguages: { value: "18 (minden kombináció)", highlight: true }, competitor: { value: "40+ (egy irány)", highlight: false } },
    { name: "Páros funkciók", loveLanguages: { value: "Kihívások, ajándékok, közös haladás", highlight: true }, competitor: { value: "Nincs", highlight: false } },
    { name: "AI beszélgetések", loveLanguages: { value: "Valós idejű Gemini AI-val", highlight: true }, competitor: { value: "Szkriptelt válaszok", highlight: false } },
    { name: "Beszédgyakorlat", loveLanguages: { value: "Természetes beszéd AI-val", highlight: true }, competitor: { value: "Mondatok ismétlése", highlight: false } },
    { name: "Hallgatási mód", loveLanguages: { value: "Élőben rögzít és fordít", highlight: true }, competitor: { value: "Nem", highlight: false } },
    { name: "Tanulási stílus", loveLanguages: { value: "Beszélgetés-központú", highlight: true }, competitor: { value: "Fordítási gyakorlatok", highlight: false } },
    { name: "Szókincs", loveLanguages: { value: "Személyes Love Log", highlight: true }, competitor: { value: "Kurzushoz kötött", highlight: false } },
    { name: "Legjobb", loveLanguages: { value: "Pároknak, valódi beszélgetésekhez", highlight: true }, competitor: { value: "Egyéni, alkalmi", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Ingyenes szint hirdetésekkel", positive: true },
    { text: "Streak motiváció", positive: true },
    { text: "Ugyanaz a formátum minden nyelvhez", positive: false },
    { text: "Nincs páros funkció", positive: false }
  ],
  duolingoSubtitle: "Gamifikált egyéni tanulás",
  chooseDuolingo: [
    "Ingyen akar és nem zavarják a hirdetések",
    "Egyedül tanul",
    "Inkább streakeket gyűjt, mint beszél",
    "Napi 5 perc a maximum"
  ],
  chooseDuolingoTitle: "A Duolingo megfelelhet, ha...",
  duolingoFaqs: [
    { question: "Segíthet a Duolingo beszélni partnerem családjával?", answer: "A Duolingo mondatokat fordíttat. A Love Languages beszélgetni tanít. Ha partnere családjával kell beszélnie, beszédgyakorlatra van szüksége." },
    { question: "Miért jobb a Love Languages pároknak?", answer: "Mert pároknak készült. Küldjön szóajándékokat, kihívásokat játékokban, tanuljon hallgatási módban." },
    { question: "Elég a Duolingo ingyenes szintje?", answer: "Alapszókincshez — igen. Valódi beszélgetésekhez beszélgetési gyakorlat kell." },
    { question: "Mindkét appot használjam?", answer: "Néhányan így tesznek. Duolingo 5 perces szünetekre, Love Languages komoly gyakorlásra." }
  ],
  babbelFeatures: [
    { name: "Nyelvek", loveLanguages: { value: "18 (minden kombináció)", highlight: true }, competitor: { value: "14 (korlátozott párok)", highlight: false } },
    { name: "Páros funkciók", loveLanguages: { value: "Kihívások, ajándékok, közös haladás", highlight: true }, competitor: { value: "Nincs", highlight: false } },
    { name: "AI beszélgetések", loveLanguages: { value: "Valós idejű Gemini AI-val", highlight: true }, competitor: { value: "Felvett leckék", highlight: false } },
    { name: "Beszédgyakorlat", loveLanguages: { value: "Természetes beszéd AI-val", highlight: true }, competitor: { value: "Kiejtési gyakorlatok", highlight: false } },
    { name: "Hallgatási mód", loveLanguages: { value: "Élőben rögzít és fordít", highlight: true }, competitor: { value: "Csak podcastok", highlight: false } },
    { name: "Testreszabás", loveLanguages: { value: "AI valós időben alkalmazkodik", highlight: true }, competitor: { value: "Fix leckesorrend", highlight: false } },
    { name: "Tanulási stílus", loveLanguages: { value: "Először beszélgetés", highlight: true }, competitor: { value: "Először nyelvtan", highlight: false } },
    { name: "Legjobb", loveLanguages: { value: "Pároknak, valódi beszélgetésekhez", highlight: true }, competitor: { value: "Egyéni, strukturált", highlight: false } }
  ],
  babbelSummary: [
    { text: "Nyelvészek által készített kurzusok", positive: true },
    { text: "Strukturált haladás", positive: true },
    { text: "Csak 14 nyelv", positive: false },
    { text: "Nincs páros funkció", positive: false }
  ],
  babbelSubtitle: "Strukturált egyéni kurzusok",
  chooseBabbel: [
    "Fix tantervet preferál",
    "Egyedül tanul munkához",
    "Szereti a tankönyvszerű haladást",
    "Élethosszig tartó hozzáférést akar egy árért"
  ],
  chooseBabbelTitle: "A Babbel megfelelhet, ha...",
  babbelFaqs: [
    { question: "Jó a Babbel a partneremmel tanuláshoz?", answer: "A Babbel egy személyre tervezett. Nincs megosztott funkció. A Love Languages kifejezetten pároknak szól." },
    { question: "Miben különbözik a Love Languages a Babbeltől?", answer: "A Babbel leckéket ad. A Love Languages beszélgetéseket. AI-unk valós időben alkalmazkodik szintjéhez." },
    { question: "Hol jobb a beszélgetési gyakorlat?", answer: "Love Languages, egyértelműen. A Babbelnek szkriptelt dialógusai vannak. Nekünk AI-unk van, ami valóban válaszol." },
    { question: "Válthatok a Babbelről?", answer: "Igen. Sok pár vált, amikor rájön, hogy el tud olvasni egy étlapot, de nem tud beszélgetni." }
  ],
  listenMode: { title: "Hallgatási mód", description: "Rögzítse a valódi beszélgetéseket maga körül. Hallgassa partnerét, kapjon azonnali fordításokat." },
  partnerChallenges: { title: "Páros kihívások", description: "Küldjön szókincskihívásokat partnerének. Teszteljék egymást, szerezzenek pontokat együtt." },
  wordGifts: { title: "Szóajándékok", description: "Küldjön egy szép szót vagy kifejezést partnerének. Kis meglepetés, ami mutatja, hogy törődik." },
  gameModes: { title: "5 játékmód", description: "Flashcardok, hallgatási játékok, beszédkihívások. Kettőnek tervezve." },
  loveLog: { title: "Love Log", description: "Minden szó mentésre kerül. Ismételjék együtt, teszteljék egymást." },
  progressXP: { title: "Haladás és XP", description: "Haladjanak együtt felfelé. Lássák, ki dolgozik legtöbbet. Egy kis verseny segít a tanulásban." },
  languages18: { title: "18 nyelv", description: "Tanuljon lengyelül spanyolból. Koreaiul franciából. Minden nyelv, minden irány." }
};

// Content map (only languages with article content)
const CONTENT_MAP: Record<string, ComparisonContent> = {
  en: EN_CONTENT,
  es: ES_CONTENT,
  fr: FR_CONTENT,
  de: DE_CONTENT,
  it: IT_CONTENT,
  pt: PT_CONTENT,
  nl: NL_CONTENT,
  pl: PL_CONTENT,
  ru: RU_CONTENT,
  uk: UK_CONTENT,
  tr: TR_CONTENT,
  ro: RO_CONTENT,
  sv: SV_CONTENT,
  no: NO_CONTENT,
  da: DA_CONTENT,
  cs: CS_CONTENT,
  el: EL_CONTENT,
  hu: HU_CONTENT
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
