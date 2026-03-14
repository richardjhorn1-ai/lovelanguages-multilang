export interface ListenExtractionEntry {
  text: string;
  translation?: string | null;
  language?: string | null;
  languageCode?: string | null;
}

export interface ListenExtractionMessage {
  role: 'user';
  content: string;
}

function isTargetLike(entry: ListenExtractionEntry, targetLanguage: string): boolean {
  return (
    entry.language === 'target' ||
    entry.language === 'mixed' ||
    entry.language === targetLanguage ||
    entry.languageCode === targetLanguage
  );
}

function isNativeLike(entry: ListenExtractionEntry, nativeLanguage: string): boolean {
  return (
    entry.language === 'native' ||
    entry.language === nativeLanguage ||
    entry.languageCode === nativeLanguage
  );
}

export function buildListenExtractionMessages(
  entries: ListenExtractionEntry[],
  targetLanguage: string,
  nativeLanguage: string
): ListenExtractionMessage[] {
  return entries.flatMap((entry) => {
    const text = entry.text?.trim();
    const translation = entry.translation?.trim();

    if (!text) return [];

    // If the original utterance was native-language speech, prefer the translated
    // target-language text for vocabulary harvesting and keep the original as context.
    if (isNativeLike(entry, nativeLanguage) && translation) {
      return [{
        role: 'user' as const,
        content: `TARGET_TEXT: ${translation}\nORIGINAL_NATIVE: ${text}`,
      }];
    }

    // For target or mixed speech, the original text is the extraction source.
    if (isTargetLike(entry, targetLanguage)) {
      return [{
        role: 'user' as const,
        content: translation
          ? `TARGET_TEXT: ${text}\nNATIVE_GLOSS: ${translation}`
          : `TARGET_TEXT: ${text}`,
      }];
    }

    // Unknown language: fall back to the original text, but preserve the gloss if present.
    return [{
      role: 'user' as const,
      content: translation
        ? `TARGET_TEXT: ${text}\nNATIVE_GLOSS: ${translation}`
        : `TARGET_TEXT: ${text}`,
    }];
  });
}
