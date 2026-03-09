import { describe, expect, it } from 'vitest';

import {
  isInitialOnboardingLanguageSelection,
  uniqueLanguages,
} from '../api/onboarding/save-step';

describe('language default helpers', () => {
  it('replaces the legacy Polish default during first onboarding language selection', () => {
    expect(uniqueLanguages(['pl'], 'es', true)).toEqual(['es']);
  });

  it('appends additional unlocked languages after onboarding is complete', () => {
    expect(uniqueLanguages(['es'], 'fr', false)).toEqual(['es', 'fr']);
  });

  it('treats empty or legacy Polish-only profiles as initial onboarding language selection', () => {
    expect(isInitialOnboardingLanguageSelection({ onboarding_completed_at: null, languages: [] })).toBe(true);
    expect(isInitialOnboardingLanguageSelection({ onboarding_completed_at: null, languages: ['pl'] })).toBe(true);
  });

  it('does not overwrite legitimate multi-language profiles after onboarding', () => {
    expect(
      isInitialOnboardingLanguageSelection({
        onboarding_completed_at: '2026-03-09T00:00:00.000Z',
        languages: ['es', 'pl'],
      })
    ).toBe(false);
  });
});
