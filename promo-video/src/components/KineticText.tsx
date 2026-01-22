import { useCurrentFrame, spring, interpolate } from 'remotion';
import { FPS } from '../constants/timing';

interface KineticTextProps {
  text: string;
  startFrame?: number;
  style?: 'slam' | 'slide-up' | 'word-by-word' | 'blur-in' | 'scale-up';
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  style = 'slam',
  color = '#292F36',
  fontSize = 28,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  textAlign = 'center',
  lineHeight = 1.2,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // SLAM - text slams in from scale with overshoot
  if (style === 'slam') {
    const scale = spring({
      frame: localFrame,
      fps: FPS,
      config: { damping: 8, stiffness: 150, mass: 0.5 },
    });

    const opacity = interpolate(localFrame, [0, 5], [0, 1], {
      extrapolateRight: 'clamp',
    });

    return (
      <div
        style={{
          transform: `scale(${Math.max(0, scale)})`,
          opacity,
          color,
          fontSize,
          fontFamily,
          fontWeight,
          textAlign,
          lineHeight,
        }}
      >
        {text}
      </div>
    );
  }

  // SLIDE-UP - text slides up with blur becoming sharp
  if (style === 'slide-up') {
    const progress = spring({
      frame: localFrame,
      fps: FPS,
      config: { damping: 15, stiffness: 100, mass: 0.8 },
    });

    const y = interpolate(progress, [0, 1], [40, 0]);
    const blur = interpolate(progress, [0, 1], [8, 0]);
    const opacity = interpolate(localFrame, [0, 8], [0, 1], {
      extrapolateRight: 'clamp',
    });

    return (
      <div
        style={{
          transform: `translateY(${y}px)`,
          filter: `blur(${blur}px)`,
          opacity,
          color,
          fontSize,
          fontFamily,
          fontWeight,
          textAlign,
          lineHeight,
        }}
      >
        {text}
      </div>
    );
  }

  // WORD-BY-WORD - each word animates in with stagger
  if (style === 'word-by-word') {
    const words = text.split(' ');
    const staggerDelay = 4; // frames between each word

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
          gap: fontSize * 0.3,
          lineHeight,
          width: '100%',
        }}
      >
        {words.map((word, i) => {
          const wordFrame = localFrame - i * staggerDelay;

          const scale = spring({
            frame: wordFrame,
            fps: FPS,
            config: { damping: 10, stiffness: 150, mass: 0.4 },
          });

          const opacity = interpolate(wordFrame, [0, 3], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const y = interpolate(wordFrame, [0, 10], [20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `scale(${Math.max(0, scale)}) translateY(${Math.max(0, y)}px)`,
                opacity: Math.max(0, opacity),
                color,
                fontSize,
                fontFamily,
                fontWeight,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  }

  // BLUR-IN - starts blurry and far, comes into focus
  if (style === 'blur-in') {
    const progress = interpolate(localFrame, [0, 20], [0, 1], {
      extrapolateRight: 'clamp',
    });

    const scale = interpolate(progress, [0, 1], [1.3, 1]);
    const blur = interpolate(progress, [0, 1], [15, 0]);
    const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

    return (
      <div
        style={{
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity,
          color,
          fontSize,
          fontFamily,
          fontWeight,
          textAlign,
          lineHeight,
        }}
      >
        {text}
      </div>
    );
  }

  // SCALE-UP - simple scale up with ease
  const scaleProgress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });

  return (
    <div
      style={{
        transform: `scale(${Math.max(0, scaleProgress)})`,
        color,
        fontSize,
        fontFamily,
        fontWeight,
        textAlign,
        lineHeight,
      }}
    >
      {text}
    </div>
  );
};
