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

  // Prevent same language for both (can't learn English from English)
  if (targetLanguage === nativeLanguage) {
    console.warn(`[language-helpers] Same language for target and native: "${targetLanguage}", using defaults`);
    return DEFAULT_LANGUAGES;
  }

  return { targetLanguage, nativeLanguage };
}

/**
 * Extract and validate language parameters with detailed validation info.
 * Use this when you need to report validation issues to the caller.
 *
 * @param body - Request body
 * @returns Validation result with params and any warnings
 */
export function extractLanguagesWithValidation(body: any): LanguageValidationResult {
  const warnings: string[] = [];

  // Handle missing or invalid body
  if (!body || typeof body !== 'object') {
    warnings.push('Missing or invalid request body, using default languages');
    return { valid: true, params: DEFAULT_LANGUAGES, warnings };
  }

  let targetLanguage = body.targetLanguage || body.target_language || null;
  let nativeLanguage = body.nativeLanguage || body.native_language || null;

  // Track if we used defaults
  if (!targetLanguage) {
    targetLanguage = DEFAULT_LANGUAGES.targetLanguage;
    warnings.push(`No target language specified, using default: ${targetLanguage}`);
  }
  if (!nativeLanguage) {
    nativeLanguage = DEFAULT_LANGUAGES.nativeLanguage;
    warnings.push(`No native language specified, using default: ${nativeLanguage}`);
  }

  // Validate target language
  if (!isLanguageSupported(targetLanguage)) {
    warnings.push(`Unsupported target language "${targetLanguage}", using default`);
    targetLanguage = DEFAULT_LANGUAGES.targetLanguage;
  }

  // Validate native language
  if (!isLanguageSupported(nativeLanguage)) {
    warnings.push(`Unsupported native language "${nativeLanguage}", using default`);
    nativeLanguage = DEFAULT_LANGUAGES.nativeLanguage;
  }

  // Prevent same language for both
  if (targetLanguage === nativeLanguage) {
    warnings.push(`Same language for target and native: "${targetLanguage}", using defaults`);
    return { valid: false, params: DEFAULT_LANGUAGES, warnings };
  }

  return {
    valid: warnings.length === 0,
    params: { targetLanguage, nativeLanguage },
    warnings
  };
}

/**
 * Extract languages with full config objects attached.
 * Useful when you need language metadata (flags, names, grammar).
 *
 * @param body - Request body
 * @returns LanguageParams with full config objects
 */
export function extractLanguagesWithConfig(body: any): LanguageParamsWithConfig {
  const params = extractLanguages(body);

  // These are guaranteed to exist since extractLanguages validates
  const targetConfig = getLanguageConfig(params.targetLanguage)!;
  const nativeConfig = getLanguageConfig(params.nativeLanguage)!;

  return {
    ...params,
    targetConfig,
    nativeConfig
  };
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

    // Prevent same language
    if (targetLanguage === nativeLanguage) {
      console.warn(`[language-helpers] Profile has same language for both: "${targetLanguage}"`);
      return DEFAULT_LANGUAGES;
    }

    return { targetLanguage, nativeLanguage };
  } catch (err: any) {
    console.error('[language-helpers] Error fetching profile languages:', err.message || err);
    return DEFAULT_LANGUAGES;
  }
}

/**
 * Get languages from profile with full config objects.
 *
 * @param supabase - Supabase client
 * @param userId - User's UUID
 * @returns LanguageParams with full config objects
 */
export async function getProfileLanguagesWithConfig(
  supabase: any,
  userId: string
): Promise<LanguageParamsWithConfig> {
  const params = await getProfileLanguages(supabase, userId);

  const targetConfig = getLanguageConfig(params.targetLanguage)!;
  const nativeConfig = getLanguageConfig(params.nativeLanguage)!;

  return {
    ...params,
    targetConfig,
    nativeConfig
  };
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate that a language code is one of the 18 supported languages.
 *
 * @param code - Language code to validate
 * @returns true if supported, false otherwise
 */
export function validateLanguageCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return isLanguageSupported(code.toLowerCase().trim());
}

/**
 * Check if a language pair is valid.
 * Both must be supported languages, and they must be different.
 *
 * @param target - Target language code
 * @param native - Native language code
 * @returns true if valid pair, false otherwise
 */
export function isValidLanguagePair(target: string, native: string): boolean {
  // Both must be valid strings
  if (!target || !native || typeof target !== 'string' || typeof native !== 'string') {
    return false;
  }

  const normalizedTarget = target.toLowerCase().trim();
  const normalizedNative = native.toLowerCase().trim();

  // Both must be supported
  if (!isLanguageSupported(normalizedTarget) || !isLanguageSupported(normalizedNative)) {
    return false;
  }

  // Must be different languages
  if (normalizedTarget === normalizedNative) {
    return false;
  }

  return true;
}

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

/**
 * Validate and require a language pair, throwing on invalid.
 * Use this when you need to fail fast with a descriptive error.
 *
 * @param target - Target language code
 * @param native - Native language code
 * @returns LanguageParams (normalized)
 * @throws Error if invalid
 */
export function requireLanguagePair(target: string, native: string): LanguageParams {
  if (!target || typeof target !== 'string') {
    throw new Error('Target language is required');
  }
  if (!native || typeof native !== 'string') {
    throw new Error('Native language is required');
  }

  const normalizedTarget = target.toLowerCase().trim();
  const normalizedNative = native.toLowerCase().trim();

  // Validate both
  requireLanguageConfig(normalizedTarget);
  requireLanguageConfig(normalizedNative);

  // Check not same
  if (normalizedTarget === normalizedNative) {
    throw new Error(`Target and native language cannot be the same: "${normalizedTarget}"`);
  }

  return {
    targetLanguage: normalizedTarget,
    nativeLanguage: normalizedNative
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format a language pair for logging/display.
 *
 * @param params - Language parameters
 * @returns Formatted string like "Polish (learning) ← English (native)"
 */
export function formatLanguagePair(params: LanguageParams): string {
  const targetName = getLanguageName(params.targetLanguage);
  const nativeName = getLanguageName(params.nativeLanguage);
  const targetFlag = getLanguageFlag(params.targetLanguage);
  const nativeFlag = getLanguageFlag(params.nativeLanguage);

  return `${targetFlag} ${targetName} (learning) ← ${nativeFlag} ${nativeName} (native)`;
}

/**
 * Format a language pair in compact form for logs.
 *
 * @param params - Language parameters
 * @returns Compact string like "pl←en"
 */
export function formatLanguagePairCompact(params: LanguageParams): string {
  return `${params.targetLanguage}←${params.nativeLanguage}`;
}

/**
 * Create a log prefix with language context.
 * Useful for debugging multi-language issues.
 *
 * @param endpoint - API endpoint name
 * @param params - Language parameters
 * @returns Log prefix like "[chat:pl←en]"
 */
export function createLanguageLogPrefix(endpoint: string, params: LanguageParams): string {
  return `[${endpoint}:${formatLanguagePairCompact(params)}]`;
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
