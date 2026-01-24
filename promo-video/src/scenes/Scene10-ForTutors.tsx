import { AbsoluteFill, useCurrentFrame, spring, interpolate, Sequence } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { PhoneFrame } from '../components/PhoneFrame';
import { Caption } from '../components/Caption';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { SparkleBurst } from '../components/Sparkle';

// Camera path
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 40, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 80, zoom: 1.8, focusX: 50, focusY: 38 },
  { frame: 180, zoom: 1.9, focusX: 50, focusY: 45 },
  { frame: 280, zoom: 2.0, focusX: 50, focusY: 50 },
  { frame: 350, zoom: 1, focusX: 50, focusY: 50 },
];

// Student progress stats
const STUDENT_STATS = [
  { icon: '🔥', label: 'Day Streak', value: '14', color: '#f97316' },
  { icon: '⭐', label: 'XP This Week', value: '847', color: '#eab308' },
  { icon: '📚', label: 'Words Learned', value: '156', color: COLORS.teal },
];

// Recent activity items
const RECENT_ACTIVITY = [
  { action: 'Completed challenge', words: 'Family vocabulary', time: '2h ago', xp: '+45' },
  { action: 'Practiced', words: 'Your gift words', time: '5h ago', xp: '+30' },
  { action: 'New words from', words: 'Listen Mode', time: 'Yesterday', xp: '+50' },
];

// AI coaching tips
const COACHING_TIPS = [
  { icon: '💡', text: "He's struggling with verb conjugations — try sending some common verbs next" },
  { icon: '🎯', text: 'Great time to challenge him on last week\'s words!' },
];

export const Scene10ForTutors: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone animation
  const phoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Stats animation
  const statsReveal = (delay: number) => {
    return interpolate(
      frame,
      [40 + delay, 55 + delay],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

  // Activity items animation
  const activityReveal = (index: number) => {
    const delay = 80 + index * 20;
    return interpolate(
      frame,
      [delay, delay + 15],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

  // Coaching tips animation
  const coachingReveal = interpolate(
    frame,
    [160, 180],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Gift badge animation
  const giftBadgeScale = spring({
    frame: frame - 220,
    fps: FPS,
    config: { damping: 10, stiffness: 100 },
  });

  const giftBadgeOpacity = interpolate(
    frame,
    [220, 235],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
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

      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={10} />

          {/* Caption */}
          <Caption
            text="For Tutors"
            subtext="Watch your partner grow"
            startFrame={10}
            position="top"
          />

          {/* Phone */}
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
                }}
              >
                {/* Header - Partner's progress */}
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: COLORS.bgCard,
                    borderBottom: `1px solid ${COLORS.accentBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Partner avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${COLORS.accentPink} 0%, #f472b6 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        border: `3px solid ${COLORS.accentLight}`,
                      }}
                    >
                      👨
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 17,
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          margin: 0,
                        }}
                      >
                        Student's Progress
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 13,
                          color: COLORS.teal,
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        Learning Polish • Linked
                      </p>
                    </div>
                    {/* Linked indicator */}
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: COLORS.tealLight,
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>🔗</span>
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 11,
                          fontWeight: 600,
                          color: COLORS.teal,
                        }}
                      >
                        Linked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'flex',
                    padding: '14px 12px',
                    gap: 8,
                    backgroundColor: COLORS.bgCard,
                    borderBottom: `1px solid ${COLORS.accentBorder}`,
                  }}
                >
                  {STUDENT_STATS.map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        backgroundColor: COLORS.bgPrimary,
                        borderRadius: 12,
                        textAlign: 'center',
                        opacity: statsReveal(i * 10),
                        transform: `scale(${0.8 + statsReveal(i * 10) * 0.2})`,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{stat.icon}</span>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 20,
                          fontWeight: 700,
                          color: stat.color,
                          margin: '4px 0 2px',
                        }}
                      >
                        {stat.value}
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 10,
                          color: COLORS.textMuted,
                          margin: 0,
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div style={{ flex: 1, padding: 12 }}>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      margin: '0 0 10px 4px',
                    }}
                  >
                    Recent Activity
                  </p>

                  {RECENT_ACTIVITY.map((activity, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        backgroundColor: COLORS.bgCard,
                        borderRadius: 12,
                        marginBottom: 8,
                        opacity: activityReveal(i),
                        transform: `translateX(${(1 - activityReveal(i)) * 20}px)`,
                        border: `1px solid ${COLORS.accentBorder}`,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          backgroundColor: COLORS.tealLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                        }}
                      >
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.textPrimary,
                            margin: 0,
                          }}
                        >
                          {activity.action}
                        </p>
                        <p
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 12,
                            color: COLORS.textSecondary,
                            margin: 0,
                          }}
                        >
                          {activity.words} • {activity.time}
                        </p>
                      </div>
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.teal,
                        }}
                      >
                        {activity.xp}
                      </span>
                    </div>
                  ))}

                  {/* AI Coaching Tips */}
                  <div
                    style={{
                      marginTop: 12,
                      opacity: coachingReveal,
                      transform: `translateY(${(1 - coachingReveal) * 20}px)`,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        margin: '0 0 10px 4px',
                      }}
                    >
                      Coaching Tips
                    </p>

                    {COACHING_TIPS.map((tip, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '12px',
                          backgroundColor: COLORS.accentLight,
                          borderRadius: 12,
                          marginBottom: 8,
                          border: `1px solid ${COLORS.accentBorder}`,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{tip.icon}</span>
                        <p
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 13,
                            color: COLORS.textPrimary,
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {tip.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gift badge overlay */}
                {frame > 220 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: `translateX(-50%) scale(${Math.max(0, giftBadgeScale)})`,
                      opacity: giftBadgeOpacity,
                      padding: '12px 20px',
                      backgroundColor: COLORS.bgCard,
                      borderRadius: 20,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      border: `2px solid ${COLORS.accentPink}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🎁</span>
                    <div>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 14,
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          margin: 0,
                        }}
                      >
                        One account, both connected
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          margin: 0,
                        }}
                      >
                        The perfect gift for your partner
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </PhoneFrame>
          </div>

          {/* Sparkles when gift badge appears */}
          <SparkleBurst startFrame={225} x={30} y={70} count={5} color={COLORS.accentPink} />
          <SparkleBurst startFrame={230} x={70} y={68} count={5} color="#FFD700" />
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse when coaching tips appear */}
      <BeatPulse startFrame={160} color={COLORS.teal} intensity={0.4} />

      {/* Beat pulse when gift badge appears */}
      <BeatPulse startFrame={220} color={COLORS.accentPink} intensity={0.5} />
    </AbsoluteFill>
  );
};
