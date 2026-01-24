import { useCurrentFrame, spring, interpolate } from 'remotion';
import { FPS } from '../constants/timing';
import { FONTS } from '../constants/fonts';
import { COLORS } from '../constants/colors';

export type Role = 'student' | 'tutor';

interface RoleIndicatorProps {
  role: Role;
  partnerName: string;  // "Student" or "Teacher"
  targetLanguage?: string; // "Polish", "Spanish", etc.
  startFrame?: number; // For entrance animation
}

// Role-specific styling
const ROLE_STYLES = {
  student: {
    backgroundColor: `${COLORS.accentPink}15`,
    borderColor: COLORS.accentPink,
    glowColor: COLORS.accentPink,
    icon: '📚',
    labelPrefix: 'Learning',
  },
  tutor: {
    backgroundColor: `${COLORS.teal}15`,
    borderColor: COLORS.teal,
    glowColor: COLORS.teal,
    icon: '🎓',
    labelPrefix: 'Teaching',
  },
};

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  role,
  partnerName,
  targetLanguage = 'Polish',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const style = ROLE_STYLES[role];

  // Entrance animation
  const entranceScale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
  });

  const entranceOpacity = interpolate(
    localFrame,
    [0, 10],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle pulse animation
  const pulseIntensity = Math.sin(frame * 0.1) * 0.1 + 1;

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 28px',
        backgroundColor: style.backgroundColor,
        borderRadius: 28,
        border: `3px solid ${style.borderColor}`,
        boxShadow: `0 6px 24px ${style.glowColor}40`,
        transform: `scale(${Math.max(0, entranceScale) * pulseIntensity})`,
        opacity: entranceOpacity,
      }}
    >
      {/* Role icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: style.borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        {style.icon}
      </div>

      {/* Role text */}
      <div>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            fontWeight: 700,
            color: style.borderColor,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          {role === 'student' ? `${style.labelPrefix} ${targetLanguage}` : `${style.labelPrefix} Partner`}
        </p>
        <p
          style={{
            fontFamily: FONTS.header,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.textPrimary,
            margin: 0,
            marginTop: 2,
          }}
        >
          {role === 'student' ? 'Student' : 'Teacher'} view
        </p>
      </div>
    </div>
  );
};

// Compact version for inside phone screen
interface RoleIndicatorCompactProps {
  role: Role;
  partnerName: string;
}

export const RoleIndicatorCompact: React.FC<RoleIndicatorCompactProps> = ({
  role,
  partnerName,
}) => {
  const style = ROLE_STYLES[role];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        backgroundColor: style.backgroundColor,
        borderRadius: 12,
        border: `1.5px solid ${style.borderColor}`,
      }}
    >
      <span style={{ fontSize: 12 }}>{style.icon}</span>
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: 11,
          fontWeight: 600,
          color: style.borderColor,
        }}
      >
        {partnerName}
      </span>
    </div>
  );
};
