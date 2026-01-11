/**
 * Romantic phrases service with caching and usage tracking
 * Generates phrases dynamically via AI, caches locally
 */

import { supabase } from './supabase';
import { RomanticPhrase } from '../types';

interface PhraseCache {
  targetLanguage: string;
  nativeLanguage: string;
  phrases: RomanticPhrase[];
  usedIds: string[];
  generatedAt: number;
}

const CACHE_KEY = 'romantic_phrases_cache_v1';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get romantic phrases for a language pair
 * Returns cached phrases if available, generates new ones if needed
 */
export async function getRomanticPhrases(
  targetLanguage: string,
  nativeLanguage: string,
  count: number = 20,
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): Promise<RomanticPhrase[]> {
  const cache = loadCache(targetLanguage, nativeLanguage);

  // Filter by difficulty if specified
  let availablePhrases = cache.phrases;
  if (difficulty) {
    availablePhrases = availablePhrases.filter(p => p.difficulty === difficulty);
  }

  // Get unused phrases
  const unusedPhrases = availablePhrases.filter(p => !cache.usedIds.includes(p.id));

  // If we have enough unused phrases, return them
  if (unusedPhrases.length >= count) {
    return shuffleArray(unusedPhrases).slice(0, count);
  }

  // Need to generate more phrases
  const existingWords = cache.phrases.map(p => p.word);
  const needed = Math.max(count - unusedPhrases.length, 10); // Generate at least 10 extra

  try {
    const newPhrases = await generatePhrases(
      targetLanguage,
      nativeLanguage,
      needed + 10, // Buffer for filtering
      existingWords,
      difficulty
    );

    // Add to cache
    cache.phrases = [...cache.phrases, ...newPhrases];
    cache.generatedAt = Date.now();
    saveCache(cache);

    // Return mix of unused old + new
    const allUnused = [...unusedPhrases, ...newPhrases].filter(p =>
      !difficulty || p.difficulty === difficulty
    );
    return shuffleArray(allUnused).slice(0, count);
  } catch (error) {
    console.error('Failed to generate romantic phrases:', error);
    // Return whatever we have
    return shuffleArray(unusedPhrases);
  }
}

/**
 * Get count of available phrases (for UI display)
 */
export function getAvailablePhraseCount(
  targetLanguage: string,
  nativeLanguage: string
): number {
  const cache = loadCache(targetLanguage, nativeLanguage);
  const unusedCount = cache.phrases.filter(p => !cache.usedIds.includes(p.id)).length;
  // Return at least 20 to indicate "more available via generation"
  return Math.max(unusedCount, 20);
}

/**
 * Mark phrases as used after completing a challenge
 */
export function markPhrasesUsed(
  targetLanguage: string,
  nativeLanguage: string,
  phraseIds: string[]
): void {
  const cache = loadCache(targetLanguage, nativeLanguage);
  cache.usedIds = [...new Set([...cache.usedIds, ...phraseIds])];
  saveCache(cache);
}

/**
 * Reset used tracking (allow all phrases again)
 */
export function resetUsedPhrases(
  targetLanguage: string,
  nativeLanguage: string
): void {
  const cache = loadCache(targetLanguage, nativeLanguage);
  cache.usedIds = [];
  saveCache(cache);
}

/**
 * Clear entire cache for a language pair
 */
export function clearPhraseCache(
  targetLanguage: string,
  nativeLanguage: string
): void {
  const cache = loadCache(targetLanguage, nativeLanguage);
  cache.phrases = [];
  cache.usedIds = [];
  cache.generatedAt = 0;
  saveCache(cache);
}

// Internal: Generate new phrases via API
async function generatePhrases(
  targetLanguage: string,
  nativeLanguage: string,
  count: number,
  excludePhrases: string[],
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): Promise<RomanticPhrase[]> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/generate-romantic-phrases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      targetLanguage,
      nativeLanguage,
      count,
      excludePhrases: excludePhrases.slice(0, 100), // Limit to avoid huge payloads
      difficulty
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to generate phrases');
  }

  const data = await response.json();
  return data.phrases || [];
}

// Cache helpers
function getCacheKey(targetLanguage: string, nativeLanguage: string): string {
  return `${CACHE_KEY}_${targetLanguage}_${nativeLanguage}`;
}

function loadCache(targetLanguage: string, nativeLanguage: string): PhraseCache {
  try {
    const key = getCacheKey(targetLanguage, nativeLanguage);
    const raw = localStorage.getItem(key);

    if (raw) {
      const cache = JSON.parse(raw) as PhraseCache;

      // Check if cache is still valid
      if (Date.now() - cache.generatedAt < CACHE_MAX_AGE) {
        return cache;
      }
    }
  } catch (e) {
    console.error('Failed to load phrase cache:', e);
  }

  // Return empty cache
  return {
    targetLanguage,
    nativeLanguage,
    phrases: [],
    usedIds: [],
    generatedAt: 0
  };
}

function saveCache(cache: PhraseCache): void {
  try {
    const key = getCacheKey(cache.targetLanguage, cache.nativeLanguage);
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save phrase cache:', e);
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
