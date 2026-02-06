/**
 * React hook for offline mode — exposes network state, caching, and queueing.
 */

import { useState, useEffect, useCallback } from 'react';
import { offline } from '../services/offline';
import * as offlineDb from '../services/offline-db';
import { DictionaryEntry, WordScore } from '../types';
import type { PendingScoreUpdate, PendingGameSession } from '../services/offline-db';

export interface UseOfflineReturn {
  // Network state
  isOnline: boolean;
  isOfflineCapable: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;

  // Vocabulary cache
  cacheVocabulary: (entries: DictionaryEntry[]) => Promise<void>;
  getCachedVocabulary: () => Promise<DictionaryEntry[] | null>;
  cachedWordCount: number;

  // Word scores cache
  cacheWordScores: (scores: WordScore[]) => Promise<void>;
  getCachedWordScores: () => Promise<WordScore[]>;
  updateCachedWordScore: (score: WordScore) => Promise<void>;

  // Queueing
  queueScoreUpdate: (update: Omit<PendingScoreUpdate, 'id' | 'timestamp'>) => Promise<void>;
  queueGameSession: (session: Omit<PendingGameSession, 'id' | 'timestamp'>) => Promise<void>;
}

export function useOffline(
  userId: string | undefined,
  languageCode: string | undefined
): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(offline.getIsOnline());
  const [isSyncing, setIsSyncing] = useState(offline.getIsSyncing());
  const [cachedWordCount, setCachedWordCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOfflineCapable, setIsOfflineCapable] = useState(false);

  // Listen for network + sync state changes
  useEffect(() => {
    const unsubscribe = offline.addListener((online) => {
      setIsOnline(online);
      const syncing = offline.getIsSyncing();
      setIsSyncing(syncing);

      // Refresh counts after sync completes
      if (!syncing && userId) {
        offlineDb.getPendingCount(userId).then(setPendingCount);
        offlineDb.getLastSyncTime().then(setLastSyncTime);
        if (languageCode) {
          offlineDb.getCachedVocabularyCount(userId, languageCode).then((count) => {
            setCachedWordCount(count);
            setIsOfflineCapable(count > 0);
          });
        }
      }
    });
    return unsubscribe;
  }, [userId, languageCode]);

  // Load cached counts when user/language changes
  useEffect(() => {
    if (!userId || !languageCode) return;

    const loadCounts = async () => {
      const count = await offlineDb.getCachedVocabularyCount(userId, languageCode);
      setCachedWordCount(count);
      setIsOfflineCapable(count > 0);

      const syncTime = await offlineDb.getLastSyncTime();
      setLastSyncTime(syncTime);

      const pending = await offlineDb.getPendingCount(userId);
      setPendingCount(pending);
    };

    loadCounts();
  }, [userId, languageCode]);

  // ─── Vocabulary ─────────────────────────────────────────

  const cacheVocabulary = useCallback(async (entries: DictionaryEntry[]) => {
    if (!userId || !languageCode) return;
    await offlineDb.cacheVocabulary(userId, languageCode, entries);
    setCachedWordCount(entries.length);
    setIsOfflineCapable(entries.length > 0);
  }, [userId, languageCode]);

  const getCachedVocabulary = useCallback(async (): Promise<DictionaryEntry[] | null> => {
    if (!userId || !languageCode) return null;
    const entries = await offlineDb.getCachedVocabulary(userId, languageCode);
    return entries.length > 0 ? entries : null;
  }, [userId, languageCode]);

  // ─── Word Scores ────────────────────────────────────────

  const cacheWordScores = useCallback(async (scores: WordScore[]) => {
    if (!userId || !languageCode) return;
    await offlineDb.cacheWordScores(userId, languageCode, scores);
  }, [userId, languageCode]);

  const getCachedWordScores = useCallback(async (): Promise<WordScore[]> => {
    if (!userId || !languageCode) return [];
    return offlineDb.getCachedWordScores(userId, languageCode);
  }, [userId, languageCode]);

  const updateCachedWordScore = useCallback(async (score: WordScore) => {
    if (!userId) return;
    await offlineDb.updateCachedWordScore(userId, score);
  }, [userId]);

  // ─── Queueing ───────────────────────────────────────────

  const queueScoreUpdate = useCallback(async (
    update: Omit<PendingScoreUpdate, 'id' | 'timestamp'>
  ) => {
    await offlineDb.queueScoreUpdate(update);
    if (userId) {
      const pending = await offlineDb.getPendingCount(userId);
      setPendingCount(pending);
    }
  }, [userId]);

  const queueGameSession = useCallback(async (
    session: Omit<PendingGameSession, 'id' | 'timestamp'>
  ) => {
    await offlineDb.queueGameSession(session);
    if (userId) {
      const pending = await offlineDb.getPendingCount(userId);
      setPendingCount(pending);
    }
  }, [userId]);

  return {
    isOnline,
    isOfflineCapable,
    isSyncing,
    lastSyncTime,
    pendingCount,
    cacheVocabulary,
    getCachedVocabulary,
    cachedWordCount,
    cacheWordScores,
    getCachedWordScores,
    updateCachedWordScore,
    queueScoreUpdate,
    queueGameSession,
  };
}
