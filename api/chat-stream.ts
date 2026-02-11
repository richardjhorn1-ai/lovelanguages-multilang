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

import { GoogleGenAI } from "@google/genai";
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '../utils/api-middleware.js';
import { extractLanguages } from '../utils/language-helpers.js';
import { buildChatPrompt, type ChatMode } from '../utils/prompt-templates.js';
import { fetchVocabularyContext, formatVocabularyPromptSection } from '../utils/vocabulary-context.js';

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
// MAIN HANDLER
// =============================================================================

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createServiceClient();
  if (!supabase) return res.status(500).json({ error: 'Server configuration error' });

  const sub = await requireSubscription(supabase, auth.userId);
  console.log('[chat-stream] Subscription check:', { allowed: sub.allowed, plan: sub.plan, userId: auth.userId });
  if (!sub.allowed) return res.status(403).json({ error: sub.error });

  const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan as SubscriptionPlan);
  console.log('[chat-stream] Rate limit check:', { allowed: limit.allowed, remaining: limit.remaining, plan: sub.plan });
  if (!limit.allowed) return res.status(429).json({ error: limit.error, remaining: limit.remaining });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  // Parse request
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const { prompt = '', mode = 'ask', messages = [], sessionContext } = body || {};
  const { targetLanguage, nativeLanguage } = extractLanguages(body);

  if (!prompt.trim()) return res.status(400).json({ error: 'Prompt required' });

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
        }, `${p.name}'s Progress`);
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
        });
      }
    } else {
      // Fallback: fetch fresh (backwards compatible)
      const [roleData, vocabTier] = await Promise.all([
        getUserRole(supabase, auth.userId),
        fetchVocabularyContext(supabase, auth.userId, targetLanguage)
      ]);
      userRole = roleData.role;
      partnerName = roleData.partnerName;
      vocabularySection = formatVocabularyPromptSection(vocabTier);
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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream from Gemini
    console.log('[chat-stream] Starting Gemini stream for user:', auth.userId);
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: historyContents,
      config: {
        systemInstruction: systemPrompt
      }
    });

    // Stream chunks to client
    for await (const chunk of response) {
      const text = chunk.text || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Signal completion
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    // Track usage (fire and forget)
    incrementUsage(supabase, auth.userId, RATE_LIMITS.chat.type);

  } catch (error: any) {
    console.error('[chat-stream] Error:', error?.message || error);
    console.error('[chat-stream] Error stack:', error?.stack);

    // If headers already sent, end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Failed to generate response' });
    }
  }
}
