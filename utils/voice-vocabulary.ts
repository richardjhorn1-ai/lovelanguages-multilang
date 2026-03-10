export interface VoiceVocabularyMessage {
  role: string;
  content: string;
}

export const MAX_VOICE_EXTRACTION_MESSAGES = 24;
export const MAX_VOICE_EXTRACTION_CHARS = 6000;

export function selectVoiceMessagesForExtraction(
  messages: VoiceVocabularyMessage[],
  maxMessages = MAX_VOICE_EXTRACTION_MESSAGES,
  maxChars = MAX_VOICE_EXTRACTION_CHARS
): VoiceVocabularyMessage[] {
  const meaningfulMessages = messages.filter((message) => {
    return Boolean(message.content?.trim()) && !message.content.includes('[Media Attached]');
  });

  if (meaningfulMessages.length <= maxMessages) {
    return meaningfulMessages;
  }

  const selected: VoiceVocabularyMessage[] = [];
  let charCount = 0;

  for (let index = meaningfulMessages.length - 1; index >= 0; index -= 1) {
    const message = meaningfulMessages[index];
    const messageChars = message.content.trim().length;

    if (selected.length >= maxMessages) {
      break;
    }

    if (selected.length > 0 && charCount + messageChars > maxChars) {
      break;
    }

    selected.unshift(message);
    charCount += messageChars;
  }

  return selected;
}
