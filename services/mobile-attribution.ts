import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { analytics } from './analytics';
import { normalizeInboundAppUrl } from './native-links';

const APP_INSTALL_KEY = 'll_app_installed_tracked_v1';

type AppOpenSource = 'cold' | 'warm' | 'deeplink' | 'notification';

type AttributionParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  deep_link_path?: string;
};

function platform() {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

async function getInstallMarker(): Promise<string | null> {
  try {
    return localStorage.getItem(APP_INSTALL_KEY);
  } catch {
    return null;
  }
}

async function setInstallMarker(value: string): Promise<void> {
  try {
    localStorage.setItem(APP_INSTALL_KEY, value);
  } catch {
    // Ignore storage failures; attribution should never block app startup.
  }
}

export function classifyAppOpenSource(rawUrl?: string | null, fallback: AppOpenSource = 'cold'): AppOpenSource {
  if (rawUrl && normalizeInboundAppUrl(rawUrl)) {
    return 'deeplink';
  }

  return fallback;
}

export function extractAppOpenAttribution(rawUrl?: string | null): AttributionParams {
  if (!rawUrl) {
    return {};
  }

  try {
    const url = new URL(rawUrl);
    const nextPath = normalizeInboundAppUrl(rawUrl) || undefined;

    return {
      deep_link_path: nextPath,
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined,
      utm_content: url.searchParams.get('utm_content') || undefined,
      utm_term: url.searchParams.get('utm_term') || undefined,
    };
  } catch {
    return {};
  }
}

export async function registerMobileAttributionBridge(): Promise<() => void> {
  if (!Capacitor.isNativePlatform() || platform() !== 'ios') {
    return () => {};
  }

  let disposed = false;
  let sessionStartedAt = Date.now();
  let lastBackgroundedAt: number | null = null;
  let initialOpenTracked = false;

  const trackOpened = (source: AppOpenSource, rawUrl?: string | null) => {
    analytics.trackAppOpened({
      source,
      platform: platform(),
      ...extractAppOpenAttribution(rawUrl),
    });
    sessionStartedAt = Date.now();
  };

  const installTracked = await getInstallMarker();
  if (!installTracked) {
    analytics.trackAppInstalled({ platform: platform() });
    await setInstallMarker(new Date().toISOString());
  }

  try {
    const launchUrl = await CapacitorApp.getLaunchUrl();
    trackOpened(classifyAppOpenSource(launchUrl?.url, 'cold'), launchUrl?.url);
    initialOpenTracked = true;
  } catch {
    trackOpened('cold');
    initialOpenTracked = true;
  }

  const stateHandle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (disposed) {
      return;
    }

    if (isActive) {
      if (initialOpenTracked && lastBackgroundedAt === null) {
        initialOpenTracked = false;
        return;
      }

      trackOpened('warm');
      lastBackgroundedAt = null;
      return;
    }

    const activeDuration = Date.now() - sessionStartedAt;
    lastBackgroundedAt = Date.now();
    analytics.trackAppBackgrounded({
      active_duration_ms: Math.max(activeDuration, 0),
      platform: platform(),
    });
  });

  const urlHandle = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    if (disposed) {
      return;
    }

    trackOpened('deeplink', url);
  });

  return () => {
    disposed = true;
    void stateHandle.remove();
    void urlHandle.remove();
  };
}
