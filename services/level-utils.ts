// Level Calculation Utilities
// Functions for calculating user level from XP and determining progression

import { LEVEL_TIERS, QUESTION_COUNTS, PASS_THRESHOLD, LevelTier } from '../constants/levels';

// Tier names used internally (keep as English keys for lookups)
const TIER_NAMES = ['Beginner', 'Elementary', 'Conversational', 'Proficient', 'Fluent', 'Master'] as const;

/**
 * Translate a level display name like "Beginner 2" using the provided translation function
 * @param displayName - The level display name (e.g., "Beginner 2", "Master 3")
 * @param t - Translation function from i18next
 * @returns Translated level name (e.g., "Principiante 2" for Spanish)
 */
export function translateLevel(displayName: string | null | undefined, t: (key: string) => string): string {
  if (!displayName) return '';

  // Parse the display name (e.g., "Beginner 2" -> tier: "Beginner", level: 2)
  const match = displayName.match(/^(.+)\s+(\d)$/);
  if (!match) return displayName;

  const tier = match[1];
  const level = match[2];

  // Get translated tier name
  const translatedTier = t(`progress.tiers.${tier}`);

  // If translation not found, return original
  if (translatedTier === `progress.tiers.${tier}`) {
    return displayName;
  }

  return `${translatedTier} ${level}`;
}

/**
 * Translate a tier name like "Beginner" using the provided translation function
 * @param tier - The tier name (e.g., "Beginner", "Master")
 * @param t - Translation function from i18next
 * @returns Translated tier name
 */
export function translateTier(tier: string | null | undefined, t: (key: string) => string): string {
  if (!tier) return '';

  const translatedTier = t(`progress.tiers.${tier}`);

  // If translation not found, return original
  if (translatedTier === `progress.tiers.${tier}`) {
    return tier;
  }

  return translatedTier;
}

export interface LevelInfo {
  tier: string;           // e.g., "Beginner"
  level: number;          // 1, 2, or 3
  displayName: string;    // e.g., "Beginner 2"
  xpInTier: number;       // XP accumulated within current tier
  xpForCurrentLevel: number; // XP accumulated within current sub-level
  xpToNextLevel: number;  // XP needed to reach next sub-level threshold
  totalXp: number;        // Total XP
  canTakeTest: boolean;   // Has enough XP to attempt level-up test
  nextLevel: string | null; // Next level display name, null if at max
}

/**
 * Calculate the user's current level information from their total XP
 */
export function getLevelFromXP(xp: number): LevelInfo {
  // Find the current tier
  let currentTier: LevelTier | null = null;

  for (const tier of LEVEL_TIERS) {
    const [min, max] = tier.xpRange;
    if (xp >= min && xp < max) {
      currentTier = tier;
      break;
    }
  }

  // If no tier found, user is at max level (Master 3)
  if (!currentTier) {
    const masterTier = LEVEL_TIERS[LEVEL_TIERS.length - 1];
    return {
      tier: 'Master',
      level: 3,
      displayName: 'Master 3',
      xpInTier: xp - masterTier.xpRange[0],
      xpForCurrentLevel: xp - masterTier.subLevelThresholds[2],
      xpToNextLevel: 0,
      totalXp: xp,
      canTakeTest: false,
      nextLevel: null
    };
  }

  // Calculate sub-level within tier
  const thresholds = currentTier.subLevelThresholds;
  let subLevel = 1;

  if (xp >= thresholds[2]) {
    subLevel = 3;
  } else if (xp >= thresholds[1]) {
    subLevel = 2;
  } else {
    subLevel = 1;
  }

  // Calculate XP within tier and sub-level
  const xpInTier = xp - currentTier.xpRange[0];
  const xpForCurrentLevel = xp - thresholds[subLevel - 1];

  // Calculate XP needed for next level
  let xpToNextLevel: number;
  let nextLevel: string | null;
  let canTakeTest: boolean;

  if (subLevel < 3) {
    // Next level is within same tier
    xpToNextLevel = thresholds[subLevel] - xp;
    nextLevel = `${currentTier.tier} ${subLevel + 1}`;
    canTakeTest = xp >= thresholds[subLevel]; // At or past threshold for next level
  } else {
    // Need to move to next tier
    const tierIndex = LEVEL_TIERS.indexOf(currentTier);
    if (tierIndex < LEVEL_TIERS.length - 1) {
      const nextTier = LEVEL_TIERS[tierIndex + 1];
      xpToNextLevel = nextTier.xpRange[0] - xp;
      nextLevel = `${nextTier.tier} 1`;
      canTakeTest = xp >= currentTier.xpRange[1]; // At or past tier end
    } else {
      xpToNextLevel = 0;
      nextLevel = null;
      canTakeTest = false;
    }
  }

  return {
    tier: currentTier.tier,
    level: subLevel,
    displayName: `${currentTier.tier} ${subLevel}`,
    xpInTier,
    xpForCurrentLevel,
    xpToNextLevel,
    totalXp: xp,
    canTakeTest: xpToNextLevel <= 0, // Can take test if at or past threshold
    nextLevel
  };
}

/**
 * Check if user can take a level-up test
 * They must have reached the XP threshold for their next level
 */
export function canTakeLevelTest(xp: number, currentLevel: string): boolean {
  const info = getLevelFromXP(xp);
  // If displayName matches and there's a next level, check if at threshold
  return info.displayName === currentLevel && info.canTakeTest && info.nextLevel !== null;
}

/**
 * Get the next level name from current level
 */
export function getNextLevel(currentLevel: string): string | null {
  // Parse current level (e.g., "Beginner 2" -> tier: "Beginner", level: 2)
  const match = currentLevel.match(/^(.+)\s+(\d)$/);
  if (!match) return null;

  const tier = match[1];
  const level = parseInt(match[2], 10);

  if (level < 3) {
    return `${tier} ${level + 1}`;
  }

  // Find next tier
  const tierIndex = LEVEL_TIERS.findIndex(t => t.tier === tier);
  if (tierIndex >= 0 && tierIndex < LEVEL_TIERS.length - 1) {
    return `${LEVEL_TIERS[tierIndex + 1].tier} 1`;
  }

  return null;
}

/**
 * Get the number of questions for a level test based on tier
 */
export function getQuestionCount(tier: string): number {
  return QUESTION_COUNTS[tier] || 30;
}

/**
 * Get the pass threshold percentage
 */
export function getPassThreshold(): number {
  return PASS_THRESHOLD;
}

/**
 * Calculate if a score passes the test
 */
export function didPass(correctAnswers: number, totalQuestions: number): boolean {
  const percentage = (correctAnswers / totalQuestions) * 100;
  return percentage >= PASS_THRESHOLD;
}

/**
 * Get XP thresholds for a tier
 */
export function getTierThresholds(tier: string): { min: number; max: number } | null {
  const tierData = LEVEL_TIERS.find(t => t.tier === tier);
  if (!tierData) return null;

  return {
    min: tierData.xpRange[0],
    max: tierData.xpRange[1]
  };
}

/**
 * Calculate progress percentage within current sub-level
 * Useful for progress bars
 */
export function getLevelProgress(xp: number): number {
  const info = getLevelFromXP(xp);

  if (info.xpToNextLevel === 0) return 100;

  const levelRange = info.xpForCurrentLevel + info.xpToNextLevel;
  if (levelRange === 0) return 100;

  return Math.min(100, Math.round((info.xpForCurrentLevel / levelRange) * 100));
}

/**
 * Get display color for a tier (for UI theming)
 * Uses brand color consistently across all levels
 */
export function getTierColor(tier: string): string {
  // Brand color used consistently across all tiers
  return '#FF4761'; // Rose (brand color)
}

/**
 * Get tier index (0-5) for sorting/comparison
 */
export function getTierIndex(tier: string): number {
  const index = LEVEL_TIERS.findIndex(t => t.tier === tier);
  return index >= 0 ? index : 0;
}

/**
 * Compare two levels, returns -1, 0, or 1
 */
export function compareLevels(level1: string, level2: string): number {
  const match1 = level1.match(/^(.+)\s+(\d)$/);
  const match2 = level2.match(/^(.+)\s+(\d)$/);

  if (!match1 || !match2) return 0;

  const tier1Index = getTierIndex(match1[1]);
  const tier2Index = getTierIndex(match2[1]);

  if (tier1Index !== tier2Index) {
    return tier1Index < tier2Index ? -1 : 1;
  }

  const subLevel1 = parseInt(match1[2], 10);
  const subLevel2 = parseInt(match2[2], 10);

  if (subLevel1 !== subLevel2) {
    return subLevel1 < subLevel2 ? -1 : 1;
  }

  return 0;
}
