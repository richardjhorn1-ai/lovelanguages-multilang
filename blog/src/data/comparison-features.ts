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
    title: "Love Languages vs {competitor} - Best App for Couples Learning Languages (2025)",
    description: "Compare Love Languages and {competitor} for couples. Discover which app offers Listen Mode, partner challenges, word gifts, and AI conversations for learning 18 languages together.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "An honest comparison for couples learning languages together. Which app will help you actually speak with your partner?",
    whatMakesDifferent: "What Makes Love Languages Different",
    featureComparison: "Feature Comparison",
    builtForLearning: "Built for Learning Together",
    readyToLearn: "Ready to Learn Together?",
    otherComparisons: "Other Comparisons",
    allComparisons: "All Comparisons",
    bestForCouples: "Best for couples",
    ctaTitle: "Ready to Learn Together?",
    ctaSubtitle: "Join couples learning 18 languages with AI coaching, Listen Mode, partner challenges, and games designed for bonding.",
    ctaButton: "Start Learning Together",
    ctaFooter: "Join couples learning languages across 30+ countries",
    footerTagline: "Learn any language together with your partner",
    blog: "Blog",
    tools: "Tools",
    compare: "Compare",
    terms: "Terms",
    privacy: "Privacy"
  },
  loveLanguagesSummary: [
    { text: "18 languages, any combination", positive: true },
    { text: "Built for couples", positive: true },
    { text: "Listen Mode & voice practice", positive: true },
    { text: "Partner challenges & word gifts", positive: true }
  ],
  chooseLoveLanguages: [
    "You're learning a language with your partner",
    "You want real AI conversations, not scripted exercises",
    "You want Listen Mode to learn passively while doing other things",
    "You want to send challenges and word gifts to your partner",
    "You're preparing to meet your partner's family or travel together",
    "You want games and activities designed for couples"
  ],
  chooseLoveLanguagesTitle: "Choose Love Languages if...",

  // Duolingo
  duolingoFeatures: [
    { name: "Language Support", loveLanguages: { value: "18 languages, any combination", highlight: true }, competitor: { value: "40+ languages (one at a time)", highlight: false } },
    { name: "Designed for Couples", loveLanguages: { value: "Built for learning together", highlight: true }, competitor: { value: "Individual learning only", highlight: false } },
    { name: "AI Conversation Partner", loveLanguages: { value: "Advanced AI tutor (Gemini)", highlight: true }, competitor: { value: "Scripted chatbot responses", highlight: false } },
    { name: "Voice Practice", loveLanguages: { value: "Real-time voice conversations", highlight: true }, competitor: { value: "Limited speech exercises", highlight: false } },
    { name: "Listen Mode", loveLanguages: { value: "Passive listening practice", highlight: true }, competitor: { value: "Not available", highlight: false } },
    { name: "Partner Features", loveLanguages: { value: "Challenges, word gifts, bonding", highlight: true }, competitor: { value: "None", highlight: false } },
    { name: "Games & Activities", loveLanguages: { value: "5 game modes for couples", highlight: true }, competitor: { value: "Gamified drills (solo)", highlight: false } },
    { name: "Vocabulary Tracking", loveLanguages: { value: "Personal Love Log", highlight: true }, competitor: { value: "Course-based progress", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Free tier available", positive: true },
    { text: "Gamified experience", positive: true },
    { text: "Generic content for all languages", positive: false },
    { text: "No couple or partner features", positive: false }
  ],
  duolingoSubtitle: "Best for casual solo learning",
  chooseDuolingo: [
    "You want a free option with no commitment",
    "You enjoy gamified learning with streaks and rewards",
    "You're casually exploring multiple languages",
    "You prefer short 5-minute daily sessions",
    "You're testing if you want to learn a language at all"
  ],
  chooseDuolingoTitle: "Choose Duolingo if...",
  duolingoFaqs: [
    { question: "Is Duolingo good for learning languages?", answer: "Duolingo offers free courses for 40+ languages that are great for casual learners and building basic vocabulary. However, it uses the same gamified template for all languages and focuses on individual learning. For couples wanting to learn together with features like partner challenges, word gifts, and Listen Mode, a specialized app like Love Languages provides more depth and connection." },
    { question: "Why choose Love Languages over Duolingo?", answer: "Love Languages is built specifically for couples learning together across 18 languages. While Duolingo focuses on gamified solo exercises, we offer AI conversation partners, Listen Mode for passive learning, partner challenges to compete and bond, word gifts to surprise your partner, and 5 interactive game modes designed for learning together." },
    { question: "Is Love Languages more expensive than Duolingo?", answer: "Duolingo offers a free tier with ads and a paid Super plan. Love Languages is a premium app designed for committed couples. If you're serious about learning a language together - especially for meeting family, traveling, or building your relationship - the AI coaching, Listen Mode, and couple-focused features provide significantly more value than generic gamified exercises." },
    { question: "Can I use both Duolingo and Love Languages?", answer: "Many couples use Duolingo for casual vocabulary building and Love Languages for deeper learning, conversation practice, and bonding activities. Think of Duolingo as individual gym workouts and Love Languages as couples training sessions with a personal coach." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Language Support", loveLanguages: { value: "18 languages, any combination", highlight: true }, competitor: { value: "14 languages (limited pairs)", highlight: false } },
    { name: "Learning Together", loveLanguages: { value: "Couple-focused features", highlight: true }, competitor: { value: "Individual subscriptions", highlight: false } },
    { name: "AI Tutor", loveLanguages: { value: "Advanced AI conversations", highlight: true }, competitor: { value: "Scripted lessons", highlight: false } },
    { name: "Voice Practice", loveLanguages: { value: "Real-time AI voice chat", highlight: true }, competitor: { value: "Speech recognition drills", highlight: false } },
    { name: "Listen Mode", loveLanguages: { value: "Passive listening anytime", highlight: true }, competitor: { value: "Podcast content only", highlight: false } },
    { name: "Partner Features", loveLanguages: { value: "Challenges, gifts, bonding", highlight: true }, competitor: { value: "No partner features", highlight: false } },
    { name: "Games", loveLanguages: { value: "5 interactive game modes", highlight: true }, competitor: { value: "Review exercises", highlight: false } },
    { name: "Personalization", loveLanguages: { value: "AI adapts to your level", highlight: true }, competitor: { value: "Fixed curriculum", highlight: false } }
  ],
  babbelSummary: [
    { text: "Expert-designed curriculum", positive: true },
    { text: "Clear lesson progression", positive: true },
    { text: "Limited to 14 languages", positive: false },
    { text: "No couple or partner features", positive: false }
  ],
  babbelSubtitle: "Best for structured solo courses",
  chooseBabbel: [
    "You prefer traditional structured courses",
    "You want a fixed curriculum with clear progression",
    "You're learning for business or solo travel",
    "You prefer methodical solo learning with set lessons",
    "You want lifetime access with a one-time payment option"
  ],
  chooseBabbelTitle: "Choose Babbel if...",
  babbelFaqs: [
    { question: "Is Babbel good for learning languages?", answer: "Babbel offers structured courses created by linguists, making it solid for grammar and vocabulary building across 14 languages. However, their content is designed for individual learners following a fixed curriculum. For couples wanting to learn together with AI conversations, Listen Mode, and partner features like challenges and word gifts, Love Languages provides a more connected experience." },
    { question: "What's the difference between Babbel and Love Languages?", answer: "Babbel uses a traditional course structure with lessons designed for individual learners. Love Languages is built for couples learning any of 18 languages together, featuring AI-powered conversations, Listen Mode for passive learning, partner challenges to compete and bond, word gifts to surprise each other, and vocabulary you'll actually use together." },
    { question: "Which is more expensive: Babbel or Love Languages?", answer: "Both are premium apps. Babbel offers various subscription lengths plus a lifetime option. Love Languages provides specialized couple-focused learning with AI features that adapt to your progress. If you're learning with a partner and want features designed for bonding - like challenges, word gifts, and shared progress - Love Languages offers better value for couples." },
    { question: "Can I switch from Babbel to Love Languages?", answer: "Yes! Many users switch when they realize they need more conversational practice and partner engagement than Babbel provides. Love Languages focuses on actually speaking through AI conversations and Listen Mode, plus couple-focused features that make learning a bonding experience rather than solo homework." }
  ],

  // Feature cards
  listenMode: { title: "Listen Mode", description: "Learn passively while cooking, commuting, or relaxing. Duolingo requires active screen time - Love Languages lets you absorb language naturally." },
  partnerChallenges: { title: "Partner Challenges", description: "Challenge your partner to vocabulary battles and track who's learning faster. Turn language learning into playful competition and bonding." },
  wordGifts: { title: "Word Gifts", description: "Send romantic vocabulary and phrases to your partner. A sweet way to share what you're learning and encourage each other." },
  gameModes: { title: "5 Game Modes", description: "From flashcard battles to listening challenges, our games are designed for couples. Compete, collaborate, and celebrate progress together." },
  loveLog: { title: "Love Log", description: "Your personal vocabulary journal. Track words you've learned, review together, and see your shared language journey grow." },
  progressXP: { title: "Progress & XP", description: "Earn XP, level up together, and track your journey. See who's putting in the work and motivate each other to keep going." },
  languages18: { title: "18 Languages", description: "Spanish, French, German, Italian, Portuguese, Polish, Japanese, Korean, and more. Learn any language from any native language background." }
};

// Spanish content
const ES_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} - Mejor App para Parejas Aprendiendo Idiomas (2025)",
    description: "Compara Love Languages y {competitor} para parejas. Descubre qué app ofrece Modo Escucha, desafíos de pareja, regalos de palabras y conversaciones con IA para aprender 18 idiomas juntos.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Una comparación honesta para parejas aprendiendo idiomas juntas. ¿Qué app te ayudará a hablar realmente con tu pareja?",
    whatMakesDifferent: "Qué Hace Diferente a Love Languages",
    featureComparison: "Comparación de Funciones",
    builtForLearning: "Diseñado para Aprender Juntos",
    readyToLearn: "¿Listos para Aprender Juntos?",
    otherComparisons: "Otras Comparaciones",
    allComparisons: "Todas las Comparaciones",
    bestForCouples: "Mejor para parejas",
    ctaTitle: "¿Listos para Aprender Juntos?",
    ctaSubtitle: "Únete a parejas aprendiendo 18 idiomas con coaching de IA, Modo Escucha, desafíos de pareja y juegos diseñados para conectar.",
    ctaButton: "Empezar a Aprender Juntos",
    ctaFooter: "Únete a parejas aprendiendo idiomas en más de 30 países",
    footerTagline: "Aprende cualquier idioma junto con tu pareja",
    blog: "Blog",
    tools: "Herramientas",
    compare: "Comparar",
    terms: "Términos",
    privacy: "Privacidad"
  },
  loveLanguagesSummary: [
    { text: "18 idiomas, cualquier combinación", positive: true },
    { text: "Diseñado para parejas", positive: true },
    { text: "Modo Escucha y práctica de voz", positive: true },
    { text: "Desafíos de pareja y regalos de palabras", positive: true }
  ],
  chooseLoveLanguages: [
    "Estás aprendiendo un idioma con tu pareja",
    "Quieres conversaciones reales con IA, no ejercicios guionizados",
    "Quieres Modo Escucha para aprender pasivamente mientras haces otras cosas",
    "Quieres enviar desafíos y regalos de palabras a tu pareja",
    "Te estás preparando para conocer a la familia de tu pareja o viajar juntos",
    "Quieres juegos y actividades diseñados para parejas"
  ],
  chooseLoveLanguagesTitle: "Elige Love Languages si...",

  // Duolingo
  duolingoFeatures: [
    { name: "Soporte de Idiomas", loveLanguages: { value: "18 idiomas, cualquier combinación", highlight: true }, competitor: { value: "40+ idiomas (uno a la vez)", highlight: false } },
    { name: "Diseñado para Parejas", loveLanguages: { value: "Diseñado para aprender juntos", highlight: true }, competitor: { value: "Solo aprendizaje individual", highlight: false } },
    { name: "Compañero de IA", loveLanguages: { value: "Tutor de IA avanzado (Gemini)", highlight: true }, competitor: { value: "Respuestas de chatbot guionizadas", highlight: false } },
    { name: "Práctica de Voz", loveLanguages: { value: "Conversaciones de voz en tiempo real", highlight: true }, competitor: { value: "Ejercicios de habla limitados", highlight: false } },
    { name: "Modo Escucha", loveLanguages: { value: "Práctica de escucha pasiva", highlight: true }, competitor: { value: "No disponible", highlight: false } },
    { name: "Funciones de Pareja", loveLanguages: { value: "Desafíos, regalos, conexión", highlight: true }, competitor: { value: "Ninguna", highlight: false } },
    { name: "Juegos y Actividades", loveLanguages: { value: "5 modos de juego para parejas", highlight: true }, competitor: { value: "Ejercicios gamificados (solo)", highlight: false } },
    { name: "Seguimiento de Vocabulario", loveLanguages: { value: "Love Log personal", highlight: true }, competitor: { value: "Progreso basado en curso", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Nivel gratuito disponible", positive: true },
    { text: "Experiencia gamificada", positive: true },
    { text: "Contenido genérico para todos los idiomas", positive: false },
    { text: "Sin funciones de pareja", positive: false }
  ],
  duolingoSubtitle: "Mejor para aprendizaje casual individual",
  chooseDuolingo: [
    "Quieres una opción gratuita sin compromiso",
    "Disfrutas el aprendizaje gamificado con rachas y recompensas",
    "Estás explorando varios idiomas casualmente",
    "Prefieres sesiones cortas de 5 minutos diarias",
    "Estás probando si quieres aprender un idioma"
  ],
  chooseDuolingoTitle: "Elige Duolingo si...",
  duolingoFaqs: [
    { question: "¿Es Duolingo bueno para aprender idiomas?", answer: "Duolingo ofrece cursos gratuitos para más de 40 idiomas que son geniales para aprendices casuales y construir vocabulario básico. Sin embargo, usa la misma plantilla gamificada para todos los idiomas y se enfoca en aprendizaje individual. Para parejas que quieren aprender juntas con funciones como desafíos de pareja, regalos de palabras y Modo Escucha, una app especializada como Love Languages proporciona más profundidad y conexión." },
    { question: "¿Por qué elegir Love Languages sobre Duolingo?", answer: "Love Languages está diseñado específicamente para parejas aprendiendo juntas en 18 idiomas. Mientras Duolingo se enfoca en ejercicios gamificados en solitario, nosotros ofrecemos compañeros de conversación con IA, Modo Escucha para aprendizaje pasivo, desafíos de pareja para competir y conectar, regalos de palabras para sorprender a tu pareja, y 5 modos de juego interactivos diseñados para aprender juntos." },
    { question: "¿Es Love Languages más caro que Duolingo?", answer: "Duolingo ofrece un nivel gratuito con anuncios y un plan Super de pago. Love Languages es una app premium diseñada para parejas comprometidas. Si te tomas en serio aprender un idioma juntos - especialmente para conocer a la familia, viajar o fortalecer tu relación - el coaching de IA, Modo Escucha y funciones para parejas proporcionan significativamente más valor que ejercicios gamificados genéricos." },
    { question: "¿Puedo usar Duolingo y Love Languages?", answer: "Muchas parejas usan Duolingo para construir vocabulario casualmente y Love Languages para aprendizaje más profundo, práctica de conversación y actividades de conexión. Piensa en Duolingo como entrenamientos individuales en el gimnasio y Love Languages como sesiones de entrenamiento para parejas con un coach personal." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Soporte de Idiomas", loveLanguages: { value: "18 idiomas, cualquier combinación", highlight: true }, competitor: { value: "14 idiomas (pares limitados)", highlight: false } },
    { name: "Aprender Juntos", loveLanguages: { value: "Funciones enfocadas en parejas", highlight: true }, competitor: { value: "Suscripciones individuales", highlight: false } },
    { name: "Tutor de IA", loveLanguages: { value: "Conversaciones avanzadas con IA", highlight: true }, competitor: { value: "Lecciones guionizadas", highlight: false } },
    { name: "Práctica de Voz", loveLanguages: { value: "Chat de voz con IA en tiempo real", highlight: true }, competitor: { value: "Ejercicios de reconocimiento de voz", highlight: false } },
    { name: "Modo Escucha", loveLanguages: { value: "Escucha pasiva en cualquier momento", highlight: true }, competitor: { value: "Solo contenido de podcast", highlight: false } },
    { name: "Funciones de Pareja", loveLanguages: { value: "Desafíos, regalos, conexión", highlight: true }, competitor: { value: "Sin funciones de pareja", highlight: false } },
    { name: "Juegos", loveLanguages: { value: "5 modos de juego interactivos", highlight: true }, competitor: { value: "Ejercicios de repaso", highlight: false } },
    { name: "Personalización", loveLanguages: { value: "La IA se adapta a tu nivel", highlight: true }, competitor: { value: "Currículum fijo", highlight: false } }
  ],
  babbelSummary: [
    { text: "Currículum diseñado por expertos", positive: true },
    { text: "Progresión clara de lecciones", positive: true },
    { text: "Limitado a 14 idiomas", positive: false },
    { text: "Sin funciones de pareja", positive: false }
  ],
  babbelSubtitle: "Mejor para cursos estructurados individuales",
  chooseBabbel: [
    "Prefieres cursos estructurados tradicionales",
    "Quieres un currículum fijo con progresión clara",
    "Estás aprendiendo para negocios o viajes en solitario",
    "Prefieres aprendizaje metódico en solitario con lecciones establecidas",
    "Quieres acceso de por vida con una opción de pago único"
  ],
  chooseBabbelTitle: "Elige Babbel si...",
  babbelFaqs: [
    { question: "¿Es Babbel bueno para aprender idiomas?", answer: "Babbel ofrece cursos estructurados creados por lingüistas, lo que lo hace sólido para construcción de gramática y vocabulario en 14 idiomas. Sin embargo, su contenido está diseñado para aprendices individuales siguiendo un currículum fijo. Para parejas que quieren aprender juntas con conversaciones de IA, Modo Escucha y funciones de pareja como desafíos y regalos de palabras, Love Languages proporciona una experiencia más conectada." },
    { question: "¿Cuál es la diferencia entre Babbel y Love Languages?", answer: "Babbel usa una estructura de curso tradicional con lecciones diseñadas para aprendices individuales. Love Languages está diseñado para parejas aprendiendo cualquiera de 18 idiomas juntos, con conversaciones potenciadas por IA, Modo Escucha para aprendizaje pasivo, desafíos de pareja para competir y conectar, regalos de palabras para sorprenderse mutuamente, y vocabulario que realmente usarán juntos." },
    { question: "¿Qué es más caro: Babbel o Love Languages?", answer: "Ambas son apps premium. Babbel ofrece varias duraciones de suscripción más una opción de por vida. Love Languages proporciona aprendizaje especializado para parejas con funciones de IA que se adaptan a tu progreso. Si estás aprendiendo con una pareja y quieres funciones diseñadas para conectar - como desafíos, regalos de palabras y progreso compartido - Love Languages ofrece mejor valor para parejas." },
    { question: "¿Puedo cambiar de Babbel a Love Languages?", answer: "¡Sí! Muchos usuarios cambian cuando se dan cuenta de que necesitan más práctica conversacional y engagement de pareja de lo que Babbel proporciona. Love Languages se enfoca en realmente hablar a través de conversaciones con IA y Modo Escucha, más funciones para parejas que hacen del aprendizaje una experiencia de conexión en lugar de tarea en solitario." }
  ],

  // Feature cards
  listenMode: { title: "Modo Escucha", description: "Aprende pasivamente mientras cocinas, viajas o te relajas. Duolingo requiere tiempo activo de pantalla - Love Languages te permite absorber el idioma naturalmente." },
  partnerChallenges: { title: "Desafíos de Pareja", description: "Desafía a tu pareja a batallas de vocabulario y ve quién aprende más rápido. Convierte el aprendizaje de idiomas en competición juguetona y conexión." },
  wordGifts: { title: "Regalos de Palabras", description: "Envía vocabulario romántico y frases a tu pareja. Una forma dulce de compartir lo que estás aprendiendo y animarse mutuamente." },
  gameModes: { title: "5 Modos de Juego", description: "Desde batallas de tarjetas hasta desafíos de escucha, nuestros juegos están diseñados para parejas. Compite, colabora y celebra el progreso juntos." },
  loveLog: { title: "Love Log", description: "Tu diario de vocabulario personal. Rastrea las palabras que has aprendido, repasa juntos y ve crecer tu viaje lingüístico compartido." },
  progressXP: { title: "Progreso y XP", description: "Gana XP, sube de nivel juntos y rastrea tu viaje. Ve quién está poniendo el esfuerzo y motívense mutuamente a seguir adelante." },
  languages18: { title: "18 Idiomas", description: "Español, francés, alemán, italiano, portugués, polaco, japonés, coreano y más. Aprende cualquier idioma desde cualquier idioma nativo." }
};

// French content
const FR_CONTENT: ComparisonContent = {
  page: {
    title: "Love Languages vs {competitor} - Meilleure App pour Couples Apprenant les Langues (2025)",
    description: "Comparez Love Languages et {competitor} pour les couples. Découvrez quelle app offre le Mode Écoute, les défis de couple, les cadeaux de mots et les conversations IA pour apprendre 18 langues ensemble.",
    heroTitle: "Love Languages vs {competitor}",
    heroSubtitle: "Une comparaison honnête pour les couples apprenant des langues ensemble. Quelle app vous aidera vraiment à parler avec votre partenaire ?",
    whatMakesDifferent: "Ce Qui Rend Love Languages Différent",
    featureComparison: "Comparaison des Fonctionnalités",
    builtForLearning: "Conçu pour Apprendre Ensemble",
    readyToLearn: "Prêts à Apprendre Ensemble ?",
    otherComparisons: "Autres Comparaisons",
    allComparisons: "Toutes les Comparaisons",
    bestForCouples: "Meilleur pour les couples",
    ctaTitle: "Prêts à Apprendre Ensemble ?",
    ctaSubtitle: "Rejoignez des couples apprenant 18 langues avec coaching IA, Mode Écoute, défis de couple et jeux conçus pour renforcer les liens.",
    ctaButton: "Commencer à Apprendre Ensemble",
    ctaFooter: "Rejoignez des couples apprenant des langues dans plus de 30 pays",
    footerTagline: "Apprenez n'importe quelle langue avec votre partenaire",
    blog: "Blog",
    tools: "Outils",
    compare: "Comparer",
    terms: "Conditions",
    privacy: "Confidentialité"
  },
  loveLanguagesSummary: [
    { text: "18 langues, toute combinaison", positive: true },
    { text: "Conçu pour les couples", positive: true },
    { text: "Mode Écoute et pratique vocale", positive: true },
    { text: "Défis de couple et cadeaux de mots", positive: true }
  ],
  chooseLoveLanguages: [
    "Vous apprenez une langue avec votre partenaire",
    "Vous voulez de vraies conversations IA, pas des exercices scriptés",
    "Vous voulez le Mode Écoute pour apprendre passivement en faisant autre chose",
    "Vous voulez envoyer des défis et des cadeaux de mots à votre partenaire",
    "Vous vous préparez à rencontrer la famille de votre partenaire ou voyager ensemble",
    "Vous voulez des jeux et activités conçus pour les couples"
  ],
  chooseLoveLanguagesTitle: "Choisissez Love Languages si...",

  // Duolingo
  duolingoFeatures: [
    { name: "Support Langues", loveLanguages: { value: "18 langues, toute combinaison", highlight: true }, competitor: { value: "40+ langues (une à la fois)", highlight: false } },
    { name: "Conçu pour Couples", loveLanguages: { value: "Conçu pour apprendre ensemble", highlight: true }, competitor: { value: "Apprentissage individuel uniquement", highlight: false } },
    { name: "Partenaire IA", loveLanguages: { value: "Tuteur IA avancé (Gemini)", highlight: true }, competitor: { value: "Réponses chatbot scriptées", highlight: false } },
    { name: "Pratique Vocale", loveLanguages: { value: "Conversations vocales en temps réel", highlight: true }, competitor: { value: "Exercices de parole limités", highlight: false } },
    { name: "Mode Écoute", loveLanguages: { value: "Pratique d'écoute passive", highlight: true }, competitor: { value: "Non disponible", highlight: false } },
    { name: "Fonctionnalités Couple", loveLanguages: { value: "Défis, cadeaux, connexion", highlight: true }, competitor: { value: "Aucune", highlight: false } },
    { name: "Jeux et Activités", loveLanguages: { value: "5 modes de jeu pour couples", highlight: true }, competitor: { value: "Exercices gamifiés (solo)", highlight: false } },
    { name: "Suivi du Vocabulaire", loveLanguages: { value: "Love Log personnel", highlight: true }, competitor: { value: "Progression basée sur cours", highlight: false } }
  ],
  duolingoSummary: [
    { text: "Niveau gratuit disponible", positive: true },
    { text: "Expérience gamifiée", positive: true },
    { text: "Contenu générique pour toutes les langues", positive: false },
    { text: "Pas de fonctionnalités couple", positive: false }
  ],
  duolingoSubtitle: "Meilleur pour l'apprentissage solo occasionnel",
  chooseDuolingo: [
    "Vous voulez une option gratuite sans engagement",
    "Vous aimez l'apprentissage gamifié avec des séries et récompenses",
    "Vous explorez plusieurs langues occasionnellement",
    "Vous préférez des sessions courtes de 5 minutes par jour",
    "Vous testez si vous voulez apprendre une langue"
  ],
  chooseDuolingoTitle: "Choisissez Duolingo si...",
  duolingoFaqs: [
    { question: "Duolingo est-il bon pour apprendre les langues ?", answer: "Duolingo propose des cours gratuits pour plus de 40 langues qui sont excellents pour les apprenants occasionnels et la construction de vocabulaire de base. Cependant, il utilise le même modèle gamifié pour toutes les langues et se concentre sur l'apprentissage individuel. Pour les couples voulant apprendre ensemble avec des fonctionnalités comme les défis de couple, les cadeaux de mots et le Mode Écoute, une application spécialisée comme Love Languages offre plus de profondeur et de connexion." },
    { question: "Pourquoi choisir Love Languages plutôt que Duolingo ?", answer: "Love Languages est conçu spécifiquement pour les couples apprenant ensemble dans 18 langues. Tandis que Duolingo se concentre sur des exercices gamifiés en solo, nous offrons des partenaires de conversation IA, le Mode Écoute pour l'apprentissage passif, des défis de couple pour rivaliser et se rapprocher, des cadeaux de mots pour surprendre votre partenaire, et 5 modes de jeu interactifs conçus pour apprendre ensemble." },
    { question: "Love Languages est-il plus cher que Duolingo ?", answer: "Duolingo offre un niveau gratuit avec publicités et un plan Super payant. Love Languages est une application premium conçue pour les couples engagés. Si vous êtes sérieux dans l'apprentissage d'une langue ensemble - surtout pour rencontrer la famille, voyager ou construire votre relation - le coaching IA, le Mode Écoute et les fonctionnalités pour couples offrent significativement plus de valeur que des exercices gamifiés génériques." },
    { question: "Puis-je utiliser Duolingo et Love Languages ?", answer: "Beaucoup de couples utilisent Duolingo pour construire du vocabulaire occasionnellement et Love Languages pour un apprentissage plus profond, la pratique conversationnelle et les activités de connexion. Pensez à Duolingo comme des entraînements individuels à la salle de sport et Love Languages comme des sessions d'entraînement pour couples avec un coach personnel." }
  ],

  // Babbel
  babbelFeatures: [
    { name: "Support Langues", loveLanguages: { value: "18 langues, toute combinaison", highlight: true }, competitor: { value: "14 langues (paires limitées)", highlight: false } },
    { name: "Apprendre Ensemble", loveLanguages: { value: "Fonctionnalités pour couples", highlight: true }, competitor: { value: "Abonnements individuels", highlight: false } },
    { name: "Tuteur IA", loveLanguages: { value: "Conversations IA avancées", highlight: true }, competitor: { value: "Leçons scriptées", highlight: false } },
    { name: "Pratique Vocale", loveLanguages: { value: "Chat vocal IA en temps réel", highlight: true }, competitor: { value: "Exercices reconnaissance vocale", highlight: false } },
    { name: "Mode Écoute", loveLanguages: { value: "Écoute passive à tout moment", highlight: true }, competitor: { value: "Contenu podcast uniquement", highlight: false } },
    { name: "Fonctionnalités Couple", loveLanguages: { value: "Défis, cadeaux, connexion", highlight: true }, competitor: { value: "Pas de fonctionnalités couple", highlight: false } },
    { name: "Jeux", loveLanguages: { value: "5 modes de jeu interactifs", highlight: true }, competitor: { value: "Exercices de révision", highlight: false } },
    { name: "Personnalisation", loveLanguages: { value: "L'IA s'adapte à votre niveau", highlight: true }, competitor: { value: "Programme fixe", highlight: false } }
  ],
  babbelSummary: [
    { text: "Programme conçu par des experts", positive: true },
    { text: "Progression claire des leçons", positive: true },
    { text: "Limité à 14 langues", positive: false },
    { text: "Pas de fonctionnalités couple", positive: false }
  ],
  babbelSubtitle: "Meilleur pour cours structurés solo",
  chooseBabbel: [
    "Vous préférez les cours structurés traditionnels",
    "Vous voulez un programme fixe avec progression claire",
    "Vous apprenez pour le travail ou voyages solo",
    "Vous préférez l'apprentissage méthodique solo avec leçons établies",
    "Vous voulez un accès à vie avec option de paiement unique"
  ],
  chooseBabbelTitle: "Choisissez Babbel si...",
  babbelFaqs: [
    { question: "Babbel est-il bon pour apprendre les langues ?", answer: "Babbel offre des cours structurés créés par des linguistes, ce qui le rend solide pour la construction de grammaire et vocabulaire dans 14 langues. Cependant, leur contenu est conçu pour les apprenants individuels suivant un programme fixe. Pour les couples voulant apprendre ensemble avec des conversations IA, le Mode Écoute et des fonctionnalités couple comme les défis et cadeaux de mots, Love Languages offre une expérience plus connectée." },
    { question: "Quelle est la différence entre Babbel et Love Languages ?", answer: "Babbel utilise une structure de cours traditionnelle avec des leçons conçues pour les apprenants individuels. Love Languages est conçu pour les couples apprenant l'une des 18 langues ensemble, avec des conversations alimentées par l'IA, le Mode Écoute pour l'apprentissage passif, des défis de couple pour rivaliser et se rapprocher, des cadeaux de mots pour se surprendre, et du vocabulaire que vous utiliserez vraiment ensemble." },
    { question: "Lequel est plus cher : Babbel ou Love Languages ?", answer: "Les deux sont des applications premium. Babbel offre diverses durées d'abonnement plus une option à vie. Love Languages fournit un apprentissage spécialisé pour couples avec des fonctionnalités IA qui s'adaptent à vos progrès. Si vous apprenez avec un partenaire et voulez des fonctionnalités conçues pour la connexion - comme les défis, cadeaux de mots et progrès partagé - Love Languages offre une meilleure valeur pour les couples." },
    { question: "Puis-je passer de Babbel à Love Languages ?", answer: "Oui ! Beaucoup d'utilisateurs changent quand ils réalisent qu'ils ont besoin de plus de pratique conversationnelle et d'engagement de couple que ce que Babbel fournit. Love Languages se concentre sur le fait de vraiment parler à travers des conversations IA et le Mode Écoute, plus des fonctionnalités couple qui font de l'apprentissage une expérience de connexion plutôt que des devoirs en solo." }
  ],

  // Feature cards
  listenMode: { title: "Mode Écoute", description: "Apprenez passivement en cuisinant, voyageant ou vous relaxant. Duolingo nécessite du temps d'écran actif - Love Languages vous permet d'absorber la langue naturellement." },
  partnerChallenges: { title: "Défis de Couple", description: "Défiez votre partenaire à des batailles de vocabulaire et voyez qui apprend plus vite. Transformez l'apprentissage des langues en compétition ludique et connexion." },
  wordGifts: { title: "Cadeaux de Mots", description: "Envoyez du vocabulaire romantique et des phrases à votre partenaire. Une façon douce de partager ce que vous apprenez et de vous encourager mutuellement." },
  gameModes: { title: "5 Modes de Jeu", description: "Des batailles de cartes aux défis d'écoute, nos jeux sont conçus pour les couples. Rivalisez, collaborez et célébrez les progrès ensemble." },
  loveLog: { title: "Love Log", description: "Votre journal de vocabulaire personnel. Suivez les mots appris, révisez ensemble et voyez grandir votre voyage linguistique partagé." },
  progressXP: { title: "Progrès et XP", description: "Gagnez des XP, montez de niveau ensemble et suivez votre parcours. Voyez qui fait l'effort et motivez-vous mutuellement à continuer." },
  languages18: { title: "18 Langues", description: "Espagnol, français, allemand, italien, portugais, polonais, japonais, coréen et plus. Apprenez n'importe quelle langue depuis n'importe quelle langue maternelle." }
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
