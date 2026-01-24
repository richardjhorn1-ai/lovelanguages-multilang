import React, { useRef, useEffect, useMemo } from 'react';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';

// Particle for word effect
interface WordParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  alpha: number;
  size: number;
  angle: number; // For spiral motion
  speed: number;
}

// Animation states
type WordEventState = 'spawning' | 'showing_word' | 'transforming' | 'showing_translation' | 'forming_heart' | 'floating' | 'done';

// Word event - one word animation sequence
interface WordEvent {
  id: number;
  word: string;
  translation: string;
  particles: WordParticle[];
  state: WordEventState;
  stateStartTime: number;
  centerX: number;
  centerY: number;
  rotation: number; // Rotation angle in radians
  wordPositions: { x: number; y: number }[];
  translationPositions: { x: number; y: number }[];
  heartPositions: { x: number; y: number }[];
  floatY: number;
  opacity: number;
}

interface WordParticleEffectProps {
  accentColor: string;
  containerRef: React.RefObject<HTMLDivElement>;
  targetLanguage?: string;
  nativeLanguage?: string;
}

// Word particle effect - independent background animation
const WordParticleEffect: React.FC<WordParticleEffectProps> = ({
  accentColor,
  containerRef,
  targetLanguage = 'pl',
  nativeLanguage = 'en'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventsRef = useRef<WordEvent[]>([]);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const eventIdRef = useRef<number>(0);

  // Get language configs for the selected languages
  const targetConfig = LANGUAGE_CONFIGS[targetLanguage];
  const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];

  // Build word pairs dynamically based on selected language settings
  // Only language words, no emojis
  const wordPairs = useMemo(() => {
    return [
      { word: targetConfig?.examples.hello || 'Hello', translation: nativeConfig?.examples.hello || 'Hello' },
      { word: targetConfig?.examples.iLoveYou || 'I love you', translation: nativeConfig?.examples.iLoveYou || 'I love you' },
      { word: targetConfig?.examples.thankYou || 'Thank you', translation: nativeConfig?.examples.thankYou || 'Thank you' },
    ];
  }, [targetConfig, nativeConfig]);

  // Convert text to particle positions using offscreen canvas
  const getTextParticlePositions = (
    text: string,
    centerX: number,
    centerY: number,
    fontSize: number,
    rotation: number = 0
  ): { x: number; y: number }[] => {
    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d');
    if (!ctx) return [];

    // Set canvas size
    offscreen.width = 300;
    offscreen.height = 80;

    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, offscreen.width / 2, offscreen.height / 2);

    // Sample pixels - use rate that clearly resolves the text
    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const positions: { x: number; y: number }[] = [];
    const sampleRate = 2; // Sample every 2nd pixel for clear resolution

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    for (let y = 0; y < offscreen.height; y += sampleRate) {
      for (let x = 0; x < offscreen.width; x += sampleRate) {
        const i = (y * offscreen.width + x) * 4;
        if (imageData.data[i + 3] > 128) { // Alpha > 50%
          // Apply rotation around center
          const localX = x - offscreen.width / 2;
          const localY = y - offscreen.height / 2;
          const rotatedX = localX * cos - localY * sin;
          const rotatedY = localX * sin + localY * cos;

          positions.push({
            x: centerX + rotatedX,
            y: centerY + rotatedY,
          });
        }
      }
    }

    return positions;
  };

  // Generate filled heart-shaped positions (not just outline)
  const getHeartPositions = (
    centerX: number,
    centerY: number,
    scale: number,
    count: number
  ): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];

    // Fill the heart by sampling points and checking if inside
    // Heart parametric bounds: x ∈ [-16, 16], y ∈ [-17, 13] at scale=1
    const gridSize = Math.ceil(Math.sqrt(count * 1.5)); // Oversample then trim

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const x = (gx / gridSize - 0.5) * 34 * scale;
        const y = (gy / gridSize - 0.5) * 34 * scale;

        // Check if point is inside heart using implicit equation
        // Normalized: ((x/16)² + (y/13)² - 1)³ - (x/16)²(y/13)³ < 0
        const nx = x / (16 * scale);
        const ny = -y / (13 * scale); // Flip y for heart orientation
        const term1 = nx * nx + ny * ny - 1;
        const inside = term1 * term1 * term1 - nx * nx * ny * ny * ny < 0;

        if (inside) {
          positions.push({
            x: centerX + x,
            y: centerY + y,
          });
        }
      }
    }

    // Shuffle and trim to exact count needed
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return positions.slice(0, count);
  };

  // Spawn a new word event, avoiding existing event positions
  const spawnWordEvent = (
    canvasWidth: number,
    canvasHeight: number,
    existingEvents: WordEvent[],
    pairs: { word: string; translation: string }[]
  ): WordEvent => {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];

    // Generate candidate position at edges - avoid center text area
    const generatePosition = (): { x: number; y: number } => {
      const edge = Math.floor(Math.random() * 5);
      switch (edge) {
        case 0: // Left edge
          return {
            x: canvasWidth * (0.05 + Math.random() * 0.15),
            y: canvasHeight * (0.2 + Math.random() * 0.6),
          };
        case 1: // Right edge
          return {
            x: canvasWidth * (0.80 + Math.random() * 0.15),
            y: canvasHeight * (0.2 + Math.random() * 0.6),
          };
        case 2: // Top-left corner
          return {
            x: canvasWidth * (0.1 + Math.random() * 0.2),
            y: canvasHeight * (0.05 + Math.random() * 0.15),
          };
        case 3: // Top-right corner
          return {
            x: canvasWidth * (0.7 + Math.random() * 0.2),
            y: canvasHeight * (0.05 + Math.random() * 0.15),
          };
        default: // Bottom area
          return {
            x: canvasWidth * (0.2 + Math.random() * 0.6),
            y: canvasHeight * (0.85 + Math.random() * 0.1),
          };
      }
    };

    // Minimum distance between word events
    const MIN_DISTANCE = 250;

    // Try to find a position away from existing events
    let centerX: number;
    let centerY: number;
    let bestDistance = 0;
    let bestPos = generatePosition();

    // Try several positions, pick the one furthest from all existing events
    for (let attempt = 0; attempt < 10; attempt++) {
      const pos = generatePosition();
      let minDistToExisting = Infinity;

      for (const existing of existingEvents) {
        if (existing.state === 'done') continue;
        const dx = pos.x - existing.centerX;
        const dy = pos.y - existing.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        minDistToExisting = Math.min(minDistToExisting, dist);
      }

      // If no existing events or far enough, use this position
      if (minDistToExisting > MIN_DISTANCE) {
        bestPos = pos;
        break;
      }

      // Track best candidate
      if (minDistToExisting > bestDistance) {
        bestDistance = minDistToExisting;
        bestPos = pos;
      }
    }

    centerX = bestPos.x;
    centerY = bestPos.y;

    // Random rotation: -90 to +90 degrees (keeps text readable)
    const rotation = (Math.random() - 0.5) * Math.PI; // -π/2 to +π/2

    // Font size for clear readability
    const fontSize = 32;

    const wordPositions = getTextParticlePositions(pair.word, centerX, centerY, fontSize, rotation);
    const translationPositions = getTextParticlePositions(pair.translation, centerX, centerY, fontSize, rotation);

    // Use the exact particle count needed to resolve text clearly
    // Heart scales to fit that number of particles nicely
    const particleCount = Math.max(wordPositions.length, translationPositions.length);
    // Scale heart based on particle count: more particles = larger heart
    // sqrt scaling keeps particle density consistent
    const heartScale = Math.sqrt(particleCount / 80) * 2.5;
    const heartPositions = getHeartPositions(centerX, centerY, heartScale, particleCount);

    // Extend smaller arrays by repeating positions
    while (wordPositions.length < particleCount) {
      wordPositions.push(wordPositions[Math.floor(Math.random() * wordPositions.length)]);
    }
    while (translationPositions.length < particleCount) {
      translationPositions.push(translationPositions[Math.floor(Math.random() * translationPositions.length)]);
    }

    // Create particles starting scattered - smaller particles
    const particles: WordParticle[] = wordPositions.slice(0, particleCount).map((pos) => ({
      x: pos.x + (Math.random() - 0.5) * 100,
      y: pos.y + (Math.random() - 0.5) * 100,
      originX: pos.x,
      originY: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      alpha: 0,
      size: 0.8 + Math.random() * 0.8, // Smaller particles
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
    }));

    return {
      id: eventIdRef.current++,
      word: pair.word,
      translation: pair.translation,
      particles,
      state: 'spawning',
      stateStartTime: Date.now(),
      centerX,
      centerY,
      rotation,
      wordPositions: wordPositions.slice(0, particleCount),
      translationPositions: translationPositions.slice(0, particleCount),
      heartPositions,
      floatY: 0,
      opacity: 1,
    };
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Timing constants (in ms)
    const SPAWN_INTERVAL = 6000; // New word every 6 seconds
    const MAX_ACTIVE_EVENTS = 3; // Allow multiple words at once
    const SPAWNING_DURATION = 1500;
    const SHOWING_WORD_DURATION = 2000;
    const TRANSFORMING_DURATION = 1500;
    const SHOWING_TRANSLATION_DURATION = 2000;
    const FORMING_HEART_DURATION = 2000;
    const FLOATING_DURATION = 4000;

    // Lighter version of accent color for softer appearance
    const lighterColor = accentColor.replace(/^#/, '');
    const r = parseInt(lighterColor.slice(0, 2), 16);
    const g = parseInt(lighterColor.slice(2, 4), 16);
    const b = parseInt(lighterColor.slice(4, 6), 16);
    // Blend toward white by 30%
    const lr = Math.round(r + (255 - r) * 0.3);
    const lg = Math.round(g + (255 - g) * 0.3);
    const lb = Math.round(b + (255 - b) * 0.3);
    const softColor = `rgb(${lr}, ${lg}, ${lb})`;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      // Spawn new events periodically (allow multiple active)
      const activeEvents = eventsRef.current.filter(e => e.state !== 'done');
      if (activeEvents.length < MAX_ACTIVE_EVENTS && now - lastSpawnRef.current > SPAWN_INTERVAL) {
        eventsRef.current.push(spawnWordEvent(canvas.width, canvas.height, eventsRef.current, wordPairs));
        lastSpawnRef.current = now;
      }

      // Update and render each event
      eventsRef.current.forEach((event) => {
        const elapsed = now - event.stateStartTime;

        // State machine
        switch (event.state) {
          case 'spawning': {
            const progress = Math.min(elapsed / SPAWNING_DURATION, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            event.particles.forEach((p, i) => {
              const target = event.wordPositions[i];
              p.x += (target.x - p.x) * 0.08;
              p.y += (target.y - p.y) * 0.08;
              p.alpha = ease * 0.45; // Slightly visible
            });

            if (progress >= 1) {
              event.state = 'showing_word';
              event.stateStartTime = now;
            }
            break;
          }

          case 'showing_word': {
            // Gentle breathing effect
            const breathe = Math.sin(elapsed * 0.003) * 0.05;
            event.particles.forEach((p, i) => {
              const target = event.wordPositions[i];
              p.x += (target.x - p.x) * 0.1;
              p.y += (target.y - p.y) * 0.1;
              p.alpha = 0.4 + breathe; // Slightly visible
            });

            if (elapsed > SHOWING_WORD_DURATION) {
              event.state = 'transforming';
              event.stateStartTime = now;
            }
            break;
          }

          case 'transforming': {
            const progress = Math.min(elapsed / TRANSFORMING_DURATION, 1);
            const ease = progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2; // Ease in-out cubic

            event.particles.forEach((p, i) => {
              const from = event.wordPositions[i];
              const to = event.translationPositions[i];

              // Spiral motion during transform
              const spiralRadius = Math.sin(progress * Math.PI) * 30;
              const spiralAngle = p.angle + progress * Math.PI * 2;

              const baseX = from.x + (to.x - from.x) * ease;
              const baseY = from.y + (to.y - from.y) * ease;

              p.targetX = baseX + Math.cos(spiralAngle) * spiralRadius;
              p.targetY = baseY + Math.sin(spiralAngle) * spiralRadius;

              p.x += (p.targetX - p.x) * 0.15;
              p.y += (p.targetY - p.y) * 0.15;
              p.alpha = 0.35 + Math.sin(progress * Math.PI) * 0.15; // Slightly visible
            });

            if (progress >= 1) {
              event.state = 'showing_translation';
              event.stateStartTime = now;
            }
            break;
          }

          case 'showing_translation': {
            const breathe = Math.sin(elapsed * 0.003) * 0.05;
            event.particles.forEach((p, i) => {
              const target = event.translationPositions[i];
              p.x += (target.x - p.x) * 0.1;
              p.y += (target.y - p.y) * 0.1;
              p.alpha = 0.4 + breathe; // Slightly visible
            });

            if (elapsed > SHOWING_TRANSLATION_DURATION) {
              event.state = 'forming_heart';
              event.stateStartTime = now;
            }
            break;
          }

          case 'forming_heart': {
            const progress = Math.min(elapsed / FORMING_HEART_DURATION, 1);
            const ease = 1 - Math.pow(1 - progress, 4); // Ease out quart

            event.particles.forEach((p, i) => {
              const from = event.translationPositions[i];
              const to = event.heartPositions[i % event.heartPositions.length];

              // Inward spiral
              const spiralRadius = (1 - progress) * 50;
              const spiralAngle = p.angle + progress * Math.PI * 4;

              const baseX = from.x + (to.x - from.x) * ease;
              const baseY = from.y + (to.y - from.y) * ease;

              p.targetX = baseX + Math.cos(spiralAngle) * spiralRadius * (1 - ease);
              p.targetY = baseY + Math.sin(spiralAngle) * spiralRadius * (1 - ease);

              p.x += (p.targetX - p.x) * 0.12;
              p.y += (p.targetY - p.y) * 0.12;
              p.alpha = 0.4; // Slightly visible
            });

            if (progress >= 1) {
              event.state = 'floating';
              event.stateStartTime = now;
            }
            break;
          }

          case 'floating': {
            const progress = Math.min(elapsed / FLOATING_DURATION, 1);
            event.floatY = progress * 150; // Float up 150px
            event.opacity = 1 - progress; // Fade out

            event.particles.forEach((p, i) => {
              const target = event.heartPositions[i % event.heartPositions.length];
              p.x += (target.x - p.x) * 0.05;
              p.y += (target.y - event.floatY - p.y) * 0.05;
              p.alpha = 0.4 * event.opacity; // Slightly visible

              // Slight dispersion as it fades
              p.x += (Math.random() - 0.5) * progress * 2;
              p.y += (Math.random() - 0.5) * progress * 2;
            });

            if (progress >= 1) {
              event.state = 'done';
            }
            break;
          }
        }

        // Render particles - no shadow for performance
        event.particles.forEach((p) => {
          if (p.alpha <= 0) return;

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = softColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      });

      // Clean up done events
      eventsRef.current = eventsRef.current.filter(e => e.state !== 'done');

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start first word after a short delay
    lastSpawnRef.current = Date.now() - SPAWN_INTERVAL + 2000;

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accentColor, containerRef, wordPairs]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: -1 }}
    />
  );
};

export default WordParticleEffect;
