import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

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

    const { status, role } = req.body || {};

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single();

    const userRole = role || profile?.role || 'student';

    let query = supabase
      .from('word_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (userRole === 'tutor') {
      query = query.eq('tutor_id', auth.userId);
    } else {
      query = query.eq('student_id', auth.userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: wordRequests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Error fetching word requests:', requestsError);
      return res.status(500).json({ error: 'Failed to fetch word requests' });
    }

    return res.status(200).json({
      success: true,
      wordRequests: wordRequests || []
    });

  } catch (error: any) {
    console.error('[get-word-requests] Error:', error);
    return res.status(500).json({ error: 'Failed to load word requests. Please try again.' });
  }
}
