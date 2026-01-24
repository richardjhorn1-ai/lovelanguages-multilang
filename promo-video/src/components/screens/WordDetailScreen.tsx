import React from 'react';
import { useCurrentFrame, spring } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface WordDetailScreenProps {
  word: {
    target: string;
    native: string;
    pronunciation?: string;
    type?: string;
  };
  isGift?: boolean;
  senderName?: string;
  exampleSentence?: { target: string; native: string };
  startFrame?: number;
}

export const WordDetailScreen: React.FC<WordDetailScreenProps> = ({
  word = { target: 'Te quiero', native: 'I love you', pronunciation: 'teh kee-EH-roh', type: 'phrase' },
  isGift = true,
  senderName = 'Partner',
  exampleSentence = { target: 'Te quiero mucho, mi amor.', native: 'I love you so much, my love.' },
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const scale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.bgPrimary,
        borderRadius: 16,
        transform: `scale(${Math.max(0, scale)})`,
        padding: 12,
      }}
    >
      {/* Back header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 0',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            backgroundColor: COLORS.bgCard,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
          }}
        >
          ‹
        </div>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textSecondary,
          }}
        >
          Back to Love Log
        </span>
      </div>

      {/* Word detail card */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: 20,
          padding: 16,
          border: `2px solid ${COLORS.accentBorder}`,
          textAlign: 'center',
        }}
      >
        {/* Gift badge */}
        {isGift && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: COLORS.accentLight,
              padding: '4px 10px',
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12 }}>💝</span>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.accentPink,
              }}
            >
              Gift from {senderName}
            </span>
          </div>
        )}

        {/* Word */}
        <p
          style={{
            fontFamily: FONTS.header,
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.accentPink,
            margin: 0,
          }}
        >
          {word.target}
        </p>

        {/* Pronunciation */}
        {word.pronunciation && (
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textMuted,
              margin: '4px 0 8px 0',
            }}
          >
            ({word.pronunciation})
          </p>
        )}

        {/* Play audio button */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: COLORS.accentLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto',
            border: `2px solid ${COLORS.accentPink}`,
          }}
        >
          <span style={{ fontSize: 14 }}>▶</span>
        </div>

        {/* Translation */}
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.textPrimary,
            margin: 0,
          }}
        >
          {word.native}
        </p>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
        }}
      >
        <button
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: COLORS.bgCard,
            border: `1.5px solid ${COLORS.accentBorder}`,
            borderRadius: 12,
            fontFamily: FONTS.body,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          📝 Conjugations
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: COLORS.bgCard,
            border: `1.5px solid ${COLORS.accentBorder}`,
            borderRadius: 12,
            fontFamily: FONTS.body,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          📚 Forms
        </button>
      </div>

      {/* Example sentences */}
      <div style={{ marginTop: 12, flex: 1 }}>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Example Sentences
        </p>
        <div
          style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: 12,
            padding: 10,
            borderLeft: `3px solid ${COLORS.accentPink}`,
          }}
        >
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.accentPink,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {exampleSentence.target}
          </p>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.textSecondary,
              margin: '4px 0 0 0',
            }}
          >
            {exampleSentence.native}
          </p>
        </div>
      </div>
    </div>
  );
};
