'use client';

import React from 'react';

interface Props {
  text?: string;
  buttonText?: string;
  showSocialProof?: boolean;
  language?: string;
  articleSlug?: string;
  nativeLang?: string;
  targetLang?: string;
  topic?: string;
  pathname?: string;
}

const CTA_TRANSLATIONS: Record<string, { title: string; subtitle: string; button: string; socialProof: string }> = {
  en: { title: "Ready to learn together?", subtitle: "Speak their language, touch their heart. Fun games, voice practice & goals made for two.", button: "Start Learning for $0.00", socialProof: "\u2728 Try free \u2014 no credit card needed" },
  es: { title: "\u00bfListos para aprender juntos?", subtitle: "Habla su idioma, toca su coraz\u00f3n. Juegos, pr\u00e1ctica de voz y metas para dos.", button: "Empezar por $0.00", socialProof: "\u2728 Prueba gratis \u2014 sin tarjeta" },
  fr: { title: "Pr\u00eats \u00e0 apprendre ensemble ?", subtitle: "Parlez leur langue, touchez leur c\u0153ur. Jeux, pratique vocale et objectifs pour deux.", button: "Commencer pour 0,00 $", socialProof: "\u2728 Essai gratuit \u2014 sans carte" },
  de: { title: "Bereit, gemeinsam zu lernen?", subtitle: "Sprich ihre Sprache, ber\u00fchre ihr Herz. Spiele, Sprach\u00fcbungen & Ziele f\u00fcr zwei.", button: "Starten f\u00fcr 0,00 $", socialProof: "\u2728 Kostenlos testen \u2014 keine Karte" },
  it: { title: "Pronti a imparare insieme?", subtitle: "Parla la loro lingua, tocca il loro cuore. Giochi, pratica vocale e obiettivi per due.", button: "Inizia per $0.00", socialProof: "\u2728 Prova gratis \u2014 senza carta" },
  pt: { title: "Prontos para aprender juntos?", subtitle: "Fale a l\u00edngua deles, toque o cora\u00e7\u00e3o deles. Jogos, pr\u00e1tica de voz e metas para dois.", button: "Come\u00e7ar por $0.00", socialProof: "\u2728 Experimente gr\u00e1tis \u2014 sem cart\u00e3o" },
  pl: { title: "Gotowi uczy\u0107 si\u0119 razem?", subtitle: "M\u00f3w ich j\u0119zykiem, dotknij ich serca. Gry, \u0107wiczenia g\u0142osowe i cele dla dwojga.", button: "Zacznij za $0.00", socialProof: "\u2728 Wypr\u00f3buj za darmo \u2014 bez karty" },
  ru: { title: "\u0413\u043e\u0442\u043e\u0432\u044b \u0443\u0447\u0438\u0442\u044c\u0441\u044f \u0432\u043c\u0435\u0441\u0442\u0435?", subtitle: "\u0413\u043e\u0432\u043e\u0440\u0438\u0442\u0435 \u043d\u0430 \u0438\u0445 \u044f\u0437\u044b\u043a\u0435, \u043a\u043e\u0441\u043d\u0438\u0442\u0435\u0441\u044c \u0438\u0445 \u0441\u0435\u0440\u0434\u0446\u0430. \u0418\u0433\u0440\u044b, \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u044f \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0430 \u0438 \u0446\u0435\u043b\u0438 \u0434\u043b\u044f \u0434\u0432\u043e\u0438\u0445.", button: "\u041d\u0430\u0447\u0430\u0442\u044c \u0437\u0430 $0.00", socialProof: "\u2728 \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e \u2014 \u0431\u0435\u0437 \u043a\u0430\u0440\u0442\u044b" },
  nl: { title: "Klaar om samen te leren?", subtitle: "Spreek hun taal, raak hun hart. Spelletjes, spraakpraktijk & doelen voor twee.", button: "Start voor $0.00", socialProof: "\u2728 Probeer gratis \u2014 geen kaart nodig" },
  ro: { title: "Gata s\u0103 \u00eenv\u0103\u021ba\u021bi \u00eempreun\u0103?", subtitle: "Vorbe\u0219te limba lor, atinge-le inima. Jocuri, practic\u0103 vocal\u0103 \u0219i obiective pentru doi.", button: "\u00cencepe pentru $0.00", socialProof: "\u2728 \u00cencearc\u0103 gratuit \u2014 f\u0103r\u0103 card" },
  uk: { title: "\u0413\u043e\u0442\u043e\u0432\u0456 \u0432\u0447\u0438\u0442\u0438\u0441\u044f \u0440\u0430\u0437\u043e\u043c?", subtitle: "\u0413\u043e\u0432\u043e\u0440\u0456\u0442\u044c \u0457\u0445\u043d\u044c\u043e\u044e \u043c\u043e\u0432\u043e\u044e, \u0442\u043e\u0440\u043a\u043d\u0456\u0442\u044c\u0441\u044f \u0457\u0445\u043d\u044c\u043e\u0433\u043e \u0441\u0435\u0440\u0446\u044f. \u0406\u0433\u0440\u0438, \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430 \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0430 \u0442\u0430 \u0446\u0456\u043b\u0456 \u0434\u043b\u044f \u0434\u0432\u043e\u0445.", button: "\u041f\u043e\u0447\u0430\u0442\u0438 \u0437\u0430 $0.00", socialProof: "\u2728 \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u043e \u2014 \u0431\u0435\u0437 \u043a\u0430\u0440\u0442\u043a\u0438" },
  tr: { title: "Birlikte \u00f6\u011frenmeye haz\u0131r m\u0131s\u0131n\u0131z?", subtitle: "Onlar\u0131n dilini konu\u015fun, kalplerini dokunun. Oyunlar, ses prati\u011fi ve ikisi i\u00e7in hedefler.", button: "$0.00'a ba\u015fla", socialProof: "\u2728 \u00dccretsiz deneyin \u2014 kart gerekmez" },
  sv: { title: "Redo att l\u00e4ra er tillsammans?", subtitle: "Tala deras spr\u00e5k, r\u00f6r deras hj\u00e4rta. Spel, r\u00f6st\u00f6vningar & m\u00e5l f\u00f6r tv\u00e5.", button: "B\u00f6rja f\u00f6r $0.00", socialProof: "\u2728 Prova gratis \u2014 inget kort beh\u00f6vs" },
  no: { title: "Klare til \u00e5 l\u00e6re sammen?", subtitle: "Snakk deres spr\u00e5k, ber\u00f8r deres hjerte. Spill, stemme\u00f8velser og m\u00e5l for to.", button: "Start for $0.00", socialProof: "\u2728 Pr\u00f8v gratis \u2014 ingen kort n\u00f8dvendig" },
  da: { title: "Klar til at l\u00e6re sammen?", subtitle: "Tal deres sprog, r\u00f8r deres hjerte. Spil, stemme\u00f8velser og m\u00e5l for to.", button: "Start for $0.00", socialProof: "\u2728 Pr\u00f8v gratis \u2014 intet kort p\u00e5kr\u00e6vet" },
  cs: { title: "P\u0159ipraveni u\u010dit se spole\u010dn\u011b?", subtitle: "Mluvte jejich jazykem, dotkn\u011bte se jejich srdce. Hry, hlasov\u00e1 praxe a c\u00edle pro dva.", button: "Za\u010d\u00edt za $0.00", socialProof: "\u2728 Vyzkou\u0161ejte zdarma \u2014 bez karty" },
  el: { title: "\u0388\u03c4\u03bf\u03b9\u03bc\u03bf\u03b9 \u03bd\u03b1 \u03bc\u03ac\u03b8\u03b5\u03c4\u03b5 \u03bc\u03b1\u03b6\u03af;", subtitle: "\u039c\u03b9\u03bb\u03ae\u03c3\u03c4\u03b5 \u03c4\u03b7 \u03b3\u03bb\u03ce\u03c3\u03c3\u03b1 \u03c4\u03bf\u03c5\u03c2, \u03b1\u03b3\u03b3\u03af\u03be\u03c4\u03b5 \u03c4\u03b7\u03bd \u03ba\u03b1\u03c1\u03b4\u03b9\u03ac \u03c4\u03bf\u03c5\u03c2. \u03a0\u03b1\u03b9\u03c7\u03bd\u03af\u03b4\u03b9\u03b1, \u03c6\u03c9\u03bd\u03b7\u03c4\u03b9\u03ba\u03ae \u03b5\u03be\u03ac\u03c3\u03ba\u03b7\u03c3\u03b7 \u03ba\u03b1\u03b9 \u03c3\u03c4\u03cc\u03c7\u03bf\u03b9 \u03b3\u03b9\u03b1 \u03b4\u03cd\u03bf.", button: "\u039e\u03b5\u03ba\u03b9\u03bd\u03ae\u03c3\u03c4\u03b5 \u03b3\u03b9\u03b1 $0.00", socialProof: "\u2728 \u0394\u03bf\u03ba\u03b9\u03bc\u03ac\u03c3\u03c4\u03b5 \u03b4\u03c9\u03c1\u03b5\u03ac\u03bd \u2014 \u03c7\u03c9\u03c1\u03af\u03c2 \u03ba\u03ac\u03c1\u03c4\u03b1" },
  hu: { title: "K\u00e9szen \u00e1lltok egy\u00fctt tanulni?", subtitle: "Besz\u00e9ld a nyelv\u00fcket, \u00e9rintsd meg a sz\u00edv\u00fcket. J\u00e1t\u00e9kok, hanggyakorl\u00e1s \u00e9s c\u00e9lok kettesben.", button: "Kezd\u00e9s $0.00-\u00e9rt", socialProof: "\u2728 Pr\u00f3b\u00e1ld ki ingyen \u2014 k\u00e1rtya n\u00e9lk\u00fcl" },
};

export default function BlogCTA({
  showSocialProof = true,
  nativeLang: nativeLangProp,
  targetLang: targetLangProp,
  articleSlug: articleSlugProp,
  pathname: pathnameProp,
}: Props) {
  // Extract article context from URL or props
  const pathname = pathnameProp || (typeof window !== 'undefined' ? window.location.pathname : '');
  const pathParts = pathname.split('/').filter(Boolean);
  // URL pattern: /learn/{native}/{target}/{slug}
  const nativeLang = nativeLangProp || (pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : 'en');
  const targetLang = targetLangProp || (pathParts[2] && pathParts[2].length === 2 ? pathParts[2] : '');
  const articleSlug = articleSlugProp || pathParts[3] || '';

  const translations = CTA_TRANSLATIONS[nativeLang] || CTA_TRANSLATIONS.en;

  // Build UTM-tagged URL for attribution
  const utmParams = new URLSearchParams({
    utm_source: 'blog',
    utm_medium: 'article',
    utm_campaign: `${nativeLang}-${targetLang}`,
    utm_content: articleSlug,
    ref_native: nativeLang,
    ref_target: targetLang,
  });
  const ctaUrl = `/?${utmParams.toString()}`;

  const handleCtaClick = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'blog_cta_click', {
        native_lang: nativeLang,
        target_lang: targetLang,
        article_slug: articleSlug,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        event_category: 'conversion',
        event_label: `${nativeLang}-${targetLang}`,
      });
    }
  };

  return (
    <div className="mt-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-8 text-center text-white">
      <h3 className="text-2xl font-bold font-header mb-3">{translations.title}</h3>
      <p className="text-white/90 mb-5 text-lg">{translations.subtitle}</p>
      <a
        href={ctaUrl}
        className="inline-block bg-white text-rose-500 font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg cta-button"
        data-native={nativeLang}
        data-target={targetLang}
        data-article={articleSlug}
        onClick={handleCtaClick}
      >
        {translations.button} &rarr;
      </a>
      {showSocialProof && (
        <p className="mt-4 text-white/80 text-sm">
          {translations.socialProof}
        </p>
      )}
    </div>
  );
}
