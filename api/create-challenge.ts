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

    const { challengeType, title, config, wordIds } = req.body;

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
    } else if (config.aiSuggestedWeakWords) {
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
