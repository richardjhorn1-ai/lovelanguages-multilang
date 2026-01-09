import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get current user's profile with partner info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, linked_user_id, subscription_granted_by, subscription_status, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No partner to unlink' });
    }

    const partnerId = profile.linked_user_id;
    const isPayer = !profile.subscription_granted_by;
    const now = new Date().toISOString();

    console.log(`[delink-partner] User ${auth.userId} initiating breakup with ${partnerId}. isPayer: ${isPayer}`);

    // 1. Delink both profiles (bidirectional)
    const { error: delinkError1 } = await supabase
      .from('profiles')
      .update({ linked_user_id: null })
      .eq('id', profile.id);

    const { error: delinkError2 } = await supabase
      .from('profiles')
      .update({ linked_user_id: null })
      .eq('id', partnerId);

    if (delinkError1 || delinkError2) {
      console.error('[delink-partner] Delink error:', delinkError1 || delinkError2);
      return res.status(500).json({ error: 'Failed to unlink accounts' });
    }

    // 2. Handle subscription access based on who initiated
    if (isPayer) {
      // I'm the payer - revoke partner's inherited access
      const { error: revokeError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'none',
          subscription_status: 'inactive',
          subscription_granted_by: null,
          subscription_granted_at: null,
          subscription_ends_at: null
        })
        .eq('id', partnerId);

      if (revokeError) {
        console.error('[delink-partner] Failed to revoke partner access:', revokeError);
      } else {
        console.log(`[delink-partner] Revoked access for partner ${partnerId}`);
      }
    } else {
      // I'm the partner with inherited access - I lose it
      const { error: revokeError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'none',
          subscription_status: 'inactive',
          subscription_granted_by: null,
          subscription_granted_at: null,
          subscription_ends_at: null
        })
        .eq('id', profile.id);

      if (revokeError) {
        console.error('[delink-partner] Failed to revoke own access:', revokeError);
      } else {
        console.log(`[delink-partner] User ${profile.id} lost inherited access`);
      }
    }

    // 3. Expire any pending invites from either party
    await supabase
      .from('invite_tokens')
      .update({ expires_at: now })
      .in('inviter_id', [profile.id, partnerId])
      .is('used_at', null);

    // 4. Return appropriate message based on role
    return res.status(200).json({
      success: true,
      wasPayingUser: isPayer,
      message: isPayer
        ? 'Accounts unlinked. Your subscription continues. You can invite a new partner anytime.'
        : 'Accounts unlinked. You\'ll need your own subscription to continue learning.'
    });

  } catch (err: any) {
    console.error('[delink-partner] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
