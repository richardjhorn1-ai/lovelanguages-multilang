import React from 'react';
import { useCurrentFrame, spring } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface GamesScreenProps {
  highlightedGame?: number;
  startFrame?: number;
}

const GAMES = [
  { name: 'Flashcards', emoji: '🎴', color: COLORS.accentPink, description: 'Classic flip & learn' },
  { name: 'Multiple Choice', emoji: '✅', color: '#10b981', description: 'Test your knowledge' },
  { name: 'Type It', emoji: '⌨️', color: '#3B82F6', description: 'Spell it out' },
  { name: 'Quick Fire', emoji: '⚡', color: '#F59E0B', description: 'Beat the clock' },
  { name: 'Voice Chat', emoji: '🎙️', color: '#8B5CF6', description: 'Practice speaking' },
  { name: 'AI Challenge', emoji: '🤖', color: '#06b6d4', description: 'Adaptive learning' },
];

export const GamesScreen: React.FC<GamesScreenProps> = ({
  highlightedGame = -1,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.bgPrimary,
        padding: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 14,
          padding: '10px 12px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            backgroundColor: '#8B5CF620',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}
        >
          🎮
        </div>
        <span
          style={{
            fontFamily: FONTS.header,
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          Practice Games
        </span>
      </div>

      {/* Games grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          flex: 1,
        }}
      >
        {GAMES.map((game, i) => {
          const itemDelay = startFrame + i * 8;
          const itemScale = spring({
            frame: frame - itemDelay,
            fps: FPS,
            config: { damping: 15, stiffness: 100 },
          });

          const isHighlighted = i === highlightedGame;

          return (
            <div
              key={game.name}
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 16,
                padding: 14,
                border: isHighlighted ? `3px solid ${game.color}` : `2px solid ${COLORS.accentBorder}`,
                boxShadow: isHighlighted ? `0 4px 16px ${game.color}30` : 'none',
                transform: `scale(${Math.max(0, itemScale) * (isHighlighted ? 1.02 : 1)})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: `${game.color}15`,
                  border: `2px solid ${game.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                {game.emoji}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: FONTS.header,
                    fontSize: 13,
                    fontWeight: 700,
                    color: game.color,
                    margin: 0,
                  }}
                >
                  {game.name}
                </p>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 10,
                    color: COLORS.textSecondary,
                    margin: '2px 0 0 0',
                  }}
                >
                  {game.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          paddingTop: 12,
          marginTop: 8,
          borderTop: `1px solid ${COLORS.accentBorder}`,
        }}
      >
        {[
          { icon: '🏠', label: 'Home', active: false },
          { icon: '📚', label: 'Log', active: false },
          { icon: '🎮', label: 'Practice', active: true },
          { icon: '📈', label: 'Progress', active: false },
        ].map((nav) => (
          <div
            key={nav.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 18, opacity: nav.active ? 1 : 0.5 }}>
              {nav.icon}
            </span>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 9,
                fontWeight: nav.active ? 700 : 400,
                color: nav.active ? COLORS.accentPink : COLORS.textMuted,
              }}
            >
              {nav.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
