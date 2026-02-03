import { useState, useEffect } from 'react';
import { ProposedAction } from '../types';

interface WordItem {
  word: string;
  translation: string;
  word_type?: string;
  included: boolean;
}

interface Props {
  isOpen: boolean;
  action: ProposedAction;
  partnerName: string;
  onConfirm: (modifiedAction: ProposedAction, createLinkedChallenge: boolean) => Promise<void>;
  onCancel: () => void;
}

const ICONS: Record<string, string> = {
  word_gift: '🎁',
  quiz: '📝',
  quickfire: '⚡',
  love_note: '💌',
};

export function CoachActionConfirmModal({ isOpen, action, partnerName, onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<'preview' | 'editing' | 'executing' | 'success' | 'error'>('preview');
  const [createLinked, setCreateLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');

  // Initialize words when action changes
  useEffect(() => {
    if (action.words) {
      setWords(action.words.map(w => ({ ...w, included: true })));
    }
  }, [action]);

  if (!isOpen) return null;

  const includedWords = words.filter(w => w.included);
  const hasWords = action.type === 'word_gift' || action.type === 'quiz' || action.type === 'quickfire';

  const handleConfirm = async () => {
    setStep('executing');
    try {
      // Build modified action with filtered words
      const modifiedAction: ProposedAction = {
        ...action,
        words: hasWords ? includedWords.map(({ word, translation, word_type }) => ({ word, translation, word_type })) : action.words,
      };
      await onConfirm(modifiedAction, createLinked);
      setStep('success');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('preview');
    setCreateLinked(false);
    setError(null);
    setNewWord('');
    setNewTranslation('');
    onCancel();
  };

  const toggleWord = (index: number) => {
    setWords(prev => prev.map((w, i) => i === index ? { ...w, included: !w.included } : w));
  };

  const addWord = () => {
    if (newWord.trim() && newTranslation.trim()) {
      setWords(prev => [...prev, { word: newWord.trim(), translation: newTranslation.trim(), word_type: 'phrase', included: true }]);
      setNewWord('');
      setNewTranslation('');
    }
  };

  const icon = ICONS[action.type] || '✨';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {step === 'preview' && (
          <>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">{icon}</div>
              <h3 className="text-xl font-black mb-1">{action.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{action.description}</p>
            </div>

            {/* Show words summary for word-based actions */}
            {hasWords && words.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{includedWords.length} words selected</p>
                  <button
                    onClick={() => setStep('editing')}
                    className="text-xs font-bold text-[var(--accent-color)] hover:underline"
                  >
                    Edit words
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {includedWords.slice(0, 4).map(w => w.word).join(', ')}
                  {includedWords.length > 4 && ` +${includedWords.length - 4} more`}
                </p>
              </div>
            )}

            {/* Linked challenge checkbox */}
            {action.type === 'word_gift' && action.linkedChallenge && (
              <label className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--bg-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={createLinked}
                  onChange={e => setCreateLinked(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-medium text-sm">Also create a {action.linkedChallenge.type}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Activates after {partnerName} learns the words
                  </p>
                </div>
              </label>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border-color)] font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={hasWords && includedWords.length === 0}
                className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-color)] text-white font-bold text-sm disabled:opacity-50"
              >
                Send It!
              </button>
            </div>
          </>
        )}

        {step === 'editing' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">Edit Words</h3>
              <button
                onClick={() => setStep('preview')}
                className="text-sm font-bold text-[var(--accent-color)]"
              >
                Done
              </button>
            </div>

            {/* Word list */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[40vh]">
              {words.map((w, i) => (
                <div
                  key={i}
                  onClick={() => toggleWord(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    w.included
                      ? 'bg-[var(--accent-light)] border border-[var(--accent-color)]'
                      : 'bg-[var(--bg-secondary)] border border-transparent opacity-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    w.included ? 'bg-[var(--accent-color)] border-[var(--accent-color)]' : 'border-[var(--border-color)]'
                  }`}>
                    {w.included && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{w.word}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{w.translation}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new word */}
            <div className="border-t border-[var(--border-color)] pt-4">
              <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">ADD A WORD</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWord}
                  onChange={e => setNewWord(e.target.value)}
                  placeholder="Word"
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                />
                <input
                  type="text"
                  value={newTranslation}
                  onChange={e => setNewTranslation(e.target.value)}
                  placeholder="Translation"
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                />
                <button
                  onClick={addWord}
                  disabled={!newWord.trim() || !newTranslation.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white font-bold text-sm disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">
              {includedWords.length} of {words.length} words selected
            </p>
          </>
        )}

        {step === 'executing' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-bounce">{icon}</div>
            <p className="text-[var(--text-secondary)]">Creating...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <p className="font-bold">Sent to {partnerName}!</p>
            <button
              onClick={handleClose}
              className="mt-4 py-2 px-6 rounded-xl bg-[var(--accent-color)] text-white font-bold"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">❌</div>
            <p className="font-bold text-red-500">{error}</p>
            <button onClick={handleClose} className="mt-4 underline">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
