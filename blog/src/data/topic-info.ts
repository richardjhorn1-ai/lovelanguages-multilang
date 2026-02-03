/**
 * Topic Information Helper
 *
 * Maps topic slugs to their display names using UI translations
 */

import { getUITranslations } from './ui-translations';

export const TOPICS = [
  'pet-names',
  'i-love-you',
  'pronunciation',
  'grammar-basics',
  'essential-phrases',
  'romantic-phrases',
] as const;

export type TopicSlug = typeof TOPICS[number];

export interface TopicInfo {
  slug: TopicSlug;
  icon: string;
  getDisplayName: (nativeLang: string) => string;
}

/**
 * Get the translated display name for a topic
 */
export function getTopicDisplayName(topicSlug: string, nativeLang: string): string {
  const text = getUITranslations(nativeLang);

  switch (topicSlug) {
    case 'pet-names':
      return text.topicPetNames;
    case 'i-love-you':
      return text.topicILoveYou;
    case 'pronunciation':
      return text.topicPronunciation;
    case 'grammar-basics':
      return text.topicGrammar;
    case 'essential-phrases':
      return text.topicEssentialPhrases;
    case 'romantic-phrases':
      return text.topicRomanticPhrases;
    default:
      return topicSlug;
  }
}

/**
 * Get topic icon by slug
 */
export function getTopicIcon(topicSlug: string): string {
  switch (topicSlug) {
    case 'pet-names':
      return '💕';
    case 'i-love-you':
      return '❤️';
    case 'pronunciation':
      return '🗣️';
    case 'grammar-basics':
      return '📝';
    case 'essential-phrases':
      return '💬';
    case 'romantic-phrases':
      return '💘';
    default:
      return '📚';
  }
}

/**
 * Get all topics with their info
 */
export function getAllTopics(): { slug: TopicSlug; icon: string }[] {
  return TOPICS.map(slug => ({
    slug,
    icon: getTopicIcon(slug),
  }));
}

/**
 * Check if a topic slug is valid
 */
export function isValidTopic(slug: string): slug is TopicSlug {
  return TOPICS.includes(slug as TopicSlug);
}
