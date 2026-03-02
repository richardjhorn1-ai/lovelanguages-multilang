/**
 * Offline mode service — network detection + sync orchestration.
 * Storage is handled by offline-db.ts (IndexedDB).
 */

import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';
import { apiFetch } from './api-config';
import * as offlineDb from './offline-db';
import { logger } from '../utils/logger';

type NetworkListener = (isOnline: boolean) => void;

class OfflineService {
  private isOnline: boolean = true;
  private listeners: NetworkListener[] = [];
  private isNative: boolean = false;
  private _isSyncing: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.initNetworkListener();
    this.initVisibilityListener();
  }

  // ─── Network Detection ───────────────────────────────────

  private async initNetworkListener(): Promise<void> {
    if (this.isNative) {
      const status = await Network.getStatus();
      this.isOnline = status.connected;

      Network.addListener('networkStatusChange', async (status: ConnectionStatus) => {
        const wasOffline = !this.isOnline;
        this.isOnline = status.connected;
        this.notifyListeners();
        if (wasOffline && status.connected) {
          await this.processPendingSync();
        }
      });
    } else {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', async () => {
        this.isOnline = true;
        this.notifyListeners();
        await this.processPendingSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  private initVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        await this.processPendingSync();
      }
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  addListener(listener: NetworkListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getIsSyncing(): boolean {
    return this._isSyncing;
  }

  // ─── Pre-cache on Login ──────────────────────────────────

  async preCacheOnLogin(userId: string, languageCode: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Cache vocabulary
      const { data: vocabData } = await supabase
        .from('dictionary')
        .select('*')
        .eq('user_id', userId)
        .eq('language_code', languageCode);

      if (vocabData && vocabData.length > 0) {
        await offlineDb.cacheVocabulary(userId, languageCode, vocabData);
      }

      // Cache word scores
      const { data: scoreData } = await supabase
        .from('word_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('language_code', languageCode);

      if (scoreData && scoreData.length > 0) {
        await offlineDb.cacheWordScores(userId, languageCode, scoreData);
      }
    } catch (error) {
      logger.error('Pre-cache on login failed', error);
    }
  }

  // ─── Sync Pending Data ───────────────────────────────────

  async processPendingSync(): Promise<void> {
    if (this._isSyncing || !this.isOnline) return;
    if (typeof window === 'undefined') return;

    this._isSyncing = true;
    this.notifyListeners();

    try {
      // Get valid session
      const { data: { session } } = await supabase.auth.getSession();
      let validSession = session;
      if (!validSession?.user?.id) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        validSession = refreshData.session;
        if (!validSession?.user?.id) return;
      }

      const userId = validSession.user.id;
      const token = validSession.access_token;
      // 1. Batch sync pending scores
      const pendingScores = await offlineDb.getPendingScoreUpdates(userId);
      if (pendingScores.length > 0) {
        // Deduplicate: keep latest per word_id
        const latestByWord = new Map<string, offlineDb.PendingScoreUpdate>();
        for (const score of pendingScores) {
          const existing = latestByWord.get(score.wordId);
          if (!existing || score.timestamp > existing.timestamp) {
            latestByWord.set(score.wordId, score);
          }
        }

        // Single batch upsert
        const scoreRecords = Array.from(latestByWord.values()).map(s => ({
          user_id: s.userId,
          word_id: s.wordId,
          language_code: s.languageCode,
          total_attempts: s.totalAttempts,
          correct_attempts: s.correctAttempts,
          correct_streak: s.correctStreak,
          learned_at: s.learnedAt,
        }));

        const { error } = await supabase.from('word_scores').upsert(scoreRecords, {
          onConflict: 'user_id,word_id',
        });

        if (!error) {
          await offlineDb.clearPendingScoreUpdates(userId);
        }
      }

      // 2. Sync pending game sessions (individual — each awards XP)
      const pendingSessions = await offlineDb.getPendingGameSessions(userId);
      if (pendingSessions.length > 0) {
        const failedSessions: offlineDb.PendingGameSession[] = [];

        for (const gs of pendingSessions) {
          try {
            const response = await apiFetch('/api/submit-game-session/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                gameMode: gs.gameMode,
                correctCount: gs.correctCount,
                incorrectCount: gs.incorrectCount,
                totalTimeSeconds: gs.totalTimeSeconds,
                answers: gs.answers,
                targetLanguage: gs.targetLanguage,
                nativeLanguage: gs.nativeLanguage,
                clientSessionId: gs.clientSessionId,
              }),
            });
            if (!response.ok) failedSessions.push(gs);
          } catch {
            failedSessions.push(gs);
          }
        }

        await offlineDb.clearPendingGameSessions(userId);
        if (failedSessions.length > 0) {
          await offlineDb.requeueGameSessions(failedSessions);
        }
      }

      await offlineDb.setLastSyncTime(new Date().toISOString());
    } catch (error) {
      logger.error('Offline sync failed', error);
    } finally {
      this._isSyncing = false;
      this.notifyListeners();
    }
  }
}

// Singleton
export const offline = new OfflineService();
