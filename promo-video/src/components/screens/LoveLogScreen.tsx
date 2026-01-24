import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface VocabWord {
  target: string;
  native: string;
  type: string;
  isGift: boolean;
  pronunciation?: string;
}

interface LoveLogScreenProps {
  vocabulary?: VocabWord[];
  wordsVisible?: number;
  activeFilter?: string;
  startFrame?: number;
}

const DEFAULT_VOCABULARY: VocabWord[] = [
  { target: 'Te quiero', native: 'I love you', type: 'phrase', isGift: true, pronunciation: 'teh kee-EH-roh' },
  { target: 'Mi corazón', native: 'My heart', type: 'noun', isGift: true, pronunciation: 'mee koh-rah-SOHN' },
  { target: 'Bésame', native: 'Kiss me', type: 'verb', isGift: false, pronunciation: 'BEH-sah-meh' },
  { target: 'Siempre', native: 'Always', type: 'adverb', isGift: true, pronunciation: 'see-EHM-preh' },
];

const WORD_TYPE_COLORS: Record<string, string> = {
  noun: '#3B82F6',
  verb: '#10B981',
  adjective: '#8B5CF6',
  adverb: '#F59E0B',
  phrase: '#EC4899',
};

export const LoveLogScreen: React.FC<LoveLogScreenProps> = ({
  vocabulary = DEFAULT_VOCABULARY,
  wordsVisible = 4,
  activeFilter = 'All',
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
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: COLORS.accentPink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            📚
          </div>
          <span
            style={{
              fontFamily: FONTS.header,
              fontSize: 17,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            Love Log
          </span>
        </div>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.textSecondary,
            backgroundColor: COLORS.bgPrimary,
            padding: '3px 8px',
            borderRadius: 8,
          }}
        >
          42 words
        </span>
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        {['All', 'Nouns', 'Verbs', 'Phrases'].map((filter, i) => (
          <div
            key={filter}
            style={{
              padding: '4px 8px',
              borderRadius: 10,
              border: `1.5px solid ${filter === activeFilter ? COLORS.accentPink : COLORS.accentBorder}`,
              backgroundColor: filter === activeFilter ? COLORS.accentPink : 'transparent',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: FONTS.body,
              color: filter === activeFilter ? 'white' : COLORS.textSecondary,
            }}
          >
            {filter}
          </div>
        ))}
        <div
          style={{
            padding: '4px 8px',
            borderRadius: 10,
            border: `1.5px solid ${COLORS.accentBorder}`,
            backgroundColor: COLORS.accentLight,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: FONTS.body,
            color: COLORS.accentPink,
          }}
        >
          💝 Gifts
        </div>
      </div>

      {/* Vocabulary list */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {vocabulary.slice(0, wordsVisible).map((word, i) => {
          const cardDelay = startFrame + i * 18;
          const cardScale = spring({
            frame: frame - cardDelay,
            fps: FPS,
            config: { damping: 15, stiffness: 100 },
          });

          const typeColor = WORD_TYPE_COLORS[word.type] || COLORS.accentPink;

          return (
            <div
              key={i}
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 14,
                padding: '10px 12px',
                marginBottom: 8,
                border: word.isGift ? `2px solid ${COLORS.accentBorder}` : `1px solid ${COLORS.accentBorder}`,
                transform: `scale(${Math.max(0, cardScale)})`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* Gift/type badge */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: word.isGift ? COLORS.accentLight : `${typeColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {word.isGift ? '💝' : '📖'}
              </div>

              {/* Word info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 15,
                      fontWeight: 700,
                      color: COLORS.accentPink,
                    }}
                  >
                    {word.target}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: typeColor,
                      backgroundColor: `${typeColor}15`,
                      padding: '2px 5px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      fontFamily: FONTS.body,
                    }}
                  >
                    {word.type}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: COLORS.textSecondary,
                  }}
                >
                  {word.native}
                </span>
              </div>

              {/* Arrow */}
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>›</span>
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
          { icon: '📚', label: 'Log', active: true },
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
