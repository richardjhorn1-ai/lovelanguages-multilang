/**
 * Answer Validation Helpers
 *
 * SHARED UTILITY - Import this, don't copy the code!
 *
 * Used by: FlashcardGame, TutorGames, PlayQuickFireChallenge, PlayQuizChallenge
 *
 * These functions handle answer validation with:
 * - Diacritic normalization (żółw → zolw)
 * - Case insensitivity
 * - Local-first matching (fast, no API call)
 * - Smart AI validation fallback (handles synonyms, alternative forms)
 */

import { enhancedLocalMatch } from './local-matcher';

/**
 * Normalize a string for comparison by removing diacritics and normalizing case.
 * Handles Polish, French, Spanish, and other languages with diacritical marks.
 *
 * @example
 * normalizeAnswer('Żółw') // → 'zolw'
 * normalizeAnswer('café') // → 'cafe'
 */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

/**
 * Check if user's answer matches the correct answer locally (no API call).
 * Uses diacritic-tolerant comparison.
 *
 * @example
 * isCorrectAnswer('zolw', 'żółw') // → true
 * isCorrectAnswer('turtle', 'żółw') // → false
 */
export function isCorrectAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

/**
 * Options for smart validation API call
 */
export interface ValidateAnswerOptions {
  /** The target language word being tested */
  targetWord?: string;
  /** Type of word (noun, verb, etc.) */
  wordType?: string;
  /** Direction of translation */
  direction?: 'target_to_native' | 'native_to_target';
  /** Language pair for AI context */
  languageParams?: {
    targetLanguage: string;
    nativeLanguage: string;
  };
}

/**
 * Result from validation
 */
export interface ValidationResult {
  accepted: boolean;
  explanation: string;
  rateLimitHit?: boolean;
}

/**
 * Validate an answer using local matching first, then AI validation as fallback.
 *
 * COST OPTIMIZATION: Always tries exact match first (free) before API call.
 *
 * @example
 * // Simple usage (Challenge components)
 * const result = await validateAnswerSmart('turtle', 'żółw', { targetWord: 'żółw' });
 *
 * // Full usage (FlashcardGame)
 * const result = await validateAnswerSmart('turtle', 'żółw', {
 *   targetWord: 'żółw',
 *   direction: 'target_to_native',
 *   languageParams: { targetLanguage: 'pl', nativeLanguage: 'en' }
 * });
 */
export async function validateAnswerSmart(
  userAnswer: string,
  correctAnswer: string,
  options?: ValidateAnswerOptions
): Promise<ValidationResult> {
  // Fast local match first (free, no API call)
  if (isCorrectAnswer(userAnswer, correctAnswer)) {
    return { accepted: true, explanation: 'Exact match' };
  }

  // Enhanced local match (articles, typos, verb prefixes — still no API call)
  const localResult = enhancedLocalMatch(userAnswer, correctAnswer, {
    direction: options?.direction,
    targetLanguage: options?.languageParams?.targetLanguage,
    nativeLanguage: options?.languageParams?.nativeLanguage
  });
  if (localResult === true) {
    return { accepted: true, explanation: 'Close match' };
  }

  // API validation for synonyms, alternative forms, etc.
  try {
    const response = await fetch('/api/validate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAnswer,
        correctAnswer,
        targetWord: options?.targetWord,
        wordType: options?.wordType,
        direction: options?.direction,
        ...options?.languageParams
      })
    });

    if (!response.ok) {
      // Handle rate limit (429) specially - let caller know
      if (response.status === 429) {
        const accepted = isCorrectAnswer(userAnswer, correctAnswer);
        return { accepted, explanation: accepted ? 'Exact match' : 'No match', rateLimitHit: true };
      }
      // Fallback to local matching on other API errors
      const accepted = isCorrectAnswer(userAnswer, correctAnswer);
      return { accepted, explanation: accepted ? 'Exact match' : 'No match' };
    }

    const result = await response.json();
    return {
      accepted: result.accepted,
      explanation: result.explanation || (result.accepted ? 'Validated' : 'No match')
    };
  } catch {
    // Fallback to local matching on network error
    const accepted = isCorrectAnswer(userAnswer, correctAnswer);
    return { accepted, explanation: accepted ? 'Exact match' : 'Validation error' };
  }
}

/**
 * Legacy wrapper for TutorGames signature.
 * Prefer using validateAnswerSmart with options object for new code.
 */
export async function validateAnswerSmartLegacy(
  userAnswer: string,
  correctAnswer: string,
  targetWord: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<ValidationResult> {
  return validateAnswerSmart(userAnswer, correctAnswer, {
    targetWord,
    direction: 'target_to_native',
    languageParams: { targetLanguage, nativeLanguage }
  });
}
