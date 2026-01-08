import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // Check for explicit origin match (not wildcard)
  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    // Explicit match - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard mode - NEVER combine with credentials (security vulnerability)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0) {
    // No match but have allowed origins - use first one
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

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
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
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
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, linked_user_id, subscription_status, subscription_granted_by')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if already has a linked partner
    if (profile.linked_user_id) {
      return res.status(400).json({ error: 'You already have a linked partner' });
    }

    // Must have active subscription to invite
    if (profile.subscription_status !== 'active') {
      return res.status(403).json({
        error: 'Active subscription required to invite a partner',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // Only subscription owners can invite (not those with inherited access)
    if (profile.subscription_granted_by) {
      return res.status(403).json({
        error: 'Only subscription owners can invite partners. Ask your partner to send the invite.',
        code: 'NOT_SUBSCRIPTION_OWNER'
      });
    }

    // Check for existing valid (unused, unexpired) token
    const { data: existingToken } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('inviter_id', auth.userId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingToken) {
      // Return existing token - use request origin (validated by CORS) or production URL
      const baseUrl = req.headers.origin || process.env.APP_URL || 'https://lovelanguages.xyz';
      return res.status(200).json({
        token: existingToken.token,
        inviteLink: `${baseUrl}/#/join/${existingToken.token}`,
        expiresAt: existingToken.expires_at,
        isExisting: true
      });
    }

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data: newToken, error: insertError } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        inviter_id: auth.userId,
        inviter_name: profile.full_name,
        inviter_email: profile.email,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invite token:', insertError);
      return res.status(500).json({ error: 'Failed to create invite link' });
    }

    // Use request origin (validated by CORS) or production URL
    const baseUrl = req.headers.origin || process.env.APP_URL || 'https://lovelanguages.xyz';

    return res.status(200).json({
      token: newToken.token,
      inviteLink: `${baseUrl}/#/join/${newToken.token}`,
      expiresAt: newToken.expires_at,
      isExisting: false
    });

  } catch (error: any) {
    console.error('[generate-invite] Error:', error);
    return res.status(500).json({ error: 'Failed to generate invite link. Please try again.' });
  }
}
