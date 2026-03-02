/**
 * Audio utilities for multi-language text-to-speech
 * Uses Google Cloud TTS via API with browser fallback
 */

import { supabase } from './supabase';
import { apiFetch } from './api-config';
import { LANGUAGE_CONFIGS } from '../constants/language-config';

// Current audio element for playback control
let currentAudio: HTMLAudioElement | null = null;

// Global TTS cache: "text:lang" → audio data
// Any speak() call caches its result; repeated plays are instant across the entire app
const ttsCache = new Map<string, { url?: string; base64?: string }>();
const ttsCacheKey = (text: string, lang: string) => `${text.trim().toLowerCase()}:${lang}`;

// Check if speech synthesis is available (for fallback)
const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Get available voices for a language (for fallback)
const getVoicesForLanguage = (languageCode: string): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  const config = LANGUAGE_CONFIGS[languageCode];
  const ttsCode = config?.ttsCode || languageCode;
  return speechSynthesis.getVoices().filter(voice =>
    voice.lang.startsWith(ttsCode.split('-')[0])
  );
};

// Fallback: Browser Web Speech API (language-aware)
const fallbackSpeak = (text: string, languageCode: string, rate: number = 0.85): void => {
  if (!isSpeechSupported()) {
    console.warn('[audio] Speech synthesis not supported');
    return;
  }

  speechSynthesis.cancel();

  const config = LANGUAGE_CONFIGS[languageCode];
  const ttsCode = config?.ttsCode || `${languageCode}-${languageCode.toUpperCase()}`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = ttsCode;
  utterance.rate = rate;

  const voices = getVoicesForLanguage(languageCode);
  if (voices.length > 0) {
    const preferredVoice = voices.find(v => v.name.toLowerCase().includes('female'))
      || voices[0];
    utterance.voice = preferredVoice;
  }

  speechSynthesis.speak(utterance);
};

// Get auth headers for API calls
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`
  };
}

// Play audio from URL or base64
function playAudio(url?: string, base64Data?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stop any current audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    let audioSrc: string;
    if (url) {
      audioSrc = url;
    } else if (base64Data) {
      audioSrc = `data:audio/mpeg;base64,${base64Data}`;
    } else {
      reject(new Error('No audio source provided'));
      return;
    }

    const audio = new Audio(audioSrc);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      resolve();
    };

    audio.onerror = (e) => {
      currentAudio = null;
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch(reject);
  });
}

interface SpeakResult {
  success: boolean;
  source: 'cloud' | 'browser' | 'none';
  error?: string;
}

/**
 * Speak text in any supported language using Google Cloud TTS.
 * Only falls back to browser TTS for unauthenticated users.
 * Returns result indicating success/failure and audio source.
 */
/**
 * Prefetch audio for a word/phrase so speak() plays instantly later.
 * Safe to call multiple times — skips if already cached.
 * Fire-and-forget: failures are silent (speak() will fetch on demand).
 */
export const prefetchAudio = async (text: string, languageCode: string): Promise<void> => {
  if (!text?.trim()) return;
  const key = ttsCacheKey(text, languageCode);
  if (ttsCache.has(key)) return; // already cached

  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization || headers.Authorization === 'Bearer ') return;

    const response = await apiFetch('/api/tts/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: text.trim(), targetLanguage: languageCode })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) ttsCache.set(key, { url: data.url });
      else if (data.audioData) ttsCache.set(key, { base64: data.audioData });
    }
  } catch {
    /* silent — speak() will fetch on demand if prefetch fails */
  }
};

export const speak = async (text: string, languageCode: string, rate: number = 0.85): Promise<SpeakResult> => {
  if (!text || !text.trim()) {
    console.warn('[audio] Empty text provided');
    return { success: false, source: 'none', error: 'No text provided' };
  }

  try {
    // Check cache first — instant playback for repeated words
    const cacheKey = ttsCacheKey(text, languageCode);
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      await playAudio(cached.url, cached.base64);
      return { success: true, source: 'cloud' };
    }

    const headers = await getAuthHeaders();

    // Unauthenticated users get browser TTS (only valid fallback case)
    if (!headers.Authorization || headers.Authorization === 'Bearer ') {
      fallbackSpeak(text, languageCode, rate);
      return { success: true, source: 'browser' };
    }

    const response = await apiFetch('/api/tts/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: text.trim(), targetLanguage: languageCode })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `TTS request failed (${response.status})`;
      console.error('[audio] TTS API error:', response.status, errorMsg);

      // Rate limit - don't fall back, inform the user
      if (response.status === 429) {
        return { success: false, source: 'none', error: errorMsg };
      }

      // Other server errors - don't silently degrade
      return { success: false, source: 'none', error: errorMsg };
    }

    const data = await response.json();

    // Play audio from URL or base64 data, and cache the result
    if (data.url) {
      ttsCache.set(cacheKey, { url: data.url });
      await playAudio(data.url);
      return { success: true, source: 'cloud' };
    } else if (data.audioData) {
      ttsCache.set(cacheKey, { base64: data.audioData });
      await playAudio(undefined, data.audioData);
      return { success: true, source: 'cloud' };
    } else {
      return { success: false, source: 'none', error: 'No audio data received' };
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[audio] TTS failed:', errorMsg);
    return { success: false, source: 'none', error: errorMsg };
  }
};

