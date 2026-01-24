import React from 'react';
import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface HomeScreenProps {
  partnerName?: string;
  targetLanguage?: string;
  startFrame?: number;
}

// Quick action buttons
const QUICK_ACTIONS = [
  { icon: '🎁', label: 'Send Gift', color: COLORS.accentPink },
  { icon: '🎯', label: 'Challenge', color: COLORS.teal },
  { icon: '💬', label: 'Chat', color: '#3B82F6' },
  { icon: '🎮', label: 'Games', color: '#8B5CF6' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  partnerName = 'Partner',
  targetLanguage = 'Polish',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: COLORS.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: COLORS.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              border: `2px solid ${COLORS.accentPink}`,
            }}
          >
            💕
          </div>
          <div>
            <p
              style={{
                fontFamily: FONTS.header,
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: 0,
              }}
            >
              Learning {targetLanguage}
            </p>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 12,
                color: COLORS.textSecondary,
                margin: 0,
              }}
            >
              with {partnerName}
            </p>
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: COLORS.bgPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 18 }}>⚙️</span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: '#10b98115',
            borderRadius: 12,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: FONTS.header,
              fontSize: 20,
              fontWeight: 700,
              color: '#10b981',
              margin: 0,
            }}
          >
            42
          </p>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textSecondary,
              margin: 0,
            }}
          >
            Words
          </p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: `${COLORS.accentPink}15`,
            borderRadius: 12,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: FONTS.header,
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.accentPink,
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
            Gifts
          </p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: `${COLORS.teal}15`,
            borderRadius: 12,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: FONTS.header,
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.teal,
              margin: 0,
            }}
          >
            7
          </p>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textSecondary,
              margin: 0,
            }}
          >
            Days
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Quick Actions
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          {QUICK_ACTIONS.map((action, i) => {
            const itemDelay = i * 5;
            const itemScale = spring({
              frame: localFrame - itemDelay,
              fps: FPS,
              config: { damping: 15, stiffness: 100 },
            });

            return (
              <div
                key={action.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transform: `scale(${Math.max(0, itemScale)})`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: `${action.color}15`,
                    border: `2px solid ${action.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {action.icon}
                </div>
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 10,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                  }}
                >
                  {action.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLORS.bgCard,
          borderRadius: 16,
          padding: 14,
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Recent
        </p>
        {[
          { text: 'New gift from Partner!', icon: '🎁', time: '2m ago' },
          { text: 'Challenge completed', icon: '🎯', time: '1h ago' },
          { text: 'Learned 5 new words', icon: '📚', time: '3h ago' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: i < 2 ? `1px solid ${COLORS.accentBorder}` : 'none',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span
              style={{
                flex: 1,
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textPrimary,
              }}
            >
              {item.text}
            </span>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 11,
                color: COLORS.textMuted,
              }}
            >
              {item.time}
            </span>
          </div>
        ))}
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
          { icon: '🏠', label: 'Home', active: true },
          { icon: '📚', label: 'Log', active: false },
          { icon: '🎮', label: 'Practice', active: false },
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
