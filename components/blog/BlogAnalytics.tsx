'use client';

import { useEffect } from 'react';

interface Props {
  nativeLang?: string;
  targetLang?: string;
  articleSlug?: string;
  topic?: string;
  pathname?: string;
}

export default function BlogAnalytics({
  nativeLang: nativeLangProp,
  targetLang: targetLangProp,
  articleSlug: articleSlugProp,
  pathname: pathnameProp,
}: Props) {
  useEffect(() => {
    const pathname = pathnameProp || window.location.pathname;
    const pathParts = pathname.split('/').filter(Boolean);
    const nativeLang = nativeLangProp || (pathParts[1]?.length === 2 ? pathParts[1] : 'en');
    const targetLang = targetLangProp || (pathParts[2]?.length === 2 ? pathParts[2] : '');
    const articleSlug = articleSlugProp || pathParts[3] || '';

    // Helper: check if analytics libs are loaded
    const w = window as any;
    const hasPostHog = () => typeof w.posthog !== 'undefined' && typeof w.posthog.capture === 'function';
    const hasGtag = () => typeof w.gtag !== 'undefined';

    // Dual-send helper: fires event to both GA4 and PostHog
    function trackEvent(eventName: string, params: Record<string, unknown>) {
      if (hasGtag()) {
        w.gtag('event', eventName, params);
      }
      if (hasPostHog()) {
        w.posthog.capture(eventName, params);
      }
    }

    // Set page-level dimensions for GA4
    if (hasGtag()) {
      w.gtag('set', {
        'content_group': nativeLang + '-' + targetLang,
        'custom_map': {
          'dimension1': 'native_lang',
          'dimension2': 'target_lang',
          'dimension3': 'article_slug'
        }
      });
    }

    // Track scroll depth
    const scrollThresholds = [25, 50, 75, 100];
    const scrollTracked = new Set<number>();

    function getScrollPercent() {
      const h = document.documentElement;
      const b = document.body;
      return Math.round((h.scrollTop || b.scrollTop) / ((h.scrollHeight || b.scrollHeight) - h.clientHeight) * 100);
    }

    function checkScroll() {
      const percent = getScrollPercent();
      scrollThresholds.forEach(threshold => {
        if (percent >= threshold && !scrollTracked.has(threshold)) {
          scrollTracked.add(threshold);
          trackEvent('scroll_depth', {
            percent: threshold,
            native_lang: nativeLang,
            target_lang: targetLang,
            article_slug: articleSlug,
            event_category: 'engagement'
          });
        }
      });
    }

    // Throttled scroll listener
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        checkScroll();
      }, 250);
    };

    window.addEventListener('scroll', handleScroll);

    // Track time on page
    const startTime = Date.now();
    const timeThresholds = [30, 60, 120, 300]; // seconds
    const timeTracked = new Set<number>();

    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timeThresholds.forEach(threshold => {
        if (elapsed >= threshold && !timeTracked.has(threshold)) {
          timeTracked.add(threshold);
          trackEvent('time_on_page', {
            seconds: threshold,
            native_lang: nativeLang,
            target_lang: targetLang,
            article_slug: articleSlug,
            event_category: 'engagement'
          });
        }
      });
    }, 5000);

    // Track outbound/internal link clicks
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      const isExternal = href.startsWith('http') && !href.includes('lovelanguages.io');
      const isAppLink = href.startsWith('/') && !href.startsWith('/learn');

      if (isExternal) {
        trackEvent('outbound_click', {
          url: href,
          native_lang: nativeLang,
          target_lang: targetLang,
          event_category: 'engagement'
        });
      } else if (isAppLink) {
        trackEvent('app_link_click', {
          destination: href,
          native_lang: nativeLang,
          target_lang: targetLang,
          article_slug: articleSlug,
          event_category: 'conversion'
        });
      }
    };

    document.addEventListener('click', handleClick);

    // Track article view with full context
    if (articleSlug) {
      trackEvent('article_view', {
        native_lang: nativeLang,
        target_lang: targetLang,
        article_slug: articleSlug,
        page_path: window.location.pathname,
        event_category: 'content'
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      clearInterval(timeInterval);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [nativeLangProp, targetLangProp, articleSlugProp, pathnameProp]);

  // This component renders nothing visible
  return null;
}
