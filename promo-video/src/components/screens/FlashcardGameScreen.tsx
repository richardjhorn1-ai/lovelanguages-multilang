import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface FlashcardGameScreenProps {
  word?: { target: string; native: string };
  cardIndex?: number;
  totalCards?: number;
  isFlipped?: boolean;
  startFrame?: number;
}

export const FlashcardGameScreen: React.FC<FlashcardGameScreenProps> = ({
  word = { target: 'Te quiero', native: 'I love you' },
  cardIndex = 0,
  totalCards = 10,
  isFlipped = false,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const cardScale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
  });

  // Flip animation
  const flipProgress = isFlipped ? 180 : 0;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.bgPrimary,
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: `${COLORS.accentPink}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            🎴
          </div>
          <span
            style={{
              fontFamily: FONTS.header,
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            Flashcards
          </span>
        </div>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.textSecondary,
          }}
        >
          {cardIndex + 1}/{totalCards}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          backgroundColor: COLORS.accentBorder,
          borderRadius: 3,
          marginBottom: 24,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((cardIndex + 1) / totalCards) * 100}%`,
            backgroundColor: COLORS.accentPink,
            borderRadius: 3,
          }}
        />
      </div>

      {/* Flashcard */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${Math.max(0, cardScale)})`,
        }}
      >
        <div style={{ width: '100%', height: 220, perspective: 1000 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${flipProgress}deg)`,
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
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.textMuted,
                  marginBottom: 8,
                }}
              >
                What does this mean?
              </p>
              <p
                style={{
                  fontFamily: FONTS.header,
                  fontSize: 36,
                  fontWeight: 700,
                  color: COLORS.accentPink,
                }}
              >
                {word.target}
              </p>
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.textMuted,
                  marginTop: 16,
                }}
              >
                Tap to reveal
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
              <p
                style={{
                  fontFamily: FONTS.header,
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#10b981',
                }}
              >
                {word.native} ❤️
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 24,
        }}
      >
        <button
          style={{
            flex: 1,
            padding: '14px 20px',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            border: '2px solid #ef4444',
            borderRadius: 16,
            fontFamily: FONTS.body,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          ✗ Still Learning
        </button>
        <button
          style={{
            flex: 1,
            padding: '14px 20px',
            backgroundColor: '#dcfce7',
            color: '#10b981',
            border: '2px solid #10b981',
            borderRadius: 16,
            fontFamily: FONTS.body,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          ✓ Got It!
        </button>
      </div>
    </div>
  );
};
