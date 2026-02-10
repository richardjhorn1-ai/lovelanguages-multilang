/**
 * Static metadata for the 8 RALL methodology articles.
 *
 * Used by RALLMethodologySection.astro to render 3 rotating cards on every
 * article page without an extra Supabase round-trip (~13k pages).
 */

export interface MethodologyArticleSummary {
  slug: string;
  icon: string;
  title: string;
  description: string;
}

/**
 * Titles and descriptions per native language.
 * English is the fallback for any missing language.
 */
const METHODOLOGY_ARTICLES: Record<string, MethodologyArticleSummary[]> = {
  en: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'The Science Behind Couples Learning Together', description: 'Why couples who learn languages together build stronger relationships.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'RALL Strategies That Actually Work', description: 'Turn your partnership into the ultimate language-learning commitment device.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: "Why Learning Your Partner's Language Changes Everything", description: 'The psychology behind shared vocabulary as relationship insurance.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'From Zero to Conversations \u2014 Your Couples Roadmap', description: 'A science-backed 12-week roadmap from vocabulary to real conversation.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'How AI Coaching Keeps You Both on Track', description: 'Why AI coaches protect relationships from the teacher-student trap.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Common Mistakes Couples Make When Learning Together', description: 'Why competition kills progress and what parallel play really means.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Making Language Learning a Date Night', description: '5 science-backed date night ideas that make vocabulary stick.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Long-Distance Couples \u2014 Learning Together Apart', description: 'Turn time zones into an advantage with shared learning rituals.' },
  ],
  es: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'La Ciencia Detr\u00e1s del Aprendizaje en Pareja', description: 'Por qu\u00e9 las parejas que aprenden idiomas juntas construyen relaciones m\u00e1s fuertes.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Estrategias RALL que Realmente Funcionan', description: 'Convierte tu relaci\u00f3n en el mejor compromiso para aprender idiomas.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Por Qu\u00e9 Aprender el Idioma de tu Pareja lo Cambia Todo', description: 'La psicolog\u00eda detr\u00e1s del vocabulario compartido como seguro de relaci\u00f3n.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'De Cero a Conversaciones \u2014 Tu Hoja de Ruta', description: 'Un plan de 12 semanas respaldado por la ciencia.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'C\u00f3mo el Coaching con IA os Mantiene en el Camino', description: 'Por qu\u00e9 los coaches IA protegen la relaci\u00f3n de la trampa profesor-alumno.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Errores Comunes de las Parejas al Aprender Juntas', description: 'Por qu\u00e9 la competencia mata el progreso y qu\u00e9 significa el juego paralelo.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Aprender Idiomas en una Noche de Cita', description: '5 ideas de citas respaldadas por la ciencia que hacen que el vocabulario perdure.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Parejas a Distancia \u2014 Aprender Juntos Separados', description: 'Convierte las zonas horarias en una ventaja con rituales de aprendizaje compartidos.' },
  ],
  fr: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: "La Science de l'Apprentissage en Couple", description: 'Pourquoi les couples qui apprennent ensemble renforcent leur relation.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Strat\u00e9gies RALL qui Fonctionnent Vraiment', description: 'Transformez votre couple en moteur d\u2019apprentissage linguistique.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Pourquoi Apprendre la Langue de Votre Partenaire Change Tout', description: 'La psychologie du vocabulaire partag\u00e9 comme assurance relationnelle.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'De Z\u00e9ro aux Conversations \u2014 Votre Feuille de Route', description: 'Un plan de 12 semaines bas\u00e9 sur la science.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: "Comment le Coaching IA Vous Garde sur la Bonne Voie", description: 'Pourquoi les coachs IA prot\u00e8gent votre relation du pi\u00e8ge professeur-\u00e9l\u00e8ve.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Erreurs Courantes des Couples qui Apprennent Ensemble', description: 'Pourquoi la comp\u00e9tition tue le progr\u00e8s et ce que signifie le jeu parall\u00e8le.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: "Apprendre une Langue en Soir\u00e9e Romantique", description: "5 id\u00e9es de soir\u00e9es romantiques qui ancrent le vocabulaire." },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Couples \u00e0 Distance \u2014 Apprendre Ensemble S\u00e9par\u00e9ment', description: 'Transformez les fuseaux horaires en avantage avec des rituels partag\u00e9s.' },
  ],
  de: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'Die Wissenschaft hinter dem gemeinsamen Lernen', description: 'Warum Paare, die zusammen Sprachen lernen, st\u00e4rkere Beziehungen aufbauen.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'RALL-Strategien, die wirklich funktionieren', description: 'Verwandeln Sie Ihre Partnerschaft in den ultimativen Lern-Antrieb.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Warum die Sprache des Partners alles ver\u00e4ndert', description: 'Die Psychologie hinter gemeinsamem Vokabular als Beziehungsversicherung.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Von Null zu Gespr\u00e4chen \u2014 Ihr Paar-Fahrplan', description: 'Ein wissenschaftlich fundierter 12-Wochen-Plan.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Wie KI-Coaching Sie beide auf Kurs h\u00e4lt', description: 'Warum KI-Coaches Beziehungen vor der Lehrer-Sch\u00fcler-Falle sch\u00fctzen.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'H\u00e4ufige Fehler beim gemeinsamen Sprachenlernen', description: 'Warum Wettbewerb den Fortschritt t\u00f6tet und was paralleles Lernen bedeutet.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Sprachenlernen als Date-Abend', description: '5 wissenschaftlich fundierte Date-Ideen, die Vokabeln verankern.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Fernbeziehungen \u2014 Gemeinsam getrennt lernen', description: 'Verwandeln Sie Zeitzonen in einen Vorteil mit gemeinsamen Lernritualen.' },
  ],
  it: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: "La Scienza dell'Apprendimento in Coppia", description: 'Perch\u00e9 le coppie che imparano insieme costruiscono relazioni pi\u00f9 forti.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Strategie RALL che Funzionano Davvero', description: 'Trasforma la tua relazione nel motore definitivo per imparare le lingue.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Perch\u00e9 Imparare la Lingua del Partner Cambia Tutto', description: 'La psicologia del vocabolario condiviso come assicurazione relazionale.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Da Zero alle Conversazioni \u2014 La Vostra Tabella di Marcia', description: 'Un piano di 12 settimane basato sulla scienza.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: "Come il Coaching IA Vi Tiene in Carreggiata", description: 'Perch\u00e9 i coach IA proteggono la relazione dalla trappola insegnante-studente.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Errori Comuni delle Coppie che Imparano Insieme', description: 'Perch\u00e9 la competizione uccide il progresso e cosa significa il gioco parallelo.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Imparare le Lingue in una Serata Romantica', description: '5 idee per serate romantiche che fissano il vocabolario.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Coppie a Distanza \u2014 Imparare Insieme da Lontano', description: 'Trasforma i fusi orari in un vantaggio con rituali di apprendimento condivisi.' },
  ],
  pt: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'A Ci\u00eancia por Tr\u00e1s do Aprendizado em Casal', description: 'Por que casais que aprendem juntos constroem relacionamentos mais fortes.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Estrat\u00e9gias RALL que Realmente Funcionam', description: 'Transforme sua rela\u00e7\u00e3o no melhor compromisso para aprender idiomas.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Por Que Aprender a L\u00edngua do Parceiro Muda Tudo', description: 'A psicologia por tr\u00e1s do vocabul\u00e1rio compartilhado como seguro do relacionamento.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Do Zero \u00e0s Conversas \u2014 Seu Roteiro de Casal', description: 'Um plano de 12 semanas baseado em ci\u00eancia.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Como o Coaching com IA Mant\u00e9m Voc\u00eas no Caminho', description: 'Por que coaches IA protegem o relacionamento da armadilha professor-aluno.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Erros Comuns de Casais ao Aprender Juntos', description: 'Por que a competi\u00e7\u00e3o mata o progresso e o que significa jogo paralelo.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Aprender Idiomas numa Noite Rom\u00e2ntica', description: '5 ideias de encontros baseadas em ci\u00eancia que fixam o vocabul\u00e1rio.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Casais a Dist\u00e2ncia \u2014 Aprender Juntos Separados', description: 'Transforme fusos hor\u00e1rios em vantagem com rituais de aprendizado compartilhados.' },
  ],
  pl: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'Nauka Stoj\u0105ca za Wsp\u00f3lnym Uczeniem Si\u0119', description: 'Dlaczego pary ucz\u0105ce si\u0119 razem buduj\u0105 silniejsze zwi\u0105zki.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Strategie RALL, Kt\u00f3re Naprawd\u0119 Dzia\u0142aj\u0105', description: 'Zamie\u0144 sw\u00f3j zwi\u0105zek w najlepszy motor do nauki j\u0119zyk\u00f3w.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Dlaczego Nauka J\u0119zyka Partnera Zmienia Wszystko', description: 'Psychologia wsp\u00f3lnego s\u0142ownictwa jako ubezpieczenie zwi\u0105zku.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Od Zera do Rozmowy \u2014 Mapa Drogowa dla Par', description: 'Oparty na nauce 12-tygodniowy plan dla par.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Jak Coaching AI Utrzymuje Was na W\u0142a\u015bciwej Drodze', description: 'Dlaczego trenerzy AI chroni\u0105 zwi\u0105zek przed pu\u0142apk\u0105 nauczyciel-ucze\u0144.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Cz\u0119ste B\u0142\u0119dy Par Ucz\u0105cych Si\u0119 Razem', description: 'Dlaczego rywalizacja zabija post\u0119p i co oznacza r\u00f3wnoleg\u0142a nauka.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Nauka J\u0119zyka na Randce', description: '5 opartych na nauce pomys\u0142\u00f3w na randk\u0119, kt\u00f3re utrwalaj\u0105 s\u0142ownictwo.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Pary na Odleg\u0142o\u015b\u0107 \u2014 Uczycie Si\u0119 Razem Osobno', description: 'Zamie\u0144 strefy czasowe w zalet\u0119 dzi\u0119ki wsp\u00f3lnym rytua\u0142om nauki.' },
  ],
  nl: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'De Wetenschap Achter Samen Leren', description: 'Waarom koppels die samen leren sterkere relaties opbouwen.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: "RALL-Strategie\u00ebn die Echt Werken", description: 'Maak van je relatie de ultieme motor voor taalleren.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Waarom de Taal van je Partner Leren Alles Verandert', description: 'De psychologie achter gedeelde woordenschat als relatieverzekering.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Van Nul naar Gesprekken \u2014 Jullie Routekaart', description: 'Een wetenschappelijk onderbouwd 12-weken plan.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Hoe AI-Coaching Jullie op Koers Houdt', description: 'Waarom AI-coaches de relatie beschermen tegen de leraar-leerling val.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Veelgemaakte Fouten van Koppels die Samen Leren', description: 'Waarom competitie vooruitgang doodt en wat parallel spel betekent.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Taal Leren als Date Night', description: '5 wetenschappelijk onderbouwde date-idee\u00ebn die woordenschat verankeren.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Langeafstandskoppels \u2014 Samen Apart Leren', description: 'Maak van tijdzones een voordeel met gedeelde leerrituelen.' },
  ],
  ro: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: '\u0218tiin\u021ba din Spatele \u00cenv\u0103\u021b\u0103rii \u00een Cuplu', description: 'De ce cuplurile care \u00eenva\u021b\u0103 \u00eempreun\u0103 construiesc rela\u021bii mai puternice.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Strategii RALL Care Func\u021bioneaz\u0103 cu Adev\u0103rat', description: 'Transforma\u021bi rela\u021bia voastr\u0103 \u00een motorul suprem de \u00eenv\u0103\u021bare.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'De Ce \u00cenva\u021barea Limbii Partenerului Schimb\u0103 Totul', description: 'Psihologia vocabularului comun ca asigurare a rela\u021biei.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'De la Zero la Conversa\u021bii \u2014 Foaia Voastr\u0103 de Parcurs', description: 'Un plan de 12 s\u0103pt\u0103m\u00e2ni bazat pe \u0219tiin\u021b\u0103.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Cum V\u0103 Men\u021bine Coaching-ul AI pe Drumul Cel Bun', description: 'De ce antrenorii AI protejeaz\u0103 rela\u021bia de capcana profesor-elev.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Gre\u0219eli Comune ale Cuplurilor Care \u00cenva\u021b\u0103 \u00cempreun\u0103', description: 'De ce competi\u021bia ucide progresul \u0219i ce \u00eenseamn\u0103 jocul paralel.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: '\u00cenva\u021barea Limbilor \u00eentr-o Sear\u0103 Romantic\u0103', description: '5 idei de \u00eent\u00e2lniri bazate pe \u0219tiin\u021b\u0103 care fixeaz\u0103 vocabularul.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Cupluri la Distan\u021b\u0103 \u2014 \u00cenva\u021ba\u021bi \u00cempreun\u0103 Separat', description: 'Transforma\u021bi fusurile orare \u00eentr-un avantaj cu ritualuri de \u00eenv\u0103\u021bare comune.' },
  ],
  ru: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: '\u041d\u0430\u0443\u043a\u0430 \u0441\u043e\u0432\u043c\u0435\u0441\u0442\u043d\u043e\u0433\u043e \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f \u043f\u0430\u0440', description: '\u041f\u043e\u0447\u0435\u043c\u0443 \u043f\u0430\u0440\u044b, \u0438\u0437\u0443\u0447\u0430\u044e\u0449\u0438\u0435 \u044f\u0437\u044b\u043a\u0438 \u0432\u043c\u0435\u0441\u0442\u0435, \u0441\u0442\u0440\u043e\u044f\u0442 \u0431\u043e\u043b\u0435\u0435 \u043a\u0440\u0435\u043f\u043a\u0438\u0435 \u043e\u0442\u043d\u043e\u0448\u0435\u043d\u0438\u044f.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0438 RALL, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0440\u0435\u0430\u043b\u044c\u043d\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442', description: '\u041f\u0440\u0435\u0432\u0440\u0430\u0442\u0438\u0442\u0435 \u0432\u0430\u0448\u0438 \u043e\u0442\u043d\u043e\u0448\u0435\u043d\u0438\u044f \u0432 \u043b\u0443\u0447\u0448\u0438\u0439 \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044c \u0438\u0437\u0443\u0447\u0435\u043d\u0438\u044f \u044f\u0437\u044b\u043a\u043e\u0432.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: '\u041f\u043e\u0447\u0435\u043c\u0443 \u0438\u0437\u0443\u0447\u0435\u043d\u0438\u0435 \u044f\u0437\u044b\u043a\u0430 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0430 \u043c\u0435\u043d\u044f\u0435\u0442 \u0432\u0441\u0451', description: '\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u044f \u043e\u0431\u0449\u0435\u0433\u043e \u0441\u043b\u043e\u0432\u0430\u0440\u044f \u043a\u0430\u043a \u0441\u0442\u0440\u0430\u0445\u043e\u0432\u043a\u0438 \u043e\u0442\u043d\u043e\u0448\u0435\u043d\u0438\u0439.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: '\u041e\u0442 \u043d\u0443\u043b\u044f \u0434\u043e \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440\u043e\u0432 \u2014 \u0412\u0430\u0448\u0430 \u0434\u043e\u0440\u043e\u0436\u043d\u0430\u044f \u043a\u0430\u0440\u0442\u0430', description: '\u041d\u0430\u0443\u0447\u043d\u043e \u043e\u0431\u043e\u0441\u043d\u043e\u0432\u0430\u043d\u043d\u044b\u0439 12-\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u044b\u0439 \u043f\u043b\u0430\u043d \u0434\u043b\u044f \u043f\u0430\u0440.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: '\u041a\u0430\u043a ИИ-\u043a\u043e\u0443\u0447\u0438\u043d\u0433 \u0434\u0435\u0440\u0436\u0438\u0442 \u0432\u0430\u0441 \u043d\u0430 \u043f\u0443\u0442\u0438', description: '\u041f\u043e\u0447\u0435\u043c\u0443 ИИ-\u043a\u043e\u0443\u0447\u0438 \u0437\u0430\u0449\u0438\u0449\u0430\u044e\u0442 \u043e\u0442\u043d\u043e\u0448\u0435\u043d\u0438\u044f \u043e\u0442 \u043b\u043e\u0432\u0443\u0448\u043a\u0438 \u0443\u0447\u0438\u0442\u0435\u043b\u044c-\u0443\u0447\u0435\u043d\u0438\u043a.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: '\u0427\u0430\u0441\u0442\u044b\u0435 \u043e\u0448\u0438\u0431\u043a\u0438 \u043f\u0430\u0440 \u043f\u0440\u0438 \u0441\u043e\u0432\u043c\u0435\u0441\u0442\u043d\u043e\u043c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0438', description: '\u041f\u043e\u0447\u0435\u043c\u0443 \u0441\u043e\u0440\u0435\u0432\u043d\u043e\u0432\u0430\u043d\u0438\u0435 \u0443\u0431\u0438\u0432\u0430\u0435\u0442 \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0438 \u0447\u0442\u043e \u0442\u0430\u043a\u043e\u0435 \u043f\u0430\u0440\u0430\u043b\u043b\u0435\u043b\u044c\u043d\u043e\u0435 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: '\u0418\u0437\u0443\u0447\u0435\u043d\u0438\u0435 \u044f\u0437\u044b\u043a\u0430 \u043d\u0430 \u0440\u043e\u043c\u0430\u043d\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u043c \u0432\u0435\u0447\u0435\u0440\u0435', description: '5 \u043d\u0430\u0443\u0447\u043d\u043e \u043e\u0431\u043e\u0441\u043d\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u0438\u0434\u0435\u0439 \u0434\u043b\u044f \u0441\u0432\u0438\u0434\u0430\u043d\u0438\u044f, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0437\u0430\u043a\u0440\u0435\u043f\u043b\u044f\u044e\u0442 \u0441\u043b\u043e\u0432\u0430\u0440\u043d\u044b\u0439 \u0437\u0430\u043f\u0430\u0441.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: '\u041f\u0430\u0440\u044b \u043d\u0430 \u0440\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0438 \u2014 \u0423\u0447\u0438\u0442\u0435\u0441\u044c \u0432\u043c\u0435\u0441\u0442\u0435 \u043f\u043e\u0440\u043e\u0437\u043d\u044c', description: '\u041f\u0440\u0435\u0432\u0440\u0430\u0442\u0438\u0442\u0435 \u0447\u0430\u0441\u043e\u0432\u044b\u0435 \u043f\u043e\u044f\u0441\u0430 \u0432 \u043f\u0440\u0435\u0438\u043c\u0443\u0449\u0435\u0441\u0442\u0432\u043e \u0441 \u043e\u0431\u0449\u0438\u043c\u0438 \u0440\u0438\u0442\u0443\u0430\u043b\u0430\u043c\u0438.' },
  ],
  uk: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: '\u041d\u0430\u0443\u043a\u0430 \u0441\u043f\u0456\u043b\u044c\u043d\u043e\u0433\u043e \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f \u043f\u0430\u0440', description: '\u0427\u043e\u043c\u0443 \u043f\u0430\u0440\u0438, \u044f\u043a\u0456 \u0432\u0438\u0432\u0447\u0430\u044e\u0442\u044c \u043c\u043e\u0432\u0438 \u0440\u0430\u0437\u043e\u043c, \u0431\u0443\u0434\u0443\u044e\u0442\u044c \u043c\u0456\u0446\u043d\u0456\u0448\u0456 \u0441\u0442\u043e\u0441\u0443\u043d\u043a\u0438.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0456\u0457 RALL, \u044f\u043a\u0456 \u0441\u043f\u0440\u0430\u0432\u0434\u0456 \u043f\u0440\u0430\u0446\u044e\u044e\u0442\u044c', description: '\u041f\u0435\u0440\u0435\u0442\u0432\u043e\u0440\u0456\u0442\u044c \u0432\u0430\u0448\u0456 \u0441\u0442\u043e\u0441\u0443\u043d\u043a\u0438 \u043d\u0430 \u043d\u0430\u0439\u043a\u0440\u0430\u0449\u0438\u0439 \u0434\u0432\u0438\u0433\u0443\u043d \u0432\u0438\u0432\u0447\u0435\u043d\u043d\u044f \u043c\u043e\u0432.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: '\u0427\u043e\u043c\u0443 \u0432\u0438\u0432\u0447\u0435\u043d\u043d\u044f \u043c\u043e\u0432\u0438 \u043f\u0430\u0440\u0442\u043d\u0435\u0440\u0430 \u0437\u043c\u0456\u043d\u044e\u0454 \u0432\u0441\u0435', description: '\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0456\u044f \u0441\u043f\u0456\u043b\u044c\u043d\u043e\u0433\u043e \u0441\u043b\u043e\u0432\u043d\u0438\u043a\u0430 \u044f\u043a \u0441\u0442\u0440\u0430\u0445\u0443\u0432\u043a\u0438 \u0441\u0442\u043e\u0441\u0443\u043d\u043a\u0456\u0432.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: '\u0412\u0456\u0434 \u043d\u0443\u043b\u044f \u0434\u043e \u0440\u043e\u0437\u043c\u043e\u0432 \u2014 \u0412\u0430\u0448\u0430 \u0434\u043e\u0440\u043e\u0436\u043d\u044f \u043a\u0430\u0440\u0442\u0430', description: '\u041d\u0430\u0443\u043a\u043e\u0432\u043e \u043e\u0431\u0491\u0440\u0443\u043d\u0442\u043e\u0432\u0430\u043d\u0438\u0439 12-\u0442\u0438\u0436\u043d\u0435\u0432\u0438\u0439 \u043f\u043b\u0430\u043d \u0434\u043b\u044f \u043f\u0430\u0440.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: '\u042f\u043a \u0428\u0406-\u043a\u043e\u0443\u0447\u0438\u043d\u0433 \u0442\u0440\u0438\u043c\u0430\u0454 \u0432\u0430\u0441 \u043d\u0430 \u0448\u043b\u044f\u0445\u0443', description: '\u0427\u043e\u043c\u0443 \u0428\u0406-\u043a\u043e\u0443\u0447\u0456 \u0437\u0430\u0445\u0438\u0449\u0430\u044e\u0442\u044c \u0441\u0442\u043e\u0441\u0443\u043d\u043a\u0438 \u0432\u0456\u0434 \u043f\u0430\u0441\u0442\u043a\u0438 \u0432\u0447\u0438\u0442\u0435\u043b\u044c-\u0443\u0447\u0435\u043d\u044c.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: '\u0427\u0430\u0441\u0442\u0456 \u043f\u043e\u043c\u0438\u043b\u043a\u0438 \u043f\u0430\u0440 \u043f\u0440\u0438 \u0441\u043f\u0456\u043b\u044c\u043d\u043e\u043c\u0443 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u0456', description: '\u0427\u043e\u043c\u0443 \u0437\u043c\u0430\u0433\u0430\u043d\u043d\u044f \u0432\u0431\u0438\u0432\u0430\u0454 \u043f\u0440\u043e\u0433\u0440\u0435\u0441 \u0456 \u0449\u043e \u0442\u0430\u043a\u0435 \u043f\u0430\u0440\u0430\u043b\u0435\u043b\u044c\u043d\u0435 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: '\u0412\u0438\u0432\u0447\u0435\u043d\u043d\u044f \u043c\u043e\u0432\u0438 \u043d\u0430 \u0440\u043e\u043c\u0430\u043d\u0442\u0438\u0447\u043d\u043e\u043c\u0443 \u0432\u0435\u0447\u043e\u0440\u0456', description: '5 \u043d\u0430\u0443\u043a\u043e\u0432\u043e \u043e\u0431\u0491\u0440\u0443\u043d\u0442\u043e\u0432\u0430\u043d\u0438\u0445 \u0456\u0434\u0435\u0439 \u0434\u043b\u044f \u043f\u043e\u0431\u0430\u0447\u0435\u043d\u043d\u044f, \u0449\u043e \u0437\u0430\u043a\u0440\u0456\u043f\u043b\u044e\u044e\u0442\u044c \u0441\u043b\u043e\u0432\u043d\u0438\u043a.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: '\u041f\u0430\u0440\u0438 \u043d\u0430 \u0432\u0456\u0434\u0441\u0442\u0430\u043d\u0456 \u2014 \u0412\u0447\u0456\u0442\u044c\u0441\u044f \u0440\u0430\u0437\u043e\u043c \u043e\u043a\u0440\u0435\u043c\u043e', description: '\u041f\u0435\u0440\u0435\u0442\u0432\u043e\u0440\u0456\u0442\u044c \u0447\u0430\u0441\u043e\u0432\u0456 \u043f\u043e\u044f\u0441\u0438 \u043d\u0430 \u043f\u0435\u0440\u0435\u0432\u0430\u0433\u0443 \u0437\u0456 \u0441\u043f\u0456\u043b\u044c\u043d\u0438\u043c\u0438 \u0440\u0438\u0442\u0443\u0430\u043b\u0430\u043c\u0438.' },
  ],
  tr: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: '\u00c7iftlerin Birlikte \u00d6\u011frenmesinin Bilimi', description: 'Birlikte dil \u00f6\u011frenen \u00e7iftlerin neden daha g\u00fc\u00e7l\u00fc ili\u015fkiler kurdu\u011fu.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Ger\u00e7ekten \u0130\u015fe Yarayan RALL Stratejileri', description: '\u0130li\u015fkinizi dil \u00f6\u011frenimi i\u00e7in en iyi motivasyon kayna\u011f\u0131na d\u00f6n\u00fc\u015ft\u00fcr\u00fcn.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Partnerinizin Dilini \u00d6\u011frenmek Neden Her \u015eeyi De\u011fi\u015ftirir', description: 'Ortak kelime hazinesinin ili\u015fki sigortas\u0131 olarak psikolojisi.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'S\u0131f\u0131rdan Sohbetlere \u2014 \u00c7ift Yol Haritan\u0131z', description: 'Bilime dayal\u0131 12 haftal\u0131k plan.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Yapay Zeka Ko\u00e7lu\u011fu Sizi Nas\u0131l Yolda Tutar', description: 'Yapay zeka ko\u00e7lar\u0131n\u0131n ili\u015fkiyi \u00f6\u011fretmen-\u00f6\u011frenci tuza\u011f\u0131ndan nas\u0131l korudu\u011fu.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: '\u00c7iftlerin Birlikte \u00d6\u011frenirken Yapt\u0131\u011f\u0131 Yayg\u0131n Hatalar', description: 'Rekabetin ilerlemeyi neden \u00f6ld\u00fcrd\u00fc\u011f\u00fc ve paralel oyunun ne anlama geldi\u011fi.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Dil \u00d6\u011frenimini Randevu Gecesine D\u00f6n\u00fc\u015ft\u00fcrmek', description: 'Kelime hazinesini peki\u015ftiren 5 bilime dayal\u0131 randevu fikri.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Uzak Mesafe \u00c7iftleri \u2014 Ayr\u0131 Birlikte \u00d6\u011frenmek', description: 'Payla\u015f\u0131lan \u00f6\u011frenme ritüelleriyle saat dilimlerini avantaja \u00e7evirin.' },
  ],
  sv: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'Vetenskapen Bakom att L\u00e4ra Sig Tillsammans', description: 'Varf\u00f6r par som l\u00e4r sig spr\u00e5k tillsammans bygger starkare relationer.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'RALL-Strategier som Verkligen Fungerar', description: 'G\u00f6r ert f\u00f6rh\u00e5llande till den ultimata motorn f\u00f6r spr\u00e5kinl\u00e4rning.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Varf\u00f6r att L\u00e4ra Sig Partnerns Spr\u00e5k F\u00f6r\u00e4ndrar Allt', description: 'Psykologin bakom gemensamt ordförr\u00e5d som relationsf\u00f6rs\u00e4kring.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Fr\u00e5n Noll till Samtal \u2014 Er F\u00e4rdplan', description: 'En vetenskapligt grundad 12-veckorsplan f\u00f6r par.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Hur AI-Coaching H\u00e5ller Er p\u00e5 R\u00e4tt Sp\u00e5r', description: 'Varf\u00f6r AI-coacher skyddar relationen fr\u00e5n l\u00e4rare-elev-f\u00e4llan.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Vanliga Misstag Par G\u00f6r N\u00e4r De L\u00e4r Sig Tillsammans', description: 'Varf\u00f6r t\u00e4vling d\u00f6dar framsteg och vad parallellt l\u00e4rande inneb\u00e4r.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Spr\u00e5kinl\u00e4rning som Dejtkv\u00e4ll', description: '5 vetenskapligt grundade dejt-id\u00e9er som f\u00f6rankrar ordförr\u00e5det.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'L\u00e5ngdistanspar \u2014 L\u00e4r Er Tillsammans p\u00e5 Avst\u00e5nd', description: 'G\u00f6r tidszoner till en f\u00f6rdel med gemensamma l\u00e4rritualer.' },
  ],
  no: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'Vitenskapen Bak \u00e5 L\u00e6re Sammen', description: 'Hvorfor par som l\u00e6rer spr\u00e5k sammen bygger sterkere forhold.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'RALL-Strategier som Virkelig Fungerer', description: 'Gj\u00f8r forholdet til den ultimate motoren for spr\u00e5kl\u00e6ring.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Hvorfor \u00e5 L\u00e6re Partnerens Spr\u00e5k Endrer Alt', description: 'Psykologien bak felles ordforr\u00e5d som forholdsforsikring.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Fra Null til Samtaler \u2014 Deres Veikart', description: 'En vitenskapelig basert 12-ukersplan for par.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Hvordan AI-Coaching Holder Dere p\u00e5 Rett Spor', description: 'Hvorfor AI-coacher beskytter forholdet mot l\u00e6rer-elev-fellen.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Vanlige Feil Par Gj\u00f8r N\u00e5r De L\u00e6rer Sammen', description: 'Hvorfor konkurranse dreper fremgang og hva parallell l\u00e6ring betyr.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Spr\u00e5kl\u00e6ring som Datekveld', description: '5 vitenskapelig baserte date-ideer som forankrer ordforr\u00e5det.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Langdistansepar \u2014 L\u00e6r Sammen p\u00e5 Avstand', description: 'Gj\u00f8r tidssoner til en fordel med felles l\u00e6ingsritualer.' },
  ],
  da: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'Videnskaben Bag at L\u00e6re Sammen', description: 'Hvorfor par, der l\u00e6rer sprog sammen, bygger st\u00e6rkere forhold.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'RALL-Strategier der Virkelig Virker', description: 'G\u00f8r jeres forhold til den ultimative motor for spr\u00e5gl\u00e6ring.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Hvorfor det at L\u00e6re Partnerens Sprog \u00c6ndrer Alt', description: 'Psykologien bag f\u00e6lles ordforr\u00e5d som forholdsforsikring.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Fra Nul til Samtaler \u2014 Jeres K\u00f8replan', description: 'En videnskabeligt baseret 12-ugersplan for par.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Hvordan AI-Coaching Holder Jer p\u00e5 Rette Spor', description: 'Hvorfor AI-coaches beskytter forholdet mod l\u00e6rer-elev-f\u00e6lden.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Almindelige Fejl Par Beg\u00e5r N\u00e5r De L\u00e6rer Sammen', description: 'Hvorfor konkurrence dr\u00e6ber fremskridt, og hvad parallel l\u00e6ring betyder.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Spr\u00e5gl\u00e6ring som Dateaften', description: '5 videnskabeligt baserede date-id\u00e9er, der forankrer ordforr\u00e5det.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'Langdistancepar \u2014 L\u00e6r Sammen p\u00e5 Afstand', description: 'G\u00f8r tidszoner til en fordel med f\u00e6lles l\u00e6ringsritualer.' },
  ],
  cs: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'V\u011bda za Spole\u010dn\u00fdm U\u010den\u00edm P\u00e1r\u016f', description: 'Pro\u010d p\u00e1ry, kter\u00e9 se u\u010d\u00ed jazyky spolu, buduj\u00ed siln\u011bj\u0161\u00ed vztahy.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'Strategie RALL, Kter\u00e9 Opravdu Funguj\u00ed', description: 'Prom\u011b\u0148te sv\u016fj vztah v nejlep\u0161\u00ed motor pro u\u010den\u00ed jazyk\u016f.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Pro\u010d U\u010den\u00ed Jazyka Partnera M\u011bn\u00ed V\u0161e', description: 'Psychologie spole\u010dn\u00e9 slovn\u00ed z\u00e1soby jako poji\u0161t\u011bn\u00ed vztahu.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'Od Nuly ke Konverzac\u00edm \u2014 V\u00e1\u0161 Pl\u00e1n', description: 'V\u011bdecky podlo\u017een\u00fd 12t\u00fddenn\u00ed pl\u00e1n pro p\u00e1ry.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Jak V\u00e1s AI Kou\u010dov\u00e1n\u00ed Udr\u017e\u00ed na Spr\u00e1vn\u00e9 Cest\u011b', description: 'Pro\u010d AI kou\u010dov\u00e9 chr\u00e1n\u00ed vztah p\u0159ed past\u00ed u\u010ditel-\u017e\u00e1k.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: '\u010cast\u00e9 Chyby P\u00e1r\u016f p\u0159i Spole\u010dn\u00e9m U\u010den\u00ed', description: 'Pro\u010d sout\u011b\u017een\u00ed zab\u00edj\u00ed pokrok a co znamen\u00e1 paraleln\u00ed u\u010den\u00ed.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'U\u010den\u00ed Jazyk\u016f jako Romantick\u00fd Ve\u010der', description: '5 v\u011bdecky podlo\u017een\u00fdch n\u00e1pad\u016f na rande, kter\u00e9 upevn\u00ed slovn\u00ed z\u00e1sobu.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'P\u00e1ry na D\u00e1lku \u2014 U\u010dte Se Spolu Odd\u011blen\u011b', description: 'Prom\u011b\u0148te \u010dasov\u00e1 p\u00e1sma ve v\u00fdhodu se sd\u00edlen\u00fdmi ritu\u00e1ly u\u010den\u00ed.' },
  ],
  el: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: '\u0397 \u0395\u03C0\u03B9\u03C3\u03C4\u03AE\u03BC\u03B7 \u03C0\u03AF\u03C3\u03C9 \u03B1\u03C0\u03CC \u03C4\u03B7 \u039C\u03AC\u03B8\u03B7\u03C3\u03B7 \u03C3\u03B5 \u0396\u03B5\u03C5\u03B3\u03AC\u03C1\u03B9', description: '\u0393\u03B9\u03B1\u03C4\u03AF \u03C4\u03B1 \u03B6\u03B5\u03C5\u03B3\u03AC\u03C1\u03B9\u03B1 \u03C0\u03BF\u03C5 \u03BC\u03B1\u03B8\u03B1\u03AF\u03BD\u03BF\u03C5\u03BD \u03B3\u03BB\u03CE\u03C3\u03C3\u03B5\u03C2 \u03BC\u03B1\u03B6\u03AF \u03C7\u03C4\u03AF\u03B6\u03BF\u03C5\u03BD \u03B9\u03C3\u03C7\u03C5\u03C1\u03CC\u03C4\u03B5\u03C1\u03B5\u03C2 \u03C3\u03C7\u03AD\u03C3\u03B5\u03B9\u03C2.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: '\u03A3\u03C4\u03C1\u03B1\u03C4\u03B7\u03B3\u03B9\u03BA\u03AD\u03C2 RALL \u03C0\u03BF\u03C5 \u039B\u03B5\u03B9\u03C4\u03BF\u03C5\u03C1\u03B3\u03BF\u03CD\u03BD \u03A0\u03C1\u03B1\u03B3\u03BC\u03B1\u03C4\u03B9\u03BA\u03AC', description: '\u039C\u03B5\u03C4\u03B1\u03C4\u03C1\u03AD\u03C8\u03C4\u03B5 \u03C4\u03B7 \u03C3\u03C7\u03AD\u03C3\u03B7 \u03C3\u03B1\u03C2 \u03C3\u03C4\u03BF\u03BD \u03BA\u03B1\u03BB\u03CD\u03C4\u03B5\u03C1\u03BF \u03BA\u03B9\u03BD\u03B7\u03C4\u03AE\u03C1\u03B1 \u03B5\u03BA\u03BC\u03AC\u03B8\u03B7\u03C3\u03B7\u03C2 \u03B3\u03BB\u03C9\u03C3\u03C3\u03CE\u03BD.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: '\u0393\u03B9\u03B1\u03C4\u03AF \u03B7 \u0395\u03BA\u03BC\u03AC\u03B8\u03B7\u03C3\u03B7 \u03C4\u03B7\u03C2 \u0393\u03BB\u03CE\u03C3\u03C3\u03B1\u03C2 \u03C4\u03BF\u03C5 \u03A3\u03C5\u03BD\u03C4\u03C1\u03CC\u03C6\u03BF\u03C5 \u0391\u03BB\u03BB\u03AC\u03B6\u03B5\u03B9 \u03C4\u03B1 \u03A0\u03AC\u03BD\u03C4\u03B1', description: '\u0397 \u03C8\u03C5\u03C7\u03BF\u03BB\u03BF\u03B3\u03AF\u03B1 \u03C4\u03BF\u03C5 \u03BA\u03BF\u03B9\u03BD\u03BF\u03CD \u03BB\u03B5\u03BE\u03B9\u03BB\u03BF\u03B3\u03AF\u03BF\u03C5 \u03C9\u03C2 \u03B1\u03C3\u03C6\u03AC\u03BB\u03B5\u03B9\u03B1 \u03C3\u03C7\u03AD\u03C3\u03B7\u03C2.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: '\u0391\u03C0\u03CC \u03C4\u03BF \u039C\u03B7\u03B4\u03AD\u03BD \u03C3\u03B5 \u03A3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B5\u03C2 \u2014 \u039F \u03A7\u03AC\u03C1\u03C4\u03B7\u03C2 \u03A3\u03B1\u03C2', description: '\u0388\u03BD\u03B1 \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AC \u03C4\u03B5\u03BA\u03BC\u03B7\u03C1\u03B9\u03C9\u03BC\u03AD\u03BD\u03BF \u03C0\u03BB\u03AC\u03BD\u03BF 12 \u03B5\u03B2\u03B4\u03BF\u03BC\u03AC\u03B4\u03C9\u03BD.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: '\u03A0\u03CE\u03C2 \u03C4\u03BF AI Coaching \u03A3\u03B1\u03C2 \u039A\u03C1\u03B1\u03C4\u03AC \u03C3\u03C4\u03BF \u03A3\u03C9\u03C3\u03C4\u03CC \u0394\u03C1\u03CC\u03BC\u03BF', description: '\u0393\u03B9\u03B1\u03C4\u03AF \u03BF\u03B9 AI coaches \u03C0\u03C1\u03BF\u03C3\u03C4\u03B1\u03C4\u03B5\u03CD\u03BF\u03C5\u03BD \u03C4\u03B7 \u03C3\u03C7\u03AD\u03C3\u03B7 \u03B1\u03C0\u03CC \u03C4\u03B7\u03BD \u03C0\u03B1\u03B3\u03AF\u03B4\u03B1 \u03B4\u03AC\u03C3\u03BA\u03B1\u03BB\u03BF\u03C2-\u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: '\u03A3\u03C5\u03BD\u03B7\u03B8\u03B9\u03C3\u03BC\u03AD\u03BD\u03B1 \u039B\u03AC\u03B8\u03B7 \u0396\u03B5\u03C5\u03B3\u03B1\u03C1\u03B9\u03CE\u03BD \u03C0\u03BF\u03C5 \u039C\u03B1\u03B8\u03B1\u03AF\u03BD\u03BF\u03C5\u03BD \u039C\u03B1\u03B6\u03AF', description: '\u0393\u03B9\u03B1\u03C4\u03AF \u03BF \u03B1\u03BD\u03C4\u03B1\u03B3\u03C9\u03BD\u03B9\u03C3\u03BC\u03CC\u03C2 \u03C3\u03BA\u03BF\u03C4\u03CE\u03BD\u03B5\u03B9 \u03C4\u03B7\u03BD \u03C0\u03C1\u03CC\u03BF\u03B4\u03BF \u03BA\u03B1\u03B9 \u03C4\u03B9 \u03C3\u03B7\u03BC\u03B1\u03AF\u03BD\u03B5\u03B9 \u03C0\u03B1\u03C1\u03AC\u03BB\u03BB\u03B7\u03BB\u03B7 \u03BC\u03AC\u03B8\u03B7\u03C3\u03B7.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: '\u0395\u03BA\u03BC\u03AC\u03B8\u03B7\u03C3\u03B7 \u0393\u03BB\u03CE\u03C3\u03C3\u03B1\u03C2 \u03C3\u03B5 \u03A1\u03BF\u03BC\u03B1\u03BD\u03C4\u03B9\u03BA\u03CC \u0392\u03C1\u03AC\u03B4\u03C5', description: '5 \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AC \u03C4\u03B5\u03BA\u03BC\u03B7\u03C1\u03B9\u03C9\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B9\u03B4\u03AD\u03B5\u03C2 \u03C1\u03B1\u03BD\u03C4\u03B5\u03B2\u03BF\u03CD \u03C0\u03BF\u03C5 \u03B5\u03B4\u03C1\u03B1\u03B9\u03CE\u03BD\u03BF\u03C5\u03BD \u03C4\u03BF \u03BB\u03B5\u03BE\u03B9\u03BB\u03CC\u03B3\u03B9\u03BF.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: '\u0396\u03B5\u03C5\u03B3\u03AC\u03C1\u03B9\u03B1 \u03C3\u03B5 \u0391\u03C0\u03CC\u03C3\u03C4\u03B1\u03C3\u03B7 \u2014 \u039C\u03B1\u03B8\u03B1\u03AF\u03BD\u03BF\u03BD\u03C4\u03B1\u03C2 \u039C\u03B1\u03B6\u03AF \u03A7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AC', description: '\u039C\u03B5\u03C4\u03B1\u03C4\u03C1\u03AD\u03C8\u03C4\u03B5 \u03C4\u03B9\u03C2 \u03B6\u03CE\u03BD\u03B5\u03C2 \u03CE\u03C1\u03B1\u03C2 \u03C3\u03B5 \u03C0\u03BB\u03B5\u03BF\u03BD\u03AD\u03BA\u03C4\u03B7\u03BC\u03B1 \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AC \u03C4\u03B5\u03BB\u03B5\u03C4\u03BF\u03C5\u03C1\u03B3\u03B9\u03BA\u03AC \u03BC\u03AC\u03B8\u03B7\u03C3\u03B7\u03C2.' },
  ],
  hu: [
    { slug: 'science-of-couples-language-learning', icon: '\u{1F52C}', title: 'A P\u00e1ros Tanul\u00e1s M\u00f6g\u00f6tti Tudom\u00e1ny', description: 'Mi\u00e9rt \u00e9p\u00edtenek er\u0151sebb kapcsolatot az egy\u00fctt tanul\u00f3 p\u00e1rok.' },
    { slug: 'rall-strategies-for-couples-learning-together', icon: '\u{1F91D}', title: 'RALL Strat\u00e9gi\u00e1k, Amelyek T\u00e9nyleg M\u0171k\u00f6dnek', description: 'Alak\u00edtsd kapcsolatodat a legjobb nyelvtanul\u00e1si motorr\u00e1.' },
    { slug: 'benefits-learning-partners-language', icon: '\u{1F49D}', title: 'Mi\u00e9rt V\u00e1ltoztat Meg Mindent a P\u00e1rod Nyelv\u00e9nek Tanul\u00e1sa', description: 'A k\u00f6z\u00f6s sz\u00f3kincs pszichol\u00f3gi\u00e1ja mint kapcsolati biztos\u00edt\u00e1s.' },
    { slug: 'couples-language-learning-roadmap', icon: '\u{1F5FA}', title: 'A Null\u00e1t\u00f3l a Besz\u00e9lget\u00e9sekig \u2014 Az \u00dati Tervetek', description: 'Tudom\u00e1nyosan megalapozott 12 hetes terv p\u00e1roknak.' },
    { slug: 'ai-coaching-for-couples-learning-together', icon: '\u{1F916}', title: 'Hogyan Tart Benneteket \u00daton az MI Coaching', description: 'Mi\u00e9rt v\u00e9dik az MI coachok a kapcsolatot a tan\u00e1r-di\u00e1k csapd\u00e1t\u00f3l.' },
    { slug: 'couples-language-learning-mistakes', icon: '\u26A0\uFE0F', title: 'Gyakori Hib\u00e1k, Amiket P\u00e1rok Elk\u00f6vetnek a K\u00f6z\u00f6s Tanul\u00e1skor', description: 'Mi\u00e9rt \u00f6li meg a verseng\u00e9s a halad\u00e1st \u00e9s mit jelent a p\u00e1rhuzamos tanul\u00e1s.' },
    { slug: 'language-learning-date-night-ideas', icon: '\u{1F319}', title: 'Nyelvtanul\u00e1s Romantikus Est\u00e9ken', description: '5 tudom\u00e1nyosan megalapozott randi \u00f6tlet, ami r\u00f6gz\u00edti a sz\u00f3kincset.' },
    { slug: 'long-distance-couples-language-learning', icon: '\u{1F4F1}', title: 'T\u00e1vkapcsolat\u00fa P\u00e1rok \u2014 Egy\u00fctt Tanulni K\u00fcl\u00f6n', description: 'Alak\u00edtsd az id\u0151z\u00f3n\u00e1kat el\u0151nny\u00e9 k\u00f6z\u00f6s tanul\u00e1si ritu\u00e1l\u00e9kkal.' },
  ],
};

/**
 * Get methodology articles for a native language (falls back to English).
 */
export function getMethodologyArticles(nativeLang: string): MethodologyArticleSummary[] {
  return METHODOLOGY_ARTICLES[nativeLang] || METHODOLOGY_ARTICLES.en;
}

/**
 * Deterministic hash-based selection of `count` articles from the list.
 * Uses the article slug as a seed so every page shows different cards,
 * but the same page always shows the same set (cache-friendly).
 */
export function selectRotatingArticles(
  articles: MethodologyArticleSummary[],
  seed: string,
  count: number = 3,
): MethodologyArticleSummary[] {
  if (articles.length <= count) return articles;

  // Simple string hash (djb2)
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  // Make positive
  hash = Math.abs(hash);

  // Pick `count` unique indices by stepping through with the hash
  const selected: MethodologyArticleSummary[] = [];
  const used = new Set<number>();
  let offset = hash % articles.length;

  while (selected.length < count) {
    if (!used.has(offset)) {
      used.add(offset);
      selected.push(articles[offset]);
    }
    offset = (offset + 1) % articles.length;
  }

  return selected;
}
