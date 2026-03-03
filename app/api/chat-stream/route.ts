/**
 * Streaming Chat Endpoint
 *
 * Uses Server-Sent Events (SSE) to stream responses word-by-word.
 * Shares prompts with chat.ts via buildChatPrompt() - no duplication.
 *
 * Uses sessionContext (from boot-session) when available to avoid DB queries.
 * Falls back to fetchVocabularyContext() when sessionContext is absent.
 *
 * NOTE: Does NOT extract vocabulary (use analyzeHistory separately).
 */

import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
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
import { extractLanguages } from '@/utils/language-helpers';
import { buildChatPrompt, type ChatMode } from '@/utils/prompt-templates';
import { fetchVocabularyContext, fetchKnownWordsList, formatVocabularyPromptSection } from '@/utils/vocabulary-context';

// =============================================================================
// HELPER FUNCTIONS (minimal - just what streaming needs)
// =============================================================================

async function getUserRole(supabase: any, userId: string): Promise<{
  role: 'student' | 'tutor';
  partnerName: string | null;
  linkedUserId: string | null;
}> {
  const { data } = await supabase
    .from('profiles')
    .select('role, partner_name, linked_user_id')
    .eq('id', userId)
    .single();

  return {
    role: data?.role || 'student',
    partnerName: data?.partner_name || null,
    linkedUserId: data?.linked_user_id || null
  };
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
  }

  const sub = await requireSubscription(supabase, auth.userId);
  if (!sub.allowed) {
    return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
  }

  const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan as SubscriptionPlan);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.error, remaining: limit.remaining }, { status: 429, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500, headers: corsHeaders });
  }

  // Parse request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const { prompt = '', mode = 'ask', messages = [], sessionContext } = body || {};
  const { targetLanguage, nativeLanguage } = extractLanguages(body);

  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400, headers: corsHeaders });
  }

  try {
    // Build vocabulary section from sessionContext (cached) or fresh fetch (fallback)
    let vocabularySection = '';
    let userRole: 'student' | 'tutor' = 'student';
    let partnerName: string | null = null;
    let partnerContext: { learnerName: string; stats: { totalWords: number; masteredCount: number; xp: number; level: string } } | null = null;

    if (sessionContext && sessionContext.bootedAt) {
      // Use cached session context (efficient: 0 DB queries for vocabulary)
      userRole = sessionContext.role === 'tutor' ? 'tutor' : 'student';
      partnerName = sessionContext.partnerName;

      if (userRole === 'tutor' && sessionContext.partner) {
        // Tutor: show partner's vocabulary
        const p = sessionContext.partner;
        vocabularySection = formatVocabularyPromptSection({
          vocabulary: p.vocabulary || [],
          masteredWords: p.masteredWords || [],
          weakSpots: p.weakSpots || [],
          recentWords: p.recentWords || [],
          stats: p.stats || { totalWords: 0, masteredCount: 0 },
          lastActive: null
        }, `${p.name}'s Progress`, { level: p.level });
        partnerContext = {
          learnerName: p.name,
          stats: { totalWords: p.stats.totalWords, masteredCount: p.stats.masteredCount, xp: p.xp, level: p.level }
        };
      } else {
        // Student: show their own vocabulary
        vocabularySection = formatVocabularyPromptSection({
          vocabulary: sessionContext.vocabulary || [],
          masteredWords: sessionContext.masteredWords || [],
          weakSpots: sessionContext.weakSpots || [],
          recentWords: sessionContext.recentWords || [],
          stats: sessionContext.stats || { totalWords: 0, masteredCount: 0 },
          lastActive: null
        }, undefined, {
          level: sessionContext.level,
          knownWords: sessionContext.knownWordsList
        });
      }
    } else {
      // Fallback: fetch fresh (backwards compatible)
      const roleData = await getUserRole(supabase, auth.userId);
      userRole = roleData.role;
      partnerName = roleData.partnerName;

      // Fetch vocab for the right person (tutor sees partner's vocab, student sees own)
      const vocabUserId = (userRole === 'tutor' && roleData.linkedUserId) ? roleData.linkedUserId : auth.userId;
      const [vocabTier, knownWords] = await Promise.all([
        fetchVocabularyContext(supabase, vocabUserId, targetLanguage),
        fetchKnownWordsList(supabase, vocabUserId, targetLanguage),
      ]);
      vocabularySection = formatVocabularyPromptSection(vocabTier, undefined, { knownWords });
    }

    // Build prompt using shared function
    const systemPrompt = buildChatPrompt({
      targetLanguage,
      nativeLanguage,
      mode: mode as ChatMode,
      userRole,
      partnerName,
      partnerContext,
      vocabularySection
    });

    // Build conversation history
    const historyContents = messages.slice(-20).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add current prompt
    historyContents.push({ role: 'user', parts: [{ text: prompt }] });

    // Stream from Gemini
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-lite-preview',
      contents: historyContents,
      config: {
        systemInstruction: systemPrompt
      }
    });

    // Create SSE stream using ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream chunks to client
          for await (const chunk of response) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Signal completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();

          // Track usage (fire and forget)
          incrementUsage(supabase, auth.userId, RATE_LIMITS.chat.type);
        } catch (error: any) {
          console.error('[chat-stream] Stream error:', error?.message || error);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`));
            controller.close();
          } catch {
            // Controller may already be closed
          }
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: any) {
    console.error('[chat-stream] Error:', error?.message || error);
    console.error('[chat-stream] Error stack:', error?.stack);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500, headers: corsHeaders });
  }
}
