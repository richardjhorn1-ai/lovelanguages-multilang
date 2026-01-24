import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface ChallengeComposerScreenProps {
  questions?: Array<{ native: string; targetHint?: string }>;
  questionsVisible?: number;
  showSendButton?: boolean;
  targetLanguage?: string;
  startFrame?: number;
}

const DEFAULT_QUESTIONS = [
  { native: 'I miss you' },
  { native: 'My love' },
  { native: 'Kiss me' },
];

export const ChallengeComposerScreen: React.FC<ChallengeComposerScreenProps> = ({
  questions = DEFAULT_QUESTIONS,
  questionsVisible = 3,
  showSendButton = true,
  targetLanguage = 'Spanish',
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
            🎯
          </div>
          <span
            style={{
              fontFamily: FONTS.header,
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            Quiz Challenge
          </span>
        </div>

        {/* Quiz items */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 10,
            }}
          >
            Questions for partner:
          </p>

          {questions.slice(0, questionsVisible).map((question, i) => {
            const itemDelay = startFrame + i * 25;
            const itemScale = spring({
              frame: frame - itemDelay,
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
                  transform: `scale(${Math.max(0, itemScale)})`,
                  opacity: Math.max(0, itemScale),
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: COLORS.accentPink,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: FONTS.body,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 15,
                      color: COLORS.textPrimary,
                      margin: 0,
                    }}
                  >
                    {question.native}
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textMuted,
                      margin: 0,
                    }}
                  >
                    → Translate to {targetLanguage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* XP bonus info */}
        <div
          style={{
            backgroundColor: COLORS.accentLight,
            borderRadius: 12,
            padding: 10,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>🏆</span>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.accentPink,
              margin: 0,
            }}
          >
            Earn XP when your partner completes it!
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
            🎯 Send Challenge
          </button>
        )}
      </div>
    </div>
  );
};

// Challenge sent confirmation
interface ChallengeSentConfirmationProps {
  questionCount?: number;
  startFrame?: number;
}

export const ChallengeSentConfirmation: React.FC<ChallengeSentConfirmationProps> = ({
  questionCount = 3,
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
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: COLORS.teal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <span style={{ fontSize: 32, color: 'white' }}>🎯</span>
        </div>
        <h2
          style={{
            fontFamily: FONTS.header,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.teal,
            marginBottom: 8,
          }}
        >
          Challenge Sent!
        </h2>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            color: COLORS.textSecondary,
          }}
        >
          {questionCount} questions sent to your partner
        </p>
      </div>
    </div>
  );
};
