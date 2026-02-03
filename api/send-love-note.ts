import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
} from '../utils/api-middleware.js';
import { LOVE_NOTE_TEMPLATES } from '../constants/levels.js';
import { sanitizeInput } from '../utils/sanitize.js';

// Rate limit: 10 love notes per day
const DAILY_LIMIT = 10;

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

    // Subscription check
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    const { templateCategory, templateText, customMessage } = req.body;

    // Validate input
    if (!templateCategory && !customMessage) {
      return res.status(400).json({ error: 'Must provide template or custom message' });
    }

    // Validate template if provided
    if (templateCategory) {
      const validCategories = ['encouragement', 'check_in', 'celebration'] as const;
      if (!validCategories.includes(templateCategory)) {
        return res.status(400).json({ error: 'Invalid template category' });
      }

      if (templateText) {
        const templates = LOVE_NOTE_TEMPLATES[templateCategory as keyof typeof LOVE_NOTE_TEMPLATES];
        if (!(templates as readonly string[]).includes(templateText)) {
          return res.status(400).json({ error: 'Invalid template text' });
        }
      }
    }

    // Sanitize custom message
    const sanitizedMessage = customMessage ? sanitizeInput(customMessage, 200) : null;

    // Get user profile and verify they have a linked partner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked partner' });
    }

    // Check daily rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('love_notes')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', auth.userId)
      .gte('created_at', today.toISOString());

    if ((todayCount || 0) >= DAILY_LIMIT) {
      return res.status(429).json({
        error: `Daily limit reached (${DAILY_LIMIT} notes per day)`,
        remaining: 0,
      });
    }

    // Create the love note
    const { data: loveNote, error: noteError } = await supabase
      .from('love_notes')
      .insert({
        sender_id: auth.userId,
        recipient_id: profile.linked_user_id,
        template_category: templateCategory || null,
        template_text: templateText || null,
        custom_message: sanitizedMessage,
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating love note:', noteError);
      return res.status(500).json({ error: 'Failed to send love note' });
    }

    // Create notification for recipient
    const noteText = templateText || sanitizedMessage || 'sent you a love note';
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: profile.linked_user_id,
      type: 'love_note',
      title: `💕 ${profile.full_name || 'Your partner'}`,
      message: noteText,
      data: {
        love_note_id: loveNote.id,
        sender_name: profile.full_name,
      },
    });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request, notification is non-critical
    }

    // Add to activity feed
    await supabase.from('activity_feed').insert({
      user_id: auth.userId,
      partner_id: profile.linked_user_id,
      event_type: 'love_note',
      title: 'Sent a love note',
      subtitle: noteText,
      data: { note_id: loveNote.id },
    });

    return res.status(200).json({
      success: true,
      loveNote: {
        id: loveNote.id,
        createdAt: loveNote.created_at,
      },
      remaining: DAILY_LIMIT - (todayCount || 0) - 1,
    });
  } catch (error: any) {
    console.error('[send-love-note] Error:', error);
    return res.status(500).json({ error: 'Failed to send love note' });
  }
}
