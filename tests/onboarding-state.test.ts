import { describe, expect, it } from 'vitest';

import {
  applyOnboardingPatch,
  getFlowSteps,
  getStepNumber,
  resolveOnboardingFlowKey,
} from '../utils/onboarding-state';
import { getStatusForPersistedStep } from '../utils/onboarding-server';

describe('onboarding state helpers', () => {
  it('clears incompatible role fields when role changes', () => {
    const next = applyOnboardingPatch(
      {
        role: 'student',
        partnerName: 'Sara',
        relationshipVibe: 'playful',
        learnerName: 'Old learner',
        teachingStyle: 'structured',
      },
      {
        role: 'tutor',
        learnerName: 'Jeff',
      }
    );

    expect(next.role).toBe('tutor');
    expect(next.learnerName).toBe('Jeff');
    expect(next.partnerName).toBeUndefined();
    expect(next.relationshipVibe).toBeUndefined();
  });

  it('clears invite intent when target language changes', () => {
    const next = applyOnboardingPatch(
      {
        targetLanguage: 'pl',
        invitePartnerIntent: { method: 'link', inviteLink: 'https://example.com/join/test' },
      },
      {
        targetLanguage: 'es',
      }
    );

    expect(next.targetLanguage).toBe('es');
    expect(next.invitePartnerIntent).toBeUndefined();
  });

  it('marks native paid purchase confirmation as pending checkout on start step', () => {
    const status = getStatusForPersistedStep(
      'start',
      {
        selectedPlan: 'standard',
        selectedPriceId: undefined,
      }
    );

    expect(status).toBe('pending_checkout');
  });

  it('maps invited tutor flow to the shortened step order', () => {
    const flowKey = resolveOnboardingFlowKey('tutor', true);
    const stepNumber = getStepNumber(flowKey, 'preview');

    expect(flowKey).toBe('tutor_invited');
    expect(stepNumber).toBe(3);
  });

  it('starts full onboarding with native language before role and target language', () => {
    expect(getFlowSteps('student_full').slice(0, 3)).toEqual([
      'native_language',
      'role',
      'target_language',
    ]);

    expect(getFlowSteps('tutor_full').slice(0, 3)).toEqual([
      'native_language',
      'role',
      'target_language',
    ]);
  });
});
