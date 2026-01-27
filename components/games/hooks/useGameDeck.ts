import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { Profile, DictionaryEntry } from '../../../types';
import { shuffleArray } from '../../../utils/array';
import { useLanguage } from '../../../context/LanguageContext';
import { useOffline } from '../../../hooks/useOffline';

interface UseGameDeckOptions {
  profile: Profile;
}

interface UseGameDeckReturn {
  deck: DictionaryEntry[];
  loading: boolean;
  currentIndex: number;
  setCurrentIndex: (index: number | ((prev: number) => number)) => void;
  shuffleDeck: () => void;
  nextCard: () => void;
  prevCard: () => void;
  resetDeck: () => void;
  currentWord: DictionaryEntry | null;
  hasCards: boolean;
  isLastCard: boolean;
  refreshDeck: () => Promise<void>;
}

/**
 * Hook for managing the game deck (vocabulary words).
 * Handles loading, shuffling, caching for offline, and navigation.
 */
export function useGameDeck({ profile }: UseGameDeckOptions): UseGameDeckReturn {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { targetLanguage } = useLanguage();
  const { isOnline, cacheVocabulary, getCachedVocabulary } = useOffline(
    profile.id,
    targetLanguage
  );

  // Determine which user's vocabulary to load (tutor sees student's words)
  const targetUserId =
    profile.role === 'tutor' && profile.linked_user_id
      ? profile.linked_user_id
      : profile.id;

  const fetchDeck = useCallback(async () => {
    setLoading(true);

    // If offline, try to use cached data
    if (!isOnline) {
      const cachedData = getCachedVocabulary();
      if (cachedData && cachedData.length > 0) {
        setDeck(shuffleArray(cachedData));
        setLoading(false);
        return;
      }
    }

    try {
      const { data: dictData, error } = await supabase
        .from('dictionary')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage);

      if (error) {
        console.error('Error fetching deck:', error);
        setDeck([]);
      } else if (dictData) {
        const shuffled = shuffleArray(dictData);
        setDeck(shuffled);
        // Cache for offline use
        cacheVocabulary(dictData);
      }
    } catch (error) {
      console.error('Error fetching deck:', error);
      setDeck([]);
    }

    setLoading(false);
  }, [targetUserId, targetLanguage, isOnline, getCachedVocabulary, cacheVocabulary]);

  // Fetch deck on mount and when dependencies change
  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  // Listen for language switch events from Profile settings
  useEffect(() => {
    const handleLanguageSwitch = () => {
      fetchDeck();
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, [fetchDeck]);

  const shuffleDeck = useCallback(() => {
    setDeck((prev) => shuffleArray([...prev]));
    setCurrentIndex(0);
  }, []);

  const nextCard = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, deck.length - 1));
  }, [deck.length]);

  const prevCard = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetDeck = useCallback(() => {
    shuffleDeck();
  }, [shuffleDeck]);

  const currentWord = deck.length > 0 && currentIndex < deck.length ? deck[currentIndex] : null;
  const hasCards = deck.length > 0;
  const isLastCard = currentIndex >= deck.length - 1;

  return {
    deck,
    loading,
    currentIndex,
    setCurrentIndex,
    shuffleDeck,
    nextCard,
    prevCard,
    resetDeck,
    currentWord,
    hasCards,
    isLastCard,
    refreshDeck: fetchDeck,
  };
}

export default useGameDeck;
