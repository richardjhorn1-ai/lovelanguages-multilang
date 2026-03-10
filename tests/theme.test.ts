import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, DEFAULT_THEME } from '../services/theme';

describe('applyTheme', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    document.documentElement.removeAttribute('style');
    document.documentElement.className = '';
    document.documentElement.dataset.bgStyle = '';
  });

  it('softens primary and secondary accent tokens in dark mode', () => {
    applyTheme({
      ...DEFAULT_THEME,
      accentColor: 'rose',
      darkMode: 'midnight',
    });

    expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe(
      'color-mix(in srgb, #FF4761 70%, #f5f5f5)'
    );
    expect(document.documentElement.style.getPropertyValue('--secondary-color')).toBe(
      'color-mix(in srgb, #FFD93B 60%, #f5f5f5)'
    );
    expect(document.documentElement.style.getPropertyValue('--accent-text')).toBe(
      'color-mix(in srgb, #FF4761 70%, #f5f5f5)'
    );
    expect(document.documentElement.style.getPropertyValue('--secondary-text')).toBe(
      'color-mix(in srgb, #FFD93B 60%, #f5f5f5)'
    );
  });

  it('keeps full-strength accent tokens in light mode', () => {
    applyTheme({
      ...DEFAULT_THEME,
      accentColor: 'rose',
      darkMode: 'off',
    });

    expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('#FF4761');
    expect(document.documentElement.style.getPropertyValue('--secondary-color')).toBe('#FFD93B');
    expect(document.documentElement.style.getPropertyValue('--accent-text')).toBe('#BE123C');
    expect(document.documentElement.style.getPropertyValue('--secondary-text')).toBe('#A16207');
  });
});
