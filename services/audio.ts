/**
 * Audio utilities for Polish text-to-speech
 * Uses Web Speech API with Polish voice
 */

// Check if speech synthesis is available
export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Get available Polish voices
export const getPolishVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  return speechSynthesis.getVoices().filter(voice =>
    voice.lang.startsWith('pl')
  );
};

// Speak a Polish word or phrase
export const speakPolish = (text: string, rate: number = 0.85): void => {
  if (!isSpeechSupported()) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pl-PL';
  utterance.rate = rate; // Slightly slower for learning

  // Try to find a Polish voice
  const polishVoices = getPolishVoices();
  if (polishVoices.length > 0) {
    // Prefer female voice if available (often clearer for language learning)
    const preferredVoice = polishVoices.find(v => v.name.toLowerCase().includes('female'))
      || polishVoices[0];
    utterance.voice = preferredVoice;
  }

  speechSynthesis.speak(utterance);
};

// Stop any ongoing speech
export const stopSpeaking = (): void => {
  if (isSpeechSupported()) {
    speechSynthesis.cancel();
  }
};

// Check if currently speaking
export const isSpeaking = (): boolean => {
  if (!isSpeechSupported()) return false;
  return speechSynthesis.speaking;
};
