import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
} from '@/utils/api-middleware';

// Notification limit constraints
const MAX_NOTIFICATION_LIMIT = 100;
const DEFAULT_NOTIFICATION_LIMIT = 50;

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { unreadOnly, limit: rawLimit } = await request.json() || {};

    // Validate and clamp limit parameter
    let validLimit = DEFAULT_NOTIFICATION_LIMIT;
    if (rawLimit !== undefined && rawLimit !== null) {
      const parsedLimit = typeof rawLimit === 'number' ? rawLimit : parseInt(String(rawLimit), 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        validLimit = Math.min(parsedLimit, MAX_NOTIFICATION_LIMIT);
      }
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(validLimit);  // Always apply a limit

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notifications, error: notifError } = await query;

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500, headers: corsHeaders });
    }

    // Count unread
    const unreadCount = (notifications || []).filter(n => !n.read_at).length;

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[get-notifications] Error:', error);
    return NextResponse.json({ error: 'Failed to load notifications. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
