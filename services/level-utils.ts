// Level Calculation Utilities
// Functions for calculating user level from XP and determining progression

import { LEVEL_TIERS, LevelTier } from '../constants/levels';

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

