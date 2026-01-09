import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware';

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
    console.error('[start-challenge] Error:', error);
    return res.status(500).json({ error: 'Failed to start challenge. Please try again.' });
  }
}
