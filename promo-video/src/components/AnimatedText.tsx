import { useCurrentFrame, interpolate } from 'remotion';
import { FPS } from '../constants/timing';

type AnimatedTextProps = {
  text: string;
  startFrame?: number;
  durationInSeconds?: number;
  style?: React.CSSProperties;
  showCursor?: boolean;
  cursorColor?: string;
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  startFrame = 0,
  durationInSeconds = 2,
  style,
  showCursor = true,
  cursorColor = '#FF4761',
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - startFrame;

  const durationInFrames = durationInSeconds * FPS;

  const charsToShow = Math.floor(
    interpolate(
      adjustedFrame,
      [0, durationInFrames],
      [0, text.length],
      { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    )
  );

  const displayedText = text.slice(0, charsToShow);
  const isTyping = charsToShow < text.length && adjustedFrame >= 0;
  const cursorVisible = showCursor && isTyping && adjustedFrame % 30 < 15;

  if (adjustedFrame < 0) return null;

  return (
    <span style={style}>
      {displayedText}
      {cursorVisible && (
        <span style={{ color: cursorColor, fontWeight: 400 }}>|</span>
      )}
    </span>
  );
};
