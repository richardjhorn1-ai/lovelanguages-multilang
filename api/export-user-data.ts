import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  logSecurityEvent,
  getClientIp,
  SubscriptionPlan,
} from '../utils/api-middleware.js';

// Per-table export limits to prevent memory exhaustion
const EXPORT_LIMITS = {
  chats: 500,
  dictionary: 5000,
  wordScores: 5000,
  levelTests: 100,
  gameSessions: 500,
  progressSummaries: 365,
  listenSessions: 200,
  tutorChallenges: 200,
  challengeResults: 500,
  wordRequests: 200,
  notifications: 500,
  subscriptionEvents: 100,
  usageTracking: 365,
  giftPasses: 50,
  inviteTokens: 50
};

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
    const limit = await checkRateLimit(supabase, auth.userId, 'exportUserData', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const userId = auth.userId;

    console.log(`[export-user-data] Starting export for user ${userId.substring(0, 8)}...`);

    // Fetch all user data in parallel (with limits to prevent memory exhaustion)
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
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.chats),

      // Dictionary (vocabulary)
      supabase
        .from('dictionary')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.dictionary),

      // Word scores
      supabase
        .from('word_scores')
        .select('*')
        .eq('user_id', userId)
        .limit(EXPORT_LIMITS.wordScores),

      // Level tests
      supabase
        .from('level_tests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.levelTests),

      // Game sessions with answers
      supabase
        .from('game_sessions')
        .select(`
          id, game_mode, words_practiced, correct_count, incorrect_count,
          score, streak, duration_seconds, completed_at, created_at,
          game_session_answers (id, word_id, user_answer, correct_answer, is_correct, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.gameSessions),

      // Progress summaries
      supabase
        .from('progress_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.progressSummaries),

      // Listen sessions
      supabase
        .from('listen_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.listenSessions),

      // Tutor challenges created by user
      supabase
        .from('tutor_challenges')
        .select('*')
        .eq('tutor_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.tutorChallenges),

      // Tutor challenges received by user
      supabase
        .from('tutor_challenges')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.tutorChallenges),

      // Challenge results
      supabase
        .from('challenge_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(EXPORT_LIMITS.challengeResults),

      // Word requests created (as tutor)
      supabase
        .from('word_requests')
        .select(`
          *,
          gift_words (id, word, translation, pronunciation, word_type, difficulty, created_at)
        `)
        .eq('tutor_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.wordRequests),

      // Word requests received (as student)
      supabase
        .from('word_requests')
        .select(`
          *,
          gift_words (id, word, translation, pronunciation, word_type, difficulty, created_at)
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.wordRequests),

      // Notifications
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.notifications),

      // Subscription events (audit log)
      supabase
        .from('subscription_events')
        .select('id, event_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMITS.subscriptionEvents),

      // Usage tracking
      supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('usage_date', { ascending: false })
        .limit(EXPORT_LIMITS.usageTracking),

      // Gift passes created
      supabase
        .from('gift_passes')
        .select('id, code, expires_at, redeemed_at, created_at')
        .eq('created_by', userId)
        .limit(EXPORT_LIMITS.giftPasses),

      // Invite tokens created
      supabase
        .from('invite_tokens')
        .select('id, token, expires_at, used_at, created_at')
        .eq('inviter_id', userId)
        .limit(EXPORT_LIMITS.inviteTokens)
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

    // Track truncations
    const truncations: string[] = [];
    if (exportData.chats.length >= EXPORT_LIMITS.chats) truncations.push(`chats (limit: ${EXPORT_LIMITS.chats})`);
    if (exportData.dictionary.length >= EXPORT_LIMITS.dictionary) truncations.push(`dictionary (limit: ${EXPORT_LIMITS.dictionary})`);
    if (exportData.wordScores.length >= EXPORT_LIMITS.wordScores) truncations.push(`wordScores (limit: ${EXPORT_LIMITS.wordScores})`);
    if (exportData.levelTests.length >= EXPORT_LIMITS.levelTests) truncations.push(`levelTests (limit: ${EXPORT_LIMITS.levelTests})`);
    if (exportData.gameSessions.length >= EXPORT_LIMITS.gameSessions) truncations.push(`gameSessions (limit: ${EXPORT_LIMITS.gameSessions})`);
    if (exportData.progressSummaries.length >= EXPORT_LIMITS.progressSummaries) truncations.push(`progressSummaries (limit: ${EXPORT_LIMITS.progressSummaries})`);
    if (exportData.listenSessions.length >= EXPORT_LIMITS.listenSessions) truncations.push(`listenSessions (limit: ${EXPORT_LIMITS.listenSessions})`);
    if (exportData.tutorChallenges.created.length >= EXPORT_LIMITS.tutorChallenges) truncations.push(`tutorChallenges.created (limit: ${EXPORT_LIMITS.tutorChallenges})`);
    if (exportData.tutorChallenges.received.length >= EXPORT_LIMITS.tutorChallenges) truncations.push(`tutorChallenges.received (limit: ${EXPORT_LIMITS.tutorChallenges})`);
    if (exportData.challengeResults.length >= EXPORT_LIMITS.challengeResults) truncations.push(`challengeResults (limit: ${EXPORT_LIMITS.challengeResults})`);
    if (exportData.wordRequests.created.length >= EXPORT_LIMITS.wordRequests) truncations.push(`wordRequests.created (limit: ${EXPORT_LIMITS.wordRequests})`);
    if (exportData.wordRequests.received.length >= EXPORT_LIMITS.wordRequests) truncations.push(`wordRequests.received (limit: ${EXPORT_LIMITS.wordRequests})`);
    if (exportData.notifications.length >= EXPORT_LIMITS.notifications) truncations.push(`notifications (limit: ${EXPORT_LIMITS.notifications})`);
    if (exportData.usageTracking.length >= EXPORT_LIMITS.usageTracking) truncations.push(`usageTracking (limit: ${EXPORT_LIMITS.usageTracking})`);

    // Calculate summary stats
    const summary = {
      totalChats: exportData.chats.length,
      totalMessages: exportData.chats.reduce((sum: number, chat: any) => sum + (chat.messages?.length || 0), 0),
      totalWords: exportData.dictionary.length,
      totalGameSessions: exportData.gameSessions.length,
      totalLevelTests: exportData.levelTests.length,
      totalListenSessions: exportData.listenSessions.length,
      dataExportedAt: exportData.exportedAt,
      truncatedTables: truncations.length > 0 ? truncations : undefined
    };

    if (truncations.length > 0) {
      console.log(`[export-user-data] Export truncated for user ${userId.substring(0, 8)}:`, truncations);
    }
    console.log(`[export-user-data] Export complete for user ${userId.substring(0, 8)}:`, summary);

    // Log data export for security audit trail
    logSecurityEvent(supabase, 'data_exported', {
      userId: userId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      totalRecords: summary.totalChats + summary.totalWords + summary.totalGameSessions
    });

    incrementUsage(supabase, auth.userId, RATE_LIMITS.exportUserData.type);

    return res.status(200).json({
      success: true,
      summary,
      data: exportData,
      warning: truncations.length > 0
        ? `Some data was truncated due to export limits. Affected: ${truncations.join(', ')}`
        : undefined
    });

  } catch (error: any) {
    console.error('[export-user-data] Error:', error);
    return res.status(500).json({ error: 'Failed to export user data. Please try again.' });
  }
}
