import { describe, expect, it } from 'vitest';
import { getPwaInstallMode, isIosLikeDevice, isSafariBrowser } from '../utils/pwa-install';

describe('pwa install helpers', () => {
  it('detects iPhone and iPadOS touch devices as iOS-like', () => {
    expect(isIosLikeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', 'iPhone', 0)).toBe(true);
    expect(isIosLikeDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 5)).toBe(true);
    expect(isIosLikeDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0)).toBe(false);
  });

  it('distinguishes Safari from iOS Chromium wrappers', () => {
    expect(isSafariBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')).toBe(true);
    expect(isSafariBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.0.0 Mobile/15E148 Safari/604.1')).toBe(false);
  });

  it('prefers the native install prompt when available', () => {
    expect(getPwaInstallMode({
      hasInstallPrompt: true,
      isInstalled: false,
      isNativeApp: false,
      userAgent: 'Mozilla/5.0 (Linux; Android 14)',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    })).toBe('prompt');
  });

  it('falls back to manual instructions on iOS Safari', () => {
    expect(getPwaInstallMode({
      hasInstallPrompt: false,
      isInstalled: false,
      isNativeApp: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })).toBe('ios_safari_help');
  });

  it('shows open-in-safari help for other iOS browsers', () => {
    expect(getPwaInstallMode({
      hasInstallPrompt: false,
      isInstalled: false,
      isNativeApp: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.0.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })).toBe('ios_browser_help');
  });
});
