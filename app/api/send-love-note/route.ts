import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
} from '@/utils/api-middleware';
import { getProfileLanguages } from '@/utils/language-helpers';
import { LOVE_NOTE_TEMPLATES } from '@/constants/levels';
import { sanitizeInput } from '@/utils/sanitize';

// Rate limit: 10 love notes per day
const DAILY_LIMIT = 10;

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Subscription check
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    const { templateCategory, templateText, customMessage } = await request.json();

    // Validate input
    if (!templateCategory && !customMessage) {
      return NextResponse.json({ error: 'Must provide template or custom message' }, { status: 400, headers: corsHeaders });
    }

    // Validate template if provided
    if (templateCategory) {
      const validCategories = ['encouragement', 'check_in', 'celebration'] as const;
      if (!validCategories.includes(templateCategory)) {
        return NextResponse.json({ error: 'Invalid template category' }, { status: 400, headers: corsHeaders });
      }

      if (templateText) {
        const templates = LOVE_NOTE_TEMPLATES[templateCategory as keyof typeof LOVE_NOTE_TEMPLATES];
        if (!(templates as readonly string[]).includes(templateText)) {
          return NextResponse.json({ error: 'Invalid template text' }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    if (!profile.linked_user_id) {
      return NextResponse.json({ error: 'No linked partner' }, { status: 400, headers: corsHeaders });
    }

    const { targetLanguage } = await getProfileLanguages(supabase, auth.userId);

    // Check daily rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('love_notes')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', auth.userId)
      .gte('created_at', today.toISOString());

    if ((todayCount || 0) >= DAILY_LIMIT) {
      return NextResponse.json({
        error: `Daily limit reached (${DAILY_LIMIT} notes per day)`,
        remaining: 0,
      }, { status: 429, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to send love note' }, { status: 500, headers: corsHeaders });
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
      language_code: targetLanguage,
    });

    return NextResponse.json({
      success: true,
      loveNote: {
        id: loveNote.id,
        createdAt: loveNote.created_at,
      },
      remaining: DAILY_LIMIT - (todayCount || 0) - 1,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[send-love-note] Error:', error);
    return NextResponse.json({ error: 'Failed to send love note' }, { status: 500, headers: corsHeaders });
  }
}
