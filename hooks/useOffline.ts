/**
 * React hook for offline mode functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { offline } from '../services/offline';
import { DictionaryEntry } from '../types';

interface UseOfflineReturn {
  isOnline: boolean;
  isOfflineCapable: boolean;
  lastSyncTime: string | null;
  cacheVocabulary: (entries: DictionaryEntry[]) => void;
  getCachedVocabulary: () => DictionaryEntry[] | null;
  cachedWordCount: number;
}

export function useOffline(userId: string | undefined, languageCode: string | undefined): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(offline.getIsOnline());
  const [cachedWordCount, setCachedWordCount] = useState(0);

  useEffect(() => {
    // Listen for network changes
    const unsubscribe = offline.addListener((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update cached word count when user/language changes
    if (userId && languageCode) {
      setCachedWordCount(offline.getCachedWordCount(userId, languageCode));
    }
  }, [userId, languageCode]);

  const cacheVocabulary = useCallback((entries: DictionaryEntry[]) => {
    if (!userId || !languageCode) return;
    offline.cacheVocabulary(userId, languageCode, entries);
    setCachedWordCount(entries.length);
  }, [userId, languageCode]);

  const getCachedVocabulary = useCallback(() => {
    if (!userId || !languageCode) return null;
    return offline.getCachedVocabulary(userId, languageCode);
  }, [userId, languageCode]);

  const isOfflineCapable = userId && languageCode
    ? offline.hasOfflineData(userId, languageCode)
    : false;

  return {
    isOnline,
    isOfflineCapable,
    lastSyncTime: offline.getLastSyncTime(),
    cacheVocabulary,
    getCachedVocabulary,
    cachedWordCount
  };
}
