import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { BeatPulse } from '../components/BeatPulse';

// Game mode definitions
const GAMES = [
  { name: 'Flashcards', emoji: '🎴', color: COLORS.accentPink },
  { name: 'Multiple Choice', emoji: '✅', color: '#10b981' },
  { name: 'Type It', emoji: '⌨️', color: '#3B82F6' },
  { name: 'Quick Fire', emoji: '⚡', color: '#F59E0B' },
  { name: 'Voice Chat', emoji: '🎙️', color: '#8B5CF6' },
  { name: 'AI Challenge', emoji: '🤖', color: '#06b6d4' },
  { name: 'Verb Mastery', emoji: '📝', color: '#EC4899' },
];

// Scene timing - rapid game cycling
const GAME_DURATION = 45; // Frames per game
const GAME_START = 30; // Start showing games after caption
const OUTRO_START = GAME_START + GAMES.length * GAME_DURATION;

export const Scene6Games: React.FC = () => {
  const frame = useCurrentFrame();

  // Game cycling
  const gameFrame = Math.max(0, frame - GAME_START);
  const currentGameIndex = Math.floor(gameFrame / GAME_DURATION);
  const gameLocalFrame = gameFrame % GAME_DURATION;
  const safeGameIndex = Math.max(0, Math.min(currentGameIndex, GAMES.length - 1));
  const currentGame = GAMES[safeGameIndex];

  const showGames = frame >= GAME_START && frame < OUTRO_START;
  const showOutro = frame >= OUTRO_START;

  // Card animation
  const cardScale = spring({
    frame: gameLocalFrame,
    fps: FPS,
    config: { damping: 12, stiffness: 100 },
  });

  const cardOpacity = interpolate(
    gameLocalFrame,
    [0, 8, GAME_DURATION - 10, GAME_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary, overflow: 'hidden' }}>
      <AnimatedGradient style="wave" />
      <FloatingHearts count={10} />

      <Caption
        text="7 Ways to Practice"
        subtext="Master vocabulary your way"
        startFrame={10}
        position="top"
        style="highlight"
      />

      {/* Game cycling - large centered cards */}
      {showGames && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Game name label - large and prominent */}
          <div
            style={{
              transform: `scale(${Math.max(0, cardScale)})`,
              opacity: cardOpacity,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '20px 40px',
                backgroundColor: `${currentGame.color}15`,
                borderRadius: 30,
                border: `3px solid ${currentGame.color}`,
              }}
            >
              <span style={{ fontSize: 48 }}>{currentGame.emoji}</span>
              <span
                style={{
                  fontFamily: FONTS.header,
                  fontSize: 48,
                  fontWeight: 700,
                  color: currentGame.color,
                }}
              >
                {currentGame.name}
              </span>
            </div>
          </div>

          {/* Large game card */}
          <div
            style={{
              transform: `scale(${Math.max(0, cardScale)})`,
              opacity: cardOpacity,
            }}
          >
            <div
              style={{
                width: 600,
                height: 450,
                backgroundColor: COLORS.bgCard,
                borderRadius: 48,
                border: `5px solid ${currentGame.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `
                  0 30px 80px ${currentGame.color}40,
                  0 12px 32px rgba(0,0,0,0.1)
                `,
              }}
            >
              {/* Large emoji */}
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 45,
                  backgroundColor: `${currentGame.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 100,
                }}
              >
                {currentGame.emoji}
              </div>
            </div>
          </div>

          {/* Progress indicator - at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 200,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 14,
            }}
          >
            {GAMES.map((game, i) => (
              <div
                key={game.name}
                style={{
                  width: i === safeGameIndex ? 40 : 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: i <= safeGameIndex ? game.color : COLORS.accentBorder,
                  boxShadow: i === safeGameIndex ? `0 0 20px ${game.color}` : 'none',
                }}
              />
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* Outro - all games grid */}
      {showOutro && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 200,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
              maxWidth: 700,
            }}
          >
            {GAMES.map((game, i) => {
              const itemScale = spring({
                frame: frame - OUTRO_START - i * 4,
                fps: FPS,
                config: { damping: 12, stiffness: 100 },
              });
              return (
                <div
                  key={game.name}
                  style={{
                    width: i === 6 ? 340 : 160,
                    gridColumn: i === 6 ? 'span 2' : 'span 1',
                    backgroundColor: COLORS.bgCard,
                    borderRadius: 24,
                    padding: 20,
                    textAlign: 'center',
                    border: `3px solid ${game.color}`,
                    boxShadow: `0 8px 24px ${game.color}30`,
                    transform: `scale(${Math.max(0, itemScale)})`,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: `${game.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      margin: '0 auto 12px auto',
                    }}
                  >
                    {game.emoji}
                  </div>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      fontWeight: 700,
                      color: game.color,
                      margin: 0,
                    }}
                  >
                    {game.name}
                  </p>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {/* Beat pulses for each game */}
      {GAMES.map((game, i) => (
        <BeatPulse
          key={game.name}
          startFrame={GAME_START + i * GAME_DURATION + 8}
          color={game.color}
          intensity={0.35}
        />
      ))}
      <BeatPulse startFrame={OUTRO_START + 5} color={COLORS.accentPink} intensity={0.5} />
    </AbsoluteFill>
  );
};
