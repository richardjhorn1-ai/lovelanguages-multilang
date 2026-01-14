/**
 * Offline mode service for native app
 * Handles network detection and local vocabulary caching
 */

import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { DictionaryEntry } from '../types';

// Storage keys
const OFFLINE_VOCAB_KEY = 'love-languages-offline-vocabulary';
const OFFLINE_SCORES_KEY = 'love-languages-offline-scores';
const LAST_SYNC_KEY = 'love-languages-last-sync';

// Types for offline storage
interface OfflineVocabulary {
  userId: string;
  languageCode: string;
  entries: DictionaryEntry[];
  syncedAt: string;
}

interface OfflineScore {
  wordId: string;
  isCorrect: boolean;
  timestamp: string;
}

interface PendingScores {
  userId: string;
  scores: OfflineScore[];
}

type NetworkListener = (isOnline: boolean) => void;

class OfflineService {
  private isOnline: boolean = true;
  private listeners: NetworkListener[] = [];
  private isNative: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.initNetworkListener();
  }

  /**
   * Initialize network status listener
   */
  private async initNetworkListener(): Promise<void> {
    if (this.isNative) {
      // Use Capacitor Network plugin on native
      const status = await Network.getStatus();
      this.isOnline = status.connected;

      Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        this.isOnline = status.connected;
        this.notifyListeners();
      });
    } else {
      // Use browser's navigator.onLine for web
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
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
  queueScoreUpdate(userId: string, wordId: string, isCorrect: boolean): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `${OFFLINE_SCORES_KEY}-${userId}`;
      const stored = localStorage.getItem(key);
      const pending: PendingScores = stored
        ? JSON.parse(stored)
        : { userId, scores: [] };

      pending.scores.push({
        wordId,
        isCorrect,
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
  getPendingScores(userId: string): OfflineScore[] {
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
}

// Singleton instance
export const offline = new OfflineService();
