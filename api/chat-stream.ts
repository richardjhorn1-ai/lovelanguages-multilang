import { GoogleGenAI } from "@google/genai";
import { setStreamingCorsHeaders, verifyAuth } from '../utils/api-middleware.js';
import { extractLanguages, type LanguageParams } from '../utils/language-helpers.js';
import { buildCupidSystemPrompt, getGrammarExtractionNotes, type ChatMode } from '../utils/prompt-templates.js';
import { getLanguageConfig, getLanguageName, getConjugationPersons } from '../constants/language-config.js';
import { buildVocabularySchema } from '../utils/schema-builders.js';

// Sanitize output to remove any CSS/HTML artifacts the AI might generate
function sanitizeOutput(text: string): string {
  if (!text) return '';

  // LITERAL string replacements first (most reliable)
  let result = text
    .split('(#FF4761) font-semibold">').join('')
    .split('(#FF4761)font-semibold">').join('')
    .split('#FF4761) font-semibold">').join('')
    .split('font-semibold">').join('')
    .split('font-semibold>').join('');

  // Then regex patterns for variations
  return result
    // Remove patterns like: (#HEX) font-semibold"> with any hex color
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    // Remove hex color in parentheses: (#FF4761)
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    // Remove font-semibold with any trailing punctuation
    .replace(/font-semibold["'>:\s]*/gi, '')
    // Remove Tailwind-style classes: text-[#FF4761]
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    // Remove any HTML tags
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    // Remove orphaned style/class fragments
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    // Remove any stray hex colors
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    // Clean up orphaned quotes, brackets, angle brackets
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    // Clean up double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Build system instruction based on mode and language parameters
function buildSystemInstruction(
  mode: string,
  userLog: string[],
  targetLanguage: string,
  nativeLanguage: string
): string {
  // Get language configs and names
  const targetConfig = getLanguageConfig(targetLanguage);
  const nativeConfig = getLanguageConfig(nativeLanguage);
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  // Get conjugation persons for verb rules (or fallback to English)
  const conjugationPersons = getConjugationPersons(targetLanguage);
  const hasConjugation = targetConfig?.grammar.hasConjugation || false;
  const conjugationCount = conjugationPersons.length || 6;

  // Get example phrases for the target language
  const helloExample = targetConfig?.examples.hello || 'Hello';
  const helloNative = nativeConfig?.examples.hello || 'Hello';

  const COMMON = `
You are "Cupid" - a warm, encouraging ${targetName} language companion helping someone learn their partner's native language.

CONTEXT AWARENESS:
You can see the recent conversation history. Use it to:
- Reference what was discussed earlier
- Avoid repeating information already covered
- Build progressively on vocabulary they've seen in this chat

CORE RULES:
- ${targetName} text ALWAYS followed by (${nativeName} translation)
- Never dump multiple concepts - one thing at a time
- Include pronunciation hints for tricky words

FORMATTING - YOU MUST FOLLOW THIS EXACTLY:
- ${targetName} words go inside **double asterisks**: **${helloExample}**
- Pronunciation goes in [square brackets]: [pronunciation guide]
- Complete example: **${helloExample}** [pronunciation] means "${helloNative}"
- Output ONLY plain text with markdown - nothing else
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

${hasConjugation && conjugationPersons.length >= 6
  ? `VERB RULE: Show ALL ${conjugationCount} conjugations (${conjugationPersons.join(', ')})`
  : `VERB RULE: Show the base form and any key variations for this language`}

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
  // Set SSE and CORS headers (handles OPTIONS preflight)
  if (setStreamingCorsHeaders(req, res)) {
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

    const { prompt, mode = 'ask', userLog = [], messages = [] } = body;

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    const { targetLanguage, nativeLanguage } = extractLanguages(body);

    if (!prompt) {
      res.write(`data: ${JSON.stringify({ error: 'No prompt provided' })}\n\n`);
      return res.end();
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(mode, userLog, targetLanguage, nativeLanguage);

    // Build multi-turn conversation contents
    const contents: any[] = [];

    // Add conversation history (last 50 messages for context)
    if (messages && Array.isArray(messages) && messages.length > 0) {
      messages.slice(-50).forEach((msg: any) => {
        if (msg.content) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Add current user message
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Use streaming
    const result = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction
      }
    });

    let fullText = '';
    let buffer = ''; // Buffer to handle patterns spanning chunks

    // Stream chunks to client
    for await (const chunk of result) {
      const text = chunk.text || '';
      if (text) {
        // Accumulate raw text
        fullText += text;
        buffer += text;

        // Only send when we have enough text to safely sanitize
        // Keep last 50 chars in buffer to catch cross-chunk patterns
        if (buffer.length > 50) {
          const toSend = buffer.slice(0, -50);
          const cleanText = sanitizeOutput(toSend);
          buffer = buffer.slice(-50);
          if (cleanText) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: cleanText })}\n\n`);
          }
        }
      }
    }

    // Send remaining buffer
    if (buffer) {
      const cleanText = sanitizeOutput(buffer);
      if (cleanText) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: cleanText })}\n\n`);
      }
    }

    // Send completion event with full sanitized text
    res.write(`data: ${JSON.stringify({ type: 'done', fullText: sanitizeOutput(fullText) })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('[chat-stream] Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
    res.end();
  }
}
