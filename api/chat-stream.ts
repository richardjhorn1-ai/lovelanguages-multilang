import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { userId: user.id };
}

// Build system instruction based on mode
function buildSystemInstruction(mode: string, userLog: string[]): string {
  const COMMON = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language.

CORE RULES:
- Polish text ALWAYS followed by (English translation)
- Never dump multiple concepts - one thing at a time
- Include pronunciation hints for tricky words
`;

  const MODES: Record<string, string> = {
    ask: `
${COMMON}
MODE: ASK - Quick Text Chat. Be BRIEF (2-3 sentences max).
- NEVER repeat the same word/phrase twice
- End with a quick follow-up question
BANNED: Tables, bullet points, long explanations
`,
    learn: `
${COMMON}
MODE: LEARN - Structured Lesson

Known vocabulary: [${userLog.slice(0, 30).join(', ')}]

VERB RULE: Show ALL 6 conjugations (I, You, He/She, We, You plural, They)

USE THESE EXACT FORMATS:

::: table
Column1 | Column2 | Column3
---|---|---
Row1 | Row2 | Row3
:::

::: drill
Challenge text here
:::

ALWAYS end with a follow-up question.
`
  };

  return MODES[mode] || MODES.ask;
}

export default async function handler(req: any, res: any) {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS?.split(',')[0] || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Verify auth
  const auth = await verifyAuth(req);
  if (!auth) {
    res.write(`data: ${JSON.stringify({ error: 'Unauthorized' })}\n\n`);
    return res.end();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: 'API key missing' })}\n\n`);
    return res.end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { prompt, mode = 'ask', userLog = [] } = body;

    if (!prompt) {
      res.write(`data: ${JSON.stringify({ error: 'No prompt provided' })}\n\n`);
      return res.end();
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(mode, userLog);

    // Use streaming
    const result = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction
      }
    });

    let fullText = '';

    // Stream chunks to client
    for await (const chunk of result) {
      const text = chunk.text || '';
      if (text) {
        fullText += text;
        // Send text chunk
        res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
      }
    }

    // Send completion event with full text
    res.write(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
}
