import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';
import { getLanguageName } from '../constants/language-config.js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }

    const { token } = body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
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
      return res.status(404).json({
        valid: false,
        error: 'Invalid invite link. Please ask your partner for a new one.'
      });
    }

    // Check if already used
    if (tokenData.used_at) {
      return res.status(400).json({
        valid: false,
        error: 'This invite link has already been used.'
      });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({
        valid: false,
        error: 'This invite link has expired. Please ask your partner for a new one.'
      });
    }

    // Get language code - from token if available, otherwise look up from inviter's profile
    let languageCode = tokenData.language_code;

    if (!languageCode) {
      // Fallback for old tokens without language_code - look up from inviter's profile
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('active_language')
        .eq('id', tokenData.inviter_id)
        .single();

      languageCode = inviterProfile?.active_language;
      if (!languageCode) {
        const inviterLangs = await getProfileLanguages(supabase, tokenData.inviter_id);
        languageCode = inviterLangs.targetLanguage;
      }
    }

    // Token is valid - return inviter info with language context
    return res.status(200).json({
      valid: true,
      inviter: {
        name: tokenData.inviter_name,
        email: tokenData.inviter_email
      },
      language: {
        code: languageCode,
        name: getLanguageName(languageCode)
      },
      expiresAt: tokenData.expires_at
    });

  } catch (error: any) {
    console.error('[validate-invite] Error:', error);
    return res.status(500).json({ error: 'Failed to validate invite. Please try again.' });
  }
}
