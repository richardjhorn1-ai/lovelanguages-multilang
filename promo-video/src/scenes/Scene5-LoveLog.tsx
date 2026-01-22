import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { PhoneFrame } from '../components/PhoneFrame';
import { Caption } from '../components/Caption';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';

// Camera path - follows vocabulary list and detail view (focus on TOP where content appears)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 25, zoom: 2.2, focusX: 50, focusY: 40 },        // Zoom into header/filter area
  { frame: 60, zoom: 2.2, focusX: 50, focusY: 45 },        // Pan slightly as cards appear
  { frame: 100, zoom: 2.2, focusX: 50, focusY: 48 },       // Follow cards (not too far down)
  { frame: 120, zoom: 2.5, focusX: 50, focusY: 45 },       // Zoom into detail view
  { frame: 180, zoom: 2.2, focusX: 50, focusY: 48 },       // Pan to example sentences
  { frame: 200, zoom: 2.2, focusX: 50, focusY: 48 },       // Hold
  { frame: 240, zoom: 1, focusX: 50, focusY: 50 },         // Zoom out
];

const VOCABULARY = [
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

// Animation phases (8s = 240 frames)
const LIST_PHASE_END = 140;
const DETAIL_PHASE_START = 120;

export const Scene5LoveLog: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone animation
  const phoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Cards appear as a list progressively
  const cardsVisible = Math.floor(
    interpolate(frame, [30, 100], [0, 4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Detail view transition
  const showDetailView = frame >= DETAIL_PHASE_START;
  const detailProgress = interpolate(
    frame,
    [DETAIL_PHASE_START, DETAIL_PHASE_START + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Detail card scale
  const detailScale = spring({
    frame: frame - DETAIL_PHASE_START,
    fps: FPS,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="aurora" />

      {/* Camera follows vocabulary list and detail view */}
      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={8} />

      {/* Caption explaining the feature */}
      <Caption
        text="Your Love Log"
        subtext="Every word you've learned together"
        startFrame={10}
        position="top"
      />
      <Caption
        text="Deep dive into any word"
        subtext="Definitions, conjugations & more"
        startFrame={DETAIL_PHASE_START + 10}
        position="top"
      />

      {/* Phone with Love Log */}
      <div
        style={{
          transform: `scale(${Math.max(0, phoneScale)})`,
        }}
      >
        <PhoneFrame scale={1.4}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: COLORS.bgPrimary,
              padding: 12,
              position: 'relative',
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
                opacity: showDetailView ? 1 - detailProgress * 0.3 : 1,
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
                    fontSize: 14,
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
                  fontSize: 9,
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
                opacity: showDetailView ? 1 - detailProgress * 0.3 : 1,
              }}
            >
              {['All', 'Nouns', 'Verbs', 'Phrases'].map((filter, i) => (
                <div
                  key={filter}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 10,
                    border: `1.5px solid ${i === 0 ? COLORS.accentPink : COLORS.accentBorder}`,
                    backgroundColor: i === 0 ? COLORS.accentPink : 'transparent',
                    fontSize: 8,
                    fontWeight: 600,
                    fontFamily: FONTS.body,
                    color: i === 0 ? 'white' : COLORS.textSecondary,
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
                  fontSize: 8,
                  fontWeight: 600,
                  fontFamily: FONTS.body,
                  color: COLORS.accentPink,
                }}
              >
                💝 Gifts
              </div>
            </div>

            {/* Vocabulary list - scrollable list style */}
            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                opacity: showDetailView ? 1 - detailProgress : 1,
              }}
            >
              {VOCABULARY.slice(0, cardsVisible).map((word, i) => {
                const cardDelay = 30 + i * 18;
                const cardScale = spring({
                  frame: frame - cardDelay,
                  fps: FPS,
                  config: { damping: 200 },
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
                    {/* Gift badge */}
                    {word.isGift && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: COLORS.accentLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        💝
                      </div>
                    )}
                    {!word.isGift && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: `${typeColor}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        📖
                      </div>
                    )}

                    {/* Word info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontFamily: FONTS.header,
                            fontSize: 13,
                            fontWeight: 700,
                            color: COLORS.accentPink,
                          }}
                        >
                          {word.target}
                        </span>
                        <span
                          style={{
                            fontSize: 6,
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
                          fontSize: 10,
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

            {/* Detail view overlay */}
            {showDetailView && (
              <div
                style={{
                  position: 'absolute',
                  inset: 12,
                  backgroundColor: COLORS.bgPrimary,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  transform: `scale(${Math.max(0, detailScale)})`,
                  opacity: detailProgress,
                }}
              >
                {/* Sparkles when detail view appears */}
                <SparkleBurst startFrame={DETAIL_PHASE_START} x={20} y={30} count={5} color="#FFD700" />
                <SparkleBurst startFrame={DETAIL_PHASE_START + 5} x={80} y={25} count={5} color={COLORS.accentPink} />
                {/* Back header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 12px 8px 12px',
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
                      fontSize: 11,
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
                    margin: '0 12px',
                    border: `2px solid ${COLORS.accentBorder}`,
                    textAlign: 'center',
                  }}
                >
                  {/* Gift badge */}
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
                    <span style={{ fontSize: 10 }}>💝</span>
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 9,
                        fontWeight: 600,
                        color: COLORS.accentPink,
                      }}
                    >
                      Gift from Alex
                    </span>
                  </div>

                  {/* Word */}
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 28,
                      fontWeight: 700,
                      color: COLORS.accentPink,
                      margin: 0,
                    }}
                  >
                    Te quiero
                  </p>

                  {/* Pronunciation */}
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: COLORS.textMuted,
                      margin: '4px 0 8px 0',
                    }}
                  >
                    (teh kee-EH-roh)
                  </p>

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
                      fontSize: 16,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
                      margin: 0,
                    }}
                  >
                    I love you
                  </p>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '12px',
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
                      fontSize: 10,
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
                      fontSize: 10,
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
                <div style={{ padding: '0 12px', flex: 1 }}>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 9,
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
                        fontSize: 11,
                        color: COLORS.accentPink,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Te quiero mucho, mi amor.
                    </p>
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 10,
                        color: COLORS.textSecondary,
                        margin: '4px 0 0 0',
                      }}
                    >
                      I love you so much, my love.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on detail view reveal */}
      <BeatPulse startFrame={DETAIL_PHASE_START} color={COLORS.accentPink} intensity={0.4} />
    </AbsoluteFill>
  );
};
