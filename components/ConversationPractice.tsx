import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { LiveSession, LiveSessionState, ConversationScenario } from '../services/live-session';
import ScenarioSelector from './ScenarioSelector';
import { useLanguage } from '../context/LanguageContext';

interface ConversationPracticeProps {
  userName: string;
  onClose: () => void;
}

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const ConversationPractice: React.FC<ConversationPracticeProps> = ({ userName, onClose }) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [showSelector, setShowSelector] = useState(true);
  const [scenario, setScenario] = useState<ConversationScenario | null>(null);
  const [state, setState] = useState<LiveSessionState>('disconnected');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const liveSessionRef = useRef<LiveSession | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, currentText]);

  const handleSelectScenario = async (selectedScenario: ConversationScenario) => {
    setScenario(selectedScenario);
    setShowSelector(false);
    setError(null);

    // Start the voice session
    try {
      liveSessionRef.current = new LiveSession({
        mode: 'conversation',
        conversationScenario: {
          id: selectedScenario.id,
          name: selectedScenario.name,
          persona: selectedScenario.persona,
          context: selectedScenario.context,
          difficulty: selectedScenario.difficulty
        },
        userName,
        onTranscript: (role, text, isFinal) => {
          if (isFinal && text.trim()) {
            setTranscript(prev => [...prev, {
              role,
              text: text.trim(),
              timestamp: new Date()
            }]);
            setCurrentText('');
          } else if (!isFinal) {
            setCurrentText(text);
          }
        },
        onStateChange: (newState) => {
          setState(newState);
        },
        onError: (err) => {
          setError(err.message);
          setState('error');
        },
        onClose: () => {
          setState('disconnected');
        }
      });

      await liveSessionRef.current.connect();
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
      setState('error');
    }
  };

  const handleEnd = () => {
    liveSessionRef.current?.disconnect();
    liveSessionRef.current = null;
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    if (scenario) {
      handleSelectScenario(scenario);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      liveSessionRef.current?.disconnect();
    };
  }, []);

  // Show scenario selector
  if (showSelector) {
    return (
      <ScenarioSelector
        onSelect={handleSelectScenario}
        onClose={onClose}
      />
    );
  }

  // Active conversation UI
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md h-[80vh] max-h-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl">
              {scenario?.icon || '🎙️'}
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-sm">
                {scenario?.id === 'custom' ? t('scenarioSelector.customScenarioName') : t(`scenarioSelector.scenarios.${scenario?.id}.name`)}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  state === 'listening' ? 'bg-green-500 animate-pulse' :
                  state === 'speaking' ? 'bg-purple-500 animate-pulse' :
                  state === 'connecting' ? 'bg-amber-500 animate-pulse' :
                  'bg-gray-400'
                }`}></span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {state === 'listening' ? t('conversationPractice.states.listening') :
                   state === 'speaking' ? t('conversationPractice.states.speaking') :
                   state === 'connecting' ? t('conversationPractice.states.connecting') :
                   state === 'error' ? t('conversationPractice.states.error') :
                   t('conversationPractice.states.disconnected')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleEnd}
            className="px-3 py-2 bg-red-500/10 text-red-500 font-bold text-xs rounded-xl hover:bg-red-500/20 transition-colors"
          >
            {t('conversationPractice.end')}
          </button>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {transcript.length === 0 && state === 'connecting' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{t('conversationPractice.startingConversation')}</p>
              </div>
            </div>
          )}

          {transcript.map((entry, index) => (
            <div
              key={index}
              className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  entry.role === 'user'
                    ? 'bg-purple-500 text-white rounded-br-md'
                    : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-md'
                }`}
              >
                <p className="text-sm">{entry.text}</p>
              </div>
            </div>
          ))}

          {/* Current text being transcribed */}
          {currentText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-2xl bg-[var(--bg-primary)] border border-purple-300 dark:border-purple-700 rounded-bl-md">
                <p className="text-sm text-[var(--text-secondary)] italic">{currentText}...</p>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              {t('conversationPractice.tryAgain')}
            </button>
          </div>
        )}

        {/* Speaking Indicator */}
        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="flex flex-col items-center justify-center">
            {state === 'listening' && (
              <>
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 relative">
                  <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping"></div>
                  <ICONS.Mic className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{t('conversationPractice.speakIn', { language: targetName })}</p>
              </>
            )}
            {state === 'speaking' && (
              <>
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-8 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-7 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{t('conversationPractice.aiSpeaking')}</p>
              </>
            )}
            {state === 'disconnected' && !error && (
              <p className="text-sm text-[var(--text-secondary)]">{t('conversationPractice.conversationEnded')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPractice;
