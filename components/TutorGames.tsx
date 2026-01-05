import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, TutorChallenge, WordRequest, DictionaryEntry, WordScore } from '../types';
import { ICONS } from '../constants';
import { shuffleArray } from '../utils/array';
import CreateQuizChallenge from './CreateQuizChallenge';
import CreateQuickFireChallenge from './CreateQuickFireChallenge';
import WordRequestCreator from './WordRequestCreator';

interface TutorGamesProps {
  profile: Profile;
}

type PlayMode = 'send' | 'local';

const TutorGames: React.FC<TutorGamesProps> = ({ profile }) => {
  const [challenges, setChallenges] = useState<TutorChallenge[]>([]);
  const [wordRequests, setWordRequests] = useState<WordRequest[]>([]);
  const [partnerVocab, setPartnerVocab] = useState<DictionaryEntry[]>([]);
  const [partnerScores, setPartnerScores] = useState<Map<string, WordScore>>(new Map());
  const [partnerName, setPartnerName] = useState<string>('Your Partner');
  const [loading, setLoading] = useState(true);

  // Play mode
  const [playMode, setPlayMode] = useState<PlayMode>('send');

  // Modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuickFireModal, setShowQuickFireModal] = useState(false);
  const [showWordRequestModal, setShowWordRequestModal] = useState(false);

  // Local game states
  const [localGameActive, setLocalGameActive] = useState<'quiz' | 'quickfire' | null>(null);
  const [localGameWords, setLocalGameWords] = useState<DictionaryEntry[]>([]);
  const [localGameIndex, setLocalGameIndex] = useState(0);
  const [localGameScore, setLocalGameScore] = useState({ correct: 0, incorrect: 0 });
  const [localGameFlipped, setLocalGameFlipped] = useState(false);
  const [localQuickFireTimeLeft, setLocalQuickFireTimeLeft] = useState(60);
  const [localQuickFireInput, setLocalQuickFireInput] = useState('');
  const [localQuickFireStarted, setLocalQuickFireStarted] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get partner's name
      if (profile.linked_user_id) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.linked_user_id)
          .single();
        if (partnerProfile) setPartnerName(partnerProfile.full_name);

        // Get partner's vocabulary for game creation
        const { data: vocab } = await supabase
          .from('dictionary')
          .select('*')
          .eq('user_id', profile.linked_user_id)
          .order('unlocked_at', { ascending: false });
        if (vocab) setPartnerVocab(vocab);

        // Get partner's scores for smart word selection
        const { data: scores } = await supabase
          .from('scores')
          .select('*')
          .eq('user_id', profile.linked_user_id);
        if (scores) {
          const map = new Map<string, WordScore>();
          scores.forEach((s: any) => map.set(s.word_id, s));
          setPartnerScores(map);
        }
      }

      // Fetch challenges
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const challengeRes = await fetch('/api/get-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'tutor' })
      });
      const challengeData = await challengeRes.json();
      if (challengeData.challenges) setChallenges(challengeData.challenges);

      // Fetch word requests
      const requestRes = await fetch('/api/get-word-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'tutor' })
      });
      const requestData = await requestRes.json();
      if (requestData.wordRequests) setWordRequests(requestData.wordRequests);

    } catch (error) {
      console.error('Error fetching tutor game data:', error);
    }
    setLoading(false);
  };

  const handleChallengeCreated = () => {
    fetchData();
    setShowQuizModal(false);
    setShowQuickFireModal(false);
  };

  const handleWordRequestCreated = () => {
    fetchData();
    setShowWordRequestModal(false);
  };

  const startLocalQuiz = () => {
    // Pick 10 random words, prioritizing weak ones
    const weakWords = partnerVocab.filter(w => {
      const score = partnerScores.get(w.id);
      return score && (score.fail_count > 0 || (score.correct_streak || 0) < 3);
    });
    const otherWords = partnerVocab.filter(w => !weakWords.includes(w));
    const selectedWords = [...shuffleArray(weakWords).slice(0, 5), ...shuffleArray(otherWords).slice(0, 5)];
    setLocalGameWords(shuffleArray(selectedWords).slice(0, 10));
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalGameFlipped(false);
    setLocalGameActive('quiz');
  };

  const startLocalQuickFire = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 20);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalQuickFireTimeLeft(60);
    setLocalQuickFireInput('');
    setLocalQuickFireStarted(false);
    setLocalGameActive('quickfire');
  };

  const handleLocalQuizResponse = (correct: boolean) => {
    setLocalGameScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }));
    setLocalGameFlipped(false);
    if (localGameIndex < localGameWords.length - 1) {
      setTimeout(() => setLocalGameIndex(prev => prev + 1), 300);
    } else {
      // Game over - keep showing results
    }
  };

  const handleLocalQuickFireAnswer = () => {
    if (!localQuickFireInput.trim()) return;
    const currentWord = localGameWords[localGameIndex];
    const isCorrect = localQuickFireInput.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();

    setLocalGameScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    setLocalQuickFireInput('');

    if (localGameIndex < localGameWords.length - 1) {
      setLocalGameIndex(prev => prev + 1);
    }
  };

  const resetLocalGame = () => {
    setLocalGameActive(null);
    setLocalGameWords([]);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalGameFlipped(false);
    setLocalQuickFireStarted(false);
  };

  // QuickFire timer effect
  React.useEffect(() => {
    if (localGameActive === 'quickfire' && localQuickFireStarted && localQuickFireTimeLeft > 0) {
      const timer = setTimeout(() => setLocalQuickFireTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [localGameActive, localQuickFireStarted, localQuickFireTimeLeft]);

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  const pendingRequests = wordRequests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  // Local game is active - render game UI
  if (localGameActive) {
    const currentWord = localGameWords[localGameIndex];
    const isGameOver = localGameIndex >= localGameWords.length - 1 && (localGameScore.correct + localGameScore.incorrect) === localGameWords.length;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0;

    // Game Over Screen
    if (isGameOver || quickFireTimeUp) {
      const total = localGameScore.correct + localGameScore.incorrect;
      const percentage = total > 0 ? Math.round((localGameScore.correct / total) * 100) : 0;

      return (
        <div className="h-full flex items-center justify-center p-4 bg-[var(--bg-primary)]">
          <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full">
            <div className="text-6xl mb-4">{percentage >= 70 ? '🎉' : '💪'}</div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
              {percentage >= 70 ? 'Great Job!' : 'Keep Practicing!'}
            </h2>
            <div className="text-5xl font-black text-[var(--accent-color)] mb-4">{percentage}%</div>
            <p className="text-[var(--text-secondary)] mb-6">
              {localGameScore.correct} of {total} correct
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetLocalGame}
                className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              >
                Done
              </button>
              <button
                onClick={() => localGameActive === 'quiz' ? startLocalQuiz() : startLocalQuickFire()}
                className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)]"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Local Quiz Game
    if (localGameActive === 'quiz') {
      return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)]">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={resetLocalGame} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
                <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <span className="text-sm font-bold text-[var(--text-secondary)]">
                {localGameIndex + 1} / {localGameWords.length}
              </span>
              <div className="flex gap-2">
                <span className="text-green-500 font-bold">{localGameScore.correct}</span>
                <span className="text-[var(--text-secondary)]">/</span>
                <span className="text-red-400 font-bold">{localGameScore.incorrect}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 bg-[var(--bg-primary)] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[var(--accent-color)] transition-all"
                style={{ width: `${((localGameIndex + 1) / localGameWords.length) * 100}%` }}
              />
            </div>

            {/* Flashcard */}
            <div
              onClick={() => setLocalGameFlipped(!localGameFlipped)}
              className="relative aspect-[4/5] cursor-pointer perspective-1000"
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${localGameFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 bg-[var(--bg-card)] rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-lg backface-hidden border border-[var(--border-color)]">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-4">Polish</span>
                  <h2 className="text-4xl font-black text-[var(--accent-color)] text-center">{currentWord?.word}</h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-8">Tap to reveal</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-[var(--accent-color)] text-white rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-lg backface-hidden rotate-y-180">
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-4">English</span>
                  <h2 className="text-4xl font-black text-center">{currentWord?.translation}</h2>
                  <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLocalQuizResponse(false); }}
                      className="py-3 bg-[var(--bg-card)]/20 rounded-xl font-bold text-sm hover:bg-[var(--bg-card)]/30"
                    >
                      ❌ Hard
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLocalQuizResponse(true); }}
                      className="py-3 bg-[var(--bg-card)] rounded-xl font-bold text-sm text-[var(--accent-color)]"
                    >
                      ✓ Got it!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            .perspective-1000 { perspective: 1000px; }
            .transform-style-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
          `}</style>
        </div>
      );
    }

    // Local Quick Fire Game
    if (localGameActive === 'quickfire') {
      if (!localQuickFireStarted) {
        return (
          <div className="h-full flex items-center justify-center p-4 bg-[var(--bg-primary)]">
            <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Quick Fire!</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Translate as many words as you can in 60 seconds!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resetLocalGame}
                  className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setLocalQuickFireStarted(true)}
                  className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600"
                >
                  Start!
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)]">
          <div className="max-w-md mx-auto w-full">
            {/* Timer Bar */}
            <div className="h-3 bg-[var(--bg-primary)] rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  localQuickFireTimeLeft > 20 ? 'bg-amber-500' :
                  localQuickFireTimeLeft > 10 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${(localQuickFireTimeLeft / 60) * 100}%` }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold text-[var(--text-secondary)]">
                {localGameIndex + 1} / {localGameWords.length}
              </span>
              <span className={`text-3xl font-black ${localQuickFireTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                {localQuickFireTimeLeft}s
              </span>
            </div>

            {/* Word */}
            <div className="bg-amber-50 p-8 rounded-2xl mb-6 text-center">
              <p className="text-4xl font-black text-amber-600">{currentWord?.word}</p>
            </div>

            {/* Input */}
            <input
              type="text"
              value={localQuickFireInput}
              onChange={e => setLocalQuickFireInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLocalQuickFireAnswer()}
              placeholder="Type the translation..."
              autoFocus
              className="w-full p-4 border-2 border-amber-200 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-amber-400"
            />

            {/* Score */}
            <div className="mt-4 flex justify-center gap-6">
              <span className="text-green-500 font-bold">✓ {localGameScore.correct}</span>
              <span className="text-red-400 font-bold">✗ {localGameScore.incorrect}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header with Mode Toggle */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-3">Play Together</h1>

          {/* Mode Tabs */}
          <div className="inline-flex bg-[var(--bg-primary)] p-1 rounded-xl">
            <button
              onClick={() => setPlayMode('send')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                playMode === 'send'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-color)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Send Challenge
            </button>
            <button
              onClick={() => setPlayMode('local')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                playMode === 'local'
                  ? 'bg-[var(--bg-card)] text-teal-600 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Play Now
            </button>
          </div>

          <p className="text-[var(--text-secondary)] text-xs mt-2">
            {playMode === 'send'
              ? `Send challenges for ${partnerName} to complete later`
              : `Practice together right now`}
          </p>
        </div>

        {/* LOCAL PLAY MODE */}
        {playMode === 'local' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={startLocalQuiz}
              disabled={partnerVocab.length < 4}
              className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[var(--text-primary)] mb-1">Quiz {partnerName}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Flashcard quiz together</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[var(--accent-color)] text-xs font-bold">
                <ICONS.Play className="w-3 h-3" />
                <span>Start Now</span>
              </div>
            </button>

            <button
              onClick={startLocalQuickFire}
              disabled={partnerVocab.length < 4}
              className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[var(--text-primary)] mb-1">Quick Fire</h3>
                  <p className="text-sm text-[var(--text-secondary)]">60 second challenge</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
                <ICONS.Play className="w-3 h-3" />
                <span>Start Now</span>
              </div>
            </button>

            {partnerVocab.length < 4 && (
              <p className="text-xs text-[var(--text-secondary)] text-center col-span-2">
                {partnerName} needs at least 4 words in their vocabulary to play
              </p>
            )}
          </div>
        )}

        {/* SEND MODE - Game Cards */}
        {playMode === 'send' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Do You Remember Quiz */}
          <button
            onClick={() => setShowQuizModal(true)}
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-primary)] mb-1">Do You Remember?</h3>
                <p className="text-sm text-[var(--text-secondary)]">Quiz {partnerName} on their vocabulary</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[var(--accent-color)] text-xs font-bold">
              <span>Create Quiz</span>
              <ICONS.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Quick Fire */}
          <button
            onClick={() => setShowQuickFireModal(true)}
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-primary)] mb-1">Quick Fire</h3>
                <p className="text-sm text-[var(--text-secondary)]">Timed vocabulary challenge</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
              <span>Create Challenge</span>
              <ICONS.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Whisper Game - Coming Soon */}
          <div className="group p-6 bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] shadow-sm opacity-60 cursor-not-allowed text-left">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center text-3xl">
                🎤
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-secondary)] mb-1">Whisper Game</h3>
                <p className="text-sm text-[var(--text-secondary)]">Pronunciation practice</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[var(--text-secondary)] text-xs font-bold">
              <span>Coming Soon</span>
            </div>
          </div>

          {/* Word Gift */}
          <button
            onClick={() => setShowWordRequestModal(true)}
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎁
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-primary)] mb-1">Gift Words</h3>
                <p className="text-sm text-[var(--text-secondary)]">Send words for {partnerName} to learn</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-teal-500 text-xs font-bold">
              <span>Send Gift</span>
              <ICONS.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
        )}

        {/* Pending Challenges Section - Only in send mode */}
        {playMode === 'send' && pendingChallenges.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Clock className="w-4 h-4" />
              Waiting for {partnerName}
            </h3>
            <div className="space-y-3">
              {pendingChallenges.slice(0, 3).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{challenge.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {challenge.words_data?.length || 0} words • Sent {new Date(challenge.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/20 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Word Gifts - Only in send mode */}
        {playMode === 'send' && pendingRequests.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Heart className="w-4 h-4 text-[var(--accent-color)]" />
              Word Gifts Sent
            </h3>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map(request => (
                <div key={request.id} className="flex items-center gap-3 p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                    🎁
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">
                      {request.selected_words?.length || 0} word{(request.selected_words?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {request.request_type === 'ai_topic' ? `Topic: ${request.input_text}` : 'Custom words'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-teal-500 bg-teal-500/20 px-2 py-1 rounded-full">
                    {request.xp_multiplier}x XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results - Only in send mode */}
        {playMode === 'send' && completedChallenges.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Check className="w-4 h-4 text-green-500" />
              Recent Results
            </h3>
            <div className="space-y-3">
              {completedChallenges.slice(0, 5).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{challenge.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Completed {new Date(challenge.completed_at || '').toLocaleDateString()}
                    </p>
                  </div>
                  {(challenge as any).result && (
                    <span className="text-xs font-bold text-green-500 bg-green-500/20 px-2 py-1 rounded-full">
                      {(challenge as any).result.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Only in send mode */}
        {playMode === 'send' && challenges.length === 0 && wordRequests.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <div className="text-6xl mb-4">🎮</div>
            <p className="font-bold">No challenges yet</p>
            <p className="text-sm">Create your first challenge for {partnerName}!</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuizModal && (
        <CreateQuizChallenge
          profile={profile}
          partnerVocab={partnerVocab}
          partnerName={partnerName}
          onClose={() => setShowQuizModal(false)}
          onCreated={handleChallengeCreated}
        />
      )}

      {showQuickFireModal && (
        <CreateQuickFireChallenge
          profile={profile}
          partnerVocab={partnerVocab}
          partnerName={partnerName}
          onClose={() => setShowQuickFireModal(false)}
          onCreated={handleChallengeCreated}
        />
      )}

      {showWordRequestModal && (
        <WordRequestCreator
          profile={profile}
          partnerName={partnerName}
          onClose={() => setShowWordRequestModal(false)}
          onCreated={handleWordRequestCreated}
        />
      )}
    </div>
  );
};

export default TutorGames;
