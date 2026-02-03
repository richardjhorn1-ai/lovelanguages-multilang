import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Parse query params
    const limit = Math.min(Math.max(parseInt(req.query?.limit) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query?.offset) || 0, 0);
    const unreadOnly = req.query?.unread_only === 'true';

    // Build query
    let query = supabase
      .from('love_notes')
      .select(`
        id,
        sender_id,
        recipient_id,
        template_category,
        template_text,
        custom_message,
        read_at,
        created_at,
        sender:sender_id(full_name, avatar_url)
      `)
      .eq('recipient_id', auth.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter to unread only if requested
    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notes, error } = await query;

    if (error) {
      console.error('[get-love-notes] Error fetching notes:', error);
      return res.status(500).json({ error: 'Failed to fetch love notes' });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('love_notes')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', auth.userId);

    if (unreadOnly) {
      countQuery = countQuery.is('read_at', null);
    }

    const { count } = await countQuery;

    return res.status(200).json({
      notes: notes || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('[get-love-notes] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch love notes' });
  }
}
