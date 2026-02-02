import { useState, useCallback, useMemo } from 'react';
import { DictionaryEntry } from '../../../../types';
import { VerbTense, getAvailableTenses } from '../../../../constants/language-config';
import { shuffleArray } from '../../../../utils/array';
import { VerbTenseCombo } from './types';

interface UseVerbQueueOptions {
  verbs: DictionaryEntry[];
  targetLanguage: string;
  focusTense: VerbTense | null;
}

export function useVerbQueue({ verbs, targetLanguage, focusTense }: UseVerbQueueOptions) {
  // Build initial queue from all verb+tense combinations
  const initialQueue = useMemo(() => {
    const combos: VerbTenseCombo[] = [];
    const languageTenses = getAvailableTenses(targetLanguage);

    for (const verb of verbs) {
      const conjugations = verb.conjugations as Record<string, any> | null;
      if (!conjugations) continue;

      for (const tense of languageTenses) {
        // Check if this verb has this tense unlocked
        const tenseData = conjugations[tense];
        const isPresent = tense === 'present';
        const isUnlocked = isPresent ? !!tenseData : tenseData?.unlockedAt;

        if (isUnlocked && tenseData) {
          // Apply focus filter if set
          if (focusTense && tense !== focusTense) continue;

          combos.push({
            verb,
            tense,
            correctStreak: 0,
          });
        }
      }
    }

    return shuffleArray(combos);
  }, [verbs, targetLanguage, focusTense]);

  const [queue, setQueue] = useState<VerbTenseCombo[]>(initialQueue);

  // Get the next combo from the front of the queue
  const getNext = useCallback((): VerbTenseCombo | null => {
    if (queue.length === 0) return null;
    return queue[0];
  }, [queue]);

  // Mark current combo as correct - move to back of queue
  const markCorrect = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) return prev;
      const [current, ...rest] = prev;
      return [...rest, { ...current, correctStreak: current.correctStreak + 1 }];
    });
  }, []);

  // Mark current combo as wrong - keep near front (shuffle into first third)
  const markWrong = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) return prev;
      const [current, ...rest] = prev;
      const resetCombo = { ...current, correctStreak: 0 };

      // Insert into first third of remaining queue (will come back soon)
      const insertIndex = Math.floor(Math.min(rest.length, Math.max(1, rest.length / 3)));
      const newQueue = [...rest];
      newQueue.splice(insertIndex, 0, resetCombo);
      return newQueue;
    });
  }, []);

  // Reset queue to initial shuffled state
  const reset = useCallback(() => {
    setQueue(shuffleArray([...initialQueue]));
  }, [initialQueue]);

  return {
    queue,
    queueLength: queue.length,
    getNext,
    markCorrect,
    markWrong,
    reset,
    isEmpty: queue.length === 0,
  };
}
