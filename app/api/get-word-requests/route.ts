import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
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

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { status, role } = await request.json() || {};

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
      return NextResponse.json({ error: 'Failed to fetch word requests' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      wordRequests: wordRequests || []
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[get-word-requests] Error:', error);
    return NextResponse.json({ error: 'Failed to load word requests. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
