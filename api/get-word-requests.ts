import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';

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

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { status, role } = req.body || {};

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_relationship_session_id')
      .eq('id', auth.userId)
      .single();

    const userRole = role || profile?.role || 'student';
    const activeRelationshipSessionId = profile?.active_relationship_session_id;

    if (!activeRelationshipSessionId) {
      return res.status(200).json({
        success: true,
        wordRequests: [],
      });
    }

    let query = supabase
      .from('word_requests')
      .select('*')
      .eq('relationship_session_id', activeRelationshipSessionId)
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
