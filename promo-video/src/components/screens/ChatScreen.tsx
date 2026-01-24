import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { FPS } from '../../constants/timing';

interface ChatMessage {
  type: 'user' | 'ai' | 'ai-highlight';
  text?: string;
  word?: string;
  translation?: string;
  delay: number;
}

interface ChatScreenProps {
  messages?: ChatMessage[];
  contextBadges?: Array<{ icon: string; label: string }>;
  targetLanguage?: string;
  startFrame?: number;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  { type: 'user', text: 'How do I say "I miss you" in Spanish?', delay: 0 },
  { type: 'ai', text: 'Based on your vocabulary, you already know this one! 🎉', delay: 40 },
  { type: 'ai-highlight', word: 'Te extraño', translation: 'I miss you', delay: 80 },
];

const DEFAULT_BADGES = [
  { icon: '📚', label: '42 words learned' },
  { icon: '💝', label: '12 gifted words' },
  { icon: '🎯', label: 'Conversational 2' },
];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages = DEFAULT_MESSAGES,
  contextBadges = DEFAULT_BADGES,
  targetLanguage = 'Spanish',
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
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.accentBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: COLORS.accentPink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          🤖
        </div>
        <div>
          <p
            style={{
              fontFamily: FONTS.header,
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: 0,
            }}
          >
            {targetLanguage} Tutor
          </p>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.teal,
              margin: 0,
            }}
          >
            ● Online
          </p>
        </div>
      </div>

      {/* Context awareness badges */}
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: COLORS.accentLight,
          display: 'flex',
          gap: 8,
          borderBottom: `1px solid ${COLORS.accentBorder}`,
          flexWrap: 'wrap',
        }}
      >
        {contextBadges.map((badge, i) => {
          const badgeDelay = startFrame + i * 7;
          const badgeOpacity = interpolate(
            frame,
            [badgeDelay, badgeDelay + 10],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                backgroundColor: COLORS.bgCard,
                borderRadius: 12,
                opacity: badgeOpacity,
                border: `1px solid ${COLORS.accentBorder}`,
              }}
            >
              <span style={{ fontSize: 12 }}>{badge.icon}</span>
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                }}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat messages */}
      <div
        style={{
          flex: 1,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
        }}
      >
        {messages.map((msg, i) => {
          const msgDelay = startFrame + msg.delay;
          const msgOpacity = interpolate(
            frame,
            [msgDelay, msgDelay + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const msgScale = spring({
            frame: frame - msgDelay,
            fps: FPS,
            config: { damping: 15, stiffness: 100 },
          });

          if (msgOpacity <= 0) return null;

          // User message
          if (msg.type === 'user') {
            return (
              <div
                key={i}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '80%',
                  opacity: msgOpacity,
                  transform: `scale(${Math.max(0, msgScale)})`,
                }}
              >
                <div
                  style={{
                    backgroundColor: COLORS.accentPink,
                    borderRadius: '16px 16px 4px 16px',
                    padding: '10px 14px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      color: 'white',
                      margin: 0,
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }

          // AI highlight message (word card)
          if (msg.type === 'ai-highlight') {
            return (
              <div
                key={i}
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  opacity: msgOpacity,
                  transform: `scale(${Math.max(0, msgScale)})`,
                }}
              >
                <div
                  style={{
                    backgroundColor: COLORS.bgCard,
                    borderRadius: 16,
                    padding: 14,
                    border: `2px solid ${COLORS.accentPink}`,
                    boxShadow: `0 4px 16px ${COLORS.accentPink}20`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>💝</span>
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.accentPink,
                        textTransform: 'uppercase',
                      }}
                    >
                      From your Love Log
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 26,
                      fontWeight: 700,
                      color: COLORS.accentPink,
                      margin: 0,
                    }}
                  >
                    {msg.word}
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 15,
                      color: COLORS.textSecondary,
                      margin: '4px 0 0 0',
                    }}
                  >
                    {msg.translation}
                  </p>
                </div>
              </div>
            );
          }

          // Regular AI message
          return (
            <div
              key={i}
              style={{
                alignSelf: 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                gap: 8,
                opacity: msgOpacity,
                transform: `scale(${Math.max(0, msgScale)})`,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: COLORS.tealLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div
                style={{
                  backgroundColor: COLORS.bgCard,
                  borderRadius: '16px 16px 16px 4px',
                  padding: '10px 14px',
                  border: `1px solid ${COLORS.accentBorder}`,
                }}
              >
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.textPrimary,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: 12,
          backgroundColor: COLORS.bgCard,
          borderTop: `1px solid ${COLORS.accentBorder}`,
          display: 'flex',
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: COLORS.bgPrimary,
            borderRadius: 20,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.textMuted,
            }}
          >
            Type a message...
          </span>
        </div>
        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: COLORS.accentPink,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 16 }}>🎤</span>
        </button>
      </div>
    </div>
  );
};
