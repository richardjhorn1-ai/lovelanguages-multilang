/**
 * Debug Coach Endpoint
 *
 * Diagnostic endpoint for troubleshooting coach mode issues.
 * Only available in non-production environments.
 *
 * Returns user info, role, partner link status, and two-way link validation.
 */

import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Only available in development/preview environments
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, linked_user_id, full_name, active_language, native_language')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        diagnostics: {
          userId: auth.userId,
          error: 'Profile not found',
          timestamp: new Date().toISOString(),
          environment: process.env.VERCEL_ENV || 'local',
        },
      });
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

    return res.status(200).json({
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
    });
  } catch (error: any) {
    return res.status(500).json({
      diagnostics: {
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || 'local',
      },
    });
  }
}
