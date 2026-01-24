import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface ChallengePlayScreenProps {
  senderName?: string;
  currentQuestion?: {
    native: string;
    answer: string;
  };
  questionIndex?: number;
  totalQuestions?: number;
  showAnswer?: boolean;
  startFrame?: number;
}

export const ChallengePlayScreen: React.FC<ChallengePlayScreenProps> = ({
  senderName = 'Partner',
  currentQuestion = { native: 'I miss you', answer: 'Te extraño' },
  questionIndex = 0,
  totalQuestions = 3,
  showAnswer = false,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const cardScale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: COLORS.bgPrimary,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.accentLight,
            borderRadius: 20,
            padding: '8px 16px',
            border: `1px solid ${COLORS.accentBorder}`,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.accentPink,
              fontWeight: 600,
            }}
          >
            🎯 Challenge from {senderName}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i <= questionIndex ? 32 : 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: i <= questionIndex ? COLORS.accentPink : COLORS.accentBorder,
            }}
          />
        ))}
      </div>

      {/* Question card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${Math.max(0, cardScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: 24,
            padding: 28,
            width: '100%',
            textAlign: 'center',
            border: `2px solid ${COLORS.accentBorder}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
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
            Translate to Spanish
          </p>
          <p
            style={{
              fontFamily: FONTS.header,
              fontSize: 30,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            {currentQuestion.native}
          </p>
        </div>

        {/* Correct answer reveal */}
        {showAnswer && (
          <div
            style={{
              marginTop: 20,
              padding: '14px 24px',
              backgroundColor: '#10b98120',
              borderRadius: 16,
              border: '2px solid #10b981',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONTS.header,
                fontSize: 20,
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              ✓ {currentQuestion.answer}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Challenge completion celebration
interface ChallengeCelebrationProps {
  correctCount?: number;
  totalCount?: number;
  xpEarned?: number;
  startFrame?: number;
}

export const ChallengeCelebration: React.FC<ChallengeCelebrationProps> = ({
  correctCount = 3,
  totalCount = 3,
  xpEarned = 50,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const scale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 12, stiffness: 80 },
  });

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: `rgba(0, 0, 0, ${Math.min(0.5, Math.max(0, scale) * 0.5)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 20,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 32,
          padding: 28,
          textAlign: 'center',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          transform: `scale(${Math.max(0, scale)})`,
          opacity: Math.max(0, scale),
        }}
      >
        <span style={{ fontSize: 56 }}>🎉</span>
        <h2
          style={{
            fontFamily: FONTS.header,
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.textPrimary,
            marginTop: 16,
          }}
        >
          {correctCount === totalCount ? 'Perfect Score!' : 'Challenge Complete!'}
        </h2>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 18,
            color: COLORS.textSecondary,
            marginTop: 6,
          }}
        >
          {correctCount}/{totalCount} correct
        </p>

        {/* XP earned */}
        <div
          style={{
            marginTop: 24,
            padding: '14px 28px',
            backgroundColor: COLORS.accentLight,
            borderRadius: 20,
            border: `2px solid ${COLORS.accentPink}`,
            display: 'inline-block',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.header,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.accentPink,
            }}
          >
            +{xpEarned} XP ✨
          </span>
        </div>
      </div>
    </div>
  );
};
