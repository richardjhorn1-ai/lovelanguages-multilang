import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  incrementUsage,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }

    const { sessionType, durationSeconds } = body || {};

    if (sessionType !== 'voice' && sessionType !== 'listen') {
      return res.status(400).json({ error: 'sessionType must be "voice" or "listen"' });
    }

    if (typeof durationSeconds !== 'number' || durationSeconds < 0 || durationSeconds > 86400) {
      return res.status(400).json({ error: 'durationSeconds must be a number between 0 and 86400' });
    }

    // Convert to minutes (ceil, minimum 1 minute for any non-zero session)
    const minutes = durationSeconds > 0 ? Math.max(1, Math.ceil(durationSeconds / 60)) : 0;

    if (minutes === 0) {
      return res.status(200).json({ recorded: 0 });
    }

    const usageType = sessionType === 'voice' ? 'voice_minutes' : 'listen_minutes';
    incrementUsage(supabase, auth.userId, usageType, minutes);

    console.log(`[report-session-usage] ${sessionType} ${minutes}min for user ${auth.userId.substring(0, 8)}...`);

    return res.status(200).json({ recorded: minutes });
  } catch (error: any) {
    console.error('[report-session-usage] Error:', error);
    return res.status(500).json({ error: 'Failed to record usage' });
  }
}
