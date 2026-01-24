import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

// Gift notification modal
interface GiftNotificationProps {
  senderName?: string;
  wordCount?: number;
  startFrame?: number;
  onOpenFrame?: number; // When to show "opened" state
}

export const GiftNotification: React.FC<GiftNotificationProps> = ({
  senderName = 'Partner',
  wordCount = 3,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const bounceFrame = localFrame % 30;
  const giftBounce = interpolate(bounceFrame, [0, 15, 30], [0, -15, 0]);

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
        padding: 16,
        zIndex: 20,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 32,
          padding: 24,
          textAlign: 'center',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          transform: `scale(${Math.max(0, scale)})`,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: `linear-gradient(135deg, ${COLORS.accentLight} 0%, #fef3c7 100%)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            transform: `translateY(${giftBounce}px)`,
            boxShadow: '0 8px 24px rgba(255, 71, 97, 0.2)',
            margin: '0 auto',
          }}
        >
          🎁
        </div>
        <h2
          style={{
            fontFamily: FONTS.header,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.textPrimary,
            marginTop: 20,
          }}
        >
          {senderName} sent you a gift!
        </h2>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            color: COLORS.textSecondary,
            marginTop: 6,
          }}
        >
          {wordCount} new words to learn
        </p>

        {/* XP bonus badge */}
        <div
          style={{
            marginTop: 16,
            padding: '8px 16px',
            backgroundColor: COLORS.accentLight,
            borderRadius: 20,
            border: `1px solid ${COLORS.accentBorder}`,
            display: 'inline-block',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.accentPink,
              fontWeight: 500,
            }}
          >
            ✨ +30 XP bonus
          </span>
        </div>

        <button
          style={{
            marginTop: 24,
            padding: '14px 32px',
            backgroundColor: COLORS.accentPink,
            color: 'white',
            border: 'none',
            borderRadius: 14,
            fontFamily: FONTS.body,
            fontSize: 17,
            fontWeight: 600,
            display: 'block',
            width: '100%',
          }}
        >
          Open Gift
        </button>
      </div>
    </div>
  );
};

// Gift word card learning screen
interface GiftWordCardProps {
  word: { target: string; native: string; pronunciation?: string };
  senderName?: string;
  currentIndex?: number;
  totalCount?: number;
  startFrame?: number;
}

export const GiftWordCard: React.FC<GiftWordCardProps> = ({
  word,
  senderName = 'Partner',
  currentIndex = 0,
  totalCount = 3,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const cardScale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
  });

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: COLORS.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        transform: `scale(${Math.max(0, cardScale)})`,
      }}
    >
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 20,
        }}
      >
        {Array.from({ length: totalCount }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: i <= currentIndex ? COLORS.accentPink : COLORS.accentBorder,
            }}
          />
        ))}
      </div>

      {/* Word card */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 28,
          padding: 28,
          boxShadow: `0 12px 40px ${COLORS.accentPink}20`,
          border: `2px solid ${COLORS.accentBorder}`,
          textAlign: 'center',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 40 }}>💕</span>
        <p
          style={{
            fontFamily: FONTS.header,
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.accentPink,
            marginTop: 12,
          }}
        >
          {word.target}
        </p>
        {word.pronunciation && (
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.textMuted,
              marginTop: 6,
            }}
          >
            ({word.pronunciation})
          </p>
        )}
        <div
          style={{
            height: 1,
            backgroundColor: COLORS.accentBorder,
            margin: '16px 0',
          }}
        />
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 20,
            color: COLORS.textPrimary,
            fontWeight: 500,
          }}
        >
          {word.native}
        </p>

        {/* From badge */}
        <div
          style={{
            marginTop: 16,
            padding: '6px 14px',
            backgroundColor: COLORS.accentLight,
            borderRadius: 16,
            display: 'inline-block',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.accentPink,
              fontWeight: 500,
            }}
          >
            💝 From {senderName}
          </span>
        </div>
      </div>

      {/* Continue button */}
      <button
        style={{
          marginTop: 20,
          padding: '12px 28px',
          backgroundColor: COLORS.accentPink,
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontFamily: FONTS.body,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Got it! →
      </button>
    </div>
  );
};
