import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
} from '@/utils/api-middleware';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Parse query params
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') as string) || 20, 50);
    const offset = parseInt(url.searchParams.get('offset') as string) || 0;
    const filter = url.searchParams.get('filter') as string; // 'all', 'mine', 'partner'

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
      return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500, headers: corsHeaders });
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

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      pagination: {
        offset,
        limit,
        hasMore: formattedEvents.length === limit,
      },
      unreadCount,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[activity-feed] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500, headers: corsHeaders });
  }
}
