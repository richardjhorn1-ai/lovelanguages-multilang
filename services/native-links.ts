import { App as NativeApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { APP_URL, NATIVE_APP_SCHEME } from './api-config';
const APP_ORIGIN = new URL(APP_URL).origin;

export function normalizeInboundAppUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);

    if (url.protocol === `${NATIVE_APP_SCHEME}:`) {
      const hostPath = url.host ? `/${url.host}` : '';
      const pathname = url.pathname === '/' ? '' : url.pathname;
      return `${hostPath}${pathname}${url.search}${url.hash}` || '/';
    }

    if ((url.protocol === 'https:' || url.protocol === 'http:') && url.origin === APP_ORIGIN) {
      return `${url.pathname}${url.search}${url.hash}` || '/';
    }

    return null;
  } catch (error) {
    console.warn('[NativeLinks] Ignoring invalid inbound URL:', rawUrl, error);
    return null;
  }
}

export async function registerNativeAppUrlBridge(
  onNavigate: (path: string) => void
): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  let disposed = false;
  let listenerHandle: PluginListenerHandle | null = null;

  const handleIncomingUrl = (rawUrl?: string) => {
    if (!rawUrl || disposed) {
      return;
    }

    const nextPath = normalizeInboundAppUrl(rawUrl);
    if (!nextPath) {
      return;
    }

    onNavigate(nextPath);
  };

  try {
    const launchUrl = await NativeApp.getLaunchUrl();
    handleIncomingUrl(launchUrl?.url);
  } catch (error) {
    console.warn('[NativeLinks] Failed to read launch URL:', error);
  }

  try {
    listenerHandle = await NativeApp.addListener('appUrlOpen', (event) => {
      handleIncomingUrl(event.url);
    });
  } catch (error) {
    console.warn('[NativeLinks] Failed to register appUrlOpen listener:', error);
  }

  return () => {
    disposed = true;
    void listenerHandle?.remove();
  };
}
