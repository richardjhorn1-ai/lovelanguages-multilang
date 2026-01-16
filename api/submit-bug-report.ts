/**
 * API endpoint for submitting bug reports.
 * POST /api/submit-bug-report
 *
 * Body: { title, description, severity, pageUrl, browserInfo, appState }
 * Returns: { success, reportId }
 */

import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware';
import { Resend } from 'resend';

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

    // Send email notification to support (non-blocking)
    if (process.env.RESEND_API_KEY) {
      (async () => {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const severityEmoji = {
            critical: '🚨',
            high: '🔴',
            medium: '🟡',
            low: '🟢'
          }[severity] || '🟡';

          await resend.emails.send({
            from: 'Love Languages Bugs <bugs@lovelanguages.xyz>',
            to: 'support@lovelanguages.xyz',
            subject: `${severityEmoji} [${severity.toUpperCase()}] Bug Report: ${body.title.trim().slice(0, 80)}`,
            html: `
              <h2>Bug Report #${report.id}</h2>
              <p><strong>Severity:</strong> ${severityEmoji} ${severity.toUpperCase()}</p>
              <p><strong>Title:</strong> ${body.title.trim()}</p>
              <p><strong>Description:</strong></p>
              <pre style="background: #f4f4f4; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${body.description.trim()}</pre>
              <hr />
              <p><strong>User ID:</strong> ${auth.userId}</p>
              <p><strong>Page URL:</strong> ${body.pageUrl || 'Not provided'}</p>
              ${body.browserInfo ? `
                <p><strong>Browser Info:</strong></p>
                <ul>
                  <li>Platform: ${body.browserInfo.platform}</li>
                  <li>Screen: ${body.browserInfo.screenWidth}x${body.browserInfo.screenHeight}</li>
                  <li>Language: ${body.browserInfo.language}</li>
                  <li>User Agent: ${body.browserInfo.userAgent}</li>
                </ul>
              ` : ''}
              ${body.appState ? `
                <p><strong>App State:</strong></p>
                <ul>
                  <li>Role: ${body.appState.role}</li>
                  <li>Level: ${body.appState.level}</li>
                  <li>XP: ${body.appState.xp}</li>
                  <li>Path: ${body.appState.currentPath}</li>
                </ul>
              ` : ''}
            `
          });
          console.log(`[submit-bug-report] Email sent for report ${report.id}`);
        } catch (err: any) {
          console.error('[submit-bug-report] Email error:', err.message);
        }
      })();
    }

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
