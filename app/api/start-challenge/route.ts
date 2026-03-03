import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth } from '@/utils/api-middleware';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: 'Missing challengeId' }, { status: 400, headers: corsHeaders });
    }

    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('tutor_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404, headers: corsHeaders });
    }

    // Verify the user is the student for this challenge
    if (challenge.student_id !== auth.userId) {
      return NextResponse.json({ error: 'Not authorized to start this challenge' }, { status: 403, headers: corsHeaders });
    }

    // Check if challenge can be started (must be pending)
    if (challenge.status !== 'pending') {
      return NextResponse.json({
        error: `Challenge cannot be started (status: ${challenge.status})`
      }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to start challenge' }, { status: 500, headers: corsHeaders });
    }

    // Mark related notification as read
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', auth.userId)
      .eq('type', 'challenge')
      .filter('data->challenge_id', 'eq', challengeId);

    return NextResponse.json({
      success: true,
      challenge: updatedChallenge
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[start-challenge] Error:', error);
    return NextResponse.json({ error: 'Failed to start challenge. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
