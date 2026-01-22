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

// Camera path - follows progress sections (reduced panning, focus on upper content)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 25, zoom: 2.2, focusX: 50, focusY: 40 },        // Zoom into level card
  { frame: 80, zoom: 2.2, focusX: 50, focusY: 45 },        // Pan to stats grid
  { frame: 140, zoom: 2.2, focusX: 50, focusY: 48 },       // Pan to streak row
  { frame: 170, zoom: 2.2, focusX: 50, focusY: 52 },       // Pan to journey section (not too far)
  { frame: 240, zoom: 2.2, focusX: 50, focusY: 55 },       // Follow journal entries (reduced)
  { frame: 260, zoom: 2.2, focusX: 50, focusY: 52 },       // Hold
  { frame: 300, zoom: 1, focusX: 50, focusY: 50 },         // Zoom out
];

// Section phases (10s = 300 frames)
const LEVEL_SECTION = { start: 0, end: 100 };
const STATS_SECTION = { start: 80, end: 170 };
const JOURNEY_SECTION = { start: 150, end: 300 };

export const Scene7Progress: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone animation
  const phoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Section highlights
  const levelHighlight = interpolate(
    frame,
    [LEVEL_SECTION.start, LEVEL_SECTION.start + 10, LEVEL_SECTION.end - 10, LEVEL_SECTION.end],
    [0, 1, 1, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const statsHighlight = interpolate(
    frame,
    [STATS_SECTION.start, STATS_SECTION.start + 10, STATS_SECTION.end - 10, STATS_SECTION.end],
    [0.6, 1, 1, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const journeyHighlight = interpolate(
    frame,
    [JOURNEY_SECTION.start, JOURNEY_SECTION.start + 10, JOURNEY_SECTION.end],
    [0.6, 1, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // XP counter animation (slower)
  const xpCount = Math.floor(
    interpolate(frame, [30, 80], [0, 1250], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  // Progress bar animation (slower)
  const progressWidth = interpolate(
    frame,
    [35, 85],
    [0, 65],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Stats counter (slower)
  const statsCount = Math.floor(
    interpolate(frame, [STATS_SECTION.start + 15, STATS_SECTION.start + 60], [0, 42], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="aurora" />

      {/* Camera follows progress sections - level, stats, journey */}
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

      {/* Caption */}
      <Caption
        text="Watch Your Love Grow"
        subtext="Every word, every gift, every milestone"
        startFrame={10}
        position="top"
      />

      {/* Phone with Progress UI */}
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
            }}
          >
            {/* Level Card */}
            <div
              style={{
                background: `linear-gradient(135deg, #10b981 0%, #10b981dd 100%)`,
                borderRadius: 20,
                padding: 14,
                marginBottom: 10,
                opacity: levelHighlight,
                transform: `scale(${0.97 + levelHighlight * 0.03})`,
                boxShadow: levelHighlight > 0.8 ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                position: 'relative',
              }}
            >
              {/* Sparkles when XP reaches target */}
              <SparkleBurst startFrame={75} x={85} y={30} count={5} color="#FFD700" />
              <SparkleBurst startFrame={80} x={90} y={50} count={4} color="#10b981" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 8,
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 2,
                    }}
                  >
                    Current Level
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    Conversational 2
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 8,
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 2,
                    }}
                  >
                    Total XP
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {xpCount}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: FONTS.body, fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    Progress to Conversational 3
                  </span>
                  <span style={{ fontFamily: FONTS.body, fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    {Math.round(progressWidth)}%
                  </span>
                </div>
                <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressWidth}%`,
                      backgroundColor: 'white',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                marginBottom: 10,
                opacity: statsHighlight,
                transform: `scale(${0.97 + statsHighlight * 0.03})`,
              }}
            >
              {[
                { label: 'Total', count: statsCount, color: COLORS.accentPink },
                { label: 'Nouns', count: Math.floor(statsCount * 0.3), color: '#3B82F6' },
                { label: 'Verbs', count: Math.floor(statsCount * 0.25), color: '#10B981' },
                { label: 'Phrases', count: Math.floor(statsCount * 0.2), color: '#EC4899' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: `${stat.color}15`,
                    border: `1.5px solid ${stat.color}30`,
                    borderRadius: 12,
                    padding: '8px 6px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 16,
                      fontWeight: 700,
                      color: stat.color,
                      margin: 0,
                    }}
                  >
                    {stat.count}
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 7,
                      fontWeight: 700,
                      color: stat.color,
                      opacity: 0.7,
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Challenges completed */}
            <div
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 14,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                opacity: statsHighlight,
                border: `1.5px solid ${COLORS.accentBorder}`,
              }}
            >
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <p
                  style={{
                    fontFamily: FONTS.header,
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.teal,
                    margin: 0,
                  }}
                >
                  12
                </p>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 8,
                    color: COLORS.textSecondary,
                    margin: 0,
                  }}
                >
                  Challenges done
                </p>
              </div>
            </div>

            {/* AI Learning Summary Section */}
            <div
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 16,
                padding: 12,
                flex: 1,
                opacity: journeyHighlight,
                transform: `scale(${0.97 + journeyHighlight * 0.03})`,
                boxShadow: journeyHighlight > 0.8 ? `0 0 16px ${COLORS.accentPink}30` : 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>📚</span>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 10,
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Learning Journey
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#10b981',
                    }}
                  >
                    Jan 21
                  </span>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 7,
                      fontWeight: 700,
                      color: '#10b981',
                      backgroundColor: '#10b98115',
                      padding: '2px 6px',
                      borderRadius: 6,
                    }}
                  >
                    42 words
                  </span>
                </div>
              </div>

              {/* AI Summary Text */}
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 9,
                  color: COLORS.textPrimary,
                  margin: 0,
                  marginBottom: 10,
                  lineHeight: 1.4,
                }}
              >
                You've been learning romantic Spanish phrases with Alex! Your vocabulary is growing beautifully with words of love and affection.
              </p>

              {/* What You Can Say */}
              <div style={{ marginBottom: 10 }}>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 7,
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 6,
                  }}
                >
                  You can now say
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['Te quiero', 'Mi amor', 'Siempre'].map((phrase) => (
                    <span
                      key={phrase}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        backgroundColor: '#10b98115',
                        fontFamily: FONTS.body,
                        fontSize: 8,
                        fontWeight: 600,
                        color: '#10b981',
                      }}
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>

              {/* Topics & Grammar in two columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 7,
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 4,
                    }}
                  >
                    Topics
                  </p>
                  {['Romantic phrases', 'Endearments'].map((topic) => (
                    <div
                      key={topic}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 8,
                          color: COLORS.textSecondary,
                        }}
                      >
                        {topic}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 7,
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 4,
                    }}
                  >
                    Grammar
                  </p>
                  {['Present tense', 'Possessives'].map((grammar) => (
                    <div
                      key={grammar}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 8,
                          color: COLORS.textSecondary,
                        }}
                      >
                        {grammar}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on XP count animation */}
      <BeatPulse startFrame={75} color="#10b981" intensity={0.4} />
    </AbsoluteFill>
  );
};
