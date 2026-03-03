import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '@/utils/api-middleware';
import { getProfileLanguages } from '@/utils/language-helpers';
import { getLanguageName } from '@/constants/language-config';
import { sanitizeInput } from '@/utils/sanitize';

// Get AI suggestions for a topic - lightweight preview data only
// Full grammatical data (conjugations, examples, etc.) is generated later
// in complete-word-request.ts when the student actually accepts the words
async function getTopicSuggestions(
  topic: string,
  count: number = 10,
  excludeWords: string[] = [],
  targetLanguage: string,
  nativeLanguage: string
): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  // Build exclusion instruction if there are words to exclude
  const exclusionText = excludeWords.length > 0
    ? `\n\nIMPORTANT: Do NOT include any of these words (the learner already knows them): ${excludeWords.slice(0, 100).join(', ')}`
    : '';

  const result = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Generate ${count} ${targetName} vocabulary words/phrases related to the topic: "${topic}"

For a romantic couple where one partner is learning ${targetName}. The words should be practical and useful for everyday communication.${exclusionText}

Return ONLY the JSON array with basic word info for preview.`,
    config: {
      responseMimeType: "application/json",
      // Lightweight schema - just enough for tutor to preview and select words
      // Full enrichment (conjugations, examples, etc.) happens in complete-word-request.ts
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: `${targetName} word or phrase` },
            translation: { type: Type.STRING, description: `${nativeName} translation` },
            word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
            pronunciation: { type: Type.STRING, description: "Pronunciation guide" }
          },
          required: ["word", "translation", "word_type", "pronunciation"]
        }
      }
    }
  });

  try {
    const words = JSON.parse(result.text || '[]');
    // Return lightweight preview data - no context field needed here
    return words.map((w: any) => ({
      word: w.word,
      translation: w.translation,
      word_type: w.word_type,
      pronunciation: w.pronunciation
    }));
  } catch {
    return [];
  }
}

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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    // Check rate limit (use sendWordGift limit)
    const limit = await checkRateLimit(supabase, auth.userId, 'sendWordGift', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      }, { status: 429, headers: corsHeaders });
    }

    // Get tutor's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    if (profile.role !== 'tutor') {
      return NextResponse.json({ error: 'Only tutors can create word requests' }, { status: 403, headers: corsHeaders });
    }

    if (!profile.linked_user_id) {
      return NextResponse.json({ error: 'No linked partner found' }, { status: 400, headers: corsHeaders });
    }

    // CRITICAL: Verify two-way partner link (prevents orphaned word requests if student unlinked)
    const { data: studentProfile, error: studentProfileError } = await supabase
      .from('profiles')
      .select('linked_user_id')
      .eq('id', profile.linked_user_id)
      .single();

    if (studentProfileError || !studentProfile) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 400, headers: corsHeaders });
    }

    if (studentProfile.linked_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Partner link is no longer active. Please ask your partner to reconnect.' }, { status: 400, headers: corsHeaders });
    }

    // Get student's language settings for word generation
    const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, profile.linked_user_id);

    const { requestType, inputText, selectedWords, xpMultiplier, dryRun, excludeWords, count } = await request.json();

    if (!requestType || !inputText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    // Sanitize user inputs
    const sanitizedInputText = sanitizeInput(inputText, 200);

    let aiSuggestions = null;
    let finalWords = selectedWords || [];

    // For AI topic requests, generate suggestions
    if (requestType === 'ai_topic') {
      const wordCount = count || 10;
      const wordsToExclude = excludeWords || [];
      aiSuggestions = await getTopicSuggestions(sanitizedInputText, wordCount, wordsToExclude, targetLanguage, nativeLanguage);

      // If dryRun, just return suggestions without creating a word request
      if (dryRun) {
        return NextResponse.json({
          success: true,
          suggestions: aiSuggestions
        }, { headers: corsHeaders });
      }

      // If no selectedWords provided, mark first 5 as selected
      if (!selectedWords || selectedWords.length === 0) {
        finalWords = aiSuggestions.slice(0, 5).map(w => ({ ...w, selected: true }));
      }
    } else if (requestType === 'free_text' && !selectedWords) {
      // For free text, create a single word entry from the input
      // The tutor typed a specific word/phrase
      const parts = sanitizedInputText.split('=').map((s: string) => s.trim());
      const word = parts[0];
      const translation = parts[1] || '';

      finalWords = [{
        word,
        translation,
        word_type: 'phrase',
        selected: true
      }];
    }

    // Create the word request
    const { data: wordRequest, error: requestError } = await supabase
      .from('word_requests')
      .insert({
        tutor_id: auth.userId,
        student_id: profile.linked_user_id,
        language_code: targetLanguage,
        request_type: requestType,
        input_text: sanitizedInputText,
        ai_suggestions: aiSuggestions,
        selected_words: finalWords.filter((w: any) => w.selected !== false),
        status: 'pending',
        xp_multiplier: xpMultiplier || 2.0
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating word request:', requestError);
      return NextResponse.json({ error: 'Failed to create word request' }, { status: 500, headers: corsHeaders });
    }

    // Create notification for student
    const wordCount = finalWords.filter((w: any) => w.selected !== false).length;
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: profile.linked_user_id,
      type: 'word_request',
      title: `${profile.full_name} sent you ${wordCount} word${wordCount > 1 ? 's' : ''} to learn!`,
      message: requestType === 'ai_topic'
        ? `Topic: ${sanitizedInputText}`
        : `A special gift from your partner`,
      data: {
        request_id: wordRequest.id,
        word_count: wordCount
      }
    });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail - word request was created, just warn
    }

    // Award Tutor XP for sending word gift
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${baseUrl}/api/tutor-award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('authorization') || '',
        },
        body: JSON.stringify({
          action: 'send_word_gift',
        }),
      });
    } catch (tutorXpError) {
      // Don't fail the main request if tutor XP fails
      console.error('[create-word-request] Failed to award tutor XP:', tutorXpError);
    }

    // Add to activity feed
    await supabase.from('activity_feed').insert({
      user_id: auth.userId,
      partner_id: profile.linked_user_id,
      event_type: 'gift_sent',
      title: 'Sent a word gift',
      subtitle: requestType === 'ai_topic' ? `Topic: ${sanitizedInputText}` : `${wordCount} words`,
      data: { request_id: wordRequest.id, word_count: wordCount },
      language_code: targetLanguage,
    });

    // Increment usage counter
    incrementUsage(supabase, auth.userId, RATE_LIMITS.sendWordGift.type);

    return NextResponse.json({
      success: true,
      wordRequest,
      suggestions: aiSuggestions,
      notificationError: notificationError ? 'Words sent but notification may not have been delivered' : undefined
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[create-word-request] Error:', error);
    return NextResponse.json({ error: 'Failed to send words. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
