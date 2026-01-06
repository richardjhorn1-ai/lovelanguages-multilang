import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import { getLevelFromXP, getTierColor } from '../services/level-utils';

interface GameSession {
  id: string;
  game_mode: string;
  correct_count: number;
  incorrect_count: number;
  total_time_seconds: number | null;
  completed_at: string;
  wrong_answer_count: number;
}

interface GameSessionAnswer {
  id: string;
  word_text: string;
  correct_answer: string;
  user_answer: string | null;
  question_type: string;
  is_correct: boolean;
  explanation?: string;
}

interface GameHistoryProps {
  xp: number;
  onPracticeWords?: (words: { word: string; translation: string }[]) => void;
}

const GAME_MODE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  flashcards: { name: 'Flashcards', icon: '🎴', color: 'text-[var(--accent-color)]' },
  multiple_choice: { name: 'Multiple Choice', icon: '🔘', color: 'text-purple-500' },
  type_it: { name: 'Type It', icon: '⌨️', color: 'text-blue-500' },
  quick_fire: { name: 'Quick Fire', icon: '⚡', color: 'text-amber-500' },
  ai_challenge: { name: 'AI Challenge', icon: '🤖', color: 'text-green-500' }
};

const GameHistory: React.FC<GameHistoryProps> = ({ xp, onPracticeWords }) => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, GameSessionAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<string | null>(null);

  const levelInfo = getLevelFromXP(xp);
  const tierColor = getTierColor(levelInfo.tier);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/get-game-history?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
    setLoading(false);
  };

  const fetchSessionAnswers = async (sessionId: string) => {
    if (sessionAnswers[sessionId]) {
      setExpandedSession(expandedSession === sessionId ? null : sessionId);
      return;
    }

    setLoadingAnswers(sessionId);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/get-game-history?sessionId=${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success && data.session) {
        setSessionAnswers(prev => ({
          ...prev,
          [sessionId]: data.session.answers || []
        }));
        setExpandedSession(sessionId);
      }
    } catch (error) {
      console.error('Error fetching session answers:', error);
    }
    setLoadingAnswers(null);
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupSessionsByDate = (sessions: GameSession[]) => {
    const groups: Record<string, GameSession[]> = {};
    sessions.forEach(session => {
      const dateKey = new Date(session.completed_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });
    return groups;
  };

  const handlePracticeWrongWords = (sessionId: string) => {
    const answers = sessionAnswers[sessionId];
    if (!answers || !onPracticeWords) return;

    const wrongWords = answers
      .filter(a => !a.is_correct)
      .map(a => ({
        word: a.word_text,
        translation: a.correct_answer
      }));

    if (wrongWords.length > 0) {
      onPracticeWords(wrongWords);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-[var(--text-secondary)] font-medium">No game history yet</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Play some games to see your progress here!</p>
      </div>
    );
  }

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSessions).map(([dateKey, dateSessions]) => (
        <div key={dateKey}>
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">
            {formatDate(dateSessions[0].completed_at)}
          </h3>

          <div className="space-y-3">
            {dateSessions.map(session => {
              const modeInfo = GAME_MODE_INFO[session.game_mode] || {
                name: session.game_mode,
                icon: '🎮',
                color: 'text-[var(--text-primary)]'
              };
              const total = session.correct_count + session.incorrect_count;
              const percentage = total > 0 ? Math.round((session.correct_count / total) * 100) : 0;
              const isExpanded = expandedSession === session.id;
              const answers = sessionAnswers[session.id] || [];
              const wrongAnswers = answers.filter(a => !a.is_correct);

              return (
                <div
                  key={session.id}
                  className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden"
                >
                  <button
                    onClick={() => fetchSessionAnswers(session.id)}
                    className="w-full p-4 text-left hover:bg-[var(--bg-primary)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center text-xl">
                        {modeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${modeInfo.color}`}>
                            {modeInfo.name}
                          </span>
                          <span className="text-lg font-black" style={{ color: tierColor }}>
                            {percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {session.correct_count}/{total} correct
                          {session.total_time_seconds && ` · ${formatTime(session.total_time_seconds)}`}
                          {' · '}{formatTimestamp(session.completed_at)}
                        </p>
                      </div>
                      {session.wrong_answer_count > 0 && (
                        <span className="text-xs font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          {session.wrong_answer_count} missed
                        </span>
                      )}
                      <ICONS.ChevronDown
                        className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {loadingAnswers === session.id && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-center py-4 text-[var(--text-secondary)]">
                        <div className="flex gap-1 mr-2">
                          <div className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        Loading...
                      </div>
                    </div>
                  )}

                  {isExpanded && answers.length > 0 && (
                    <div className="px-4 pb-4 border-t border-[var(--border-color)]">
                      {/* Smart-accepted answers (correct but with interesting explanation) */}
                      {(() => {
                        const smartAccepted = answers.filter(a =>
                          a.is_correct && a.explanation && a.explanation !== 'Exact match'
                        );
                        if (smartAccepted.length === 0) return null;
                        return (
                          <div className="pt-3 space-y-2 mb-4">
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                              Smart Accepted
                            </p>
                            {smartAccepted.map((answer, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
                              >
                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                  <ICONS.Check className="w-3 h-3 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[var(--text-primary)]">
                                    {answer.word_text}
                                  </p>
                                  <p className="text-xs text-[var(--text-secondary)]">
                                    {answer.user_answer} → {answer.correct_answer}
                                  </p>
                                  <p className="text-[10px] text-green-600/70 dark:text-green-400/70 italic mt-0.5">
                                    {answer.explanation}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Wrong answers */}
                      {wrongAnswers.length > 0 && (
                      <div className="pt-3 space-y-2">
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                          Missed Words
                        </p>
                        {wrongAnswers.map((answer, idx) => {
                          const showExplanation = answer.explanation && answer.explanation !== 'Exact match' && answer.explanation !== 'No match (strict mode)';
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl"
                            >
                              <div className="w-6 h-6 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                                <ICONS.X className="w-3 h-3 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[var(--text-primary)]">
                                  {answer.word_text}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  {answer.user_answer ? (
                                    <>
                                      You said: <span className="text-red-500">{answer.user_answer}</span>
                                      {' · '}
                                    </>
                                  ) : null}
                                  Correct: <span className="text-green-600 dark:text-green-400 font-medium">{answer.correct_answer}</span>
                                </p>
                                {showExplanation && (
                                  <p className="text-[10px] text-red-500/70 italic mt-0.5">
                                    {answer.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {onPracticeWords && wrongAnswers.length > 0 && (
                          <button
                            onClick={() => handlePracticeWrongWords(session.id)}
                            className="w-full mt-3 py-3 bg-[var(--accent-light)] text-[var(--accent-color)] rounded-xl font-bold text-sm hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                          >
                            Practice These {wrongAnswers.length} Words
                          </button>
                        )}
                      </div>
                      )}

                      {/* Perfect score message - only if no wrong answers and no smart accepted */}
                      {wrongAnswers.length === 0 && !answers.some(a => a.is_correct && a.explanation && a.explanation !== 'Exact match') && (
                        <div className="pt-3 text-center py-4">
                          <div className="text-3xl mb-2">🎉</div>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Perfect score! No missed words.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameHistory;
