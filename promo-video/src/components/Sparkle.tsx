import { useCurrentFrame, interpolate, random } from 'remotion';
import { COLORS } from '../constants/colors';

interface SparkleProps {
  startFrame?: number;
  count?: number;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

interface Spark {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export const Sparkle: React.FC<SparkleProps> = ({
  startFrame = 0,
  count = 6,
  size = 100,
  color = COLORS.accentPink,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // Generate sparkles deterministically
  const sparkles: Spark[] = Array.from({ length: count }, (_, i) => ({
    x: 20 + random(`spark-x-${i}`) * 60,
    y: 20 + random(`spark-y-${i}`) * 60,
    size: 0.5 + random(`spark-size-${i}`) * 0.8,
    delay: random(`spark-delay-${i}`) * 30,
    duration: 20 + random(`spark-dur-${i}`) * 20,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {sparkles.map((spark, i) => {
        const sparkFrame = (localFrame - spark.delay) % (spark.duration + 20);

        const opacity = interpolate(
          sparkFrame,
          [0, spark.duration * 0.3, spark.duration * 0.7, spark.duration],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const scale = interpolate(
          sparkFrame,
          [0, spark.duration * 0.3, spark.duration],
          [0, 1, 0.3],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${spark.x}%`,
              top: `${spark.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
            }}
          >
            {/* 4-point star sparkle */}
            <svg
              width={12 * spark.size}
              height={12 * spark.size}
              viewBox="0 0 24 24"
              fill={color}
            >
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// Burst of sparkles that appear once and fade
interface SparkleBurstProps {
  startFrame: number;
  x?: number;
  y?: number;
  count?: number;
  color?: string;
}

export const SparkleBurst: React.FC<SparkleBurstProps> = ({
  startFrame,
  x = 50,
  y = 50,
  count = 8,
  color = '#FFD700',
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > 45) return null;

  const sparkles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 30 + random(`burst-dist-${i}`) * 40;
    const size = 0.6 + random(`burst-size-${i}`) * 0.6;

    return { angle, distance, size };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 150,
      }}
    >
      {sparkles.map((spark, i) => {
        const progress = interpolate(localFrame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
        const sparkX = Math.cos(spark.angle) * spark.distance * progress;
        const sparkY = Math.sin(spark.angle) * spark.distance * progress;

        const opacity = interpolate(localFrame, [0, 10, 30, 45], [0, 1, 0.8, 0], {
          extrapolateRight: 'clamp'
        });

        const scale = interpolate(localFrame, [0, 8, 30], [0, 1.2, 0.5], {
          extrapolateRight: 'clamp'
        });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sparkX,
              top: sparkY,
              transform: `scale(${scale * spark.size})`,
              opacity,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
