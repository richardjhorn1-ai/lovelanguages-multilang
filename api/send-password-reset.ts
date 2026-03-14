/**
 * API endpoint for sending branded password reset emails.
 * POST /api/send-password-reset
 *
 * Uses Supabase Admin to generate a secure recovery link, then sends it
 * via Google Workspace SMTP with a branded Love Languages email template.
 *
 * Body: { email: string }
 * Returns: { success: true }
 */

import {
  setCorsHeaders,
  setSecurityHeaders,
  checkAuthRateLimit,
} from '../utils/api-middleware.js';
import { sendEmail } from '../utils/email.js';

// Callback URL that Supabase will redirect to after the user clicks the link.
// This must match the redirect URLs configured in Supabase dashboard.
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || 'https://www.lovelanguages.io';
const REDIRECT_URL = `${APP_URL}/auth/callback?flow=password-reset&next=/reset-password`;

function buildPasswordResetEmail(actionLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF0F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF0F3;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 32px 24px; background: linear-gradient(135deg, #FF6B8A 0%, #FF8FA3 100%);">
              <div style="font-size: 48px; line-height: 1;">&#10084;&#65039;</div>
              <h1 style="margin: 12px 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.3px;">
                Love Languages
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 8px;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #1A1A2E; text-align: center;">
                Reset your password
              </h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555770; text-align: center;">
                We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #FF6B8A 0%, #FF8FA3 100%); border-radius: 16px;">
                    <a href="${actionLink}"
                       target="_blank"
                       style="display: inline-block; padding: 16px 40px; font-size: 15px; font-weight: 800; color: #FFFFFF; text-decoration: none; letter-spacing: 0.5px; text-transform: uppercase;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #F0F0F5;"></div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding: 24px 32px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #8E8EA0; text-align: center;">
                If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link above.
              </p>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #B0B0C0; text-align: center; word-break: break-all;">
                Can't click the button? Copy this link:<br />
                <a href="${actionLink}" style="color: #FF6B8A; text-decoration: underline;">${actionLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FAFAFA; border-top: 1px solid #F0F0F5;">
              <p style="margin: 0; font-size: 12px; color: #B0B0C0; text-align: center; line-height: 1.5;">
                Love Languages &mdash; Learn languages with the people you love<br />
                <a href="${APP_URL}" style="color: #FF6B8A; text-decoration: none;">lovelanguages.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export default async function handler(req: any, res: any) {
  setSecurityHeaders(res);

  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[send-password-reset] Missing required env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!process.env.GOOGLE_EMAIL || !process.env.GOOGLE_APP_PASSWORD) {
    console.error('[send-password-reset] Missing Google email env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Validate input
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Use Supabase Admin to generate a recovery link
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Persistent rate limit via Supabase RPC (works across serverless instances)
    const rateLimit = await checkAuthRateLimit(supabaseAdmin, normalizedEmail, 'password_reset', {
      maxAttempts: 3,
    });
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', rateLimit.waitSeconds.toString());
      return res.status(429).json({ error: 'Too many reset requests. Please try again later.' });
    }

    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: REDIRECT_URL,
      },
    });

    if (linkError) {
      // Don't reveal whether the email exists — always return success
      console.warn('[send-password-reset] generateLink error:', linkError.message);
      return res.status(200).json({ success: true });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      console.error('[send-password-reset] No action_link returned');
      // Still return success to not leak info
      return res.status(200).json({ success: true });
    }

    // Send branded email via Google SMTP
    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset your password',
      html: buildPasswordResetEmail(actionLink),
    });

    console.log(`[send-password-reset] Reset email sent to ${normalizedEmail.slice(0, 3)}***`);

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('[send-password-reset] Error:', err.message);
    // Always return success to prevent email enumeration
    return res.status(200).json({ success: true });
  }
}
