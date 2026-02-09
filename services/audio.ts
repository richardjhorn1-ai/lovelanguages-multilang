/**
 * Audio utilities for multi-language text-to-speech
 * Uses Google Cloud TTS via API with browser fallback
 */

import { supabase } from './supabase';
import { LANGUAGE_CONFIGS } from '../constants/language-config';

// Current audio element for playback control
let currentAudio: HTMLAudioElement | null = null;

// Check if speech synthesis is available (for fallback)
export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Get available voices for a language (for fallback)
export const getVoicesForLanguage = (languageCode: string): SpeechSynthesisVoice[] => {
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

export interface SpeakResult {
  success: boolean;
  source: 'cloud' | 'browser' | 'none';
  error?: string;
}

/**
 * Speak text in any supported language using Google Cloud TTS.
 * Only falls back to browser TTS for unauthenticated users.
 * Returns result indicating success/failure and audio source.
 */
export const speak = async (text: string, languageCode: string, rate: number = 0.85): Promise<SpeakResult> => {
  if (!text || !text.trim()) {
    console.warn('[audio] Empty text provided');
    return { success: false, source: 'none', error: 'No text provided' };
  }

  try {
    const headers = await getAuthHeaders();

    // Unauthenticated users get browser TTS (only valid fallback case)
    if (!headers.Authorization || headers.Authorization === 'Bearer ') {
      fallbackSpeak(text, languageCode, rate);
      return { success: true, source: 'browser' };
    }

    const response = await fetch('/api/tts', {
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

    // Play audio from URL or base64 data
    if (data.url) {
      await playAudio(data.url);
      return { success: true, source: 'cloud' };
    } else if (data.audioData) {
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

// Stop any ongoing speech
export const stopSpeaking = (): void => {
  // Stop Cloud TTS audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Stop browser TTS
  if (isSpeechSupported()) {
    speechSynthesis.cancel();
  }
};

// Check if currently speaking
export const isSpeaking = (): boolean => {
  // Check Cloud TTS audio
  if (currentAudio && !currentAudio.paused) {
    return true;
  }

  // Check browser TTS
  if (isSpeechSupported() && speechSynthesis.speaking) {
    return true;
  }

  return false;
};
