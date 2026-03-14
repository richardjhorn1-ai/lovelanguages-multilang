/**
 * Shared email utility using Google Workspace SMTP via Nodemailer.
 *
 * Required env vars:
 *   GOOGLE_EMAIL          – the Google Workspace sender address (e.g. support@lovelanguages.io)
 *   GOOGLE_APP_PASSWORD   – an App Password generated from Google account security settings
 *
 * Usage:
 *   import { sendEmail } from '../utils/email.js';
 *   await sendEmail({ to, subject, html });
 */

import nodemailer from 'nodemailer';

interface SendEmailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body content */
  html: string;
  /** Override the "from" display name (default: "Love Languages") */
  fromName?: string;
}

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const user = process.env.GOOGLE_EMAIL;
  const pass = process.env.GOOGLE_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('Missing GOOGLE_EMAIL or GOOGLE_APP_PASSWORD env vars');
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return _transporter;
}

export async function sendEmail({ to, subject, html, fromName = 'Love Languages' }: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();
  const from = `${fromName} <${process.env.GOOGLE_EMAIL}>`;

  await transporter.sendMail({ from, to, subject, html });
}

/**
 * Check whether email sending is configured.
 * Useful for non-blocking email sends that should silently skip when unconfigured.
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.GOOGLE_EMAIL && process.env.GOOGLE_APP_PASSWORD);
}
