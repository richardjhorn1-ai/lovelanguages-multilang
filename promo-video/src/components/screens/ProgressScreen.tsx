import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface ProgressScreenProps {
  xp?: number;
  level?: string;
  progressPercent?: number;
  wordCount?: number;
  startFrame?: number;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  xp = 1250,
  level = 'Conversational 2',
  progressPercent = 65,
  wordCount = 42,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  // Animated XP counter
  const animatedXP = Math.floor(
    interpolate(localFrame, [0, 50], [0, xp], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Animated progress bar
  const animatedProgress = interpolate(
    localFrame,
    [5, 55],
    [0, progressPercent],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

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
      {/* Level Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #10b981dd 100%)',
          borderRadius: 20,
          padding: 14,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 2,
              }}
            >
              Current Level
            </p>
            <p
              style={{
                fontFamily: FONTS.header,
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {level}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 2,
              }}
            >
              Total XP
            </p>
            <p
              style={{
                fontFamily: FONTS.header,
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {animatedXP}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 600,
              }}
            >
              Progress to Conversational 3
            </span>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 600,
              }}
            >
              {Math.round(animatedProgress)}%
            </span>
          </div>
          <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
            <div
              style={{
                height: '100%',
                width: `${animatedProgress}%`,
                backgroundColor: 'white',
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 10,
        }}
      >
        {[
          { label: 'Total', count: wordCount, color: COLORS.accentPink },
          { label: 'Nouns', count: Math.floor(wordCount * 0.3), color: '#3B82F6' },
          { label: 'Verbs', count: Math.floor(wordCount * 0.25), color: '#10B981' },
          { label: 'Phrases', count: Math.floor(wordCount * 0.2), color: '#EC4899' },
        ].map((stat) => {
          const statDelay = startFrame + 20;
          const statScale = spring({
            frame: frame - statDelay,
            fps: FPS,
            config: { damping: 15, stiffness: 100 },
          });

          return (
            <div
              key={stat.label}
              style={{
                backgroundColor: `${stat.color}15`,
                border: `1.5px solid ${stat.color}30`,
                borderRadius: 12,
                padding: '8px 6px',
                textAlign: 'center',
                transform: `scale(${Math.max(0, statScale)})`,
              }}
            >
              <p
                style={{
                  fontFamily: FONTS.header,
                  fontSize: 18,
                  fontWeight: 700,
                  color: stat.color,
                  margin: 0,
                }}
              >
                {stat.count}
              </p>
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 9,
                  fontWeight: 700,
                  color: stat.color,
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Challenges completed */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 14,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          border: `1.5px solid ${COLORS.accentBorder}`,
        }}
      >
        <span style={{ fontSize: 20 }}>🎯</span>
        <div>
          <p
            style={{
              fontFamily: FONTS.header,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.teal,
              margin: 0,
            }}
          >
            12
          </p>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textSecondary,
              margin: 0,
            }}
          >
            Challenges done
          </p>
        </div>
      </div>

      {/* Learning Journey */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLORS.bgCard,
          borderRadius: 16,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>📚</span>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Learning Journey
          </span>
        </div>

        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            color: COLORS.textPrimary,
            margin: 0,
            marginBottom: 10,
            lineHeight: 1.4,
          }}
        >
          You've been learning romantic Spanish phrases with your partner! Your vocabulary is growing
          beautifully.
        </p>

        {/* Phrases learned */}
        <div style={{ marginBottom: 10 }}>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 9,
              fontWeight: 700,
              color: COLORS.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 6,
            }}
          >
            You can now say
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['Te quiero', 'Mi amor', 'Siempre'].map((phrase) => (
              <span
                key={phrase}
                style={{
                  padding: '4px 8px',
                  borderRadius: 8,
                  backgroundColor: '#10b98115',
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#10b981',
                }}
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
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
          { icon: '🎮', label: 'Practice', active: false },
          { icon: '📈', label: 'Progress', active: true },
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
