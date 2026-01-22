import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { BeatPulse } from '../components/BeatPulse';

// Each game gets ~70 frames for smooth animations (~2.3 seconds each)
const GAME_DURATION = 70;
const INTRO_DURATION = 50;

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

export const Scene6Games: React.FC = () => {
  const frame = useCurrentFrame();

  // Intro phase
  const introProgress = interpolate(frame, [0, INTRO_DURATION], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Which game is currently showing
  const gameFrame = frame - INTRO_DURATION;
  const currentGameIndex = Math.floor(gameFrame / GAME_DURATION);
  const gameLocalFrame = gameFrame % GAME_DURATION;

  // Outro phase (after all games)
  const totalGamesEnd = INTRO_DURATION + GAMES.length * GAME_DURATION;
  const isOutro = frame >= totalGamesEnd;

  // Get current game (clamped)
  const safeGameIndex = Math.max(0, Math.min(currentGameIndex, GAMES.length - 1));
  const currentGame = GAMES[safeGameIndex];

  // Card animation for current game - smoother entrance
  const cardScale = spring({
    frame: gameLocalFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 80 },
  });

  const cardOpacity = interpolate(
    gameLocalFrame,
    [0, 12, GAME_DURATION - 15, GAME_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Flash effect - gentler
  const flashOpacity = interpolate(
    gameLocalFrame,
    [10, 22, 32],
    [0, 0.2, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Outro animation
  const outroScale = spring({
    frame: frame - totalGamesEnd,
    fps: FPS,
    config: { damping: 15 },
  });

  // Game-specific animations - slower and smoother
  const flashcardFlip = interpolate(gameLocalFrame, [20, 50], [0, 180], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const mcSelect = gameLocalFrame > 35;
  const typeItChars = Math.floor(interpolate(gameLocalFrame, [18, 52], [0, 9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const quickFireProgress = interpolate(gameLocalFrame, [0, GAME_DURATION], [60, 48], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const voicePulse = (gameLocalFrame % 20) < 10;

  // Render game-specific UI
  const renderGameUI = () => {
    switch (safeGameIndex) {
      case 0: // Flashcards
        return (
          <div style={{ width: 320, height: 220, perspective: 1000 }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${flashcardFlip}deg)`,
              }}
            >
              {/* Front */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: COLORS.bgCard,
                  borderRadius: 24,
                  border: `3px solid ${COLORS.accentBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backfaceVisibility: 'hidden',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                }}
              >
                <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textMuted, marginBottom: 8 }}>
                  What does this mean?
                </p>
                <p style={{ fontFamily: FONTS.header, fontSize: 36, fontWeight: 700, color: COLORS.accentPink }}>
                  Te quiero
                </p>
              </div>
              {/* Back */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#dcfce7',
                  borderRadius: 24,
                  border: '3px solid #10b981',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                }}
              >
                <p style={{ fontFamily: FONTS.header, fontSize: 32, fontWeight: 700, color: '#10b981' }}>
                  I love you ❤️
                </p>
              </div>
            </div>
          </div>
        );

      case 1: // Multiple Choice
        return (
          <div style={{ width: 340 }}>
            <div style={{ backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 16, border: `2px solid ${COLORS.accentBorder}` }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 6 }}>Translate:</p>
              <p style={{ fontFamily: FONTS.header, fontSize: 28, fontWeight: 700, color: COLORS.textPrimary }}>Mi corazón</p>
            </div>
            {['My friend', 'My heart', 'My love', 'My life'].map((opt, i) => {
              const isCorrect = i === 1;
              const showResult = mcSelect && (i === 1 || i === 0);
              return (
                <div
                  key={opt}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    marginBottom: 10,
                    border: `2px solid ${showResult ? (isCorrect ? '#10b981' : i === 0 ? '#ef4444' : COLORS.accentBorder) : i === 0 && !mcSelect ? COLORS.accentPink : COLORS.accentBorder}`,
                    backgroundColor: showResult ? (isCorrect ? '#dcfce7' : i === 0 ? '#fee2e2' : COLORS.bgCard) : i === 0 && !mcSelect ? COLORS.accentLight : COLORS.bgCard,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontFamily: FONTS.body, fontSize: 16, fontWeight: 500, color: COLORS.textPrimary }}>{opt}</span>
                  {showResult && isCorrect && <span style={{ fontSize: 18, color: '#10b981' }}>✓</span>}
                  {showResult && i === 0 && <span style={{ fontSize: 18, color: '#ef4444' }}>✗</span>}
                </div>
              );
            })}
          </div>
        );

      case 2: // Type It
        const typeText = 'Te quiero';
        return (
          <div style={{ width: 340 }}>
            <div style={{ backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 20, border: `2px solid ${COLORS.accentBorder}` }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 6 }}>Type in Spanish:</p>
              <p style={{ fontFamily: FONTS.header, fontSize: 28, fontWeight: 700, color: COLORS.textPrimary }}>I love you</p>
            </div>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 16,
                border: `2px solid ${typeItChars >= 9 ? '#10b981' : COLORS.accentBorder}`,
                backgroundColor: typeItChars >= 9 ? '#dcfce7' : COLORS.bgCard,
                marginBottom: 16,
              }}
            >
              <span style={{ fontFamily: FONTS.body, fontSize: 22, fontWeight: 500, color: typeItChars >= 9 ? '#10b981' : COLORS.textPrimary }}>
                {typeText.slice(0, typeItChars)}
                {typeItChars < 9 && <span style={{ opacity: 0.4 }}>|</span>}
              </span>
            </div>
            {typeItChars >= 9 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#dcfce7', borderRadius: 12 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <span style={{ fontFamily: FONTS.body, fontSize: 18, fontWeight: 600, color: '#10b981' }}>Perfect!</span>
              </div>
            )}
          </div>
        );

      case 3: // Quick Fire
        return (
          <div style={{ width: 340 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <span style={{ fontFamily: FONTS.header, fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>Quick Fire!</span>
              </div>
              <div style={{ backgroundColor: '#fef3c7', padding: '6px 14px', borderRadius: 20, border: '2px solid #F59E0B' }}>
                <span style={{ fontFamily: FONTS.header, fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>{Math.floor(quickFireProgress)}s</span>
              </div>
            </div>
            <div style={{ backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 16, border: `2px solid ${COLORS.accentBorder}` }}>
              <p style={{ fontFamily: FONTS.header, fontSize: 32, fontWeight: 700, color: COLORS.accentPink }}>Siempre</p>
            </div>
            <div style={{ padding: '14px 20px', borderRadius: 14, border: `2px solid ${COLORS.accentBorder}`, backgroundColor: COLORS.bgCard }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 20, color: COLORS.textPrimary }}>Always<span style={{ opacity: 0.4 }}>|</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: FONTS.header, fontSize: 24, fontWeight: 700, color: '#10b981' }}>12</p>
                <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textMuted }}>Correct</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: FONTS.header, fontSize: 24, fontWeight: 700, color: '#ef4444' }}>2</p>
                <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textMuted }}>Wrong</p>
              </div>
            </div>
          </div>
        );

      case 4: // Voice Chat
        return (
          <div style={{ width: 340, backgroundColor: COLORS.bgCard, borderRadius: 24, overflow: 'hidden', border: `2px solid ${COLORS.accentBorder}` }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.accentBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙️</div>
              <div>
                <p style={{ fontFamily: FONTS.header, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>Café Roleplay</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: voicePulse ? '#10b981' : '#8B5CF6' }} />
                  <span style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary }}>{voicePulse ? 'Listening...' : 'AI Speaking'}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: 16, minHeight: 180 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', backgroundColor: COLORS.bgPrimary, borderRadius: '16px 16px 16px 4px', border: `1px solid ${COLORS.accentBorder}` }}>
                  <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary }}>¡Hola! ¿Qué desea tomar?</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', backgroundColor: '#8B5CF6', borderRadius: '16px 16px 4px 16px' }}>
                  <p style={{ fontFamily: FONTS.body, fontSize: 14, color: 'white' }}>Un café con leche, por favor.</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', backgroundColor: COLORS.bgPrimary, borderRadius: '16px 16px 16px 4px', border: `1px solid ${COLORS.accentBorder}` }}>
                  <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary }}>¡Muy bien! ¿Algo más?</p>
                </div>
              </div>
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${COLORS.accentBorder}`, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: voicePulse ? '#8B5CF620' : '#8B5CF640', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid #8B5CF6` }}>
                <span style={{ fontSize: 24 }}>🎤</span>
              </div>
            </div>
          </div>
        );

      case 5: // AI Challenge
        return (
          <div style={{ width: 340 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', backgroundColor: '#06b6d420', borderRadius: 16, border: '2px solid #06b6d4' }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <p style={{ fontFamily: FONTS.header, fontSize: 14, fontWeight: 700, color: '#06b6d4' }}>AI Challenge</p>
                <p style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary }}>Weakest Words Mode</p>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: FONTS.header, fontSize: 16, fontWeight: 700, color: '#06b6d4' }}>3/10</div>
            </div>
            <div style={{ backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 16, border: `2px solid ${COLORS.accentBorder}` }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Type the translation:</p>
              <p style={{ fontFamily: FONTS.header, fontSize: 28, fontWeight: 700, color: COLORS.textPrimary }}>Mi amor</p>
            </div>
            <div style={{ padding: '14px 18px', borderRadius: 14, border: `2px solid #10b981`, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 18, fontWeight: 500, color: '#10b981' }}>My love</span>
              <span style={{ fontSize: 18, color: '#10b981' }}>✓</span>
            </div>
          </div>
        );

      case 6: // Verb Mastery
        return (
          <div style={{ width: 340 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: '8px 14px', backgroundColor: '#EC489920', borderRadius: 12, border: '2px solid #EC4899' }}>
                <span style={{ fontFamily: FONTS.header, fontSize: 14, fontWeight: 700, color: '#EC4899' }}>Present Tense</span>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary }}>5/10</div>
            </div>
            <div style={{ backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 16, border: `2px solid ${COLORS.accentBorder}` }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Conjugate "querer" (to want/love)</p>
              <p style={{ fontFamily: FONTS.header, fontSize: 24, fontWeight: 700, color: '#EC4899', marginBottom: 8 }}>yo ___</p>
              <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary }}>(I ___)</p>
            </div>
            <div style={{ padding: '14px 18px', borderRadius: 14, border: `2px solid #10b981`, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 20, fontWeight: 600, color: '#10b981' }}>quiero</span>
              <span style={{ fontSize: 18, color: '#10b981' }}>✓</span>
            </div>
            <p style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 }}>
              "Yo quiero" = I want / I love
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary, overflow: 'hidden' }}>
      <AnimatedGradient style="wave" />
      <FloatingHearts count={10} />

      <Caption text="7 Ways to Practice" subtext="Master vocabulary your way" startFrame={10} position="top" style="highlight" />

      {/* Intro */}
      {frame < INTRO_DURATION && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${introProgress * 1.2})`, opacity: introProgress }}>
          <div style={{ width: 180, height: 180, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.accentPink} 0%, ${COLORS.teal} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 60px ${COLORS.accentPink}60` }}>
            <span style={{ fontFamily: FONTS.header, fontSize: 72, fontWeight: 800, color: 'white' }}>7</span>
          </div>
          <p style={{ fontFamily: FONTS.header, fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, textAlign: 'center', marginTop: 16 }}>Game Modes</p>
        </div>
      )}

      {/* Game cycling */}
      {frame >= INTRO_DURATION && !isOutro && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: currentGame.color, opacity: flashOpacity, pointerEvents: 'none' }} />

          {/* Progress dots */}
          <div style={{ position: 'absolute', top: 170, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
            {GAMES.map((game, i) => (
              <div
                key={game.name}
                style={{
                  width: i === safeGameIndex ? 28 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: i <= safeGameIndex ? game.color : COLORS.accentBorder,
                  boxShadow: i === safeGameIndex ? `0 0 10px ${game.color}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Game mode label */}
          <div style={{ position: 'absolute', top: 200, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', backgroundColor: `${currentGame.color}20`, borderRadius: 20, border: `2px solid ${currentGame.color}` }}>
            <span style={{ fontSize: 24 }}>{currentGame.emoji}</span>
            <span style={{ fontFamily: FONTS.header, fontSize: 20, fontWeight: 700, color: currentGame.color }}>{currentGame.name}</span>
          </div>

          {/* Game UI */}
          <div style={{ transform: `scale(${Math.max(0, cardScale)})`, opacity: cardOpacity, marginTop: 80 }}>
            {renderGameUI()}
          </div>
        </AbsoluteFill>
      )}

      {/* Outro grid */}
      {isOutro && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, transform: `scale(${Math.max(0, outroScale)})` }}>
            {GAMES.map((game, i) => {
              const itemScale = spring({ frame: frame - totalGamesEnd - i * 3, fps: FPS, config: { damping: 12 } });
              return (
                <div
                  key={game.name}
                  style={{
                    width: i === 6 ? 280 : 130,
                    gridColumn: i === 6 ? 'span 2' : 'span 1',
                    backgroundColor: COLORS.bgCard,
                    borderRadius: 18,
                    padding: 14,
                    textAlign: 'center',
                    border: `3px solid ${game.color}`,
                    boxShadow: `0 6px 20px ${game.color}30`,
                    transform: `scale(${Math.max(0, itemScale)})`,
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${game.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 8px auto' }}>
                    {game.emoji}
                  </div>
                  <p style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, color: game.color, margin: 0 }}>{game.name}</p>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {/* Beat pulses */}
      {GAMES.map((game, i) => (
        <BeatPulse key={game.name} startFrame={INTRO_DURATION + i * GAME_DURATION + 12} color={game.color} intensity={0.35} />
      ))}
      <BeatPulse startFrame={totalGamesEnd + 5} color={COLORS.accentPink} intensity={0.5} />
    </AbsoluteFill>
  );
};
