/**
 * IndexedDB data-access layer for offline mode.
 * Pure storage — no network logic, no sync orchestration.
 *
 * Every exported function is wrapped in try/catch so IDB unavailability
 * (Safari private browsing, storage full, SecurityError) degrades gracefully
 * instead of crashing the app. Read operations return safe empty defaults;
 * write operations fail silently with a console.warn.
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { DictionaryEntry, WordScore } from '../types';
import type { GameSessionAnswer } from '../components/games/hooks/useGameSession';

// ─── Types ───────────────────────────────────────────────────

export interface PendingScoreUpdate {
  id?: number;
  userId: string;
  wordId: string;
  languageCode: string;
  totalAttempts: number;
  correctAttempts: number;
  correctStreak: number;
  learnedAt: string | null;
  timestamp: string;
}

export interface PendingGameSession {
  id?: number;
  userId: string;
  gameMode: string;
  correctCount: number;
  incorrectCount: number;
  totalTimeSeconds: number;
  answers: GameSessionAnswer[];
  targetLanguage: string;
  nativeLanguage: string;
  timestamp: string;
  /** Client-generated idempotency key to prevent duplicate submissions on sync retry */
  clientSessionId?: string;
}

interface VocabRecord extends DictionaryEntry {
  _userId: string;
  _languageCode: string;
  _cachedAt: string;
}

interface ScoreRecord extends WordScore {
  _userId: string;
  _cachedAt: string;
}

interface SyncMetaEntry {
  key: string;
  value: string;
}

// ─── Schema ──────────────────────────────────────────────────

interface OfflineDB extends DBSchema {
  vocabulary: {
    key: string; // composite: `${userId}:${languageCode}:${id}`
    value: VocabRecord;
    indexes: {
      'by-user-language': [string, string];
    };
  };
  wordScores: {
    key: string; // composite: `${userId}:${wordId}`
    value: ScoreRecord;
    indexes: {
      'by-user-language': [string, string];
    };
  };
  pendingScoreUpdates: {
    key: number;
    value: PendingScoreUpdate;
    indexes: {
      'by-user': string;
      'by-user-word': [string, string];
    };
  };
  pendingGameSessions: {
    key: number;
    value: PendingGameSession;
    indexes: {
      'by-user': string;
    };
  };
  syncMeta: {
    key: string;
    value: SyncMetaEntry;
  };
}

const DB_NAME = 'love-languages-offline';
const DB_VERSION = 1;

// ─── Database Singleton ──────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Vocabulary store
        const vocabStore = db.createObjectStore('vocabulary', {
          keyPath: '_key',
        });
        vocabStore.createIndex('by-user-language', ['_userId', '_languageCode']);

        // Word scores store
        const scoresStore = db.createObjectStore('wordScores', {
          keyPath: '_key',
        });
        scoresStore.createIndex('by-user-language', ['_userId', 'language_code']);

        // Pending score updates (auto-increment)
        const pendingScores = db.createObjectStore('pendingScoreUpdates', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingScores.createIndex('by-user', 'userId');
        pendingScores.createIndex('by-user-word', ['userId', 'wordId']);

        // Pending game sessions (auto-increment)
        const pendingSessions = db.createObjectStore('pendingGameSessions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingSessions.createIndex('by-user', 'userId');

        // Sync metadata
        db.createObjectStore('syncMeta', { keyPath: 'key' });
      },
    }).catch(err => {
      // Reset so next call retries instead of caching a rejected promise forever
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

// ─── Vocabulary Cache ────────────────────────────────────────

export async function cacheVocabulary(
  userId: string,
  languageCode: string,
  entries: DictionaryEntry[]
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('vocabulary', 'readwrite');

    // Clear old entries for this user+language
    const index = tx.store.index('by-user-language');
    let cursor = await index.openCursor([userId, languageCode]);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    // Write new entries
    const now = new Date().toISOString();
    for (const entry of entries) {
      await tx.store.put({
        ...entry,
        _key: `${userId}:${languageCode}:${entry.id}`,
        _userId: userId,
        _languageCode: languageCode,
        _cachedAt: now,
      } as any);
    }

    await tx.done;
    await setLastSyncTime(now);
  } catch (err) {
    console.warn('[offline-db] cacheVocabulary failed:', err);
  }
}

export async function getCachedVocabulary(
  userId: string,
  languageCode: string
): Promise<DictionaryEntry[]> {
  try {
    const db = await getDB();
    const records = await db.getAllFromIndex('vocabulary', 'by-user-language', [userId, languageCode]);
    // Strip internal fields
    return records.map(({ _userId, _languageCode, _cachedAt, _key, ...entry }: any) => entry as DictionaryEntry);
  } catch (err) {
    console.warn('[offline-db] getCachedVocabulary failed:', err);
    return [];
  }
}

export async function getCachedVocabularyCount(
  userId: string,
  languageCode: string
): Promise<number> {
  try {
    const db = await getDB();
    return db.countFromIndex('vocabulary', 'by-user-language', [userId, languageCode]);
  } catch (err) {
    console.warn('[offline-db] getCachedVocabularyCount failed:', err);
    return 0;
  }
}

// ─── Word Scores Cache ───────────────────────────────────────

export async function cacheWordScores(
  userId: string,
  languageCode: string,
  scores: WordScore[]
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('wordScores', 'readwrite');

    // Clear old scores for this user+language
    const index = tx.store.index('by-user-language');
    let cursor = await index.openCursor([userId, languageCode]);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    // Write new scores
    const now = new Date().toISOString();
    for (const score of scores) {
      await tx.store.put({
        ...score,
        _key: `${userId}:${score.word_id}`,
        _userId: userId,
        _cachedAt: now,
      } as any);
    }

    await tx.done;
  } catch (err) {
    console.warn('[offline-db] cacheWordScores failed:', err);
  }
}

export async function getCachedWordScores(
  userId: string,
  languageCode: string
): Promise<WordScore[]> {
  try {
    const db = await getDB();
    const records = await db.getAllFromIndex('wordScores', 'by-user-language', [userId, languageCode]);
    return records.map(({ _userId, _cachedAt, _key, ...score }: any) => score as WordScore);
  } catch (err) {
    console.warn('[offline-db] getCachedWordScores failed:', err);
    return [];
  }
}

export async function updateCachedWordScore(
  userId: string,
  score: WordScore
): Promise<void> {
  try {
    const db = await getDB();
    await db.put('wordScores', {
      ...score,
      _key: `${userId}:${score.word_id}`,
      _userId: userId,
      _cachedAt: new Date().toISOString(),
    } as any);
  } catch (err) {
    console.warn('[offline-db] updateCachedWordScore failed:', err);
  }
}

// ─── Pending Score Updates Queue ─────────────────────────────

export async function queueScoreUpdate(
  update: Omit<PendingScoreUpdate, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('pendingScoreUpdates', 'readwrite');

    // Deduplicate: remove older pending update for same user+word
    const index = tx.store.index('by-user-word');
    let cursor = await index.openCursor([update.userId, update.wordId]);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    // Add new update
    await tx.store.add({
      ...update,
      timestamp: new Date().toISOString(),
    } as PendingScoreUpdate);

    await tx.done;
  } catch (err) {
    console.warn('[offline-db] queueScoreUpdate failed:', err);
  }
}

export async function getPendingScoreUpdates(userId: string): Promise<PendingScoreUpdate[]> {
  try {
    const db = await getDB();
    return db.getAllFromIndex('pendingScoreUpdates', 'by-user', userId);
  } catch (err) {
    console.warn('[offline-db] getPendingScoreUpdates failed:', err);
    return [];
  }
}

export async function clearPendingScoreUpdates(userId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('pendingScoreUpdates', 'readwrite');
    const index = tx.store.index('by-user');
    let cursor = await index.openCursor(userId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } catch (err) {
    console.warn('[offline-db] clearPendingScoreUpdates failed:', err);
  }
}

// ─── Pending Game Sessions Queue ─────────────────────────────

export async function queueGameSession(
  session: Omit<PendingGameSession, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const db = await getDB();
    await db.add('pendingGameSessions', {
      ...session,
      // Generate client-side idempotency key if not provided
      clientSessionId: session.clientSessionId || `${session.userId}-${Date.now()}-${session.gameMode}`,
      timestamp: new Date().toISOString(),
    } as PendingGameSession);
  } catch (err) {
    console.warn('[offline-db] queueGameSession failed:', err);
  }
}

export async function getPendingGameSessions(userId: string): Promise<PendingGameSession[]> {
  try {
    const db = await getDB();
    return db.getAllFromIndex('pendingGameSessions', 'by-user', userId);
  } catch (err) {
    console.warn('[offline-db] getPendingGameSessions failed:', err);
    return [];
  }
}

export async function clearPendingGameSessions(userId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('pendingGameSessions', 'readwrite');
    const index = tx.store.index('by-user');
    let cursor = await index.openCursor(userId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } catch (err) {
    console.warn('[offline-db] clearPendingGameSessions failed:', err);
  }
}

export async function requeueGameSessions(sessions: PendingGameSession[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('pendingGameSessions', 'readwrite');
    for (const session of sessions) {
      const { id, ...data } = session;
      await tx.store.add(data as PendingGameSession);
    }
    await tx.done;
  } catch (err) {
    console.warn('[offline-db] requeueGameSessions failed:', err);
  }
}

// ─── Sync Metadata ───────────────────────────────────────────

export async function getLastSyncTime(): Promise<string | null> {
  try {
    const db = await getDB();
    const entry = await db.get('syncMeta', 'lastSync');
    return entry?.value ?? null;
  } catch (err) {
    console.warn('[offline-db] getLastSyncTime failed:', err);
    return null;
  }
}

export async function setLastSyncTime(time: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put('syncMeta', { key: 'lastSync', value: time });
  } catch (err) {
    console.warn('[offline-db] setLastSyncTime failed:', err);
  }
}

// ─── Utility ─────────────────────────────────────────────────

export async function getPendingCount(userId: string): Promise<number> {
  try {
    const db = await getDB();
    const scores = await db.countFromIndex('pendingScoreUpdates', 'by-user', userId);
    const sessions = await db.countFromIndex('pendingGameSessions', 'by-user', userId);
    return scores + sessions;
  } catch (err) {
    console.warn('[offline-db] getPendingCount failed:', err);
    return 0;
  }
}

export async function clearUserData(userId: string): Promise<void> {
  try {
    const db = await getDB();

    // Clear vocabulary
    const vocabTx = db.transaction('vocabulary', 'readwrite');
    let vocabCursor = await vocabTx.store.index('by-user-language').openCursor();
    while (vocabCursor) {
      if ((vocabCursor.value as any)._userId === userId) {
        await vocabCursor.delete();
      }
      vocabCursor = await vocabCursor.continue();
    }
    await vocabTx.done;

    // Clear scores
    const scoresTx = db.transaction('wordScores', 'readwrite');
    let scoresCursor = await scoresTx.store.index('by-user-language').openCursor();
    while (scoresCursor) {
      if ((scoresCursor.value as any)._userId === userId) {
        await scoresCursor.delete();
      }
      scoresCursor = await scoresCursor.continue();
    }
    await scoresTx.done;

    await clearPendingScoreUpdates(userId);
    await clearPendingGameSessions(userId);
  } catch (err) {
    console.warn('[offline-db] clearUserData failed:', err);
  }
}

// ─── Migration from localStorage ─────────────────────────────

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await getDB();
    const migrated = await db.get('syncMeta', 'migration-v1');
    if (migrated) return; // Already done

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        if (key.startsWith('love-languages-offline-vocabulary-')) {
          const data = JSON.parse(localStorage.getItem(key)!);
          if (data.entries?.length > 0) {
            await cacheVocabulary(data.userId, data.languageCode, data.entries);
          }
          keysToRemove.push(key);
        }

        if (key.startsWith('love-languages-offline-word-scores-')) {
          const data = JSON.parse(localStorage.getItem(key)!);
          if (data.scores?.length > 0) {
            await cacheWordScores(data.userId, data.languageCode, data.scores);
          }
          keysToRemove.push(key);
        }

        if (key.startsWith('love-languages-offline-scores-')) {
          const data = JSON.parse(localStorage.getItem(key)!);
          for (const score of data.scores || []) {
            await queueScoreUpdate({
              userId: data.userId,
              wordId: score.word_id,
              languageCode: score.language_code,
              totalAttempts: score.total_attempts,
              correctAttempts: score.correct_attempts,
              correctStreak: score.correct_streak,
              learnedAt: score.learned_at,
            });
          }
          keysToRemove.push(key);
        }

        if (key.startsWith('love-languages-offline-game-sessions-')) {
          const data = JSON.parse(localStorage.getItem(key)!);
          for (const session of data.sessions || []) {
            await queueGameSession({
              userId: data.userId,
              gameMode: session.gameMode,
              correctCount: session.correctCount,
              incorrectCount: session.incorrectCount,
              totalTimeSeconds: session.totalTimeSeconds,
              answers: session.answers,
              targetLanguage: session.targetLanguage,
              nativeLanguage: session.nativeLanguage,
            });
          }
          keysToRemove.push(key);
        }
      } catch {
        // Skip corrupt data
      }
    }

    // Migrate last sync time
    const lastSync = localStorage.getItem('love-languages-last-sync');
    if (lastSync) {
      await setLastSyncTime(lastSync);
      keysToRemove.push('love-languages-last-sync');
    }

    // Clean up localStorage
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    // Mark migration complete
    await db.put('syncMeta', { key: 'migration-v1', value: new Date().toISOString() });
  } catch (err) {
    console.warn('[offline-db] migrateFromLocalStorage failed:', err);
  }
}
