import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '../types';
import { GladiaSession, GladiaState, TranscriptChunk } from '../services/gladia-session';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

interface ListenModeProps {
  profile: Profile;
  onClose: () => void;
}

interface TranscriptEntry {
  id: string;
  speaker: string;
  polish: string;
  english: string;
  timestamp: number;
  isBookmarked: boolean;
  isFinal: boolean;
}

// Chat-style speaker bubble colors
const SPEAKER_BUBBLES = [
  {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Speaker 1'
  },
  {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    label: 'Speaker 2'
  },
  {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    label: 'Speaker 3'
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Speaker 4'
  },
];

const ListenMode: React.FC<ListenModeProps> = ({ profile, onClose }) => {
  // Session state
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped' | 'naming' | 'error'>('idle');
  const [connectionState, setConnectionState] = useState<GladiaState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Recording data
  const [duration, setDuration] = useState(0);
  const [contextLabel, setContextLabel] = useState('');

  // Transcript data
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [currentPartial, setCurrentPartial] = useState<TranscriptEntry | null>(null);

  // Refs
  const gladiaRef = useRef<GladiaSession | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const speakerMapRef = useRef<Map<string, number>>(new Map());

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get speaker display info
  const getSpeakerInfo = useCallback((speakerId: string) => {
    if (!speakerMapRef.current.has(speakerId)) {
      const index = speakerMapRef.current.size % SPEAKER_BUBBLES.length;
      speakerMapRef.current.set(speakerId, index);
    }
    const index = speakerMapRef.current.get(speakerId) || 0;
    return SPEAKER_BUBBLES[index];
  }, []);

  // Handle transcript from Gladia
  const handleTranscript = useCallback((chunk: TranscriptChunk) => {
    const entry: TranscriptEntry = {
      id: chunk.id,
      speaker: chunk.speaker,
      polish: chunk.text,
      english: chunk.translation || '',
      timestamp: chunk.timestamp,
      isBookmarked: false,
      isFinal: chunk.isFinal,
    };

    if (chunk.isFinal) {
      setEntries(prev => {
        // Find last entry from same speaker (ES5-compatible)
        let lastSameSpeakerIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].speaker === chunk.speaker) {
            lastSameSpeakerIdx = i;
            break;
          }
        }

        if (lastSameSpeakerIdx >= 0) {
          const lastEntry = prev[lastSameSpeakerIdx];
          const isExtension = entry.polish.startsWith(lastEntry.polish.slice(0, 10)) ||
                             lastEntry.polish.startsWith(entry.polish.slice(0, 10)) ||
                             entry.polish.length > lastEntry.polish.length;
          const isRecent = entry.timestamp - lastEntry.timestamp < 10000;

          if (isExtension && isRecent && !lastEntry.isBookmarked) {
            const updated = [...prev];
            updated[lastSameSpeakerIdx] = { ...entry, isBookmarked: lastEntry.isBookmarked };
            return updated;
          }
        }

        const filtered = prev.filter(e => e.isFinal || e.speaker !== chunk.speaker);
        return [...filtered, entry];
      });
      setCurrentPartial(null);
    } else {
      setCurrentPartial(entry);
    }

    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Handle state changes
  const handleStateChange = useCallback((state: GladiaState) => {
    setConnectionState(state);
    if (state === 'listening') {
      setStatus('recording');
    } else if (state === 'error') {
      setStatus('error');
    }
  }, []);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    console.error('[ListenMode] Error:', err);
    setError(err.message);
    setStatus('error');
  }, []);

  // Start recording
  const startRecording = async () => {
    setError(null);

    try {
      gladiaRef.current = new GladiaSession({
        onTranscript: handleTranscript,
        onStateChange: handleStateChange,
        onError: handleError,
        onClose: () => {
          // If no label was entered, show naming prompt
          if (!contextLabel.trim()) {
            setStatus('naming');
          } else {
            setStatus('stopped');
          }
          stopDurationTimer();
        },
      });

      await gladiaRef.current.connect();

      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setStatus('error');
    }
  };

  // Stop duration timer
  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  // Pause recording
  const pauseRecording = () => {
    gladiaRef.current?.pauseListening();
    setStatus('paused');
    stopDurationTimer();
  };

  // Resume recording
  const resumeRecording = async () => {
    await gladiaRef.current?.resumeListening();
    setStatus('recording');
    durationTimerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    gladiaRef.current?.disconnect();
    gladiaRef.current = null;
    stopDurationTimer();
    // Status will be set by onClose callback
    if (!contextLabel.trim()) {
      setStatus('naming');
    } else {
      setStatus('stopped');
    }
  };

  // Toggle bookmark
  const toggleBookmark = (entryId: string) => {
    setEntries(prev =>
      prev.map(e =>
        e.id === entryId ? { ...e, isBookmarked: !e.isBookmarked } : e
      )
    );
  };

  // Save session to database
  const saveSession = async () => {
    const bookmarkedPhrases = entries.filter(e => e.isBookmarked);

    try {
      const { error: saveError } = await supabase.from('listen_sessions').insert({
        user_id: profile.id,
        context_label: contextLabel.trim() || null,
        duration_seconds: duration,
        transcript: entries,
        bookmarked_phrases: bookmarkedPhrases,
        detected_words: [],
      });

      if (saveError) throw saveError;
      onClose();
    } catch (err: any) {
      setError('Failed to save session: ' + err.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gladiaRef.current?.disconnect();
      stopDurationTimer();
    };
  }, []);

  // Count bookmarked entries
  const bookmarkedCount = entries.filter(e => e.isBookmarked).length;

  // ========== IDLE STATE: Ready to start ==========
  if (status === 'idle') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--accent-light)] flex items-center justify-center mb-6">
            <span className="text-4xl">👂</span>
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Ready to Listen?</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Capture real Polish conversations with live transcription and translation.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-left">
              What are you listening to? <span className="opacity-60">(optional)</span>
            </label>
            <input
              type="text"
              value={contextLabel}
              onChange={(e) => setContextLabel(e.target.value)}
              placeholder="e.g., Dinner at Babcia's, TV show..."
              className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1 text-left opacity-60">
              You can name it later if you prefer
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-[var(--text-primary)] font-bold hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
            <button
              onClick={startRecording}
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-color)] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <ICONS.Mic className="w-5 h-5" />
              Start Listening
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] mt-4 flex items-center justify-center gap-1">
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded font-bold">
              BETA
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ========== NAMING STATE: Ask for session name after stopping ==========
  if (status === 'naming') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <ICONS.Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Session Complete!</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            {formatDuration(duration)} • {entries.length} phrase{entries.length !== 1 ? 's' : ''} captured
          </p>
          {bookmarkedCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-6 flex items-center justify-center gap-1">
              <ICONS.Star className="w-3 h-3" />
              {bookmarkedCount} bookmarked
            </p>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-left">
              Name this session? <span className="opacity-60">(optional)</span>
            </label>
            <input
              type="text"
              value={contextLabel}
              onChange={(e) => setContextLabel(e.target.value)}
              placeholder="e.g., Dinner at Babcia's, TV show..."
              className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-[var(--text-primary)] font-bold hover:opacity-80 transition-opacity"
            >
              Discard
            </button>
            <button
              onClick={saveSession}
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-color)] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <ICONS.Check className="w-5 h-5" />
              Save Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== RECORDING/PAUSED/STOPPED/ERROR: Chat view ==========
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👂</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[var(--text-primary)]">
                  {contextLabel || 'Listen Mode'}
                </h2>
                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold">
                  BETA
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                {status === 'recording' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Recording • {formatDuration(duration)}</span>
                  </>
                )}
                {status === 'paused' && <span>⏸ Paused • {formatDuration(duration)}</span>}
                {status === 'stopped' && <span>✓ Stopped • {formatDuration(duration)}</span>}
                {status === 'error' && <span className="text-red-500">Error</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-primary)] transition-colors"
          >
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Transcript Area - Chat Style */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] bg-[var(--bg-primary)]">
          {entries.length === 0 && !currentPartial && (
            <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">
              <div className="text-center">
                <ICONS.Mic className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Listening for Polish speech...</p>
              </div>
            </div>
          )}

          {/* Chat-style transcript entries */}
          {entries.map((entry) => {
            const speakerInfo = getSpeakerInfo(entry.speaker);
            return (
              <div key={entry.id} className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm rounded-tl-none border ${speakerInfo.bg} ${speakerInfo.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${speakerInfo.text}`}>
                        {speakerInfo.label}
                      </span>
                      <p className="text-[var(--text-primary)] font-medium mt-1">
                        🇵🇱 {entry.polish}
                      </p>
                      {entry.english && (
                        <p className="text-[var(--text-secondary)] text-sm mt-1">
                          🇬🇧 {entry.english}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleBookmark(entry.id)}
                      className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                        entry.isBookmarked
                          ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400'
                          : 'hover:bg-white/50 dark:hover:bg-black/20 text-[var(--text-secondary)]'
                      }`}
                      title={entry.isBookmarked ? 'Remove bookmark' : 'Bookmark this phrase'}
                    >
                      <ICONS.Star className={`w-4 h-4 ${entry.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Current Partial (interim result) */}
          {currentPartial && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 rounded-tl-none border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {getSpeakerInfo(currentPartial.speaker).label}
                </span>
                <p className="text-[var(--text-secondary)] mt-1 italic flex items-center gap-2">
                  🇵🇱 {currentPartial.polish}
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </p>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          {bookmarkedCount > 0 && (
            <div className="mb-3 text-xs text-[var(--text-secondary)] flex items-center gap-1">
              <ICONS.Star className="w-3 h-3 text-amber-500 fill-current" />
              {bookmarkedCount} phrase{bookmarkedCount !== 1 ? 's' : ''} bookmarked
            </div>
          )}

          <div className="flex gap-3">
            {status === 'recording' && (
              <>
                <button
                  onClick={pauseRecording}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ICONS.Pause className="w-5 h-5" />
                  Pause
                </button>
                <button
                  onClick={stopRecording}
                  className="py-3 px-6 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ICONS.Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}

            {status === 'paused' && (
              <>
                <button
                  onClick={resumeRecording}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ICONS.Mic className="w-5 h-5" />
                  Resume
                </button>
                <button
                  onClick={stopRecording}
                  className="py-3 px-6 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ICONS.Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}

            {status === 'stopped' && entries.length > 0 && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-[var(--text-primary)] font-bold hover:opacity-80 transition-opacity"
                >
                  Discard
                </button>
                <button
                  onClick={saveSession}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-color)] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ICONS.Check className="w-5 h-5" />
                  Save Session
                </button>
              </>
            )}

            {status === 'error' && (
              <button
                onClick={() => {
                  setStatus('idle');
                  setError(null);
                  setEntries([]);
                  setDuration(0);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-[var(--text-primary)] font-bold hover:opacity-80 transition-opacity"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListenMode;
