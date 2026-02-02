import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
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

    // Parse query params
    const limit = Math.min(parseInt(req.query?.limit as string) || 20, 50);
    const offset = parseInt(req.query?.offset as string) || 0;
    const filter = req.query?.filter as string; // 'all', 'mine', 'partner'

    // Get user profile for linked partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('linked_user_id')
      .eq('id', auth.userId)
      .single();

    // Build query based on filter
    let query = supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'mine') {
      query = query.eq('user_id', auth.userId);
    } else if (filter === 'partner' && profile?.linked_user_id) {
      query = query.eq('user_id', profile.linked_user_id);
    } else {
      // Default: show both user's and partner's activity
      if (profile?.linked_user_id) {
        query = query.or(`user_id.eq.${auth.userId},user_id.eq.${profile.linked_user_id}`);
      } else {
        query = query.eq('user_id', auth.userId);
      }
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching activity feed:', error);
      return res.status(500).json({ error: 'Failed to fetch activity feed' });
    }

    // Get user names for display
    const userIds = [...new Set(events?.map(e => e.user_id) || [])];
    let userNames: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      userNames = Object.fromEntries(users?.map(u => [u.id, u.full_name]) || []);
    }

    // Format events
    const formattedEvents = events?.map(event => ({
      id: event.id,
      eventType: event.event_type,
      title: event.title,
      subtitle: event.subtitle,
      data: event.data,
      languageCode: event.language_code,
      createdAt: event.created_at,
      userId: event.user_id,
      userName: userNames[event.user_id] || 'Unknown',
      isOwnEvent: event.user_id === auth.userId,
    })) || [];

    // Get unread count (events from partner that are newer than last viewed)
    // For simplicity, just return count of partner events from last 24 hours
    let unreadCount = 0;
    if (profile?.linked_user_id) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count } = await supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.linked_user_id)
        .gte('created_at', yesterday.toISOString());

      unreadCount = count || 0;
    }

    return res.status(200).json({
      success: true,
      events: formattedEvents,
      pagination: {
        offset,
        limit,
        hasMore: formattedEvents.length === limit,
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error('[activity-feed] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
}
