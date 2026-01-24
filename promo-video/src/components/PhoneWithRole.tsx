import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { PhoneFramePremium } from './PhoneFramePremium';
import { RoleIndicator, Role } from './RoleIndicator';
import { FPS } from '../constants/timing';
import { COLORS } from '../constants/colors';

interface PhoneWithRoleProps {
  role: Role;
  partnerName: string;
  targetLanguage?: string;
  children: React.ReactNode;
  scale?: number;
  startFrame?: number;
  showIndicator?: boolean;
  glowIntensity?: number;
  floating?: boolean;
}

// Glow colors for each role
const ROLE_GLOW = {
  student: COLORS.accentPink,
  tutor: COLORS.teal,
};

export const PhoneWithRole: React.FC<PhoneWithRoleProps> = ({
  role,
  partnerName,
  targetLanguage = 'Polish',
  children,
  scale = 1,
  startFrame = 0,
  showIndicator = true,
  glowIntensity = 0.6,
  floating = true,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const glowColor = ROLE_GLOW[role];

  // Entrance animation
  const entranceProgress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 80 },
  });

  // Pulsing glow effect
  const glowPulse = Math.sin(frame * 0.08) * 0.15 + 0.85;

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `scale(${Math.max(0, entranceProgress)})`,
        opacity: interpolate(localFrame, [0, 15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      {/* Role indicator - positioned above phone with proper spacing */}
      {showIndicator && (
        <div
          style={{
            position: 'absolute',
            top: -110,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <RoleIndicator
            role={role}
            partnerName={partnerName}
            targetLanguage={targetLanguage}
            startFrame={startFrame}
          />
        </div>
      )}

      {/* Phone with colored glow */}
      <div
        style={{
          position: 'relative',
          filter: `drop-shadow(0 0 ${30 * glowIntensity * glowPulse}px ${glowColor}50)`,
        }}
      >
        {/* Border glow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 36,
            border: `2px solid ${glowColor}`,
            opacity: glowIntensity * glowPulse * 0.6,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        <PhoneFramePremium scale={scale} floating={floating}>
          {children}
        </PhoneFramePremium>
      </div>
    </div>
  );
};

// Transition component for switching between roles
interface PhoneRoleTransitionProps {
  fromRole: Role;
  toRole: Role;
  fromPartner: string;
  toPartner: string;
  targetLanguage?: string;
  transitionFrame: number;
  transitionDuration?: number;
  fromContent: React.ReactNode;
  toContent: React.ReactNode;
  scale?: number;
}

export const PhoneRoleTransition: React.FC<PhoneRoleTransitionProps> = ({
  fromRole,
  toRole,
  fromPartner,
  toPartner,
  targetLanguage = 'Polish',
  transitionFrame,
  transitionDuration = 30,
  fromContent,
  toContent,
  scale = 1.4,
}) => {
  const frame = useCurrentFrame();

  // Transition progress
  const transitionProgress = interpolate(
    frame,
    [transitionFrame, transitionFrame + transitionDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const showFrom = transitionProgress < 1;
  const showTo = transitionProgress > 0;

  // Cross-fade with slide
  const fromOpacity = 1 - transitionProgress;
  const toOpacity = transitionProgress;
  const fromX = -transitionProgress * 100;
  const toX = (1 - transitionProgress) * 100;

  return (
    <div style={{ position: 'relative' }}>
      {/* From phone */}
      {showFrom && (
        <div
          style={{
            position: 'absolute',
            transform: `translateX(${fromX}px)`,
            opacity: fromOpacity,
          }}
        >
          <PhoneWithRole
            role={fromRole}
            partnerName={fromPartner}
            targetLanguage={targetLanguage}
            scale={scale}
            glowIntensity={0.4 + 0.2 * fromOpacity}
          >
            {fromContent}
          </PhoneWithRole>
        </div>
      )}

      {/* To phone */}
      {showTo && (
        <div
          style={{
            position: transitionProgress < 1 ? 'absolute' : 'relative',
            transform: `translateX(${toX}px)`,
            opacity: toOpacity,
          }}
        >
          <PhoneWithRole
            role={toRole}
            partnerName={toPartner}
            targetLanguage={targetLanguage}
            scale={scale}
            glowIntensity={0.4 + 0.2 * toOpacity}
          >
            {toContent}
          </PhoneWithRole>
        </div>
      )}
    </div>
  );
};
