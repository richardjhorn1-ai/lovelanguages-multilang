export const FPS = 30;

// Convert seconds to frames
export const secondsToFrames = (seconds: number) => Math.round(seconds * FPS);

// Scene timings (expanded to ~90 seconds for better pacing)
export const SCENES = {
  hero: { start: 0, duration: secondsToFrames(7) },                    // 0-7s (intro + tagline)
  languages: { start: secondsToFrames(7), duration: secondsToFrames(8) },      // 7-15s (flags + counter)
  loveGifts: { start: secondsToFrames(15), duration: secondsToFrames(12) },    // 15-27s (gift flow)
  challenge: { start: secondsToFrames(27), duration: secondsToFrames(12) },    // 27-39s (quiz flow)
  loveLog: { start: secondsToFrames(39), duration: secondsToFrames(8) },       // 39-47s (vocabulary)
  games: { start: secondsToFrames(47), duration: secondsToFrames(14) },        // 47-61s (3 game modes)
  progress: { start: secondsToFrames(61), duration: secondsToFrames(10) },     // 61-71s (tracking)
  aiChat: { start: secondsToFrames(71), duration: secondsToFrames(10) },       // 71-81s (AI context)
  cta: { start: secondsToFrames(81), duration: secondsToFrames(7) },           // 81-88s (final CTA)
};

export const TOTAL_DURATION = secondsToFrames(88); // ~88 seconds

// Transition duration between scenes
export const TRANSITION_FRAMES = 15;
