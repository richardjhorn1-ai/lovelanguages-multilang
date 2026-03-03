import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  incrementUsage,
} from '@/utils/api-middleware';

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

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400, headers: corsHeaders });
    }

    const { sessionType, durationSeconds } = body || {};

    if (sessionType !== 'voice' && sessionType !== 'listen') {
      return NextResponse.json({ error: 'sessionType must be "voice" or "listen"' }, { status: 400, headers: corsHeaders });
    }

    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
      return NextResponse.json({ error: 'durationSeconds must be a non-negative number' }, { status: 400, headers: corsHeaders });
    }
    // Clamp to 1 hour max (tokens expire in ~30 min; generous cap)
    const clampedSeconds = Math.min(durationSeconds, 3600);
    const minutes = clampedSeconds > 0 ? Math.max(1, Math.ceil(clampedSeconds / 60)) : 0;

    if (minutes === 0) {
      return NextResponse.json({ recorded: 0 }, { headers: corsHeaders });
    }

    const usageType = sessionType === 'voice' ? 'voice_minutes' : 'listen_minutes';
    incrementUsage(supabase, auth.userId, usageType, minutes);

    console.log(`[report-session-usage] ${sessionType} ${minutes}min for user ${auth.userId.substring(0, 8)}...`);

    return NextResponse.json({ recorded: minutes }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[report-session-usage] Error:', error);
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500, headers: corsHeaders });
  }
}
