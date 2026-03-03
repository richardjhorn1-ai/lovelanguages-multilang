/**
 * Debug Coach Endpoint
 *
 * Diagnostic endpoint for troubleshooting coach mode issues.
 * Only available in non-production environments.
 *
 * Returns user info, role, partner link status, and two-way link validation.
 */

import { NextResponse } from 'next/server';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth, createServiceClient } from '@/utils/api-middleware';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // Only available in development/preview environments
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  }

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, linked_user_id, full_name, active_language, native_language')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        diagnostics: {
          userId: auth.userId,
          error: 'Profile not found',
          timestamp: new Date().toISOString(),
          environment: process.env.VERCEL_ENV || 'local',
        },
      }, { status: 404, headers: corsHeaders });
    }

    // Get partner info if linked
    let partnerInfo: {
      name: string | null;
      linkedBack: boolean;
      role: string | null;
    } | null = null;

    if (profile.linked_user_id) {
      const { data: partner, error: partnerError } = await supabase
        .from('profiles')
        .select('full_name, linked_user_id, role')
        .eq('id', profile.linked_user_id)
        .single();

      if (!partnerError && partner) {
        partnerInfo = {
          name: partner.full_name,
          linkedBack: partner.linked_user_id === auth.userId,
          role: partner.role,
        };
      }
    }

    return NextResponse.json({
      diagnostics: {
        userId: auth.userId,
        role: profile.role,
        fullName: profile.full_name,
        activeLanguage: profile.active_language,
        nativeLanguage: profile.native_language,
        hasLinkedPartner: !!profile.linked_user_id,
        partner: partnerInfo,
        twoWayLinkValid: partnerInfo?.linkedBack === true,
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || 'local',
      },
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({
      diagnostics: {
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || 'local',
      },
    }, { status: 500, headers: corsHeaders });
  }
}
