import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    // Parse query params from URL
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const unreadOnly = searchParams.get('unread_only') === 'true';

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
      return NextResponse.json({ error: 'Failed to fetch love notes' }, { status: 500, headers: corsHeaders });
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

    return NextResponse.json({
      notes: notes || [],
      total: count || 0,
      limit,
      offset,
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[get-love-notes] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch love notes' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
