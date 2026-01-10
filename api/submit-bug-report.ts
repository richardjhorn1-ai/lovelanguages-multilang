/**
 * API endpoint for submitting bug reports.
 * POST /api/submit-bug-report
 *
 * Body: { title, description, severity, pageUrl, browserInfo, appState }
 * Returns: { success, reportId }
 */

import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';

interface BugReportBody {
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  pageUrl?: string;
  browserInfo?: {
    userAgent: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    platform: string;
  };
  appState?: {
    role: string;
    level: string;
    xp: number;
    currentPath: string;
  };
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate body
  const body = req.body as BugReportBody;
  if (!body.title?.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!body.description?.trim()) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // Validate severity if provided
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  const severity = body.severity && validSeverities.includes(body.severity)
    ? body.severity
    : 'medium';

  // Create Supabase client
  const supabase = createServiceClient();
  if (!supabase) {
    console.error('[submit-bug-report] Failed to create Supabase client');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Insert bug report
    const { data: report, error: insertError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: auth.userId,
        title: body.title.trim().slice(0, 255),
        description: body.description.trim(),
        severity,
        page_url: body.pageUrl?.slice(0, 2000),
        browser_info: body.browserInfo || null,
        app_state: body.appState || null,
        status: 'open'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[submit-bug-report] Insert error:', insertError.message);
      return res.status(500).json({ error: 'Failed to submit bug report' });
    }

    // Create notification for user (confirmation)
    // Non-blocking - don't let this fail the request
    (async () => {
      try {
        await supabase.from('notifications').insert({
          user_id: auth.userId,
          type: 'love_note', // Reusing existing type
          title: 'Bug report received',
          message: `Thanks for reporting "${body.title.trim().slice(0, 50)}". We'll look into it!`,
          data: { reportId: report.id }
        });
      } catch (err: any) {
        console.error('[submit-bug-report] Notification error:', err.message);
      }
    })();

    console.log(`[submit-bug-report] Report ${report.id} created by user ${auth.userId}`);

    return res.status(200).json({
      success: true,
      reportId: report.id,
      message: 'Bug report submitted successfully'
    });

  } catch (err: any) {
    console.error('[submit-bug-report] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
