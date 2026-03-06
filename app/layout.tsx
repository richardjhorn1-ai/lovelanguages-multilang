import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import {
  Nunito,
  Manrope,
  Montserrat,
  Inter,
  Outfit,
  Quicksand,
  Source_Sans_3,
} from 'next/font/google';
import '../src/index.css';
import { Providers } from './providers';

// Font presets: Classic (Nunito+Manrope), Modern (Montserrat+Inter), Playful (Quicksand+Source Sans 3), Blog (Outfit)
// All support Latin + Latin-ext (covers all 18 target languages including Polish, Czech, Turkish, Romanian, Hungarian, etc.)
// Cyrillic + Cyrillic-ext for Russian & Ukrainian; Greek for Greek
const nunito = Nunito({ subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'], weight: ['400', '500', '600', '700'], variable: '--font-nunito', display: 'swap' });
const manrope = Manrope({ subsets: ['latin', 'latin-ext', 'cyrillic', 'greek'], weight: ['400', '500', '600', '700'], variable: '--font-manrope', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'], weight: ['400', '500', '600', '700'], variable: '--font-montserrat', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek'], weight: ['400', '500', '600', '700'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '600', '700'], variable: '--font-outfit', display: 'swap' });
const quicksand = Quicksand({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-quicksand', display: 'swap' });
const sourceSans3 = Source_Sans_3({ subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek'], weight: ['400', '500', '600', '700'], variable: '--font-source-sans-3', display: 'swap' });

const fontVariables = [nunito, manrope, montserrat, inter, outfit, quicksand, sourceSans3]
  .map((f) => f.variable)
  .join(' ');

export const metadata: Metadata = {
  title: 'Love Languages - Learn Any Language for Your Partner | AI-Powered Language Learning',
  description:
    'The only language learning app designed for couples. Learn together with AI coaching, voice conversations, games, and vocabulary for meeting your partner\'s family. 18 languages supported.',
  keywords:
    'learn language for couples, language learning for relationships, learn language for boyfriend, learn language for girlfriend, family vocabulary, meet in-laws, language learning app, couples language learning',
  metadataBase: new URL('https://www.lovelanguages.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.lovelanguages.io/',
    title: 'Love Languages - Learn a Language for the One You Love',
    description:
      'The only language learning app designed for couples. AI coaching, voice practice, games, and vocabulary for real relationships. 18 languages supported.',
    images: [{ url: '/og-image.png' }],
    siteName: 'Love Languages',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lovelanguagesio',
    title: 'Love Languages - Learn a Language for the One You Love',
    description:
      'The only language learning app designed for couples. AI coaching, voice practice, games, and vocabulary for real relationships. 18 languages supported.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Love Languages',
    statusBarStyle: 'default',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FF4761',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <link rel="mask-icon" href="/favicon.svg" color="#FF4761" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Love Languages',
              alternateName: 'Love Languages - Language Learning for Couples',
              description:
                'AI-powered language learning app designed for couples. Learn together with voice conversations, games, and vocabulary for real relationships. 18 languages supported.',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '19',
                highPrice: '139',
                priceCurrency: 'USD',
                offerCount: '4',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '50',
              },
              featureList: [
                'AI-powered language coaching',
                'Voice conversation practice',
                'Vocabulary games and flashcards',
                'Partner collaboration features',
                'Real-world conversation scenarios',
                '18 languages supported',
              ],
              url: 'https://lovelanguages.io',
              inLanguage: [
                'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl',
                'sv', 'no', 'da', 'cs', 'ru', 'uk', 'el', 'hu', 'tr', 'ro',
              ],
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>

        {/* PostHog Analytics */}
        <Script id="posthog" strategy="lazyOnload">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing identify alias set_config people.set people.set_once".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('phc_xvUI7lnN0lwitluz83jKHGB4HPivRJ4pJ2QT58GXVlV', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: true
          });`}
        </Script>

        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZJWLDBC5QP"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-ZJWLDBC5QP', {
            cookie_domain: 'lovelanguages.io',
            cookie_flags: 'SameSite=Lax;Secure'
          });

          // Detect AI referral traffic (GEO tracking)
          (function() {
            var ref = document.referrer || '';
            var src = new URLSearchParams(window.location.search).get('utm_source') || '';
            var aiSources = ['chatgpt.com','perplexity.ai','you.com','bing.com','copilot.microsoft.com','claude.ai','gemini.google.com','phind.com','bard.google.com'];
            var channel = 'direct';
            for (var i = 0; i < aiSources.length; i++) {
              if (ref.indexOf(aiSources[i]) !== -1 || src.indexOf(aiSources[i]) !== -1) {
                channel = 'ai_referral';
                gtag('event', 'ai_referral_landing', {
                  ai_source: aiSources[i],
                  referrer: ref,
                  landing_page: window.location.pathname,
                  event_category: 'acquisition'
                });
                break;
              }
            }
            gtag('set', 'user_properties', { traffic_channel: channel !== 'direct' ? channel : undefined });
          })();`}
        </Script>
      </body>
    </html>
  );
}
