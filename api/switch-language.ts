/**
 * Switch Active Language API
 *
 * Allows users to switch between their unlocked languages.
 *
 * SECURITY: Multi-language access is protected by:
 * 1. profile.languages array - only contains unlocked language codes
 * 2. This API validates languageCode is in user's languages array
 * 3. New users get languages: [their selected target language] on signup
 * 4. Additional languages require payment via ML-9 premium flow (+$5/language/month)
 *
 * Users CANNOT switch to languages they haven't unlocked - returns 403.
 */
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

// Supported language codes
const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'it', 'pt', 'ro', // Romance
  'de', 'nl', 'sv', 'no', 'da',       // Germanic
  'pl', 'cs', 'ru', 'uk',             // Slavic
  'el', 'hu', 'tr'                    // Other
];

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { languageCode } = req.body;

  // Validate language code
  if (!languageCode || typeof languageCode !== 'string') {
    return res.status(400).json({ error: 'Language code is required' });
  }

  if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
    return res.status(400).json({ error: `Unsupported language: ${languageCode}` });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get current user's profile to check if language is unlocked
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, languages, active_language')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if the language is unlocked for this user
    const unlockedLanguages = profile.languages || ['pl'];
    if (!unlockedLanguages.includes(languageCode)) {
      return res.status(403).json({
        error: 'Language not unlocked',
        message: `You need to unlock ${languageCode} before switching to it.`
      });
    }

    // Already active - no change needed
    if (profile.active_language === languageCode) {
      return res.status(200).json({
        success: true,
        message: 'Language is already active',
        activeLanguage: languageCode
      });
    }

    // Update active language
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ active_language: languageCode })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[switch-language] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to switch language' });
    }

    console.log(`[switch-language] User ${auth.userId} switched from ${profile.active_language} to ${languageCode}`);

    return res.status(200).json({
      success: true,
      message: `Switched to ${languageCode}`,
      previousLanguage: profile.active_language,
      activeLanguage: languageCode
    });

  } catch (err: any) {
    console.error('[switch-language] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
