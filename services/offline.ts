/**
 * Offline mode service for native app
 * Handles network detection and local vocabulary caching
 */

import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { DictionaryEntry, WordScore } from '../types';
import { supabase } from './supabase';

// Storage keys
const OFFLINE_VOCAB_KEY = 'love-languages-offline-vocabulary';
const OFFLINE_SCORES_KEY = 'love-languages-offline-scores';
const OFFLINE_GAME_SESSIONS_KEY = 'love-languages-offline-game-sessions';
const OFFLINE_WORD_SCORES_KEY = 'love-languages-offline-word-scores';
const LAST_SYNC_KEY = 'love-languages-last-sync';

// Types for offline storage
interface OfflineVocabulary {
  userId: string;
  languageCode: string;
  entries: DictionaryEntry[];
  syncedAt: string;
}

// Full score update object for offline queueing
interface PendingScoreUpdate {
  user_id: string;
  word_id: string;
  language_code: string;
  total_attempts: number;
  correct_attempts: number;
  correct_streak: number;
  learned_at: string | null;
  timestamp: string;
}

interface PendingScores {
  userId: string;
  scores: PendingScoreUpdate[];
}

// Game session for offline queueing
interface PendingGameSession {
  gameMode: string;
  correctCount: number;
  incorrectCount: number;
  totalTimeSeconds: number;
  answers: any[];
  targetLanguage: string;
  nativeLanguage: string;
  timestamp: string;
}

interface PendingGameSessions {
  userId: string;
  sessions: PendingGameSession[];
}

// Cached word scores
interface CachedWordScores {
  userId: string;
  languageCode: string;
  scores: WordScore[];
  syncedAt: string;
}

type NetworkListener = (isOnline: boolean) => void;

class OfflineService {
  private isOnline: boolean = true;
  private listeners: NetworkListener[] = [];
  private isNative: boolean = false;
  private isSyncing: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.initNetworkListener();
    this.initVisibilityListener();
  }

  /**
   * Initialize network status listener
   */
  private async initNetworkListener(): Promise<void> {
    if (this.isNative) {
      // Use Capacitor Network plugin on native
      const status = await Network.getStatus();
      this.isOnline = status.connected;

      Network.addListener('networkStatusChange', async (status: ConnectionStatus) => {
        const wasOffline = !this.isOnline;
        this.isOnline = status.connected;
        this.notifyListeners();
        // Trigger sync when coming back online
        if (wasOffline && status.connected) {
          await this.processPendingSync();
        }
      });
    } else {
      // Use browser's navigator.onLine for web
      this.isOnline = navigator.onLine;

      window.addEventListener('online', async () => {
        this.isOnline = true;
        this.notifyListeners();
        // Trigger sync when coming back online
        await this.processPendingSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  /**
   * Initialize visibility listener to sync when app is foregrounded
   */
  private initVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        await this.processPendingSync();
      }
    });
  }

  /**
   * Notify all registered listeners of network status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  /**
   * Register a listener for network status changes
   */
  addListener(listener: NetworkListener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cache vocabulary for offline use
   */
  cacheVocabulary(userId: string, languageCode: string, entries: DictionaryEntry[]): void {
    if (typeof window === 'undefined') return;

    const data: OfflineVocabulary = {
      userId,
      languageCode,
      entries,
      syncedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        `${OFFLINE_VOCAB_KEY}-${userId}-${languageCode}`,
        JSON.stringify(data)
      );
      localStorage.setItem(LAST_SYNC_KEY, data.syncedAt);
    } catch (error) {
      console.warn('Failed to cache vocabulary for offline use:', error);
    }
  }

  /**
   * Get cached vocabulary for offline use
   */
  getCachedVocabulary(userId: string, languageCode: string): DictionaryEntry[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`${OFFLINE_VOCAB_KEY}-${userId}-${languageCode}`);
      if (!stored) return null;

      const data: OfflineVocabulary = JSON.parse(stored);
      return data.entries;
    } catch (error) {
      console.warn('Failed to read cached vocabulary:', error);
      return null;
    }
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  /**
   * Queue a score update for later sync (when offline)
   */
  queueScoreUpdate(userId: string, scoreUpdate: Omit<PendingScoreUpdate, 'timestamp'>): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `${OFFLINE_SCORES_KEY}-${userId}`;
      const stored = localStorage.getItem(key);
      const pending: PendingScores = stored
        ? JSON.parse(stored)
        : { userId, scores: [] };

      pending.scores.push({
        ...scoreUpdate,
        timestamp: new Date().toISOString()
      });

      localStorage.setItem(key, JSON.stringify(pending));
    } catch (error) {
      console.warn('Failed to queue offline score:', error);
    }
  }

  /**
   * Get pending score updates to sync
   */
  getPendingScores(userId: string): PendingScoreUpdate[] {
    if (typeof window === 'undefined') return [];

    try {
      const key = `${OFFLINE_SCORES_KEY}-${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const pending: PendingScores = JSON.parse(stored);
      return pending.scores;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear pending scores after successful sync
   */
  clearPendingScores(userId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${OFFLINE_SCORES_KEY}-${userId}`);
  }

  /**
   * Queue a game session for later sync (when offline)
   */
  queueGameSession(userId: string, session: Omit<PendingGameSession, 'timestamp'>): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `${OFFLINE_GAME_SESSIONS_KEY}-${userId}`;
      const stored = localStorage.getItem(key);
      const pending: PendingGameSessions = stored
        ? JSON.parse(stored)
        : { userId, sessions: [] };

      pending.sessions.push({
        ...session,
        timestamp: new Date().toISOString()
      });

      localStorage.setItem(key, JSON.stringify(pending));
    } catch (error) {
      console.warn('Failed to queue offline game session:', error);
    }
  }

  /**
   * Get pending game sessions to sync
   */
  getPendingGameSessions(userId: string): PendingGameSession[] {
    if (typeof window === 'undefined') return [];

    try {
      const key = `${OFFLINE_GAME_SESSIONS_KEY}-${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const pending: PendingGameSessions = JSON.parse(stored);
      return pending.sessions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear pending game sessions after successful sync
   */
  clearPendingGameSessions(userId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${OFFLINE_GAME_SESSIONS_KEY}-${userId}`);
  }

  /**
   * Cache word scores for offline use
   */
  cacheWordScores(userId: string, languageCode: string, scores: WordScore[]): void {
    if (typeof window === 'undefined') return;

    const data: CachedWordScores = {
      userId,
      languageCode,
      scores,
      syncedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        `${OFFLINE_WORD_SCORES_KEY}-${userId}-${languageCode}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Failed to cache word scores for offline use:', error);
    }
  }

  /**
   * Get cached word scores for offline use
   */
  getCachedWordScores(userId: string, languageCode: string): WordScore[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`${OFFLINE_WORD_SCORES_KEY}-${userId}-${languageCode}`);
      if (!stored) return null;

      const data: CachedWordScores = JSON.parse(stored);
      return data.scores;
    } catch (error) {
      console.warn('Failed to read cached word scores:', error);
      return null;
    }
  }

  /**
   * Get count of pending items waiting to sync
   */
  getPendingCount(userId: string): number {
    const scores = this.getPendingScores(userId);
    const sessions = this.getPendingGameSessions(userId);
    return scores.length + sessions.length;
  }

  /**
   * Check if we have cached data for offline play
   */
  hasOfflineData(userId: string, languageCode: string): boolean {
    const entries = this.getCachedVocabulary(userId, languageCode);
    return entries !== null && entries.length > 0;
  }

  /**
   * Get count of cached words
   */
  getCachedWordCount(userId: string, languageCode: string): number {
    const entries = this.getCachedVocabulary(userId, languageCode);
    return entries?.length ?? 0;
  }

  /**
   * Process pending offline data and sync to server
   */
  async processPendingSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;
    if (typeof window === 'undefined') return;

    // Get current user - refresh session first in case token expired while offline
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user?.id) {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session?.user?.id) {
        console.warn('Cannot sync: session expired and refresh failed');
        return;
      }
    }

    // Re-fetch session after potential refresh
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user?.id) return;

    const userId = currentSession.user.id;
    this.isSyncing = true;

    try {
      // Sync pending scores
      const pendingScores = this.getPendingScores(userId);
      if (pendingScores.length > 0) {
        // Group by word_id and take the latest for each (in case of duplicates)
        const latestScores = new Map<string, PendingScoreUpdate>();
        for (const score of pendingScores) {
          const existing = latestScores.get(score.word_id);
          if (!existing || score.timestamp > existing.timestamp) {
            latestScores.set(score.word_id, score);
          }
        }

        // Upsert all scores
        for (const score of latestScores.values()) {
          const { timestamp, ...scoreData } = score;
          await supabase.from('word_scores').upsert(scoreData, {
            onConflict: 'user_id,word_id'
          });
        }

        this.clearPendingScores(userId);
      }

      // Sync pending game sessions
      const pendingSessions = this.getPendingGameSessions(userId);
      if (pendingSessions.length > 0) {
        const token = session.access_token;
        const failedSessions: PendingGameSession[] = [];

        for (const gameSession of pendingSessions) {
          const { timestamp, ...sessionData } = gameSession;
          try {
            const response = await fetch('/api/submit-game-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(sessionData)
            });
            if (!response.ok) {
              failedSessions.push(gameSession);
            }
          } catch (error) {
            console.warn('Failed to sync game session:', error);
            failedSessions.push(gameSession);
          }
        }

        // Clear all, then re-queue failed ones
        this.clearPendingGameSessions(userId);
        for (const failed of failedSessions) {
          const { timestamp, ...sessionData } = failed;
          this.queueGameSession(userId, sessionData);
        }
      }

      // Update last sync time
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.warn('Offline sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

// Singleton instance
export const offline = new OfflineService();
