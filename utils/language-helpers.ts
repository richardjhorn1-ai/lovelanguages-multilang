/**
 * API Language Helpers
 *
 * Utilities for extracting, validating, and handling language parameters
 * in API endpoints. Provides consistent language handling across all
 * serverless functions with graceful fallbacks for backward compatibility.
 *
 * Key principle: Never throw on invalid input - always fall back to defaults
 * to maintain backward compatibility with existing Polish-only clients.
 */

import {
  isLanguageSupported,
  getLanguageConfig,
  getLanguageName,
  getLanguageFlag,
  type LanguageConfig
} from '../constants/language-config.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Language parameters extracted from request or profile
 */
export interface LanguageParams {
  targetLanguage: string;  // Language being learned (e.g., 'pl', 'es')
  nativeLanguage: string;  // User's native language (e.g., 'en', 'es')
}

/**
 * Extended language params with full config objects
 */
export interface LanguageParamsWithConfig extends LanguageParams {
  targetConfig: LanguageConfig;
  nativeConfig: LanguageConfig;
}

/**
 * Validation result for language parameters
 */
export interface LanguageValidationResult {
  valid: boolean;
  params: LanguageParams;
  warnings: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default language pair for backward compatibility.
 * Existing Polish-only users (and old client versions) get this automatically.
 *
 * CRITICAL: Do not change these defaults without a migration plan for
 * existing users who don't have language fields set in their profiles.
 */
export const DEFAULT_LANGUAGES: LanguageParams = {
  targetLanguage: 'pl',
  nativeLanguage: 'en'
};

// =============================================================================
// CORE EXTRACTION FUNCTIONS
// =============================================================================

/**
 * Extract and validate language parameters from request body.
 * Falls back to defaults for backward compatibility with older clients.
 *
 * This function NEVER throws - it always returns valid LanguageParams.
 *
 * @param body - Request body (may be undefined, null, or missing fields)
 * @returns Valid LanguageParams (defaults if extraction fails)
 *
 * @example
 * ```typescript
 * const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
 * const prompt = buildCupidSystemPrompt(targetLanguage, nativeLanguage, mode);
 * ```
 */
export function extractLanguages(body: any): LanguageParams {
  // Handle missing or invalid body
  if (!body || typeof body !== 'object') {
    return DEFAULT_LANGUAGES;
  }

  const targetLanguage = body.targetLanguage || body.target_language || DEFAULT_LANGUAGES.targetLanguage;
  const nativeLanguage = body.nativeLanguage || body.native_language || DEFAULT_LANGUAGES.nativeLanguage;

  // Validate target language
  if (!isLanguageSupported(targetLanguage)) {
    console.warn(`[language-helpers] Unsupported target language: "${targetLanguage}", using default "${DEFAULT_LANGUAGES.targetLanguage}"`);
    return DEFAULT_LANGUAGES;
  }

  // Validate native language
  if (!isLanguageSupported(nativeLanguage)) {
    console.warn(`[language-helpers] Unsupported native language: "${nativeLanguage}", using default "${DEFAULT_LANGUAGES.nativeLanguage}"`);
    return { targetLanguage, nativeLanguage: DEFAULT_LANGUAGES.nativeLanguage };
  }

  // Same language - valid for tutors who teach their native language
  // Just log for monitoring, don't override
  if (targetLanguage === nativeLanguage) {
    console.warn(`[language-helpers] extractLanguages: same language for both: "${targetLanguage}"`);
  }

  return { targetLanguage, nativeLanguage };
}

// =============================================================================
// PROFILE-BASED EXTRACTION
// =============================================================================

/**
 * Extract languages from user profile in database.
 * Use this for endpoints that don't receive language params in the request body
 * (e.g., game modes that use profile settings).
 *
 * This function NEVER throws - it always returns valid LanguageParams.
 *
 * @param supabase - Supabase client (with service key for server-side)
 * @param userId - User's UUID
 * @returns Valid LanguageParams from profile or defaults
 *
 * @example
 * ```typescript
 * const supabase = createServiceClient();
 * const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, auth.userId);
 * ```
 */
export async function getProfileLanguages(
  supabase: any,
  userId: string
): Promise<LanguageParams> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('native_language, active_language')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn(`[language-helpers] Failed to fetch profile for ${userId.substring(0, 8)}...: ${error.message}`);
      return DEFAULT_LANGUAGES;
    }

    if (!profile) {
      console.warn(`[language-helpers] No profile found for ${userId.substring(0, 8)}...`);
      return DEFAULT_LANGUAGES;
    }

    // Extract with fallbacks
    const targetLanguage = profile.active_language || DEFAULT_LANGUAGES.targetLanguage;
    const nativeLanguage = profile.native_language || DEFAULT_LANGUAGES.nativeLanguage;

    // Validate extracted languages
    if (!isLanguageSupported(targetLanguage)) {
      console.warn(`[language-helpers] Profile has unsupported active_language: "${targetLanguage}"`);
      return DEFAULT_LANGUAGES;
    }

    if (!isLanguageSupported(nativeLanguage)) {
      console.warn(`[language-helpers] Profile has unsupported native_language: "${nativeLanguage}"`);
      return { targetLanguage, nativeLanguage: DEFAULT_LANGUAGES.nativeLanguage };
    }

    // Same language - valid for tutors who teach their native language
    // Just log for monitoring, don't override
    if (targetLanguage === nativeLanguage) {
      console.warn(`[language-helpers] Profile ${userId.substring(0, 8)} has same target and native language: "${targetLanguage}"`);
    }

    return { targetLanguage, nativeLanguage };
  } catch (err: any) {
    console.error('[language-helpers] Error fetching profile languages:', err.message || err);
    return DEFAULT_LANGUAGES;
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Get language config or throw if unsupported.
 * Use this when you need to fail fast on invalid language.
 *
 * @param code - Language code
 * @returns LanguageConfig
 * @throws Error if language is not supported
 */
export function requireLanguageConfig(code: string): LanguageConfig {
  const config = getLanguageConfig(code);
  if (!config) {
    throw new Error(`Unsupported language code: "${code}". Supported languages: en, es, fr, it, pt, ro, de, nl, sv, no, da, pl, cs, ru, uk, el, hu, tr`);
  }
  return config;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a log prefix with language context.
 * Useful for debugging multi-language issues.
 *
 * @param endpoint - API endpoint name
 * @param params - Language parameters
 * @returns Log prefix like "[chat:pl←en]"
 */
export function createLanguageLogPrefix(endpoint: string, params: LanguageParams): string {
  return `[${endpoint}:${params.targetLanguage}←${params.nativeLanguage}]`;
}

/**
 * Merge request body languages with profile defaults.
 * Request body takes precedence, profile fills gaps.
 *
 * @param body - Request body (may have partial language info)
 * @param profileParams - Languages from user profile
 * @returns Merged LanguageParams
 */
export function mergeLanguageParams(
  body: any,
  profileParams: LanguageParams
): LanguageParams {
  const targetLanguage = body?.targetLanguage || body?.target_language || profileParams.targetLanguage;
  const nativeLanguage = body?.nativeLanguage || body?.native_language || profileParams.nativeLanguage;

  // Validate the merged result
  if (!isLanguageSupported(targetLanguage) || !isLanguageSupported(nativeLanguage)) {
    return profileParams;
  }

  if (targetLanguage === nativeLanguage) {
    return profileParams;
  }

  return { targetLanguage, nativeLanguage };
}

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

// Re-export commonly used functions from language-config
export {
  isLanguageSupported,
  getLanguageConfig,
  getLanguageName,
  getLanguageFlag,
  getLanguageNativeName,
  getAllLanguages,
  getAllLanguageCodes
} from '../constants/language-config.js';

// =============================================================================
// NOTE: After this file is created, api-middleware.ts should add:
//
// export {
//   extractLanguages,
//   getProfileLanguages,
//   DEFAULT_LANGUAGES,
//   type LanguageParams
// } from './language-helpers';
//
// This allows endpoints to import everything from one place:
// import { setCorsHeaders, verifyAuth, extractLanguages } from '../utils/api-middleware';
// =============================================================================
