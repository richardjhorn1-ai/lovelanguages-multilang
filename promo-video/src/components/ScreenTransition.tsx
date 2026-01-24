import React from 'react';
import { useCurrentFrame, interpolate, spring } from 'remotion';
import { FPS } from '../constants/timing';

export type TransitionType = 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'fade' | 'modal' | 'none';

interface ScreenTransitionProps {
  type: TransitionType;
  startFrame: number;
  duration?: number;  // Default: 12 frames
  children: React.ReactNode;
  // For modal type
  modalScale?: number;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  type,
  startFrame,
  duration = 12,
  children,
  modalScale = 0.9,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  // Don't render before transition starts
  if (localFrame < 0) return null;

  // Transition progress (0 to 1)
  const progress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: duration,
  });

  // Calculate transform based on type
  let transform = '';
  let opacity = 1;

  switch (type) {
    case 'slide-left':
      transform = `translateX(${(1 - progress) * 100}%)`;
      break;
    case 'slide-right':
      transform = `translateX(${(progress - 1) * 100}%)`;
      break;
    case 'slide-up':
      transform = `translateY(${(1 - progress) * 100}%)`;
      break;
    case 'slide-down':
      transform = `translateY(${(progress - 1) * 100}%)`;
      break;
    case 'fade':
      opacity = progress;
      break;
    case 'modal':
      opacity = progress;
      transform = `scale(${modalScale + (1 - modalScale) * progress})`;
      break;
    case 'none':
    default:
      break;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform,
        opacity,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

// Component for managing multiple screens with transitions
interface ScreenManagerProps {
  screens: Array<{
    id: string;
    component: React.ReactNode;
    enterFrame: number;
    exitFrame?: number;
    enterTransition?: TransitionType;
    exitTransition?: TransitionType;
  }>;
}

export const ScreenManager: React.FC<ScreenManagerProps> = ({ screens }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {screens.map((screen) => {
        const isActive = frame >= screen.enterFrame &&
          (screen.exitFrame === undefined || frame < screen.exitFrame);

        if (!isActive && frame < screen.enterFrame) return null;

        // Handle exit transition
        if (screen.exitFrame && frame >= screen.exitFrame) {
          const exitProgress = interpolate(
            frame,
            [screen.exitFrame, screen.exitFrame + 12],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          if (exitProgress >= 1) return null;

          let exitTransform = '';
          let exitOpacity = 1 - exitProgress;

          switch (screen.exitTransition) {
            case 'slide-left':
              exitTransform = `translateX(${-exitProgress * 100}%)`;
              break;
            case 'slide-right':
              exitTransform = `translateX(${exitProgress * 100}%)`;
              break;
            case 'slide-up':
              exitTransform = `translateY(${-exitProgress * 100}%)`;
              break;
            case 'fade':
            default:
              break;
          }

          return (
            <div
              key={screen.id}
              style={{
                position: 'absolute',
                inset: 0,
                transform: exitTransform,
                opacity: exitOpacity,
              }}
            >
              {screen.component}
            </div>
          );
        }

        return (
          <ScreenTransition
            key={screen.id}
            type={screen.enterTransition || 'fade'}
            startFrame={screen.enterFrame}
          >
            {screen.component}
          </ScreenTransition>
        );
      })}
    </div>
  );
};

// Exit transition wrapper
interface ScreenExitProps {
  exitFrame: number;
  type?: TransitionType;
  duration?: number;
  children: React.ReactNode;
}

export const ScreenExit: React.FC<ScreenExitProps> = ({
  exitFrame,
  type = 'fade',
  duration = 12,
  children,
}) => {
  const frame = useCurrentFrame();

  if (frame < exitFrame) {
    return <>{children}</>;
  }

  const exitProgress = interpolate(
    frame,
    [exitFrame, exitFrame + duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (exitProgress >= 1) return null;

  let transform = '';
  let opacity = 1 - exitProgress;

  switch (type) {
    case 'slide-left':
      transform = `translateX(${-exitProgress * 100}%)`;
      break;
    case 'slide-right':
      transform = `translateX(${exitProgress * 100}%)`;
      break;
    case 'slide-up':
      transform = `translateY(${-exitProgress * 100}%)`;
      break;
    case 'fade':
    default:
      break;
  }

  return (
    <div style={{ transform, opacity }}>
      {children}
    </div>
  );
};
