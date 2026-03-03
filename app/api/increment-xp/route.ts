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

  // Verify authentication
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
  }

  // Parse request body
  const body = await request.json();

  const { amount } = body || {};

  // Validate amount
  if (typeof amount !== 'number' || amount < 1 || amount > 100) {
    return NextResponse.json({ error: 'Invalid amount. Must be a number between 1 and 100.' }, { status: 400, headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get current XP
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', auth.userId)
      .single();

    if (fetchError || !profile) {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch profile.' }, { status: 500, headers: corsHeaders });
    }

    const currentXp = profile.xp || 0;
    const newXp = currentXp + amount;

    // Update XP in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('Error updating XP:', updateError);
      return NextResponse.json({ error: 'Failed to update XP.' }, { status: 500, headers: corsHeaders });
    }

    // Return updated XP info
    return NextResponse.json({
      success: true,
      previousXp: currentXp,
      newXp: newXp,
      xpGained: amount
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error in increment-xp:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500, headers: corsHeaders });
  }
}
