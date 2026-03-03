/**
 * LoveNote - Mid-article CTA component
 * A personal message from Richard & Misia encouraging readers to try the app
 */

interface Props {
  nativeLang?: string;
  targetLang?: string;
  articleSlug?: string;
}

// Translations for all supported languages
const LOVENOTE_TRANSLATIONS: Record<string, { title: string; body: string; button: string }> = {
  en: {
    title: "Learning for your partner?",
    body: "We're Richard & Misia \u2014 a couple who built this app because we wanted to learn each other's languages. If you're here for the same reason, we made something for you.",
    button: "Start learning together \u2192"
  },
  es: {
    title: "\u00BFAprendiendo para tu pareja?",
    body: "Somos Richard y Misia \u2014 una pareja que cre\u00F3 esta app porque quer\u00EDamos aprender los idiomas del otro. Si est\u00E1s aqu\u00ED por la misma raz\u00F3n, hicimos algo para ti.",
    button: "Empezar a aprender juntos \u2192"
  },
  fr: {
    title: "Vous apprenez pour votre partenaire ?",
    body: "Nous sommes Richard & Misia \u2014 un couple qui a cr\u00E9\u00E9 cette app parce que nous voulions apprendre les langues de l'autre. Si vous \u00EAtes ici pour la m\u00EAme raison, nous avons cr\u00E9\u00E9 quelque chose pour vous.",
    button: "Commencer \u00E0 apprendre ensemble \u2192"
  },
  de: {
    title: "Lernst du f\u00FCr deine/n Partner/in?",
    body: "Wir sind Richard & Misia \u2014 ein Paar, das diese App entwickelt hat, weil wir die Sprachen des anderen lernen wollten. Wenn du aus dem gleichen Grund hier bist, haben wir etwas f\u00FCr dich.",
    button: "Gemeinsam lernen \u2192"
  },
  it: {
    title: "Stai imparando per il tuo partner?",
    body: "Siamo Richard e Misia \u2014 una coppia che ha creato questa app perch\u00E9 volevamo imparare le lingue dell'altro. Se sei qui per lo stesso motivo, abbiamo creato qualcosa per te.",
    button: "Inizia a imparare insieme \u2192"
  },
  pt: {
    title: "Aprendendo para o seu amor?",
    body: "Somos Richard e Misia \u2014 um casal que criou este app porque quer\u00EDamos aprender as l\u00EDnguas um do outro. Se voc\u00EA est\u00E1 aqui pelo mesmo motivo, fizemos algo para voc\u00EA.",
    button: "Come\u00E7ar a aprender juntos \u2192"
  },
  pl: {
    title: "Uczysz si\u0119 dla swojej drugiej po\u0142\u00F3wki?",
    body: "Jeste\u015Bmy Richard i Misia \u2014 para, kt\u00F3ra stworzy\u0142a t\u0119 aplikacj\u0119, bo chcieli\u015Bmy nauczy\u0107 si\u0119 j\u0119zyk\u00F3w drugiej osoby. Je\u015Bli jeste\u015B tu z tego samego powodu, stworzy\u0142i\u015Bmy co\u015B dla ciebie.",
    button: "Zacznij uczy\u0107 si\u0119 razem \u2192"
  },
  ru: {
    title: "\u0423\u0447\u0438\u0442\u0435 \u044F\u0437\u044B\u043A \u0434\u043B\u044F \u043B\u044E\u0431\u0438\u043C\u043E\u0433\u043E \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430?",
    body: "\u041C\u044B \u2014 \u0420\u0438\u0447\u0430\u0440\u0434 \u0438 \u041C\u0438\u0441\u044F, \u043F\u0430\u0440\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0441\u043E\u0437\u0434\u0430\u043B\u0430 \u044D\u0442\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u0445\u043E\u0442\u0435\u043B\u0438 \u0432\u044B\u0443\u0447\u0438\u0442\u044C \u044F\u0437\u044B\u043A\u0438 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430. \u0415\u0441\u043B\u0438 \u0432\u044B \u0437\u0434\u0435\u0441\u044C \u043F\u043E \u0442\u043E\u0439 \u0436\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0435, \u043C\u044B \u0441\u043E\u0437\u0434\u0430\u043B\u0438 \u043A\u043E\u0435-\u0447\u0442\u043E \u0434\u043B\u044F \u0432\u0430\u0441.",
    button: "\u041D\u0430\u0447\u0430\u0442\u044C \u0443\u0447\u0438\u0442\u044C\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u2192"
  },
  nl: {
    title: "Leer je voor je partner?",
    body: "Wij zijn Richard & Misia \u2014 een stel dat deze app heeft gemaakt omdat we elkaars talen wilden leren. Als je hier bent om dezelfde reden, hebben we iets voor je gemaakt.",
    button: "Begin samen te leren \u2192"
  },
  uk: {
    title: "\u0412\u0438\u0432\u0447\u0430\u0454\u0442\u0435 \u043C\u043E\u0432\u0443 \u0434\u043B\u044F \u043A\u043E\u0445\u0430\u043D\u043E\u0457 \u043B\u044E\u0434\u0438\u043D\u0438?",
    body: "\u041C\u0438 \u2014 \u0420\u0456\u0447\u0430\u0440\u0434 \u0456 \u041C\u0456\u0441\u044F, \u043F\u0430\u0440\u0430, \u044F\u043A\u0430 \u0441\u0442\u0432\u043E\u0440\u0438\u043B\u0430 \u0446\u0435\u0439 \u0434\u043E\u0434\u0430\u0442\u043E\u043A, \u0431\u043E \u0445\u043E\u0442\u0456\u043B\u0438 \u0432\u0438\u0432\u0447\u0438\u0442\u0438 \u043C\u043E\u0432\u0438 \u043E\u0434\u043D\u0435 \u043E\u0434\u043D\u043E\u0433\u043E. \u042F\u043A\u0449\u043E \u0432\u0438 \u0442\u0443\u0442 \u0437 \u0442\u0456\u0454\u0457 \u0436 \u043F\u0440\u0438\u0447\u0438\u043D\u0438, \u043C\u0438 \u0441\u0442\u0432\u043E\u0440\u0438\u043B\u0438 \u0449\u043E\u0441\u044C \u0434\u043B\u044F \u0432\u0430\u0441.",
    button: "\u041F\u043E\u0447\u0430\u0442\u0438 \u0432\u0447\u0438\u0442\u0438\u0441\u044F \u0440\u0430\u0437\u043E\u043C \u2192"
  },
  sv: {
    title: "L\u00E4r du dig f\u00F6r din partner?",
    body: "Vi \u00E4r Richard & Misia \u2014 ett par som skapade denna app f\u00F6r att vi ville l\u00E4ra oss varandras spr\u00E5k. Om du \u00E4r h\u00E4r av samma anledning har vi skapat n\u00E5got f\u00F6r dig.",
    button: "B\u00F6rja l\u00E4ra er tillsammans \u2192"
  },
  no: {
    title: "L\u00E6rer du for partneren din?",
    body: "Vi er Richard & Misia \u2014 et par som laget denne appen fordi vi ville l\u00E6re hverandres spr\u00E5k. Hvis du er her av samme grunn, har vi laget noe for deg.",
    button: "Begynn \u00E5 l\u00E6re sammen \u2192"
  },
  da: {
    title: "L\u00E6rer du for din partner?",
    body: "Vi er Richard & Misia \u2014 et par der lavede denne app, fordi vi ville l\u00E6re hinandens sprog. Hvis du er her af samme grund, har vi lavet noget til dig.",
    button: "Begynd at l\u00E6re sammen \u2192"
  },
  cs: {
    title: "U\u010D\u00EDte se pro sv\u00E9ho partnera?",
    body: "Jsme Richard a Misia \u2014 p\u00E1r, kter\u00FD vytvo\u0159il tuto aplikaci, proto\u017Ee jsme se cht\u011Bli nau\u010Dit jazyky toho druh\u00E9ho. Pokud jste tu ze stejn\u00E9ho d\u016Fvodu, vytvo\u0159ili jsme n\u011Bco pro v\u00E1s.",
    button: "Za\u010Dn\u011Bte se u\u010Dit spole\u010Dn\u011B \u2192"
  },
  el: {
    title: "\u039C\u03B1\u03B8\u03B1\u03AF\u03BD\u03B5\u03B9\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03BF\u03BD/\u03C4\u03B7\u03BD \u03C3\u03CD\u03BD\u03C4\u03C1\u03BF\u03C6\u03CC \u03C3\u03BF\u03C5;",
    body: "\u0395\u03AF\u03BC\u03B1\u03C3\u03C4\u03B5 \u03BF Richard \u03BA\u03B1\u03B9 \u03B7 Misia \u2014 \u03AD\u03BD\u03B1 \u03B6\u03B5\u03C5\u03B3\u03AC\u03C1\u03B9 \u03C0\u03BF\u03C5 \u03B4\u03B7\u03BC\u03B9\u03BF\u03CD\u03C1\u03B3\u03B7\u03C3\u03B5 \u03B1\u03C5\u03C4\u03AE\u03BD \u03C4\u03B7\u03BD \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE \u03B5\u03C0\u03B5\u03B9\u03B4\u03AE \u03B8\u03AD\u03BB\u03B1\u03BC\u03B5 \u03BD\u03B1 \u03BC\u03AC\u03B8\u03BF\u03C5\u03BC\u03B5 \u03C4\u03B9\u03C2 \u03B3\u03BB\u03CE\u03C3\u03C3\u03B5\u03C2 \u03C4\u03BF\u03C5 \u03AC\u03BB\u03BB\u03BF\u03C5. \u0391\u03BD \u03B5\u03AF\u03C3\u03B1\u03B9 \u03B5\u03B4\u03CE \u03B3\u03B9\u03B1 \u03C4\u03BF\u03BD \u03AF\u03B4\u03B9\u03BF \u03BB\u03CC\u03B3\u03BF, \u03C6\u03C4\u03B9\u03AC\u03BE\u03B1\u03BC\u03B5 \u03BA\u03AC\u03C4\u03B9 \u03B3\u03B9\u03B1 \u03C3\u03AD\u03BD\u03B1.",
    button: "\u039E\u03B5\u03BA\u03B9\u03BD\u03AE\u03C3\u03C4\u03B5 \u03BD\u03B1 \u03BC\u03B1\u03B8\u03B1\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03B1\u03B6\u03AF \u2192"
  },
  hu: {
    title: "A parod kedv\u00E9\u00E9rt tanulsz?",
    body: "Mi Richard \u00E9s Misia vagyunk \u2014 egy p\u00E1r, aki az\u00E9rt hozta l\u00E9tre ezt az alkalmaz\u00E1st, mert meg akartuk tanulni egym\u00E1s nyelv\u00E9t. Ha te is ez\u00E9rt vagy itt, k\u00E9sz\u00EDtett\u00FCnk valamit neked.",
    button: "Kezdj el egy\u00FCtt tanulni \u2192"
  },
  tr: {
    title: "Partneriniz i\u00E7in mi \u00F6\u011Freniyorsunuz?",
    body: "Biz Richard ve Misia'y\u0131z \u2014 birbirimizin dillerini \u00F6\u011Frenmek istedi\u011Fimiz i\u00E7in bu uygulama\u0131 olu\u015Fturan bir \u00E7iftiz. Ayn\u0131 nedenle buradaysan\u0131z, sizin i\u00E7in bir \u015Fey yapt\u0131k.",
    button: "Birlikte \u00F6\u011Frenmeye ba\u015Fla \u2192"
  },
  ro: {
    title: "\u00CEnve\u021Bi pentru partenerul t\u0103u?",
    body: "Suntem Richard \u0219i Misia \u2014 un cuplu care a creat aceast\u0103 aplica\u021Bie pentru c\u0103 am vrut s\u0103 \u00EEnv\u0103\u021B\u0103m limbile celuilalt. Dac\u0103 e\u0219ti aici din acela\u0219i motiv, am creat ceva pentru tine.",
    button: "\u00CEncepe s\u0103 \u00EEnve\u021Bi \u00EEmpreun\u0103 \u2192"
  },
};

export default function LoveNote({ nativeLang = 'en', targetLang = '', articleSlug = '' }: Props) {
  const t = LOVENOTE_TRANSLATIONS[nativeLang] || LOVENOTE_TRANSLATIONS.en;

  // Build UTM-tagged URL for attribution
  const utmParams = new URLSearchParams({
    utm_source: 'blog',
    utm_medium: 'lovenote',
    utm_campaign: `${nativeLang}-${targetLang}`,
    utm_content: articleSlug,
  });
  const ctaUrl = `/?${utmParams.toString()}`;

  return (
    <aside className="love-note my-10 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100 relative overflow-hidden">
      {/* Decorative heart */}
      <div className="absolute -top-2 -right-2 text-4xl opacity-20 rotate-12">{'\u{1F498}'}</div>

      <div className="relative z-10">
        <p className="text-rose-500 font-bold text-sm mb-2 flex items-center gap-2">
          <span>{'\u{1F498}'}</span> {t.title}
        </p>

        <p className="text-gray-700 mb-4 leading-relaxed">
          {t.body}
        </p>

        <a
          href={ctaUrl}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 font-bold rounded-full hover:bg-rose-600 hover:shadow-lg hover:scale-105 transition-all text-sm love-note-cta"
          style={{ color: 'white' }}
          data-native={nativeLang}
          data-target={targetLang}
          data-article={articleSlug}
        >
          {t.button}
        </a>
      </div>
    </aside>
  );
}
