import { useCurrentFrame, interpolate, Easing } from 'remotion';

// Keyframe for camera path animation
export interface CameraKeyframe {
  frame: number;      // When this keyframe occurs
  zoom: number;       // Scale level (1 = normal, 2 = 2x zoom, etc)
  focusX: number;     // X focus point (0-100, 50 = center)
  focusY: number;     // Y focus point (0-100, 50 = center)
}

interface CameraZoomProps {
  children: React.ReactNode;
  // Simple mode props
  startZoom?: number;
  endZoom?: number;
  duration?: number;
  startFrame?: number;
  style?: 'zoom-in' | 'zoom-out' | 'breathe' | 'cinematic' | 'path';
  zoomOutDuration?: number;
  focusX?: number;
  focusY?: number;
  zoomInDelay?: number;
  // Keyframe mode - for "path" style
  keyframes?: CameraKeyframe[];
}

export const CameraZoom: React.FC<CameraZoomProps> = ({
  children,
  startZoom = 1,
  endZoom = 1.05,
  duration = 300,
  startFrame = 0,
  style = 'zoom-in',
  zoomOutDuration = 45,
  focusX = 50,
  focusY = 50,
  zoomInDelay = 0,
  keyframes = [],
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  let scale = 1;
  let currentFocusX = focusX;
  let currentFocusY = focusY;

  if (style === 'path' && keyframes.length >= 2) {
    // Keyframe-based camera path - interpolate between keyframes
    // Find which two keyframes we're between
    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (localFrame >= keyframes[i].frame && localFrame <= keyframes[i + 1].frame) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }

    // Handle before first keyframe
    if (localFrame < keyframes[0].frame) {
      prevKeyframe = keyframes[0];
      nextKeyframe = keyframes[0];
    }

    // Handle after last keyframe
    if (localFrame > keyframes[keyframes.length - 1].frame) {
      prevKeyframe = keyframes[keyframes.length - 1];
      nextKeyframe = keyframes[keyframes.length - 1];
    }

    // Interpolate between keyframes with easing
    const progress = interpolate(
      localFrame,
      [prevKeyframe.frame, nextKeyframe.frame],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Use ease-in-out for smooth camera movement
    const easedProgress = Easing.inOut(Easing.cubic)(progress);

    scale = prevKeyframe.zoom + (nextKeyframe.zoom - prevKeyframe.zoom) * easedProgress;
    currentFocusX = prevKeyframe.focusX + (nextKeyframe.focusX - prevKeyframe.focusX) * easedProgress;
    currentFocusY = prevKeyframe.focusY + (nextKeyframe.focusY - prevKeyframe.focusY) * easedProgress;

  } else if (style === 'zoom-in') {
    scale = interpolate(localFrame, [0, duration], [startZoom, endZoom], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (style === 'zoom-out') {
    scale = interpolate(localFrame, [0, duration], [endZoom, startZoom], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (style === 'breathe') {
    scale = 1 + Math.sin(localFrame * 0.02) * 0.02;
  } else if (style === 'cinematic') {
    const zoomInDuration = 45;
    const zoomInEnd = duration - zoomOutDuration;

    if (localFrame <= zoomInDelay) {
      scale = startZoom;
    } else if (localFrame <= zoomInDelay + zoomInDuration) {
      const zoomProgress = (localFrame - zoomInDelay) / zoomInDuration;
      const easedProgress = Easing.out(Easing.cubic)(zoomProgress);
      scale = startZoom + (endZoom - startZoom) * easedProgress;
    } else if (localFrame <= zoomInEnd) {
      scale = endZoom;
    } else {
      const zoomOutProgress = (localFrame - zoomInEnd) / zoomOutDuration;
      const easedProgress = Easing.inOut(Easing.cubic)(zoomOutProgress);
      scale = endZoom - (endZoom - startZoom) * easedProgress;
    }
  }

  // Calculate translate to achieve focus point effect
  // When zoomed in, we need to translate to keep focus point centered
  const translateX = (50 - currentFocusX) * (scale - 1) * 2;
  const translateY = (50 - currentFocusY) * (scale - 1) * 2;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  );
};
