import { useCurrentFrame, interpolate, random } from 'remotion';
import { COLORS } from '../constants/colors';

interface ConfettiProps {
  startFrame: number;
  count?: number;
  duration?: number;
  colors?: string[];
}

const CONFETTI_COLORS = [
  COLORS.accentPink,
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#95E1D3', // Mint
  '#F38181', // Salmon
  '#AA96DA', // Lavender
];

interface ConfettiPiece {
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  horizontalDrift: number;
  size: number;
  color: string;
  shape: 'square' | 'circle' | 'strip';
  delay: number;
}

export const Confetti: React.FC<ConfettiProps> = ({
  startFrame,
  count = 50,
  duration = 90,
  colors = CONFETTI_COLORS,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > duration + 60) return null;

  // Generate confetti pieces deterministically
  const pieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
    x: random(`confetti-x-${i}`) * 100,
    y: -10 - random(`confetti-y-${i}`) * 20,
    rotation: random(`confetti-rot-${i}`) * 360,
    rotationSpeed: (random(`confetti-rotspeed-${i}`) - 0.5) * 20,
    fallSpeed: 2 + random(`confetti-fall-${i}`) * 3,
    horizontalDrift: (random(`confetti-drift-${i}`) - 0.5) * 2,
    size: 8 + random(`confetti-size-${i}`) * 12,
    color: colors[Math.floor(random(`confetti-color-${i}`) * colors.length)],
    shape: (['square', 'circle', 'strip'] as const)[Math.floor(random(`confetti-shape-${i}`) * 3)],
    delay: random(`confetti-delay-${i}`) * 15,
  }));

  // Overall opacity fade out
  const opacity = interpolate(
    localFrame,
    [duration - 30, duration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 200,
        opacity,
      }}
    >
      {pieces.map((piece, i) => {
        const pieceFrame = Math.max(0, localFrame - piece.delay);
        const yPos = piece.y + pieceFrame * piece.fallSpeed;
        const xPos = piece.x + Math.sin(pieceFrame * 0.1) * piece.horizontalDrift * 10;
        const rotation = piece.rotation + pieceFrame * piece.rotationSpeed;

        // Initial burst effect
        const burstScale = interpolate(
          pieceFrame,
          [0, 5, 15],
          [0, 1.5, 1],
          { extrapolateRight: 'clamp' }
        );

        if (yPos > 120) return null;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${xPos}%`,
              top: `${yPos}%`,
              width: piece.shape === 'strip' ? piece.size * 0.4 : piece.size,
              height: piece.shape === 'strip' ? piece.size * 1.5 : piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'strip' ? 2 : 2,
              transform: `rotate(${rotation}deg) scale(${burstScale})`,
              opacity: 0.9,
            }}
          />
        );
      })}
    </div>
  );
};
