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
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
} from '@/utils/api-middleware';

// Supported language codes
const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'it', 'pt', 'ro', // Romance
  'de', 'nl', 'sv', 'no', 'da',       // Germanic
  'pl', 'cs', 'ru', 'uk',             // Slavic
  'el', 'hu', 'tr'                    // Other
];

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // Verify authentication
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const { languageCode } = await request.json();

  // Validate language code
  if (!languageCode || typeof languageCode !== 'string') {
    return NextResponse.json({ error: 'Language code is required' }, { status: 400, headers: corsHeaders });
  }

  if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
    return NextResponse.json({ error: `Unsupported language: ${languageCode}` }, { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    // Check if the language is unlocked for this user
    const unlockedLanguages = profile.languages || ['pl'];
    if (!unlockedLanguages.includes(languageCode)) {
      return NextResponse.json({
        error: 'Language not unlocked',
        message: `You need to unlock ${languageCode} before switching to it.`
      }, { status: 403, headers: corsHeaders });
    }

    // Already active - no change needed
    if (profile.active_language === languageCode) {
      return NextResponse.json({
        success: true,
        message: 'Language is already active',
        activeLanguage: languageCode
      }, { headers: corsHeaders });
    }

    // Update active language
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ active_language: languageCode })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[switch-language] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to switch language' }, { status: 500, headers: corsHeaders });
    }

    console.log(`[switch-language] User ${auth.userId} switched from ${profile.active_language} to ${languageCode}`);

    return NextResponse.json({
      success: true,
      message: `Switched to ${languageCode}`,
      previousLanguage: profile.active_language,
      activeLanguage: languageCode
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('[switch-language] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
