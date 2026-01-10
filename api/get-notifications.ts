import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

// Notification limit constraints
const MAX_NOTIFICATION_LIMIT = 100;
const DEFAULT_NOTIFICATION_LIMIT = 50;

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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { unreadOnly, limit: rawLimit } = req.body || {};

    // Validate and clamp limit parameter
    let validLimit = DEFAULT_NOTIFICATION_LIMIT;
    if (rawLimit !== undefined && rawLimit !== null) {
      const parsedLimit = typeof rawLimit === 'number' ? rawLimit : parseInt(String(rawLimit), 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        validLimit = Math.min(parsedLimit, MAX_NOTIFICATION_LIMIT);
      }
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(validLimit);  // Always apply a limit

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notifications, error: notifError } = await query;

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Count unread
    const unreadCount = (notifications || []).filter(n => !n.read_at).length;

    return res.status(200).json({
      success: true,
      notifications: notifications || [],
      unreadCount
    });

  } catch (error: any) {
    console.error('[get-notifications] Error:', error);
    return res.status(500).json({ error: 'Failed to load notifications. Please try again.' });
  }
}
