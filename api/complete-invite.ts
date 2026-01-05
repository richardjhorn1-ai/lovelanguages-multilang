import { createClient } from '@supabase/supabase-js';

// CORS configuration
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { userId: user.id };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication - the new partner must be logged in
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }

    // Check if already used
    if (tokenData.used_at) {
      return res.status(400).json({ error: 'This invite link has already been used' });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'This invite link has expired' });
    }

    // Check that the new user isn't the inviter
    if (auth.userId === tokenData.inviter_id) {
      return res.status(400).json({ error: 'You cannot accept your own invite' });
    }

    // Get the inviter's profile to ensure they're still valid
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('id, linked_user_id')
      .eq('id', tokenData.inviter_id)
      .single();

    if (inviterError || !inviterProfile) {
      return res.status(404).json({ error: 'Inviter account no longer exists' });
    }

    // Check if inviter already has a partner
    if (inviterProfile.linked_user_id) {
      // Mark token as used (by someone else)
      await supabase
        .from('invite_tokens')
        .update({ used_at: now.toISOString() })
        .eq('id', tokenData.id);

      return res.status(400).json({ error: 'This person already has a linked partner' });
    }

    // All checks passed - link the accounts!
    console.log('[complete-invite] Linking accounts:', { newPartnerId: auth.userId, inviterId: tokenData.inviter_id });

    // 1. Update the new partner's profile: set role to tutor, link to inviter
    const { data: updatedPartner, error: newPartnerError } = await supabase
      .from('profiles')
      .update({
        role: 'tutor',
        linked_user_id: tokenData.inviter_id
      })
      .eq('id', auth.userId)
      .select()
      .single();

    if (newPartnerError) {
      console.error('[complete-invite] Error updating new partner profile:', newPartnerError);
      return res.status(500).json({ error: 'Failed to link accounts' });
    }
    console.log('[complete-invite] Updated partner profile:', updatedPartner);

    // 2. Update the inviter's profile: link to new partner
    const { error: inviterUpdateError } = await supabase
      .from('profiles')
      .update({
        linked_user_id: auth.userId
      })
      .eq('id', tokenData.inviter_id);

    if (inviterUpdateError) {
      console.error('Error updating inviter profile:', inviterUpdateError);
      // Try to rollback the new partner update
      await supabase
        .from('profiles')
        .update({ role: 'student', linked_user_id: null })
        .eq('id', auth.userId);
      return res.status(500).json({ error: 'Failed to complete linking' });
    }

    // 3. Mark the token as used
    await supabase
      .from('invite_tokens')
      .update({
        used_at: now.toISOString(),
        used_by: auth.userId
      })
      .eq('id', tokenData.id);

    // 4. Also clean up any pending link_requests between these users
    await supabase
      .from('link_requests')
      .update({ status: 'accepted' })
      .eq('requester_id', tokenData.inviter_id)
      .eq('status', 'pending');

    return res.status(200).json({
      success: true,
      message: 'Accounts successfully linked!',
      partnerId: tokenData.inviter_id,
      partnerName: tokenData.inviter_name
    });

  } catch (error: any) {
    console.error('Complete invite error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
