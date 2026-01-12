/**
 * Streaming Chat Endpoint
 *
 * Uses Server-Sent Events (SSE) to stream responses word-by-word.
 * Shares prompts with chat.ts via buildChatPrompt() - no duplication.
 *
 * NOTE: Does NOT extract vocabulary (use analyzeHistory separately).
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';
import { extractLanguages } from '../utils/language-helpers.js';
import {
  buildChatPrompt,
  type ChatMode,
  type LearningJourneyContext,
  type PartnerContext
} from '../utils/prompt-templates.js';

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

async function getJourneyContext(
  supabase: any,
  userId: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<LearningJourneyContext | null> {
  const { data: summary } = await supabase
    .from('progress_summaries')
    .select('level_at_time, words_learned, topics_explored, can_now_say, suggestions')
    .eq('user_id', userId)
    .eq('language_code', targetLanguage)
    .eq('native_language', nativeLanguage)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: scores } = await supabase
    .from('word_scores')
    .select('fail_count, dictionary:word_id(word, translation, language_code)')
    .eq('user_id', userId)
    .gt('fail_count', 0)
    .order('fail_count', { ascending: false })
    .limit(10);

  const struggledWords = (scores || [])
    .filter((s: any) => s.dictionary?.language_code === targetLanguage)
    .slice(0, 5)
    .map((s: any) => ({ word: s.dictionary?.word || '', translation: s.dictionary?.translation || '' }));

  if (!summary && struggledWords.length === 0) return null;

  return {
    level: summary?.level_at_time || 'Beginner 1',
    totalWords: summary?.words_learned || 0,
    topicsExplored: summary?.topics_explored || [],
    canNowSay: summary?.can_now_say || [],
    suggestions: summary?.suggestions || [],
    struggledWords
  };
}

async function getPartnerContext(
  supabase: any,
  tutorId: string,
  linkedUserId: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<PartnerContext | null> {
  const { data: partner } = await supabase
    .from('profiles')
    .select('full_name, xp, level')
    .eq('id', linkedUserId)
    .single();

  if (!partner) return null;

  const { data: vocab } = await supabase
    .from('dictionary')
    .select('word, translation')
    .eq('user_id', linkedUserId)
    .eq('language_code', targetLanguage)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: scores } = await supabase
    .from('word_scores')
    .select('fail_count, success_count, dictionary:word_id(word, translation)')
    .eq('user_id', linkedUserId)
    .order('fail_count', { ascending: false })
    .limit(10);

  const { count: totalWords } = await supabase
    .from('dictionary')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', linkedUserId)
    .eq('language_code', targetLanguage);

  const { count: masteredCount } = await supabase
    .from('word_scores')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', linkedUserId)
    .not('learned_at', 'is', null);

  const journey = await getJourneyContext(supabase, linkedUserId, targetLanguage, nativeLanguage);

  return {
    learnerName: partner.full_name || 'Your partner',
    vocabulary: (vocab || []).map((v: any) => `${v.word} (${v.translation})`),
    weakSpots: (scores || [])
      .filter((s: any) => s.fail_count > s.success_count)
      .slice(0, 5)
      .map((s: any) => ({
        word: s.dictionary?.word || '',
        translation: s.dictionary?.translation || '',
        failCount: s.fail_count
      })),
    recentWords: (vocab || []).slice(0, 5).map((v: any) => ({ word: v.word, translation: v.translation })),
    stats: {
      totalWords: totalWords || 0,
      masteredCount: masteredCount || 0,
      xp: partner.xp || 0,
      level: partner.level || 'Beginner 1'
    },
    journey
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
  if (!sub.allowed) return res.status(403).json({ error: sub.error });

  const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan as 'standard' | 'unlimited');
  if (!limit.allowed) return res.status(429).json({ error: limit.error, remaining: limit.remaining });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  // Parse request
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const { prompt = '', mode = 'ask', userLog = [], messages = [] } = body || {};
  const { targetLanguage, nativeLanguage } = extractLanguages(body);

  if (!prompt.trim()) return res.status(400).json({ error: 'Prompt required' });

  try {
    // Get user context
    const { role: userRole, partnerName, linkedUserId } = await getUserRole(supabase, auth.userId);
    const journeyContext = userRole === 'student'
      ? await getJourneyContext(supabase, auth.userId, targetLanguage, nativeLanguage)
      : null;
    const partnerContext = userRole === 'tutor' && linkedUserId
      ? await getPartnerContext(supabase, auth.userId, linkedUserId, targetLanguage, nativeLanguage)
      : null;

    // Build prompt using shared function
    const systemPrompt = buildChatPrompt({
      targetLanguage,
      nativeLanguage,
      mode: mode as ChatMode,
      userRole,
      userLog,
      partnerName,
      partnerContext,
      journeyContext
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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash',
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
    console.error('[chat-stream] Error:', error);

    // If headers already sent, end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Failed to generate response' });
    }
  }
}
