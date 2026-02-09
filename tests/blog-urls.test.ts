import { describe, it, expect } from 'vitest';
import { normalizePathname, canonicalUrl, articleUrl, hubUrl } from '../blog/src/lib/urls';

describe('Blog URL Helpers', () => {

  describe('normalizePathname', () => {
    it('adds trailing slash to paths without one', () => {
      expect(normalizePathname('/learn/en/pl')).toBe('/learn/en/pl/');
    });

    it('keeps trailing slash if already present', () => {
      expect(normalizePathname('/learn/en/pl/')).toBe('/learn/en/pl/');
    });

    it('handles root path', () => {
      expect(normalizePathname('/')).toBe('/');
    });

    it('handles paths with file-like endings', () => {
      // normalizePathname doesn't distinguish files — that's intentional
      // XML endpoints use their own URLs, not this helper
      expect(normalizePathname('/sitemap')).toBe('/sitemap/');
    });
  });

  describe('canonicalUrl', () => {
    it('returns full URL with trailing slash', () => {
      expect(canonicalUrl('/learn/en/pl')).toBe('https://www.lovelanguages.io/learn/en/pl/');
    });

    it('preserves trailing slash', () => {
      expect(canonicalUrl('/learn/en/pl/')).toBe('https://www.lovelanguages.io/learn/en/pl/');
    });

    it('uses correct production domain', () => {
      expect(canonicalUrl('/')).toMatch(/^https:\/\/www\.lovelanguages\.io/);
    });

    it('never produces double slashes in path', () => {
      const url = canonicalUrl('/learn/en/pl/');
      const path = new URL(url).pathname;
      expect(path).not.toMatch(/\/\//);
    });
  });

  describe('articleUrl', () => {
    it('builds correct article URL pattern', () => {
      expect(articleUrl('en', 'pl', 'polish-greetings')).toBe('/learn/en/pl/polish-greetings/');
    });

    it('always has trailing slash', () => {
      const url = articleUrl('es', 'fr', 'some-article');
      expect(url).toMatch(/\/$/);
    });

    it('uses lowercase language codes', () => {
      const url = articleUrl('en', 'de', 'test');
      expect(url).toBe('/learn/en/de/test/');
    });
  });

  describe('hubUrl', () => {
    it('builds native+target hub URL', () => {
      expect(hubUrl('en', 'pl')).toBe('/learn/en/pl/');
    });

    it('builds native-only hub URL', () => {
      expect(hubUrl('en')).toBe('/learn/en/');
    });

    it('always has trailing slash', () => {
      expect(hubUrl('es', 'fr')).toMatch(/\/$/);
      expect(hubUrl('de')).toMatch(/\/$/);
    });
  });
});
