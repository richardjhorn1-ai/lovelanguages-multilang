/**
 * Shared validation utilities for answer checking.
 * Used by submit-challenge.ts, submit-level-test.ts, and validate-answer.ts
 */

import { GoogleGenAI, Type } from "@google/genai";

// Batch validation result
export interface ValidationResult {
  index: number;
  accepted: boolean;
  explanation: string;
}

// Answer to validate
export interface AnswerToValidate {
  userAnswer: string;
  correctAnswer: string;
  polishWord?: string;
}

/**
 * Fast local matching - no API call needed.
 * Normalizes both strings (lowercase, trim, remove diacritics) and compares.
 */
export function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  return normalize(userAnswer) === normalize(correctAnswer);
}

/**
 * BATCH smart validation - validates ALL answers in ONE Gemini call.
 *
 * Strategy:
 * 1. Try free local matching first (handles 60-80% of cases)
 * 2. Batch remaining answers in ONE Gemini API call
 * 3. Map results back to original indices
 *
 * @param answers - Array of answers to validate
 * @param apiKey - Gemini API key (optional - falls back to strict mode if missing)
 * @returns Array of validation results with original indices
 */
export async function batchSmartValidate(
  answers: AnswerToValidate[],
  apiKey?: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const needsAiValidation: Array<{ index: number } & AnswerToValidate> = [];

  // Step 1: Try fast local match first for ALL answers (free, instant)
  answers.forEach((answer, index) => {
    if (fastMatch(answer.userAnswer, answer.correctAnswer)) {
      results.push({ index, accepted: true, explanation: 'Exact match' });
    } else {
      needsAiValidation.push({ index, ...answer });
    }
  });

  // If all matched locally, we're done - no AI call needed!
  if (needsAiValidation.length === 0) {
    return results;
  }

  // Step 2: Batch validate remaining answers with ONE Gemini call
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    // No API key - reject all remaining (strict mode)
    needsAiValidation.forEach(item => {
      results.push({ index: item.index, accepted: false, explanation: 'No match (strict mode)' });
    });
    return results;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Build batch prompt with all answers that need validation
    const answersText = needsAiValidation.map((item, i) =>
      `${i + 1}. Expected: "${item.correctAnswer}" | User typed: "${item.userAnswer}"${item.polishWord ? ` | Polish: "${item.polishWord}"` : ''}`
    ).join('\n');

    const prompt = `You are validating answers for a Polish language learning app.

Validate these ${needsAiValidation.length} answers:

${answersText}

For EACH answer, ACCEPT if ANY apply:
- Exact match (ignoring case)
- Missing Polish diacritics (dzis=dziś, zolw=żółw, cie=cię)
- Valid synonym (pretty=beautiful, hi=hello)
- Article variation (the dog=dog)
- Minor typo (1-2 chars off)
- Alternate valid translation

REJECT if:
- Completely different meaning
- Wrong language
- Major spelling error (3+ chars wrong)

Return a JSON array with ${needsAiValidation.length} results in order.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              accepted: { type: Type.BOOLEAN, description: "true if answer should be accepted" },
              explanation: { type: Type.STRING, description: "Brief explanation" }
            },
            required: ["accepted", "explanation"]
          }
        }
      }
    });

    const responseText = result.text || '[]';
    const validations = JSON.parse(responseText) as Array<{ accepted: boolean; explanation: string }>;

    // Map AI results back to original indices
    needsAiValidation.forEach((item, i) => {
      const validation = validations[i] || { accepted: false, explanation: 'Validation error' };
      results.push({
        index: item.index,
        accepted: validation.accepted,
        explanation: validation.explanation
      });
    });

  } catch (error) {
    console.error('Batch validation error:', error);
    // Fall back to rejection on error
    needsAiValidation.forEach(item => {
      results.push({ index: item.index, accepted: false, explanation: 'Validation error' });
    });
  }

  return results;
}
