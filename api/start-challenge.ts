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

    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({ error: 'Missing challengeId' });
    }

    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('tutor_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Verify the user is the student for this challenge
    if (challenge.student_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized to start this challenge' });
    }

    // Check if challenge is already completed
    if (challenge.status === 'completed') {
      return res.status(400).json({ error: 'Challenge already completed' });
    }

    // Update challenge status to in_progress
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('tutor_challenges')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error starting challenge:', updateError);
      return res.status(500).json({ error: 'Failed to start challenge' });
    }

    // Mark related notification as read
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', auth.userId)
      .eq('type', 'challenge')
      .filter('data->challenge_id', 'eq', challengeId);

    return res.status(200).json({
      success: true,
      challenge: updatedChallenge
    });

  } catch (error: any) {
    console.error('Start challenge error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
