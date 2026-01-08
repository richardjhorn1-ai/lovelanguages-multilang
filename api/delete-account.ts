import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.length > 0) {
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
    console.error('[delete-account] Missing Supabase config');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('[delete-account] Auth failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

const CONFIRMATION_STRING = 'DELETE MY ACCOUNT';

export default async function handler(req: any, res: any) {
  // CORS
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

    const { confirmation } = req.body || {};

    // Require explicit confirmation
    if (confirmation !== CONFIRMATION_STRING) {
      return res.status(400).json({
        error: 'Invalid confirmation',
        message: `Please type "${CONFIRMATION_STRING}" to confirm account deletion.`
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = auth.userId;

    console.log(`[delete-account] Starting account deletion for user ${userId.substring(0, 8)}...`);

    // 1. Get user profile to check for Stripe subscription and partner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id, linked_user_id, subscription_granted_by, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[delete-account] Profile not found:', profileError?.message);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 2. Cancel Stripe subscription if exists
    if (profile.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // List active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 10
        });

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          console.log(`[delete-account] Canceling Stripe subscription ${subscription.id}`);
          await stripe.subscriptions.cancel(subscription.id);
        }

        console.log(`[delete-account] Cancelled ${subscriptions.data.length} subscription(s)`);
      } catch (stripeError: any) {
        // Log but don't block deletion - subscription will eventually lapse
        console.error('[delete-account] Stripe cancellation error:', stripeError.message);
      }
    }

    // 3. Unlink partner if exists
    if (profile.linked_user_id) {
      const isPayer = !profile.subscription_granted_by;
      const partnerId = profile.linked_user_id;

      console.log(`[delete-account] Unlinking partner ${partnerId.substring(0, 8)}...`);

      // Clear partner's link to this user
      await supabase
        .from('profiles')
        .update({ linked_user_id: null })
        .eq('id', partnerId);

      // If this user was the payer, revoke partner's inherited subscription access
      if (isPayer) {
        await supabase
          .from('profiles')
          .update({
            subscription_plan: 'none',
            subscription_status: 'inactive',
            subscription_granted_by: null,
            subscription_granted_at: null,
            subscription_ends_at: new Date().toISOString()
          })
          .eq('id', partnerId);

        console.log(`[delete-account] Revoked partner's inherited subscription access`);
      }

      // Create notification for partner
      await supabase
        .from('notifications')
        .insert({
          user_id: partnerId,
          type: 'partner_deleted_account',
          title: 'Partner Account Deleted',
          message: 'Your learning partner has deleted their account. Your accounts are no longer linked.',
          read: false
        });
    }

    // 4. Delete the user's profile
    // CASCADE on foreign keys should handle:
    // - chats (and messages via cascade)
    // - dictionary
    // - word_scores
    // - level_tests
    // - game_sessions (and game_session_answers via cascade)
    // - progress_summaries
    // - listen_sessions
    // - notifications
    // - usage_tracking
    // - subscription_events
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('[delete-account] Failed to delete profile:', deleteProfileError);
      return res.status(500).json({ error: 'Failed to delete account. Please try again.' });
    }

    // 5. Delete tutor challenges where user is tutor or student
    await supabase.from('tutor_challenges').delete().eq('tutor_id', userId);
    await supabase.from('tutor_challenges').delete().eq('student_id', userId);

    // 6. Delete challenge results
    await supabase.from('challenge_results').delete().eq('user_id', userId);

    // 7. Delete word requests where user is tutor or student
    await supabase.from('word_requests').delete().eq('tutor_id', userId);
    await supabase.from('word_requests').delete().eq('student_id', userId);

    // 8. Delete invite tokens created by user
    await supabase.from('invite_tokens').delete().eq('inviter_id', userId);

    // 9. Delete gift passes created by user
    await supabase.from('gift_passes').delete().eq('created_by', userId);

    // 10. Delete the auth user (this logs them out everywhere)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('[delete-account] Failed to delete auth user:', deleteAuthError);
      // Profile is already deleted, so account is effectively gone
      // Just log the error and continue
    }

    console.log(`[delete-account] Account deletion complete for user ${userId.substring(0, 8)}`);

    return res.status(200).json({
      success: true,
      deletedAt: new Date().toISOString(),
      message: 'Your account and all associated data have been permanently deleted.'
    });

  } catch (error: any) {
    console.error('[delete-account] Error:', error);
    return res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
}
