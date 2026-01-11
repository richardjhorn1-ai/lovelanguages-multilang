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

// Legacy: Get available Polish voices (for backward compatibility)
export const getPolishVoices = (): SpeechSynthesisVoice[] => {
  return getVoicesForLanguage('pl');
};

// Fallback: Browser Web Speech API (language-aware)
const fallbackSpeak = (text: string, languageCode: string = 'pl', rate: number = 0.85): void => {
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

// Legacy fallback for Polish (backward compatibility)
const fallbackSpeakPolish = (text: string, rate: number = 0.85): void => {
  fallbackSpeak(text, 'pl', rate);
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

/**
 * Speak text in any supported language using Google Cloud TTS
 * Falls back to browser TTS if API fails
 */
export const speak = async (text: string, languageCode: string = 'pl', rate: number = 0.85): Promise<void> => {
  if (!text || !text.trim()) {
    console.warn('[audio] Empty text provided');
    return;
  }

  try {
    const headers = await getAuthHeaders();

    // Check if user is authenticated
    if (!headers.Authorization || headers.Authorization === 'Bearer ') {
      fallbackSpeak(text, languageCode, rate);
      return;
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: text.trim(), languageCode })
    });

    if (!response.ok) {
      console.warn('[audio] TTS API error:', response.status);
      fallbackSpeak(text, languageCode, rate);
      return;
    }

    const data = await response.json();

    // Play audio from URL or base64 data
    if (data.url) {
      await playAudio(data.url);
    } else if (data.audioData) {
      await playAudio(undefined, data.audioData);
    } else {
      fallbackSpeak(text, languageCode, rate);
    }

  } catch (error) {
    console.warn('[audio] TTS failed, using fallback:', error);
    fallbackSpeak(text, languageCode, rate);
  }
};

/**
 * Legacy: Speak Polish text (backward compatibility)
 * Use speak(text, languageCode) for multi-language support
 */
export const speakPolish = async (text: string, rate: number = 0.85): Promise<void> => {
  return speak(text, 'pl', rate);
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
