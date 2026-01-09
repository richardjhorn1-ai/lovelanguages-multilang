import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware';

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

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit (abuse prevention)
    const limit = await checkRateLimit(supabase, auth.userId, 'exportUserData', sub.plan as 'standard' | 'unlimited');
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const userId = auth.userId;

    console.log(`[export-user-data] Starting export for user ${userId.substring(0, 8)}...`);

    // Fetch all user data in parallel
    const [
      profileResult,
      chatsResult,
      dictionaryResult,
      wordScoresResult,
      levelTestsResult,
      gameSessionsResult,
      progressSummariesResult,
      listenSessionsResult,
      tutorChallengesCreatedResult,
      tutorChallengesReceivedResult,
      challengeResultsResult,
      wordRequestsCreatedResult,
      wordRequestsReceivedResult,
      notificationsResult,
      subscriptionEventsResult,
      usageTrackingResult,
      giftPassesResult,
      inviteTokensResult
    ] = await Promise.all([
      // Core profile (exclude sensitive fields)
      supabase
        .from('profiles')
        .select(`
          id, email, full_name, role, onboarding_completed_at, onboarding_data,
          current_level, total_xp, linked_user_id, subscription_plan, subscription_status,
          subscription_period, subscription_started_at, subscription_ends_at,
          smart_validation, created_at
        `)
        .eq('id', userId)
        .single(),

      // Chats with messages
      supabase
        .from('chats')
        .select(`
          id, title, mode, created_at, updated_at,
          messages (id, role, content, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Dictionary (vocabulary)
      supabase
        .from('dictionary')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Word scores
      supabase
        .from('word_scores')
        .select('*')
        .eq('user_id', userId),

      // Level tests
      supabase
        .from('level_tests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Game sessions with answers
      supabase
        .from('game_sessions')
        .select(`
          id, game_mode, words_practiced, correct_count, incorrect_count,
          score, streak, duration_seconds, completed_at, created_at,
          game_session_answers (id, word_id, user_answer, correct_answer, is_correct, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Progress summaries
      supabase
        .from('progress_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Listen sessions
      supabase
        .from('listen_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Tutor challenges created by user
      supabase
        .from('tutor_challenges')
        .select('*')
        .eq('tutor_id', userId)
        .order('created_at', { ascending: false }),

      // Tutor challenges received by user
      supabase
        .from('tutor_challenges')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false }),

      // Challenge results
      supabase
        .from('challenge_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),

      // Word requests created (as tutor)
      supabase
        .from('word_requests')
        .select(`
          *,
          gift_words (id, word, translation, pronunciation, word_type, difficulty, created_at)
        `)
        .eq('tutor_id', userId)
        .order('created_at', { ascending: false }),

      // Word requests received (as student)
      supabase
        .from('word_requests')
        .select(`
          *,
          gift_words (id, word, translation, pronunciation, word_type, difficulty, created_at)
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false }),

      // Notifications
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Subscription events (audit log)
      supabase
        .from('subscription_events')
        .select('id, event_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Usage tracking
      supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('usage_date', { ascending: false }),

      // Gift passes created
      supabase
        .from('gift_passes')
        .select('id, code, expires_at, redeemed_at, created_at')
        .eq('created_by', userId),

      // Invite tokens created
      supabase
        .from('invite_tokens')
        .select('id, token, expires_at, used_at, created_at')
        .eq('inviter_id', userId)
    ]);

    // Compile the export
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: userId,
      profile: profileResult.data || null,
      chats: chatsResult.data || [],
      dictionary: dictionaryResult.data || [],
      wordScores: wordScoresResult.data || [],
      levelTests: levelTestsResult.data || [],
      gameSessions: gameSessionsResult.data || [],
      progressSummaries: progressSummariesResult.data || [],
      listenSessions: listenSessionsResult.data || [],
      tutorChallenges: {
        created: tutorChallengesCreatedResult.data || [],
        received: tutorChallengesReceivedResult.data || []
      },
      challengeResults: challengeResultsResult.data || [],
      wordRequests: {
        created: wordRequestsCreatedResult.data || [],
        received: wordRequestsReceivedResult.data || []
      },
      notifications: notificationsResult.data || [],
      subscriptionEvents: subscriptionEventsResult.data || [],
      usageTracking: usageTrackingResult.data || [],
      giftPasses: giftPassesResult.data || [],
      inviteTokens: inviteTokensResult.data || []
    };

    // Calculate summary stats
    const summary = {
      totalChats: exportData.chats.length,
      totalMessages: exportData.chats.reduce((sum: number, chat: any) => sum + (chat.messages?.length || 0), 0),
      totalWords: exportData.dictionary.length,
      totalGameSessions: exportData.gameSessions.length,
      totalLevelTests: exportData.levelTests.length,
      totalListenSessions: exportData.listenSessions.length,
      dataExportedAt: exportData.exportedAt
    };

    console.log(`[export-user-data] Export complete for user ${userId.substring(0, 8)}:`, summary);

    incrementUsage(supabase, auth.userId, RATE_LIMITS.exportUserData.type);

    return res.status(200).json({
      success: true,
      summary,
      data: exportData
    });

  } catch (error: any) {
    console.error('[export-user-data] Error:', error);
    return res.status(500).json({ error: 'Failed to export user data. Please try again.' });
  }
}
