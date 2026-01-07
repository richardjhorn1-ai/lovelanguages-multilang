/**
 * Audio utilities for Polish text-to-speech
 * Uses Google Cloud TTS via API with browser fallback
 */

import { supabase } from './supabase';

// Current audio element for playback control
let currentAudio: HTMLAudioElement | null = null;

// Check if speech synthesis is available (for fallback)
export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Get available Polish voices (for fallback)
export const getPolishVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  return speechSynthesis.getVoices().filter(voice =>
    voice.lang.startsWith('pl')
  );
};

// Fallback: Browser Web Speech API
const fallbackSpeakPolish = (text: string, rate: number = 0.85): void => {
  if (!isSpeechSupported()) {
    console.warn('[audio] Speech synthesis not supported');
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pl-PL';
  utterance.rate = rate;

  const polishVoices = getPolishVoices();
  if (polishVoices.length > 0) {
    const preferredVoice = polishVoices.find(v => v.name.toLowerCase().includes('female'))
      || polishVoices[0];
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

/**
 * Speak a Polish word or phrase using Google Cloud TTS
 * Falls back to browser TTS if API fails
 */
export const speakPolish = async (text: string, rate: number = 0.85): Promise<void> => {
  if (!text || !text.trim()) {
    console.warn('[audio] Empty text provided');
    return;
  }

  try {
    const headers = await getAuthHeaders();

    // Check if user is authenticated
    if (!headers.Authorization || headers.Authorization === 'Bearer ') {
      fallbackSpeakPolish(text, rate);
      return;
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: text.trim() })
    });

    if (!response.ok) {
      console.warn('[audio] TTS API error:', response.status);
      fallbackSpeakPolish(text, rate);
      return;
    }

    const data = await response.json();

    // Play audio from URL or base64 data
    if (data.url) {
      await playAudio(data.url);
    } else if (data.audioData) {
      await playAudio(undefined, data.audioData);
    } else {
      fallbackSpeakPolish(text, rate);
    }

  } catch (error) {
    console.warn('[audio] TTS failed, using fallback:', error);
    fallbackSpeakPolish(text, rate);
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
