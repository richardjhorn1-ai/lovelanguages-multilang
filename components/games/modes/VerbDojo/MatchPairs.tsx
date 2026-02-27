import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../../constants';
import { speak } from '../../../../services/audio';
import { haptics } from '../../../../services/haptics';
import { DictionaryEntry } from '../../../../types';
import { VerbTense } from '../../../../constants/language-config';
import { shuffleArray } from '../../../../utils/array';

interface MatchPair {
  personKey: string;
  personLabel: string;
  correctAnswer: string;
}

interface MatchPairsProps {
  verb: DictionaryEntry;
  tense: VerbTense;
  pairs: MatchPair[];
  targetLanguage: string;
  accentColor: string;
  onComplete: (allCorrect: boolean) => void;
}

type SelectionState = {
  type: 'pronoun' | 'conjugation';
  index: number;
  value: string;
} | null;

export const MatchPairs: React.FC<MatchPairsProps> = ({
  verb,
  tense,
  pairs,
  targetLanguage,
  accentColor,
  onComplete,
}) => {
  const { t } = useTranslation();

  // Track matched pairs (indices that have been correctly matched)
  const [matchedIndices, setMatchedIndices] = useState<Set<number>>(new Set());
  // Track wrong attempts for shake animation
  const [wrongPair, setWrongPair] = useState<{ pronoun: number; conj: number } | null>(null);
  // Currently selected item
  const [selected, setSelected] = useState<SelectionState>(null);

  // Defensive reset when pairs change (belt-and-suspenders alongside key prop)
  useEffect(() => {
    setMatchedIndices(new Set());
    setWrongPair(null);
    setSelected(null);
  }, [pairs]);

  // Shuffle conjugations for display (pronouns stay in order)
  const shuffledConjugations = useMemo(() => {
    return shuffleArray(pairs.map((p, i) => ({ answer: p.correctAnswer, originalIndex: i })));
  }, [pairs]);

  // Handle tap on a pronoun
  const handlePronounTap = useCallback((index: number) => {
    if (matchedIndices.has(index)) return; // Already matched

    if (selected?.type === 'conjugation') {
      // Check if this pronoun matches the selected conjugation
      const conjItem = shuffledConjugations[selected.index];
      if (conjItem.originalIndex === index) {
        // Correct match!
        haptics.trigger('correct');
        const newMatched = new Set(matchedIndices);
        newMatched.add(index);
        setMatchedIndices(newMatched);
        setSelected(null);

        // Check if all matched
        if (newMatched.size === pairs.length) {
          haptics.trigger('perfect');
          setTimeout(() => onComplete(true), 300);
        }
      } else {
        // Wrong match - shake and reset
        haptics.trigger('incorrect');
        setWrongPair({ pronoun: index, conj: selected.index });
        setTimeout(() => {
          setWrongPair(null);
          setSelected(null);
        }, 500);
      }
    } else {
      // Select this pronoun
      setSelected({ type: 'pronoun', index, value: pairs[index].personLabel });
    }
  }, [selected, matchedIndices, shuffledConjugations, pairs, onComplete]);

  // Handle tap on a conjugation
  const handleConjugationTap = useCallback((shuffledIndex: number) => {
    const conjItem = shuffledConjugations[shuffledIndex];
    if (matchedIndices.has(conjItem.originalIndex)) return; // Already matched

    if (selected?.type === 'pronoun') {
      // Check if this conjugation matches the selected pronoun
      if (conjItem.originalIndex === selected.index) {
        // Correct match!
        haptics.trigger('correct');
        const newMatched = new Set(matchedIndices);
        newMatched.add(conjItem.originalIndex);
        setMatchedIndices(newMatched);
        setSelected(null);

        // Check if all matched
        if (newMatched.size === pairs.length) {
          haptics.trigger('perfect');
          setTimeout(() => onComplete(true), 300);
        }
      } else {
        // Wrong match - shake and reset
        haptics.trigger('incorrect');
        setWrongPair({ pronoun: selected.index, conj: shuffledIndex });
        setTimeout(() => {
          setWrongPair(null);
          setSelected(null);
        }, 500);
      }
    } else {
      // Select this conjugation
      setSelected({ type: 'conjugation', index: shuffledIndex, value: conjItem.answer });
    }
  }, [selected, matchedIndices, shuffledConjugations, targetLanguage, onComplete]);

  const allMatched = matchedIndices.size === pairs.length;

  return (
    <div>
      {/* Header */}
      <div
        className="p-4 rounded-2xl border mb-6 text-center"
        style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}
      >
        <p className="text-scale-caption font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
          {t(`loveLog.modal.${tense}`, tense)} tense
        </p>
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-2xl font-black font-header text-[var(--text-primary)]">{verb.word}</h3>
          <button
            onClick={() => speak(verb.word, targetLanguage)}
            className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors"
          >
            <ICONS.Volume2 className="w-5 h-5" style={{ color: accentColor }} />
          </button>
        </div>
        <p className="text-[var(--text-secondary)] italic">"{verb.translation}"</p>
      </div>

      {/* Instruction */}
      <p className="text-center text-[var(--text-secondary)] text-scale-label mb-4">
        {t('play.verbDojo.matchPairs.instruction', 'Tap to match pronouns with conjugations')}
      </p>

      {/* Match grid - two columns */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Left column: Pronouns */}
        <div className="space-y-2">
          {pairs.map((pair, index) => {
            const isMatched = matchedIndices.has(index);
            const isSelected = selected?.type === 'pronoun' && selected.index === index;
            const isWrong = wrongPair?.pronoun === index;

            return (
              <button
                key={`pronoun-${index}`}
                onClick={() => handlePronounTap(index)}
                disabled={isMatched}
                className={`w-full p-3 rounded-xl font-bold text-lg transition-all ${
                  isMatched
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-2 border-green-500/50'
                    : isSelected
                    ? 'bg-[var(--accent-color)]/20 border-2 border-[var(--accent-color)] scale-105'
                    : isWrong
                    ? 'bg-red-500/20 border-2 border-red-500 animate-shake'
                    : 'bg-[var(--bg-card)] border-2 border-[var(--border-color)] hover:border-[var(--accent-color)]/50'
                }`}
                style={{ '--accent-color': accentColor } as React.CSSProperties}
              >
                {pair.personLabel}
              </button>
            );
          })}
        </div>

        {/* Right column: Conjugations (shuffled) */}
        <div className="space-y-2">
          {shuffledConjugations.map((item, shuffledIndex) => {
            const isMatched = matchedIndices.has(item.originalIndex);
            const isSelected = selected?.type === 'conjugation' && selected.index === shuffledIndex;
            const isWrong = wrongPair?.conj === shuffledIndex;

            return (
              <button
                key={`conj-${shuffledIndex}`}
                onClick={() => handleConjugationTap(shuffledIndex)}
                disabled={isMatched}
                className={`w-full p-3 rounded-xl font-bold text-lg transition-all ${
                  isMatched
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-2 border-green-500/50'
                    : isSelected
                    ? 'bg-[var(--accent-color)]/20 border-2 border-[var(--accent-color)] scale-105'
                    : isWrong
                    ? 'bg-red-500/20 border-2 border-red-500 animate-shake'
                    : 'bg-[var(--bg-card)] border-2 border-[var(--border-color)] hover:border-[var(--accent-color)]/50'
                }`}
                style={{ '--accent-color': accentColor } as React.CSSProperties}
              >
                {item.answer}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion state */}
      {allMatched && (
        <div className="text-center p-4 bg-green-500/10 rounded-xl">
          <p className="text-green-600 dark:text-green-400 font-bold text-lg">
            ✓ {t('play.verbDojo.matchPairs.complete', 'All matched!')}
          </p>
        </div>
      )}

    </div>
  );
};
