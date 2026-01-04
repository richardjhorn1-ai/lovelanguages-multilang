
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { getLevelFromXP, getTierColor } from '../services/level-utils';
import { ICONS } from '../constants';

interface FlashcardGameProps { profile: Profile; }

type PracticeMode = 'flashcards' | 'multiple_choice' | 'type_it';
type TypeItDirection = 'polish_to_english' | 'english_to_polish';

interface TypeItQuestion {
  word: DictionaryEntry;
  direction: TypeItDirection;
}

// Lenient answer matching
function isCorrectAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  return normalize(userAnswer) === normalize(correctAnswer);
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Practice mode
  const [mode, setMode] = useState<PracticeMode>('flashcards');
  const [finished, setFinished] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, incorrect: 0 });

  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);

  // Multiple choice state
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [mcShowFeedback, setMcShowFeedback] = useState(false);

  // Type It state
  const [typeItQuestions, setTypeItQuestions] = useState<TypeItQuestion[]>([]);
  const [typeItAnswer, setTypeItAnswer] = useState('');
  const [typeItSubmitted, setTypeItSubmitted] = useState(false);
  const [typeItCorrect, setTypeItCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Level styling
  const levelInfo = getLevelFromXP(profile.xp || 0);
  const tierColor = getTierColor(levelInfo.tier);

  useEffect(() => {
    fetchData();
  }, [profile]);

  // Generate MC options when mode/index changes
  useEffect(() => {
    if (mode === 'multiple_choice' && deck.length >= 4 && currentIndex < deck.length) {
      generateMcOptions();
    }
  }, [mode, currentIndex, deck]);

  // Generate Type It questions when mode changes
  useEffect(() => {
    if (mode === 'type_it' && deck.length > 0) {
      generateTypeItQuestions();
    }
  }, [mode, deck]);

  const fetchData = async () => {
    setLoading(true);
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id)
      ? profile.linked_user_id
      : profile.id;

    const { data: dictData } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId);

    if (dictData) setDeck(shuffleArray(dictData));

    const { data: scoreData } = await supabase
      .from('scores')
      .select('*, dictionary:word_id(word, translation)')
      .eq('user_id', targetUserId);

    if (scoreData) setScores(scoreData);
    setLoading(false);
  };

  const generateMcOptions = () => {
    const currentWord = deck[currentIndex];
    const wrongOptions = deck
      .filter(w => w.id !== currentWord.id)
      .map(w => w.translation);

    const shuffledWrong = shuffleArray(wrongOptions).slice(0, 3);
    const allOptions = shuffleArray([currentWord.translation, ...shuffledWrong]);
    setMcOptions(allOptions);
    setMcSelected(null);
    setMcShowFeedback(false);
  };

  const generateTypeItQuestions = () => {
    const questions: TypeItQuestion[] = deck.map(word => ({
      word,
      direction: Math.random() > 0.5 ? 'polish_to_english' : 'english_to_polish'
    }));
    setTypeItQuestions(shuffleArray(questions));
    setCurrentIndex(0);
    resetTypeItState();
  };

  const resetTypeItState = () => {
    setTypeItAnswer('');
    setTypeItSubmitted(false);
    setTypeItCorrect(false);
    setShowHint(false);
  };

  const handleModeChange = (newMode: PracticeMode) => {
    setMode(newMode);
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setIsFlipped(false);
    setMcSelected(null);
    setMcShowFeedback(false);
    resetTypeItState();

    // Reshuffle deck
    setDeck(shuffleArray([...deck]));
  };

  const handleFlashcardResponse = async (isCorrect: boolean) => {
    const wordId = deck[currentIndex].id;

    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    await supabase.from('scores').upsert({
      user_id: profile.id,
      word_id: wordId,
      success_count: isCorrect ? 1 : 0,
      fail_count: isCorrect ? 0 : 1,
      last_practiced: new Date().toISOString()
    }, { onConflict: 'user_id,word_id' });

    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 300);
    } else {
      setFinished(true);
    }
  };

  const handleMcSelect = async (option: string) => {
    if (mcShowFeedback) return;

    setMcSelected(option);
    setMcShowFeedback(true);

    const currentWord = deck[currentIndex];
    const isCorrect = option === currentWord.translation;

    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    await supabase.from('scores').upsert({
      user_id: profile.id,
      word_id: currentWord.id,
      success_count: isCorrect ? 1 : 0,
      fail_count: isCorrect ? 0 : 1,
      last_practiced: new Date().toISOString()
    }, { onConflict: 'user_id,word_id' });

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        setFinished(true);
      }
    }, isCorrect ? 800 : 1500);
  };

  const handleTypeItSubmit = async () => {
    if (typeItSubmitted) {
      // Move to next question
      if (currentIndex < typeItQuestions.length - 1) {
        setCurrentIndex(c => c + 1);
        resetTypeItState();
      } else {
        setFinished(true);
      }
      return;
    }

    const question = typeItQuestions[currentIndex];
    const correctAnswer = question.direction === 'polish_to_english'
      ? question.word.translation
      : question.word.word;

    const isCorrect = isCorrectAnswer(typeItAnswer, correctAnswer);

    setTypeItSubmitted(true);
    setTypeItCorrect(isCorrect);

    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    await supabase.from('scores').upsert({
      user_id: profile.id,
      word_id: question.word.id,
      success_count: isCorrect ? 1 : 0,
      fail_count: isCorrect ? 0 : 1,
      last_practiced: new Date().toISOString()
    }, { onConflict: 'user_id,word_id' });
  };

  const getHint = () => {
    const question = typeItQuestions[currentIndex];
    const answer = question.direction === 'polish_to_english'
      ? question.word.translation
      : question.word.word;
    return answer.charAt(0) + '...';
  };

  const restartSession = () => {
    setDeck(shuffleArray([...deck]));
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setIsFlipped(false);
    resetTypeItState();
    if (mode === 'type_it') {
      generateTypeItQuestions();
    }
  };

  // Loading state
  if (loading) return (
    <div className="h-full flex items-center justify-center font-bold text-rose-400 animate-pulse">
      Loading practice module...
    </div>
  );

  // Tutor dashboard view
  if (profile.role === 'tutor') {
    return (
      <div className="h-full overflow-y-auto p-6 bg-[#fdfcfd]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-3xl font-bold font-header mb-2 text-gray-800">Learning Dashboard</h2>
            <p className="text-gray-500 font-medium">
              {profile.linked_user_id ? "Monitoring your partner's Polish mastery." : "Testing tutor view with your own collection."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-center">
                <div className="text-3xl font-black text-rose-600 mb-1">{deck.length}</div>
                <div className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">Total Vocabulary</div>
              </div>
              <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100 text-center">
                <div className="text-3xl font-black text-teal-600 mb-1">
                  {scores.filter(s => s.success_count > s.fail_count).length}
                </div>
                <div className="text-[10px] uppercase font-bold text-teal-400 tracking-widest">Mastered</div>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-center">
                <div className="text-3xl font-black text-amber-600 mb-1">
                  {scores.filter(s => s.fail_count > 0).length}
                </div>
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">Needs Review</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">Critical Weak Spots</h3>
            <div className="space-y-4">
              {scores.filter(s => s.fail_count > 0).length === 0 ? (
                <p className="text-gray-400 text-center py-10 italic font-medium">Acing everything!</p>
              ) : (
                scores.filter(s => s.fail_count > 0).sort((a,b) => b.fail_count - a.fail_count).slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-black text-gray-800">{s.dictionary.word}</p>
                      <p className="text-xs text-gray-400 italic font-medium">{s.dictionary.translation}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500 font-black text-sm">{s.fail_count} Misses</div>
                      <div className="text-[9px] uppercase font-bold text-gray-300">Action required</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (deck.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-6">
        <ICONS.Book className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-4">No Words Yet</h2>
      <p className="text-gray-500 font-medium">Learn some words in Chat first, then come back to practice!</p>
    </div>
  );

  // Not enough words for multiple choice
  if (mode === 'multiple_choice' && deck.length < 4) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-400 mb-6">
          <ICONS.Star className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-4">Need More Words</h2>
        <p className="text-gray-500 font-medium mb-6">Multiple choice requires at least 4 words. You have {deck.length}.</p>
        <button
          onClick={() => handleModeChange('flashcards')}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{ backgroundColor: tierColor }}
        >
          Try Flashcards Instead
        </button>
      </div>
    );
  }

  // Finished state
  if (finished) return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fdfcfd]">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-gray-100">
        <h2 className="text-3xl font-black text-gray-800 mb-2">Great Job!</h2>
        <div className="text-6xl my-8">
          {sessionScore.correct >= sessionScore.incorrect ? '🏆' : '💪'}
        </div>
        <p className="text-gray-500 font-medium mb-1">Session results:</p>
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-black text-green-500">{sessionScore.correct}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-red-400">{sessionScore.incorrect}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Missed</div>
          </div>
        </div>
        <div className="text-2xl font-black mb-8" style={{ color: tierColor }}>
          {Math.round((sessionScore.correct / (sessionScore.correct + sessionScore.incorrect)) * 100)}%
        </div>
        <button
          onClick={restartSession}
          className="w-full text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest text-sm"
          style={{ backgroundColor: tierColor }}
        >
          Practice Again
        </button>
      </div>
    </div>
  );

  // Current items based on mode
  const currentDeckLength = mode === 'type_it' ? typeItQuestions.length : deck.length;
  const progress = ((currentIndex + 1) / currentDeckLength) * 100;

  return (
    <div className="h-full flex flex-col p-6 bg-[#fcf9f9]">
      {/* Header: Tabs + Stats */}
      <div className="w-full max-w-md mx-auto mb-6">
        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-4">
          {[
            { id: 'flashcards' as PracticeMode, label: 'Flashcards', icon: ICONS.Book },
            { id: 'multiple_choice' as PracticeMode, label: 'Multiple Choice', icon: ICONS.Check },
            { id: 'type_it' as PracticeMode, label: 'Type It', icon: ICONS.Pencil },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === tab.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={mode === tab.id ? { backgroundColor: tierColor } : {}}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Session Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-gray-600">{sessionScore.correct}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-bold text-gray-600">{sessionScore.incorrect}</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {currentIndex + 1} / {currentDeckLength}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: tierColor }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">

          {/* Flashcards Mode */}
          {mode === 'flashcards' && (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full aspect-[4/5] cursor-pointer perspective-1000 group"
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden">
                  <span className="text-[10px] uppercase tracking-widest text-gray-300 font-black mb-8">POLISH WORD</span>
                  <h3 className="text-4xl font-black text-gray-800">{deck[currentIndex].word}</h3>
                  <p className="mt-12 text-gray-400 text-[10px] uppercase font-black tracking-widest animate-pulse">Tap to reveal</p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180"
                  style={{ backgroundColor: tierColor }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">TRANSLATION</span>
                  <h3 className="text-4xl font-black">{deck[currentIndex].translation}</h3>
                  <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(false); }}
                      className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-xs font-black uppercase tracking-widest transition-colors"
                    >
                      <ICONS.X className="w-4 h-4" /> Hard
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(true); }}
                      className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95"
                      style={{ color: tierColor }}
                    >
                      <ICONS.Check className="w-4 h-4" /> Got it!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Choice Mode */}
          {mode === 'multiple_choice' && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
                style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
              >
                Polish → English
              </span>

              <h3 className="text-3xl font-black text-gray-800 mb-8 text-center">
                {deck[currentIndex].word}
              </h3>

              <div className="space-y-3">
                {mcOptions.map((option, idx) => {
                  const isCorrect = option === deck[currentIndex].translation;
                  const isSelected = mcSelected === option;

                  let buttonStyle = 'border-gray-100 hover:border-gray-200 text-gray-700';
                  if (mcShowFeedback) {
                    if (isCorrect) {
                      buttonStyle = 'border-green-400 bg-green-50 text-green-700';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'border-red-400 bg-red-50 text-red-700';
                    } else {
                      buttonStyle = 'border-gray-100 text-gray-400';
                    }
                  } else if (isSelected) {
                    buttonStyle = 'border-gray-300 bg-gray-50 text-gray-700';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMcSelect(option)}
                      disabled={mcShowFeedback}
                      className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${buttonStyle}`}
                    >
                      <span className="text-xs font-bold text-gray-400 mr-3">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                      {mcShowFeedback && isCorrect && (
                        <ICONS.Check className="w-5 h-5 float-right text-green-500" />
                      )}
                      {mcShowFeedback && isSelected && !isCorrect && (
                        <ICONS.X className="w-5 h-5 float-right text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Type It Mode */}
          {mode === 'type_it' && typeItQuestions.length > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100">
              {(() => {
                const question = typeItQuestions[currentIndex];
                const isPolishToEnglish = question.direction === 'polish_to_english';
                const prompt = isPolishToEnglish ? question.word.word : question.word.translation;
                const correctAnswer = isPolishToEnglish ? question.word.translation : question.word.word;

                return (
                  <>
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
                      style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                    >
                      {isPolishToEnglish ? 'Polish → English' : 'English → Polish'}
                    </span>

                    <h3 className="text-3xl font-black text-gray-800 mb-2 text-center">
                      {prompt}
                    </h3>

                    {showHint && !typeItSubmitted && (
                      <p className="text-center text-gray-400 text-sm mb-4">
                        Hint: {getHint()}
                      </p>
                    )}

                    {typeItSubmitted && (
                      <div className={`text-center mb-4 p-3 rounded-xl ${
                        typeItCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {typeItCorrect ? (
                          <div className="flex items-center justify-center gap-2">
                            <ICONS.Check className="w-5 h-5" />
                            <span className="font-bold">Correct!</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <ICONS.X className="w-5 h-5" />
                              <span className="font-bold">Not quite</span>
                            </div>
                            <p className="text-sm">
                              Correct answer: <span className="font-black">{correctAnswer}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6">
                      <input
                        type="text"
                        value={typeItAnswer}
                        onChange={(e) => setTypeItAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTypeItSubmit()}
                        placeholder={isPolishToEnglish ? 'Type in English...' : 'Type in Polish...'}
                        disabled={typeItSubmitted}
                        className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-gray-300 focus:outline-none text-lg font-medium text-center"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      {!typeItSubmitted && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 text-sm"
                          disabled={showHint}
                        >
                          {showHint ? 'Hint shown' : 'Show hint'}
                        </button>
                      )}
                      <button
                        onClick={handleTypeItSubmit}
                        disabled={!typeItAnswer.trim() && !typeItSubmitted}
                        className="flex-1 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest disabled:opacity-50 transition-all"
                        style={{ backgroundColor: tierColor }}
                      >
                        {typeItSubmitted ? 'Next' : 'Check'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

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
};

export default FlashcardGame;
