import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface GiftComposerScreenProps {
  words?: Array<{ target: string; native: string }>;
  wordsVisible?: number; // How many words to show (animated)
  showSendButton?: boolean;
  startFrame?: number;
}

const DEFAULT_WORDS = [
  { target: 'Tęsknię za tobą', native: 'I miss you' },
  { target: 'Jesteś moim skarbem', native: "You're my treasure" },
  { target: 'Kocham cię', native: 'I love you' },
];

export const GiftComposerScreen: React.FC<GiftComposerScreenProps> = ({
  words = DEFAULT_WORDS,
  wordsVisible = 3,
  showSendButton = true,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: COLORS.bgPrimary,
        padding: 16,
      }}
    >
      {/* Modal-style card */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 32,
          padding: 20,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: COLORS.tealLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🎁
          </div>
          <span
            style={{
              fontFamily: FONTS.header,
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            Word Gift
          </span>
        </div>

        {/* Words list */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 10,
            }}
          >
            Words to gift:
          </p>

          {words.slice(0, wordsVisible).map((word, i) => {
            const wordDelay = startFrame + i * 25;
            const wordScale = spring({
              frame: frame - wordDelay,
              fps: FPS,
              config: { damping: 15, stiffness: 100 },
            });

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  backgroundColor: COLORS.accentLight,
                  borderRadius: 12,
                  marginBottom: 8,
                  border: `1px solid ${COLORS.accentBorder}`,
                  transform: `scale(${Math.max(0, wordScale)})`,
                  opacity: Math.max(0, wordScale),
                }}
              >
                <span style={{ fontSize: 16 }}>💝</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 16,
                      fontWeight: 600,
                      color: COLORS.accentPink,
                      margin: 0,
                    }}
                  >
                    {word.target}
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      margin: 0,
                    }}
                  >
                    {word.native}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* XP bonus info */}
        <div
          style={{
            backgroundColor: COLORS.tealLight,
            borderRadius: 12,
            padding: 10,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>✨</span>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.teal,
              margin: 0,
            }}
          >
            +20 XP bonus when partner learns these!
          </p>
        </div>

        {/* Send button */}
        {showSendButton && (
          <button
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: COLORS.accentPink,
              color: 'white',
              border: 'none',
              borderRadius: 16,
              fontFamily: FONTS.body,
              fontSize: 17,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            💝 Send Word Gift
          </button>
        )}
      </div>
    </div>
  );
};

// Success confirmation screen
interface GiftSentConfirmationProps {
  wordCount?: number;
  startFrame?: number;
}

export const GiftSentConfirmation: React.FC<GiftSentConfirmationProps> = ({
  wordCount = 3,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const scale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
  });

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 10,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 32,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          transform: `scale(${Math.max(0, scale)})`,
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 16px',
          }}
        >
          ✓
        </div>
        <h2
          style={{
            fontFamily: FONTS.header,
            fontSize: 26,
            fontWeight: 700,
            color: '#10b981',
            margin: 0,
          }}
        >
          Gift Sent!
        </h2>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            color: COLORS.textSecondary,
            marginTop: 8,
          }}
        >
          {wordCount} words on their way to your partner
        </p>
      </div>
    </div>
  );
};
