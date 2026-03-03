import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
} from '@/utils/api-middleware';
import { getProfileLanguages } from '@/utils/language-helpers';
import { getLanguageName } from '@/constants/language-config';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Parse body
    const body = await request.json();

    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Use service key to bypass RLS for token validation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invite link. Please ask your partner for a new one.'
      }, { status: 404, headers: corsHeaders });
    }

    // Check if already used
    if (tokenData.used_at) {
      return NextResponse.json({
        valid: false,
        error: 'This invite link has already been used.'
      }, { status: 400, headers: corsHeaders });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({
        valid: false,
        error: 'This invite link has expired. Please ask your partner for a new one.'
      }, { status: 400, headers: corsHeaders });
    }

    // Always look up inviter profile for role and language fallback
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('active_language, role, full_name')
      .eq('id', tokenData.inviter_id)
      .single();

    // Get language code - from token if available, otherwise from profile
    let languageCode = tokenData.language_code || inviterProfile?.active_language;
    if (!languageCode) {
      const inviterLangs = await getProfileLanguages(supabase, tokenData.inviter_id);
      languageCode = inviterLangs.targetLanguage;
    }

    const inviterRole = inviterProfile?.role || 'student';

    // Token is valid - return inviter info with language context
    return NextResponse.json({
      valid: true,
      inviter: {
        name: inviterProfile?.full_name || tokenData.inviter_name,
        email: tokenData.inviter_email
      },
      language: {
        code: languageCode,
        name: getLanguageName(languageCode)
      },
      inviterRole,
      expiresAt: tokenData.expires_at
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[validate-invite] Error:', error);
    return NextResponse.json({ error: 'Failed to validate invite. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
