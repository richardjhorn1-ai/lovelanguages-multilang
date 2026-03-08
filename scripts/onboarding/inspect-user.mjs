import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const identifier = process.argv[2];
if (!identifier) {
  console.error('Usage: node --env-file=.env scripts/onboarding/inspect-user.mjs <email-or-user-id>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

let query = supabase
  .from('onboarding_support_view')
  .select('*')
  .limit(1);

query = isUserId
  ? query.eq('user_id', identifier)
  : query.ilike('email', identifier);

const { data, error } = await query.maybeSingle();

if (error) {
  console.error('Failed to load onboarding support view:', error.message);
  process.exit(1);
}

if (!data) {
  console.error('No onboarding record found for:', identifier);
  process.exit(1);
}

const lines = [
  ['User ID', data.user_id],
  ['Email', data.email],
  ['Role', data.role],
  ['Linked User ID', data.linked_user_id || 'none'],
  ['Onboarding Status', data.onboarding_status],
  ['Completion Reason', data.onboarding_completion_reason || 'none'],
  ['Flow', data.onboarding_flow_key || 'none'],
  ['Current Step', data.onboarding_step_key || 'none'],
  ['Started At', data.onboarding_started_at || 'none'],
  ['Last Step At', data.onboarding_last_step_at || 'none'],
  ['Completed At', data.onboarding_completed_at || 'none'],
  ['Plan Intent', data.onboarding_plan_intent || 'none'],
  ['Subscription Plan', data.subscription_plan || 'none'],
  ['Subscription Status', data.subscription_status || 'none'],
  ['Subscription Source', data.subscription_source || 'none'],
  ['Free Tier Chosen At', data.free_tier_chosen_at || 'none'],
  ['Trial Expires At', data.trial_expires_at || 'none'],
  ['Promo Expires At', data.promo_expires_at || 'none'],
  ['Native Language', data.native_language || 'none'],
  ['Active Language', data.active_language || 'none'],
  ['Has App Access', data.has_app_access ? 'yes' : 'no'],
  ['Open Invite Count', data.invite_token_count ?? 0],
  ['Latest Invite Created At', data.latest_invite_created_at || 'none'],
  ['Error Code', data.onboarding_error_code || 'none'],
  ['Error Context', data.onboarding_error_context ? JSON.stringify(data.onboarding_error_context) : 'none'],
];

for (const [label, value] of lines) {
  console.log(`${label}: ${value}`);
}
