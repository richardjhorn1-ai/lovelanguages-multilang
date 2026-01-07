import { createClient } from '@supabase/supabase-js';
import { batchSmartValidate, ValidationResult } from '../services/validation';

// CORS configuration
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

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
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { challengeId, answers, timeSpentSeconds } = req.body;

    if (!challengeId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('tutor_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.student_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (challenge.status === 'completed') {
      return res.status(400).json({ error: 'Challenge already completed' });
    }

    // Grade the answers using BATCH smart validation (one Gemini call for all answers)
    const wordsData = challenge.words_data || [];

    // Prepare all answers for batch validation
    const validationInputs = answers.map((answer: any) => {
      const word = wordsData.find((w: any) => w.id === answer.wordId || w.word === answer.word);
      return {
        userAnswer: answer.userAnswer || '',
        correctAnswer: word?.translation || '',
        polishWord: word?.word
      };
    });

    // ONE Gemini call for ALL answers (instead of N calls)
    const validationResults = await batchSmartValidate(validationInputs);

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
        .from('scores')
        .select('word_id, success_count, fail_count, correct_streak, learned_at')
        .eq('user_id', auth.userId)
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
          const newSuccessCount = (existing?.success_count || 0) + (answer.isCorrect ? 1 : 0);
          const newFailCount = (existing?.fail_count || 0) + (answer.isCorrect ? 0 : 1);
          const newStreak = answer.isCorrect ? (existing?.correct_streak || 0) + 1 : 0;
          const isLearned = newStreak >= 5;

          return {
            user_id: auth.userId,
            word_id: word.id,
            success_count: newSuccessCount,
            fail_count: newFailCount,
            correct_streak: newStreak,
            learned_at: isLearned && !existing?.learned_at ? now : existing?.learned_at || null,
            last_practiced: now
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      // Step 4: Batch upsert ALL scores in ONE query
      if (scoreUpserts.length > 0) {
        await supabase.from('scores').upsert(scoreUpserts, {
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

    // Update challenge status
    await supabase
      .from('tutor_challenges')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId);

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
    await supabase.from('notifications').insert({
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
    console.error('Submit challenge error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
