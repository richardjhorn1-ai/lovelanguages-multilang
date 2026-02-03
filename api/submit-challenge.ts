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
import { getProfileLanguages } from '../utils/language-helpers.js';
import { buildAnswerValidationPrompt } from '../utils/prompt-templates.js';
import { buildBatchValidationSchema } from '../utils/schema-builders.js';

// ============================================================================
// INLINE VALIDATION (Vercel serverless can't import from ../services/)
// ============================================================================

interface ValidationResult {
  index: number;
  accepted: boolean;
  explanation: string;
}

interface AnswerToValidate {
  userAnswer: string;
  correctAnswer: string;
  targetWord?: string;
}

function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}

async function batchSmartValidate(
  answers: AnswerToValidate[],
  targetLanguage: string,
  nativeLanguage: string,
  apiKey?: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const needsAiValidation: Array<{ index: number } & AnswerToValidate> = [];

  answers.forEach((answer, index) => {
    if (fastMatch(answer.userAnswer, answer.correctAnswer)) {
      results.push({ index, accepted: true, explanation: 'Exact match' });
    } else {
      needsAiValidation.push({ index, ...answer });
    }
  });

  if (needsAiValidation.length === 0) {
    return results;
  }

  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    needsAiValidation.forEach(item => {
      results.push({ index: item.index, accepted: false, explanation: 'No match (strict mode)' });
    });
    return results;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const answersText = needsAiValidation.map((item, i) =>
      `${i + 1}. Expected: "${item.correctAnswer}" | User typed: "${item.userAnswer}"${item.targetWord ? ` | Target word: "${item.targetWord}"` : ''}`
    ).join('\n');

    const basePrompt = buildAnswerValidationPrompt(targetLanguage, nativeLanguage);
    const prompt = `${basePrompt}

## ANSWERS TO VALIDATE (${needsAiValidation.length} total)

${answersText}

Return validation results for each answer.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: buildBatchValidationSchema()
      }
    });

    const responseText = result.text || '[]';
    const validations = JSON.parse(responseText) as Array<{ accepted: boolean; explanation: string }>;

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
    needsAiValidation.forEach(item => {
      results.push({ index: item.index, accepted: false, explanation: 'Validation error' });
    });
  }

  return results;
}

// ============================================================================

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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'submitChallenge', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const { challengeId, answers, timeSpentSeconds } = req.body;

    if (!challengeId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate answers array
    if (!Array.isArray(answers) || answers.length === 0 || answers.length > 100) {
      return res.status(400).json({ error: 'Invalid answers: must be array with 1-100 items' });
    }

    // Get the challenge and atomically mark as in-progress to prevent race conditions
    // First, try to claim the challenge by updating status from 'pending' to 'in_progress'
    const { data: challenge, error: challengeError } = await supabase
      .from('tutor_challenges')
      .update({ status: 'in_progress' })
      .eq('id', challengeId)
      .eq('status', 'pending')  // Only update if still pending (prevents double submission)
      .select('*')
      .single();

    if (challengeError || !challenge) {
      // Could be not found OR already completed/in-progress
      // Check which case it is
      const { data: existingChallenge } = await supabase
        .from('tutor_challenges')
        .select('status, student_id')
        .eq('id', challengeId)
        .single();

      if (!existingChallenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }
      if (existingChallenge.student_id !== auth.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (existingChallenge.status === 'completed' || existingChallenge.status === 'in_progress') {
        return res.status(400).json({ error: 'Challenge already completed or in progress' });
      }
      return res.status(500).json({ error: 'Failed to start challenge' });
    }

    if (challenge.student_id !== auth.userId) {
      // Revert the status change since this user shouldn't have access
      await supabase.from('tutor_challenges').update({ status: 'pending' }).eq('id', challengeId);
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get language settings: use challenge's target language, student's native language
    const targetLanguage = challenge.language_code || 'pl';
    const studentLangs = await getProfileLanguages(supabase, auth.userId);
    const nativeLanguage = studentLangs.nativeLanguage;

    // Grade the answers using BATCH smart validation (one Gemini call for all answers)
    const wordsData = challenge.words_data || [];

    // Prepare all answers for batch validation
    const validationInputs = answers.map((answer: any) => {
      const word = wordsData.find((w: any) => w.id === answer.wordId || w.word === answer.word);
      return {
        userAnswer: answer.userAnswer || '',
        correctAnswer: word?.translation || '',
        targetWord: word?.word
      };
    });

    // ONE Gemini call for ALL answers (instead of N calls)
    const validationResults = await batchSmartValidate(
      validationInputs,
      targetLanguage,
      nativeLanguage
    );

    // Build a map of results by index for easy lookup
    const resultMap = new Map<number, ValidationResult>();
    validationResults.forEach(r => resultMap.set(r.index, r));

    // Process results and calculate scores
    let correctCount = 0;
    let streak = 0;
    let bonusXp = 0;
    const gradedAnswers: any[] = [];

    answers.forEach((answer: any, index: number) => {
      const word = wordsData.find((w: any) => w.id === answer.wordId || w.word === answer.word);
      const validation = resultMap.get(index) || { accepted: false, explanation: 'Not validated' };

      const isCorrect = validation.accepted;
      if (isCorrect) {
        correctCount++;
        streak++;
        // Streak bonus: +1 XP for 3+ streak
        if (streak >= 3) bonusXp++;
      } else {
        streak = 0;
      }

      gradedAnswers.push({
        ...answer,
        isCorrect,
        explanation: validation.explanation,
        correctAnswer: word?.translation || 'unknown'
      });
    });

    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Calculate XP: 1 per correct + streak bonuses + perfect bonus
    let xpEarned = correctCount + bonusXp;
    if (correctCount === totalQuestions && totalQuestions >= 5) {
      xpEarned += 5; // Perfect score bonus
    }

    // Quick Fire time bonus
    if (challenge.challenge_type === 'quickfire' && timeSpentSeconds) {
      const config = challenge.config as any;
      const timeLimit = config.timeLimitSeconds || 60;
      const percentTimeUsed = timeSpentSeconds / timeLimit;
      if (percentTimeUsed < 0.5) xpEarned += 3;
      else if (percentTimeUsed < 0.75) xpEarned += 2;
      else if (percentTimeUsed < 0.9) xpEarned += 1;
    }

    // Update word scores in scores table - BATCH operation (not N+1)
    // Step 1: Collect all word IDs that need score updates
    const wordIdsToUpdate = gradedAnswers
      .map(answer => {
        const word = wordsData.find((w: any) => w.id === answer.wordId || w.word === answer.word);
        return word?.id;
      })
      .filter((id): id is string => !!id);

    if (wordIdsToUpdate.length > 0) {
      // Step 2: Fetch ALL existing scores in ONE query
      const { data: existingScores } = await supabase
        .from('word_scores')
        .select('word_id, correct_streak, total_attempts, correct_attempts, learned_at, language_code')
        .eq('user_id', auth.userId)
        .eq('language_code', targetLanguage)
        .in('word_id', wordIdsToUpdate);

      // Build a map for quick lookup
      const scoreMap = new Map<string, any>();
      (existingScores || []).forEach(s => scoreMap.set(s.word_id, s));

      // Step 3: Compute all updates locally
      const now = new Date().toISOString();
      const scoreUpserts = gradedAnswers
        .map(answer => {
          const word = wordsData.find((w: any) => w.id === answer.wordId || w.word === answer.word);
          if (!word?.id) return null;

          const existing = scoreMap.get(word.id);
          const newTotalAttempts = (existing?.total_attempts || 0) + 1;
          const newCorrectAttempts = (existing?.correct_attempts || 0) + (answer.isCorrect ? 1 : 0);
          const newStreak = answer.isCorrect ? (existing?.correct_streak || 0) + 1 : 0;
          const isLearned = newStreak >= 5;

          return {
            user_id: auth.userId,
            word_id: word.id,
            language_code: targetLanguage,
            total_attempts: newTotalAttempts,
            correct_attempts: newCorrectAttempts,
            correct_streak: newStreak,
            learned_at: isLearned && !existing?.learned_at ? now : existing?.learned_at || null,
            updated_at: now
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      // Step 4: Batch upsert ALL scores in ONE query
      if (scoreUpserts.length > 0) {
        await supabase.from('word_scores').upsert(scoreUpserts, {
          onConflict: 'user_id,word_id'
        });
      }
    }

    // Create challenge result
    const { data: result, error: resultError } = await supabase
      .from('challenge_results')
      .insert({
        challenge_id: challengeId,
        student_id: auth.userId,
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        time_spent_seconds: timeSpentSeconds || null,
        answers: gradedAnswers,
        xp_earned: xpEarned
      })
      .select()
      .single();

    if (resultError) {
      console.error('Error creating result:', resultError);
      return res.status(500).json({ error: 'Failed to save result' });
    }

    // Update challenge status to completed (was set to 'in_progress' at start to prevent race condition)
    await supabase
      .from('tutor_challenges')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .eq('status', 'in_progress');  // Only complete if we're the one processing it

    // Award XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, full_name')
      .eq('id', auth.userId)
      .single();

    const newXp = (profile?.xp || 0) + xpEarned;
    await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', auth.userId);

    // Notify tutor of completion
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: challenge.tutor_id,
      type: 'challenge_complete',
      title: `${profile?.full_name || 'Your partner'} completed your challenge!`,
      message: `Score: ${score}% (${correctCount}/${totalQuestions})`,
      data: {
        challenge_id: challengeId,
        result_id: result.id,
        score,
        correct_answers: correctCount,
        total_questions: totalQuestions
      }
    });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request, notification is non-critical
    }

    // Award Tutor XP for partner completing challenge
    try {
      // Award base XP for completion
      const tutorXpActions: string[] = ['partner_completes_challenge'];

      // Bonus for high scores
      if (score >= 80 && score < 100) {
        tutorXpActions.push('partner_scores_80_plus');
      } else if (score === 100) {
        tutorXpActions.push('partner_scores_100');
      }

      // Award XP for each action
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`;
      for (const action of tutorXpActions) {
        await fetch(`${baseUrl}/api/tutor-award-xp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || '',
          },
          body: JSON.stringify({
            action,
            targetUserId: challenge.tutor_id,
          }),
        });
      }
    } catch (tutorXpError) {
      // Don't fail the main request if tutor XP fails
      console.error('[submit-challenge] Failed to award tutor XP:', tutorXpError);
    }

    // Add to activity feed
    await supabase.from('activity_feed').insert({
      user_id: auth.userId,
      partner_id: challenge.tutor_id,
      event_type: 'challenge_completed',
      title: `Completed a ${challenge.challenge_type} challenge`,
      subtitle: `Score: ${score}%`,
      data: { challenge_id: challengeId, score, xp_earned: xpEarned },
      language_code: targetLanguage,
    });

    // Increment usage counter
    incrementUsage(supabase, auth.userId, RATE_LIMITS.submitChallenge.type);

    return res.status(200).json({
      success: true,
      result: {
        ...result,
        xpEarned,
        newTotalXp: newXp
      },
      gradedAnswers
    });

  } catch (error: any) {
    console.error('[submit-challenge] Error:', error);
    return res.status(500).json({ error: 'Failed to submit challenge. Please try again.' });
  }
}
