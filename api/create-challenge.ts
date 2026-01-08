import { createClient } from '@supabase/supabase-js';

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

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Rate limiting - AI Challenges: blocked for non-subscribers, 50/month for standard, unlimited for unlimited
    const { data: subscriptionProfile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status')
      .eq('id', auth.userId)
      .single();

    const isActive = subscriptionProfile?.subscription_status === 'active';
    const plan = isActive ? (subscriptionProfile?.subscription_plan || 'none') : 'none';

    // AI Challenge limits per month
    const CHALLENGE_LIMITS: Record<string, number | null> = {
      'none': 0,         // Non-subscribers: blocked
      'standard': 50,    // Standard: 50 challenges/month
      'unlimited': null  // Unlimited: no limit
    };

    const challengeLimit = CHALLENGE_LIMITS[plan];

    // Block non-subscribers completely
    if (challengeLimit === 0) {
      return res.status(403).json({
        error: 'AI Challenges require a subscription. Please upgrade to Standard or Unlimited.',
        feature: 'ai_challenges'
      });
    }

    // Check usage for standard plan
    if (challengeLimit !== null) {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: monthlyUsage } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', auth.userId)
        .eq('usage_type', 'ai_challenges')
        .gte('usage_date', `${currentMonth}-01`)
        .lte('usage_date', `${currentMonth}-31`);

      const currentCount = (monthlyUsage || []).reduce((sum, row) => sum + (row.count || 0), 0);

      if (currentCount >= challengeLimit) {
        return res.status(429).json({
          error: 'Monthly AI challenge limit reached (50 challenges). Upgrade to Unlimited for unlimited challenges.',
          limit: challengeLimit,
          used: currentCount
        });
      }

      // Increment usage
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsage } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', auth.userId)
        .eq('usage_type', 'ai_challenges')
        .eq('usage_date', today)
        .single();

      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: auth.userId,
          usage_type: 'ai_challenges',
          usage_date: today,
          count: (todayUsage?.count || 0) + 1
        }, {
          onConflict: 'user_id,usage_type,usage_date'
        });
    }

    // Get tutor's profile and linked student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can create challenges' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked partner found' });
    }

    const { challengeType, title, config, wordIds, newWords } = req.body;

    if (!challengeType || !config) {
      return res.status(400).json({ error: 'Missing required fields: challengeType, config' });
    }

    // Fetch word data for the selected words
    let wordsData: any[] = [];
    if (wordIds && wordIds.length > 0) {
      const { data: words } = await supabase
        .from('dictionary')
        .select('id, word, translation, word_type')
        .in('id', wordIds)
        .eq('user_id', profile.linked_user_id);

      wordsData = words || [];
    }

    // Handle new words added by tutor
    if (newWords && Array.isArray(newWords) && newWords.length > 0) {
      const newWordEntries = newWords.map((w: { polish: string; english: string }) => ({
        user_id: profile.linked_user_id,
        word: w.polish.toLowerCase().trim(),
        translation: w.english.trim(),
        word_type: 'other',
        importance: 3,
        context: `Added by ${profile.full_name} in challenge`,
        root_word: w.polish.toLowerCase().trim(),
        examples: [],
        pro_tip: ''
      }));

      const { data: insertedWords, error: insertError } = await supabase
        .from('dictionary')
        .insert(newWordEntries)
        .select('id, word, translation, word_type');

      if (insertError) {
        console.error('Error inserting new words:', insertError);
        // Continue without the new words rather than failing entirely
      } else if (insertedWords) {
        wordsData = [...wordsData, ...insertedWords];
      }
    }

    if (config.aiSuggestedWeakWords) {
      // Auto-select weak words based on scores
      const { data: weakWords } = await supabase
        .from('scores')
        .select('word_id, fail_count, success_count, dictionary:word_id(id, word, translation, word_type)')
        .eq('user_id', profile.linked_user_id)
        .gt('fail_count', 0)
        .order('fail_count', { ascending: false })
        .limit(config.wordCount || 10);

      wordsData = (weakWords || [])
        .filter((w: any) => w.dictionary)
        .map((w: any) => ({
          id: w.dictionary.id,
          word: w.dictionary.word,
          translation: w.dictionary.translation,
          word_type: w.dictionary.word_type
        }));
    }

    // Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('tutor_challenges')
      .insert({
        tutor_id: auth.userId,
        student_id: profile.linked_user_id,
        challenge_type: challengeType,
        title: title || `${challengeType} Challenge`,
        config,
        word_ids: wordsData.map(w => w.id),
        words_data: wordsData,
        status: 'pending'
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Error creating challenge:', challengeError);
      return res.status(500).json({ error: 'Failed to create challenge' });
    }

    // Create notification for student
    await supabase.from('notifications').insert({
      user_id: profile.linked_user_id,
      type: 'challenge',
      title: `${profile.full_name} sent you a challenge!`,
      message: `Play "${challenge.title}" and show what you've learned!`,
      data: { challenge_id: challenge.id, challenge_type: challengeType }
    });

    return res.status(200).json({
      success: true,
      challenge
    });

  } catch (error: any) {
    console.error('Create challenge error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
