
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import { DEFAULT_THEME, applyTheme } from '../services/theme';
import { GameShowcase } from './hero/GameShowcase';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES, LanguageCode } from '../constants/language-config';
import { useHoneypot } from '../hooks/useHoneypot';

type HeroRole = 'student' | 'tutor';

// Fixed brand colors for landing page
const BRAND = {
  primary: '#FF4761',
  primaryHover: '#E63E56',
  light: '#FFF0F3',
  border: '#FECDD3',
  shadow: 'rgba(255, 71, 97, 0.25)',
  teal: '#14b8a6',
  tealHover: '#0d9488',
  tealLight: '#ccfbf1',
  tealShadow: 'rgba(20, 184, 166, 0.25)',
};

// CSS Keyframe animations (injected once)
const ANIMATION_STYLES = `
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  @keyframes reveal-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes underline-draw {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .section-content > * {
    opacity: 0;
  }

  .section-content.visible > *:nth-child(1) {
    animation: reveal-up 0.6s ease-out forwards;
  }

  .section-content.visible > *:nth-child(2) {
    animation: reveal-up 0.6s ease-out 0.1s forwards;
  }

  .section-content.visible > *:nth-child(3) {
    animation: reveal-up 0.6s ease-out 0.2s forwards;
  }

  .section-content.visible > *:nth-child(4) {
    animation: reveal-up 0.6s ease-out 0.3s forwards;
  }

  .section-content.visible > *:nth-child(5) {
    animation: reveal-up 0.6s ease-out 0.4s forwards;
  }

  .typewriter-cursor {
    animation: blink 0.8s infinite;
    font-weight: 100;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }

  .animate-pulse-glow {
    animation: pulse-glow 1.5s ease-in-out infinite;
  }
`;


// Highlight component for colored keywords - SUBTLE glow
const Highlight: React.FC<{
  children: React.ReactNode;
  isStudent: boolean;
  glow?: boolean;
  underline?: boolean;
}> = ({ children, isStudent, glow, underline }) => (
  <span
    className="transition-all duration-300 relative inline"
    style={{
      color: isStudent ? BRAND.primary : BRAND.teal,
      textShadow: glow
        ? `0 0 20px ${isStudent ? 'rgba(255, 71, 97, 0.25)' : 'rgba(20, 184, 166, 0.25)'}`
        : 'none',
      fontWeight: 'inherit',
    }}
  >
    {children}
    {underline && (
      <span
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
        style={{
          background: `linear-gradient(90deg, ${isStudent ? BRAND.primary : BRAND.teal}, ${isStudent ? '#FF6B81' : '#2dd4bf'})`,
          animation: 'underline-draw 0.8s ease-out 0.3s forwards',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
        }}
      />
    )}
  </span>
);

// Helper to render text with multiple highlights
const renderWithHighlights = (
  text: string,
  highlights: string[],
  isStudent: boolean,
  underlinedPhrase?: string
): React.ReactNode => {
  if (!highlights.length && !underlinedPhrase) return text;

  // Build regex pattern for all highlights
  const allPatterns = [...highlights];
  if (underlinedPhrase && !highlights.includes(underlinedPhrase)) {
    allPatterns.push(underlinedPhrase);
  }

  // Sort by length (longest first) to avoid partial matches
  allPatterns.sort((a, b) => b.length - a.length);

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${allPatterns.map(escapeRegex).join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isHighlight = allPatterns.some(h => h.toLowerCase() === part.toLowerCase());
    const isUnderlined = underlinedPhrase && part.toLowerCase() === underlinedPhrase.toLowerCase();

    if (isHighlight) {
      return (
        <Highlight key={i} isStudent={isStudent} glow underline={isUnderlined}>
          {part}
        </Highlight>
      );
    }
    return part;
  });
};

// Interactive floating hearts with physics
interface Heart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number; // Each heart has its own natural float speed
  wobbleOffset: number; // For organic horizontal drift
  size: number;
  opacity: number;
  radius: number; // Collision radius based on size
}

// Heart shape collision using parametric form
// x = 16*sin³(t), y = 13*cos(t) - 5*cos(2t) - 2*cos(3t) - cos(4t)
// Classic heart shape with pronounced cleft at top

// Helper to get heart point at parameter t
const getHeartPoint = (t: number, centerX: number, centerY: number, scale: number) => {
  const sint = Math.sin(t);
  // Original coefficients for deeper cleft at top
  return {
    x: centerX + 16 * sint * sint * sint * scale,
    y: centerY - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale
  };
};

// Check if point is inside heart using ray casting algorithm
const isInsideHeartShape = (px: number, py: number, centerX: number, centerY: number, scale: number): boolean => {
  // Generate heart boundary points
  const points: { x: number; y: number }[] = [];
  for (let t = 0; t < Math.PI * 2; t += 0.15) {
    points.push(getHeartPoint(t, centerX, centerY, scale));
  }

  // Ray casting algorithm - count intersections
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;

    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

// Get the closest point on heart boundary and the parameter t
// Excludes the cleft zone (around t=π) to prevent hearts filling the dip
const getHeartBoundaryInfo = (px: number, py: number, centerX: number, centerY: number, scale: number, excludeCleft: boolean = true): { x: number; y: number; t: number } => {
  let closestDist = Infinity;
  let closestX = centerX;
  let closestY = centerY;
  let closestT = 0;

  // Cleft is around t=π (3.14), exclude roughly ±0.6 radians
  const cleftMin = Math.PI - 0.6;
  const cleftMax = Math.PI + 0.6;

  for (let t = 0; t < Math.PI * 2; t += 0.1) {
    // Skip cleft zone if excluding
    if (excludeCleft && t > cleftMin && t < cleftMax) {
      continue;
    }

    const { x: hx, y: hy } = getHeartPoint(t, centerX, centerY, scale);
    const dx = px - hx;
    const dy = py - hy;
    const dist = dx * dx + dy * dy;

    if (dist < closestDist) {
      closestDist = dist;
      closestX = hx;
      closestY = hy;
      closestT = t;
    }
  }

  return { x: closestX, y: closestY, t: closestT };
};

// Get magnetic field vector at a point - flows along heart shape
const getHeartMagneticField = (px: number, py: number, centerX: number, centerY: number, scale: number): { fx: number; fy: number } => {
  const { x: bx, y: by, t } = getHeartBoundaryInfo(px, py, centerX, centerY, scale);

  // Calculate tangent direction at the closest boundary point
  // Derivative of heart parametric: dx/dt and dy/dt
  const sint = Math.sin(t);
  const cost = Math.cos(t);

  // dx/dt = 48 * sin²(t) * cos(t)
  const dxdt = 48 * sint * sint * cost * scale;
  // dy/dt for classic heart
  const dydt = (13 * Math.sin(t) - 10 * Math.sin(2 * t) - 6 * Math.sin(3 * t) - 4 * Math.sin(4 * t)) * scale;

  // Normalize tangent
  const tangentLen = Math.sqrt(dxdt * dxdt + dydt * dydt);
  if (tangentLen < 0.001) return { fx: 0, fy: 0 };

  const tx = dxdt / tangentLen;
  const ty = dydt / tangentLen;

  // Distance from point to boundary
  const dx = px - bx;
  const dy = py - by;
  const distToBoundary = Math.sqrt(dx * dx + dy * dy);

  // Field strength falls off with distance (stronger near boundary)
  const maxDist = 150;
  const strength = Math.max(0, 1 - distToBoundary / maxDist);

  // Return field vector (tangent direction, scaled by strength)
  return { fx: tx * strength, fy: ty * strength };
};

const InteractiveHearts: React.FC<{
  accentColor: string;
  activeSection: number;
  containerRef: React.RefObject<HTMLDivElement>;
  isMobile?: boolean;
}> = ({ accentColor, activeSection, containerRef, isMobile = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<Heart[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const clickImpulseRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animationRef = useRef<number>();

  // Calculate heart count based on section (starts with 30, increases by 8 each section)
  // Desktop: 70% of base, Mobile: 40% of base
  const baseCount = 30 + activeSection * 8;
  const heartCount = isMobile ? Math.round(baseCount * 0.4) : Math.round(baseCount * 0.7);

  // Initialize or update hearts when count changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentHearts = heartsRef.current;

    // Add new hearts if needed
    while (currentHearts.length < heartCount) {
      // Desktop only: 15% chance of a large, faint heart
      const isLargeHeart = !isMobile && Math.random() < 0.15;
      const size = isLargeHeart
        ? 28 + Math.random() * 12  // Large: 28-40px
        : 10 + Math.random() * 14; // Normal: 10-24px
      const opacity = isLargeHeart
        ? 0.06 + Math.random() * 0.08  // Large: very faint (0.06-0.14)
        : 0.15 + Math.random() * 0.25; // Normal: 0.15-0.40

      currentHearts.push({
        id: currentHearts.length,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        baseSpeed: isLargeHeart
          ? 0.25 + Math.random() * 0.35  // Large hearts float slower
          : 0.5 + Math.random() * 0.7,   // Normal hearts slowed down
        wobbleOffset: Math.random() * Math.PI * 2,
        size,
        opacity,
        radius: size * 0.3,
      });
    }
  }, [heartCount]);

  // Handle mouse/touch movement
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      clickImpulseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: Date.now(),
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      clickImpulseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        time: Date.now(),
      };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchend', handleMouseLeave);
    container.addEventListener('click', handleClick);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchend', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [containerRef]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016; // Approximate 60fps time step

      const hearts = heartsRef.current;
      const mouse = mouseRef.current;
      const clickImpulse = clickImpulseRef.current;

      // Cursor heart shape parameters - scale 2 = ~64px wide heart boundary
      const cursorHeartScale = 2;

      // Apply click impulse to all hearts (pushes them away from click point)
      if (clickImpulse && Date.now() - clickImpulse.time < 100) {
        hearts.forEach((heart) => {
          const dx = heart.x - clickImpulse.x;
          const dy = heart.y - clickImpulse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 300 && distance > 0) { // Impulse radius
            const force = 15 * (1 - distance / 300); // Strong push, fades with distance
            heart.vx += (dx / distance) * force;
            heart.vy += (dy / distance) * force;
          }
        });
        // Clear impulse after applying
        if (Date.now() - clickImpulse.time >= 50) {
          clickImpulseRef.current = null;
        }
      }

      // Phase 1: Apply forces (attraction + always floating upward)
      hearts.forEach((heart) => {
        // ALWAYS apply natural upward float and wobble
        const wobble = Math.sin(time * 1.5 + heart.wobbleOffset) * 0.3;
        heart.vx += wobble * 0.03;
        heart.vy -= heart.baseSpeed * 0.06; // Constant upward push (slowed)

        // Add gentle attraction toward cursor when active
        if (mouse.active) {
          const dx = mouse.x - heart.x;
          const dy = mouse.y - heart.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Very gentle attraction - whimsical and leisurely
          if (distance < 350 && distance > 0) {
            const force = 0.04 * (1 - distance / 350);
            heart.vx += (dx / distance) * force;
            heart.vy += (dy / distance) * force;
          }
        }

        // Apply damping - floaty and dreamy
        heart.vx *= 0.98;
        heart.vy *= 0.98;

        // Limit velocity - keep it slow
        const maxSpeed = 1.25;
        const speed = Math.sqrt(heart.vx * heart.vx + heart.vy * heart.vy);
        if (speed > maxSpeed) {
          heart.vx = (heart.vx / speed) * maxSpeed;
          heart.vy = (heart.vy / speed) * maxSpeed;
        }
      });

      // Phase 2: Heart-to-heart collision detection and response
      for (let i = 0; i < hearts.length; i++) {
        for (let j = i + 1; j < hearts.length; j++) {
          const h1 = hearts[i];
          const h2 = hearts[j];

          const dx = h2.x - h1.x;
          const dy = h2.y - h1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = h1.radius + h2.radius;

          if (distance < minDist && distance > 0) {
            // Collision! Push hearts apart
            const overlap = minDist - distance;
            const nx = dx / distance;
            const ny = dy / distance;

            // Move hearts apart (half each)
            const pushForce = overlap * 0.5;
            h1.x -= nx * pushForce;
            h1.y -= ny * pushForce;
            h2.x += nx * pushForce;
            h2.y += ny * pushForce;

            // Transfer velocity (elastic collision)
            const relVelX = h1.vx - h2.vx;
            const relVelY = h1.vy - h2.vy;
            const relVelDotN = relVelX * nx + relVelY * ny;

            if (relVelDotN > 0) {
              const bounce = 0.3;
              h1.vx -= relVelDotN * nx * bounce;
              h1.vy -= relVelDotN * ny * bounce;
              h2.vx += relVelDotN * nx * bounce;
              h2.vy += relVelDotN * ny * bounce;
            }
          }
        }
      }

      // Phase 3: Pull hearts toward heart-shaped boundary
      if (mouse.active) {
        // Cleft repulsion zone - at top center of heart (where the V dip is)
        const cleftX = mouse.x;
        const cleftY = mouse.y - 15 * cursorHeartScale; // Top center of heart
        const cleftRadius = 12 * cursorHeartScale; // Size of repulsion zone

        hearts.forEach((heart) => {
          const dx = heart.x - mouse.x;
          const dy = heart.y - mouse.y;
          const distToCenter = Math.sqrt(dx * dx + dy * dy);

          // Gentle repulsion from cleft area to keep it clear
          const cleftDx = heart.x - cleftX;
          const cleftDy = heart.y - cleftY;
          const distToCleft = Math.sqrt(cleftDx * cleftDx + cleftDy * cleftDy);

          if (distToCleft < cleftRadius && distToCleft > 0) {
            // Gentle push away from cleft
            const repelStrength = 0.025 * (1 - distToCleft / cleftRadius);
            heart.vx += (cleftDx / distToCleft) * repelStrength;
            heart.vy += (cleftDy / distToCleft) * repelStrength;
          }

          // Only affect hearts within 2x the heart size
          const pullRange = 32 * cursorHeartScale * 2; // ~2x heart width
          if (distToCenter < pullRange) {
            // Find nearest point on heart boundary
            const { x: bx, y: by } = getHeartBoundaryInfo(heart.x, heart.y, mouse.x, mouse.y, cursorHeartScale);
            const toBoundaryX = bx - heart.x;
            const toBoundaryY = by - heart.y;
            const distToBoundary = Math.sqrt(toBoundaryX * toBoundaryX + toBoundaryY * toBoundaryY);

            if (distToBoundary > 2) {
              // Gentle inward pull toward the heart boundary - slow and dreamy
              const pullStrength = 0.035;
              heart.vx += (toBoundaryX / distToBoundary) * pullStrength;
              heart.vy += (toBoundaryY / distToBoundary) * pullStrength;
            }

            // When close to boundary, add damping to settle gently
            if (distToBoundary < heart.radius * 3) {
              heart.vx *= 0.92;
              heart.vy *= 0.92;
            }
          }
        });
      }

      // Phase 4: Update positions and handle boundaries
      hearts.forEach((heart) => {
        heart.x += heart.vx;
        heart.y += heart.vy;

        // When heart exits top, respawn at bottom
        if (heart.y < -heart.size * 2) {
          heart.y = canvas.height + heart.size + Math.random() * 50;
          heart.x = Math.random() * canvas.width;
          heart.vx = 0;
          heart.vy = 0;
          heart.wobbleOffset = Math.random() * Math.PI * 2;
        }

        // Keep hearts within horizontal bounds
        if (heart.x < -heart.size) {
          heart.x = canvas.width + heart.size;
        }
        if (heart.x > canvas.width + heart.size) {
          heart.x = -heart.size;
        }

        // Draw heart
        ctx.save();
        ctx.translate(heart.x, heart.y);
        ctx.globalAlpha = heart.opacity;
        ctx.fillStyle = accentColor;
        ctx.font = `${heart.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, 0);
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accentColor, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Word pairs for the particle effect are now generated dynamically in WordParticleEffect
// using useLanguage() and LANGUAGE_CONFIGS for multi-language support

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

// Word particle effect - independent background animation
const WordParticleEffect: React.FC<{
  accentColor: string;
  containerRef: React.RefObject<HTMLDivElement>;
  targetLanguage?: string;
  nativeLanguage?: string;
}> = ({ accentColor, containerRef, targetLanguage = 'pl', nativeLanguage = 'en' }) => {
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
    const step = 34 * scale / gridSize; // Cover the heart width

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
    const particles: WordParticle[] = wordPositions.slice(0, particleCount).map((pos, i) => ({
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

// Section content - plain data, highlighting applied in component
interface SectionContent {
  headline: string;
  headlineHighlights: string[]; // Words to highlight in headline
  subhead?: string;
  copy: string;
  copyHighlights?: string[]; // Words to highlight in copy
  underlinedPhrase?: string; // Phrase to underline
}

// Section content for both arcs - functions that use t() for translations
const getStudentSections = (t: TFunction): SectionContent[] => [
  {
    headline: t('hero.student.section1.headline'),
    headlineHighlights: [t('hero.student.section1.highlight1'), t('hero.student.section1.highlight2')],
    subhead: t('hero.student.section1.subhead'),
    copy: t('hero.student.section1.copy'),
    copyHighlights: [t('hero.student.section1.copyHighlight1'), t('hero.student.section1.copyHighlight2'), t('hero.student.section1.copyHighlight3')],
    underlinedPhrase: t('hero.student.section1.underline'),
  },
  {
    headline: t('hero.student.section2.headline'),
    headlineHighlights: [t('hero.student.section2.highlight1')],
    copy: t('hero.student.section2.copy'),
    copyHighlights: [t('hero.student.section2.copyHighlight1'), t('hero.student.section2.copyHighlight2')],
    underlinedPhrase: t('hero.student.section2.underline'),
  },
  {
    headline: t('hero.student.section3.headline'),
    headlineHighlights: [t('hero.student.section3.highlight1')],
    copy: t('hero.student.section3.copy'),
    copyHighlights: [t('hero.student.section3.copyHighlight1'), t('hero.student.section3.copyHighlight2'), t('hero.student.section3.copyHighlight3')],
    underlinedPhrase: t('hero.student.section3.underline'),
  },
  {
    headline: t('hero.student.section4.headline'),
    headlineHighlights: [t('hero.student.section4.highlight1')],
    copy: t('hero.student.section4.copy'),
    copyHighlights: [t('hero.student.section4.copyHighlight1'), t('hero.student.section4.copyHighlight2')],
    underlinedPhrase: t('hero.student.section4.underline'),
  },
  {
    headline: t('hero.student.section5.headline'),
    headlineHighlights: [t('hero.student.section5.highlight1'), t('hero.student.section5.highlight2')],
    copy: t('hero.student.section5.copy'),
    copyHighlights: [t('hero.student.section5.copyHighlight1'), t('hero.student.section5.copyHighlight2'), t('hero.student.section5.copyHighlight3')],
    underlinedPhrase: t('hero.student.section5.underline'),
  },
  {
    headline: t('hero.student.section6.headline'),
    headlineHighlights: [t('hero.student.section6.highlight1'), t('hero.student.section6.highlight2'), t('hero.student.section6.highlight3')],
    copy: t('hero.student.section6.copy'),
    copyHighlights: [t('hero.student.section6.copyHighlight1'), t('hero.student.section6.copyHighlight2')],
    underlinedPhrase: t('hero.student.section6.underline'),
  },
];

const getTutorSections = (t: TFunction): SectionContent[] => [
  {
    headline: t('hero.tutor.section1.headline'),
    headlineHighlights: [t('hero.tutor.section1.highlight1'), t('hero.tutor.section1.highlight2')],
    copy: t('hero.tutor.section1.copy'),
    copyHighlights: [t('hero.tutor.section1.copyHighlight1'), t('hero.tutor.section1.copyHighlight2'), t('hero.tutor.section1.copyHighlight3'), t('hero.tutor.section1.copyHighlight4')],
    underlinedPhrase: t('hero.tutor.section1.underline'),
  },
  {
    headline: t('hero.tutor.section2.headline'),
    headlineHighlights: [t('hero.tutor.section2.highlight1'), t('hero.tutor.section2.highlight2'), t('hero.tutor.section2.highlight3')],
    copy: t('hero.tutor.section2.copy'),
    copyHighlights: [t('hero.tutor.section2.copyHighlight1'), t('hero.tutor.section2.copyHighlight2'), t('hero.tutor.section2.copyHighlight3')],
    underlinedPhrase: t('hero.tutor.section2.underline'),
  },
  {
    headline: t('hero.tutor.section3.headline'),
    headlineHighlights: [t('hero.tutor.section3.highlight1')],
    copy: t('hero.tutor.section3.copy'),
    copyHighlights: [t('hero.tutor.section3.copyHighlight1'), t('hero.tutor.section3.copyHighlight2'), t('hero.tutor.section3.copyHighlight3'), t('hero.tutor.section3.copyHighlight4')],
    underlinedPhrase: t('hero.tutor.section3.underline'),
  },
  {
    headline: t('hero.tutor.section4.headline'),
    headlineHighlights: [t('hero.tutor.section4.highlight1'), t('hero.tutor.section4.highlight2')],
    copy: t('hero.tutor.section4.copy'),
    copyHighlights: [t('hero.tutor.section4.copyHighlight1'), t('hero.tutor.section4.copyHighlight2'), t('hero.tutor.section4.copyHighlight3')],
    underlinedPhrase: t('hero.tutor.section4.underline'),
  },
  {
    headline: t('hero.tutor.section5.headline'),
    headlineHighlights: [t('hero.tutor.section5.highlight1'), t('hero.tutor.section5.highlight2')],
    copy: t('hero.tutor.section5.copy'),
    copyHighlights: [t('hero.tutor.section5.copyHighlight1'), t('hero.tutor.section5.copyHighlight2'), t('hero.tutor.section5.copyHighlight3')],
  },
  {
    headline: t('hero.tutor.section6.headline'),
    headlineHighlights: [t('hero.tutor.section6.highlight1'), t('hero.tutor.section6.highlight2')],
    copy: t('hero.tutor.section6.copy'),
    copyHighlights: [t('hero.tutor.section6.copyHighlight1'), t('hero.tutor.section6.copyHighlight2')],
    underlinedPhrase: t('hero.tutor.section6.underline'),
  },
];

// Context-aware login form content (7 items: sections 0-2, GameShowcase, sections 3-5)
const getStudentContexts = (t: TFunction) => [
  { header: t('hero.student.context1.header'), cta: t('hero.student.context1.cta'), subtext: t('hero.student.context1.subtext') },
  { header: t('hero.student.context2.header'), cta: t('hero.student.context2.cta'), subtext: t('hero.student.context2.subtext') },
  { header: t('hero.student.context3.header'), cta: t('hero.student.context3.cta'), subtext: t('hero.student.context3.subtext') },
  { header: t('hero.student.context4.header'), cta: t('hero.student.context4.cta'), subtext: t('hero.student.context4.subtext') },
  { header: t('hero.student.context5.header'), cta: t('hero.student.context5.cta'), subtext: t('hero.student.context5.subtext') },
  { header: t('hero.student.context6.header'), cta: t('hero.student.context6.cta'), subtext: t('hero.student.context6.subtext') },
  { header: t('hero.student.context7.header'), cta: t('hero.student.context7.cta'), subtext: t('hero.student.context7.subtext') },
];

const getTutorContexts = (t: TFunction) => [
  { header: t('hero.tutor.context1.header'), cta: t('hero.tutor.context1.cta'), subtext: t('hero.tutor.context1.subtext') },
  { header: t('hero.tutor.context2.header'), cta: t('hero.tutor.context2.cta'), subtext: t('hero.tutor.context2.subtext') },
  { header: t('hero.tutor.context3.header'), cta: t('hero.tutor.context3.cta'), subtext: t('hero.tutor.context3.subtext') },
  { header: t('hero.tutor.context4.header'), cta: t('hero.tutor.context4.cta'), subtext: t('hero.tutor.context4.subtext') },
  { header: t('hero.tutor.context5.header'), cta: t('hero.tutor.context5.cta'), subtext: t('hero.tutor.context5.subtext') },
  { header: t('hero.tutor.context6.header'), cta: t('hero.tutor.context6.cta'), subtext: t('hero.tutor.context6.subtext') },
  { header: t('hero.tutor.context7.header'), cta: t('hero.tutor.context7.cta'), subtext: t('hero.tutor.context7.subtext') },
];

// Section component
const Section: React.FC<{
  headline: string;
  headlineHighlights: string[];
  subhead?: string;
  copy: string;
  copyHighlights?: string[];
  underlinedPhrase?: string;
  index: number;
  isStudent: boolean;
  isVisible: boolean;
}> = ({ headline, headlineHighlights, subhead, copy, copyHighlights, underlinedPhrase, index, isStudent, isVisible }) => {
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  return (
    <section
      data-section={index}
      className="min-h-screen snap-start flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 relative z-10"
    >
      <div className={`max-w-xl section-content ${isVisible ? 'visible' : ''}`}>
        {/* Show logo only on first section */}
        {index === 0 && (
          <div className="flex items-center gap-3 mb-10">
            <div
              className="p-2.5 rounded-xl shadow-lg"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 20px -5px ${isStudent ? BRAND.shadow : BRAND.tealShadow}` }}
            >
              <ICONS.Heart className="text-white fill-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>
        )}

        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] mb-5 tracking-tight"
          style={{ color: '#1a1a2e' }}
        >
          {renderWithHighlights(headline, headlineHighlights, isStudent)}
        </h2>

        {subhead && (
          <p className="text-lg md:text-xl mb-6 font-semibold italic" style={{ color: accentColor }}>
            {subhead}
          </p>
        )}

        <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: '#4b5563' }}>
          {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase)}
        </p>

        {/* Visual accent bar */}
        <div
          className="mt-10 h-1.5 w-24 rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.3 }}
        />
      </div>
    </section>
  );
};

// Login form component
const LoginForm: React.FC<{
  context: { header: string; cta: string; subtext: string };
  isStudent: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  message: string;
  onSubmit: (e: React.FormEvent) => void;
  selectedRole: HeroRole;
  setMessage: (v: string) => void;
}> = ({ context, isStudent, email, setEmail, password, setPassword, loading, isSignUp, setIsSignUp, message, onSubmit, selectedRole, setMessage }) => {
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');

    // Store the selected role in localStorage so we can retrieve it after OAuth redirect
    localStorage.setItem('intended_role', selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(null);
    }
  };
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentHover = isStudent ? BRAND.primaryHover : BRAND.tealHover;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;
  const accentBorder = isStudent ? BRAND.border : BRAND.tealLight;

  // Check if error suggests user should sign up instead
  const isCredentialsError = message && (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('credentials') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no user')
  );
  const hasError = message && !message.toLowerCase().includes('check');
  const errorBorderColor = '#ef4444'; // red-500

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-5">
        <h3
          className="text-3xl md:text-4xl font-black mb-2 font-header transition-all duration-300"
          style={{ color: '#1a1a2e' }}
        >
          {context.header}
        </h3>
        <p className="font-semibold text-base transition-all duration-300" style={{ color: '#9ca3af' }}>
          {context.subtext}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Inline error message */}
        {hasError && (
          <div className="flex items-center gap-2 text-red-500 text-sm font-semibold animate-shake">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: hasError ? '#ef4444' : '#9ca3af' }}>
            {t('hero.login.emailLabel')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
            required
            className="w-full px-6 py-5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-base"
            style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: hasError ? errorBorderColor : '#e5e7eb' }}
            onFocus={(e) => e.target.style.borderColor = hasError ? errorBorderColor : accentColor}
            onBlur={(e) => e.target.style.borderColor = hasError ? errorBorderColor : '#e5e7eb'}
            placeholder={t('hero.login.emailPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: hasError ? '#ef4444' : '#9ca3af' }}>
            {t('hero.login.passwordLabel')}
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
            required
            className="w-full px-6 py-5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-base"
            style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: hasError ? errorBorderColor : '#e5e7eb' }}
            onFocus={(e) => e.target.style.borderColor = hasError ? errorBorderColor : accentColor}
            onBlur={(e) => e.target.style.borderColor = hasError ? errorBorderColor : '#e5e7eb'}
            placeholder={t('hero.login.passwordPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="w-full text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-base uppercase tracking-[0.15em] mt-4 hover:scale-[1.02]"
          style={{ backgroundColor: accentColor, boxShadow: `0 20px 40px -10px ${accentShadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
        >
          {loading ? t('hero.login.entering') : context.cta}
        </button>
      </form>

      {/* OAuth Divider */}
      <div className="flex items-center gap-4 mt-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          {t('hero.login.orContinueWith', 'or continue with')}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* OAuth Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading || oauthLoading !== null}
          className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-gray-200 bg-white font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {oauthLoading === 'google' ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthSignIn('apple')}
          disabled={loading || oauthLoading !== null}
          className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-gray-200 bg-white font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {oauthLoading === 'apple' ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
          <span>Apple</span>
        </button>
      </div>

      {/* Success messages (like email confirmation) */}
      {message && message.toLowerCase().includes('check') && (
        <div className="mt-6 p-4 rounded-2xl text-sm font-bold text-center bg-green-50 text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
          className={`text-sm font-black uppercase tracking-widest transition-all hover:opacity-70 ${
            isCredentialsError && !isSignUp ? 'animate-pulse-glow' : ''
          }`}
          style={{
            color: accentColor,
            textShadow: isCredentialsError && !isSignUp ? `0 0 20px ${accentColor}, 0 0 40px ${accentColor}` : 'none'
          }}
        >
          {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
          {isCredentialsError && !isSignUp && ' ←'}
        </button>
      </div>
    </div>
  );
};

// Mobile Section component for horizontal carousel cards
const MobileSection: React.FC<{
  headline: string;
  headlineHighlights: string[];
  subhead?: string;
  copy: string;
  copyHighlights?: string[];
  underlinedPhrase?: string;
  index: number;
  isStudent: boolean;
  showLogo?: boolean;
}> = ({ headline, headlineHighlights, subhead, copy, copyHighlights, underlinedPhrase, index, isStudent, showLogo }) => {
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  return (
    <div
      data-section={index}
      className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center px-6 py-4 relative overflow-hidden"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="section-content visible overflow-hidden">
        {/* Show logo only on first section */}
        {showLogo && (
          <div className="flex items-center gap-2 mb-4">
            <div
              className="p-2 rounded-xl shadow-lg"
              style={{ backgroundColor: accentColor, boxShadow: `0 8px 16px -4px ${isStudent ? BRAND.shadow : BRAND.tealShadow}` }}
            >
              <ICONS.Heart className="text-white fill-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>
        )}

        <h2
          className="text-2xl font-black leading-[1.15] mb-3 tracking-tight"
          style={{ color: '#1a1a2e' }}
        >
          {renderWithHighlights(headline, headlineHighlights, isStudent)}
        </h2>

        {subhead && (
          <p className="text-base mb-3 font-semibold italic" style={{ color: accentColor }}>
            {subhead}
          </p>
        )}

        <p className="text-sm leading-relaxed font-medium" style={{ color: '#4b5563' }}>
          {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase)}
        </p>

        {/* Visual accent bar */}
        <div
          className="mt-4 h-1 w-16 rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.3 }}
        />
      </div>
    </div>
  );
};

// Step type for language selection flow
type SelectionStep = 'native' | 'target' | 'marketing';

// Popular languages shown first (rest hidden behind "Show all")
const POPULAR_LANGUAGES = ['en', 'es', 'fr', 'de', 'pl', 'it', 'pt', 'nl'];

// Language selector grid component
const LanguageGrid: React.FC<{
  onSelect: (code: string) => void;
  selectedCode?: string | null;
  excludeCode?: string | null;
  isStudent: boolean;
  title: string;
  subtitle: string;
  onBack?: () => void;
  showBackButton?: boolean;
}> = ({ onSelect, selectedCode, excludeCode, isStudent, title, subtitle, onBack, showBackButton }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;
  const accentLight = isStudent ? BRAND.light : BRAND.tealLight;

  // Filter out excluded language
  const availableLanguages = Object.values(LANGUAGE_CONFIGS).filter(
    lang => lang.code !== excludeCode
  );

  // Split into popular and other
  const popularLanguages = availableLanguages.filter(lang => POPULAR_LANGUAGES.includes(lang.code));
  const otherLanguages = availableLanguages.filter(lang => !POPULAR_LANGUAGES.includes(lang.code));

  return (
    <div className="w-full max-w-xl mx-auto">
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold transition-all hover:opacity-70"
          style={{ color: accentColor }}
        >
          <ICONS.ChevronLeft className="w-4 h-4" />
          {t('hero.languageSelector.back')}
        </button>
      )}

      <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#1a1a2e' }}>
        {title}
      </h2>
      <p className="text-base mb-6 font-medium" style={{ color: '#6b7280' }}>
        {subtitle}
      </p>

      {/* Popular languages - always visible */}
      <div className="grid grid-cols-4 gap-2.5">
        {popularLanguages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: selectedCode === lang.code ? accentColor : '#e5e7eb',
              backgroundColor: selectedCode === lang.code ? accentLight : '#ffffff',
              boxShadow: selectedCode === lang.code ? `0 4px 12px ${accentShadow}, 0 0 0 2px ${accentColor}` : 'none',
            }}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-[10px] font-bold text-gray-700">{lang.nativeName}</span>
          </button>
        ))}
      </div>

      {/* Show more button - styled pill */}
      {otherLanguages.length > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-5 mx-auto flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all duration-300 hover:scale-105 group"
          style={{
            borderColor: accentColor,
            backgroundColor: 'transparent',
          }}
        >
          <span className="text-sm font-bold" style={{ color: accentColor }}>
            {t('hero.languageSelector.showAll')}
          </span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: accentLight, color: accentColor }}>
            +{otherLanguages.length}
          </span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
            style={{ color: accentColor }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Expanded languages - smooth slide down */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          showAll ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Divider with label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">More languages</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Other languages grid */}
        <div className="grid grid-cols-5 gap-2">
          {otherLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105"
              style={{
                borderColor: selectedCode === lang.code ? accentColor : '#e5e7eb',
                backgroundColor: selectedCode === lang.code ? accentLight : '#ffffff',
                boxShadow: selectedCode === lang.code ? `0 2px 8px ${accentShadow}, 0 0 0 2px ${accentColor}` : 'none',
              }}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-[9px] font-bold text-gray-600 truncate w-full text-center">{lang.nativeName}</span>
            </button>
          ))}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 hover:opacity-70"
          style={{ backgroundColor: accentLight, color: accentColor }}
        >
          <span className="text-xs font-bold">{t('hero.languageSelector.showLess')}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Language indicator for marketing step
const LanguageIndicator: React.FC<{
  nativeCode: string;
  targetCode: string;
  onChangeClick: () => void;
  isStudent: boolean;
}> = ({ nativeCode, targetCode, onChangeClick, isStudent }) => {
  const { t } = useTranslation();
  const nativeConfig = LANGUAGE_CONFIGS[nativeCode];
  const targetConfig = LANGUAGE_CONFIGS[targetCode];
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  return (
    <div className="flex items-center justify-center gap-4 mt-8 p-4 rounded-2xl bg-white/50">
      <div className="flex items-center gap-2">
        <span className="text-xl">{nativeConfig?.flag}</span>
        <span className="text-sm font-bold text-gray-700">{nativeConfig?.nativeName}</span>
      </div>
      <span className="text-gray-400">→</span>
      <div className="flex items-center gap-2">
        <span className="text-xl">{targetConfig?.flag}</span>
        <span className="text-sm font-bold text-gray-700">{targetConfig?.nativeName}</span>
      </div>
      <button
        onClick={onChangeClick}
        className="ml-2 text-xs font-bold transition-all hover:opacity-70"
        style={{ color: accentColor }}
      >
        {t('hero.languageSelector.change')}
      </button>
    </div>
  );
};

// Main Hero component
const Hero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { targetLang } = useParams<{ targetLang?: string }>();

  // Inject animation styles once
  useEffect(() => {
    const styleId = 'hero-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = ANIMATION_STYLES;
      document.head.appendChild(style);
    }
    applyTheme(DEFAULT_THEME);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<HeroRole>('student');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  // Computed error states for mobile form
  const mobileIsCredentialsError = message && (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('credentials') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no user')
  );
  const mobileHasError = message && !message.toLowerCase().includes('check');

  // OAuth sign-in handler for mobile form
  const handleMobileOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');

    // Store the selected role in localStorage so we can retrieve it after OAuth redirect
    localStorage.setItem('intended_role', selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(null);
    }
  };

  // Honeypot anti-bot protection
  const { honeypotProps, honeypotStyles, isBot } = useHoneypot();
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const mobileStepCarouselRef = useRef<HTMLDivElement>(null);

  // Language selection state
  const [currentStep, setCurrentStep] = useState<SelectionStep>('native');
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string | null>(null);
  const [stepTransition, setStepTransition] = useState<'entering' | 'exiting' | null>(null);

  // Mobile language pagination state (6 languages per page)
  const [mobileNativePage, setMobileNativePage] = useState(0);
  const [mobileTargetPage, setMobileTargetPage] = useState(0);

  // Initialize from localStorage, URL param, and browser language
  useEffect(() => {
    const savedNative = localStorage.getItem('preferredLanguage');
    const savedTarget = localStorage.getItem('preferredTargetLanguage');

    // URL param takes priority for target language
    const urlTarget = targetLang && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(targetLang) ? targetLang : null;

    // Browser language for first-time visitors
    const browserLang = navigator.language.split('-')[0];
    const validBrowserLang = (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(browserLang) ? browserLang : 'en';

    // Set native language
    if (savedNative && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedNative)) {
      setNativeLanguage(savedNative);
      i18n.changeLanguage(savedNative);
    } else if (validBrowserLang) {
      // Don't set native language yet, but prepare the UI in browser language
      i18n.changeLanguage(validBrowserLang);
    }

    // Set target language
    if (urlTarget) {
      setSelectedTargetLanguage(urlTarget);
      localStorage.setItem('preferredTargetLanguage', urlTarget);
    } else if (savedTarget && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedTarget)) {
      setSelectedTargetLanguage(savedTarget);
    }

    // Determine starting step
    if (savedNative && (savedTarget || urlTarget)) {
      // Return visitor with both languages OR native + URL target
      setCurrentStep('marketing');
    } else if (savedNative) {
      // Has native but no target
      setCurrentStep('target');
    } else if (urlTarget) {
      // URL target preset but no native yet
      setCurrentStep('native');
    }
    // Otherwise start at 'native' (default)
  }, [targetLang, i18n]);

  // Handler for native language selection
  const handleNativeSelect = async (code: string) => {
    // Animate out
    setStepTransition('exiting');
    await new Promise(resolve => setTimeout(resolve, 200));

    setNativeLanguage(code);
    i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);

    // Always go to target step after selecting native
    // User must confirm/select target language before proceeding
    setCurrentStep('target');

    // Animate in
    setStepTransition('entering');
    setTimeout(() => setStepTransition(null), 200);

    // Mobile: auto-scroll to target step
    if (mobileStepCarouselRef.current) {
      const stepWidth = mobileStepCarouselRef.current.clientWidth;
      mobileStepCarouselRef.current.scrollTo({
        left: stepWidth,
        behavior: 'smooth'
      });
    }
  };

  // Handler for target language selection
  const handleTargetSelect = async (code: string) => {
    // Animate out
    setStepTransition('exiting');
    await new Promise(resolve => setTimeout(resolve, 200));

    setSelectedTargetLanguage(code);
    localStorage.setItem('preferredTargetLanguage', code);
    setCurrentStep('marketing');

    // Animate in
    setStepTransition('entering');
    setTimeout(() => setStepTransition(null), 200);

    // Mobile: auto-scroll to marketing step
    if (mobileStepCarouselRef.current) {
      const stepWidth = mobileStepCarouselRef.current.clientWidth;
      mobileStepCarouselRef.current.scrollTo({
        left: stepWidth * 2,
        behavior: 'smooth'
      });
    }
  };

  // Handler to go back to language selection
  const handleChangeLanguages = () => {
    setCurrentStep('native');
    // Reset scroll position
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (mobileStepCarouselRef.current) {
      mobileStepCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Handler to go back one step
  const handleBack = () => {
    if (currentStep === 'target') {
      setCurrentStep('native');
      if (mobileStepCarouselRef.current) {
        mobileStepCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else if (currentStep === 'marketing') {
      setCurrentStep('target');
      if (mobileStepCarouselRef.current) {
        const stepWidth = mobileStepCarouselRef.current.clientWidth;
        mobileStepCarouselRef.current.scrollTo({ left: stepWidth, behavior: 'smooth' });
      }
    }
  };

  // Track mobile step carousel scroll
  const handleMobileStepScroll = () => {
    const carousel = mobileStepCarouselRef.current;
    if (!carousel) return;
    const scrollLeft = carousel.scrollLeft;
    const stepWidth = carousel.clientWidth;
    const step = Math.round(scrollLeft / stepWidth);
    const steps: SelectionStep[] = ['native', 'target', 'marketing'];
    if (steps[step] && steps[step] !== currentStep) {
      setCurrentStep(steps[step]);
    }
  };

  // Intersection Observer to track visible section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-section'));
            if (!isNaN(index)) {
              setActiveSection(index);
              // Track which sections have been seen (for animations)
              setVisibleSections(prev => new Set([...prev, index]));
            }
          }
        });
      },
      {
        threshold: 0.5,
        root: scrollRef.current
      }
    );

    // Observe all sections
    const sections = scrollRef.current?.querySelectorAll('[data-section]');
    sections?.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [selectedRole, currentStep]); // Re-observe when switching to marketing step

  // Reset visible sections when role changes
  useEffect(() => {
    setVisibleSections(new Set([0]));
  }, [selectedRole]);

  // Mobile carousel scroll handler - track active section
  const handleMobileCarouselScroll = () => {
    const carousel = mobileCarouselRef.current;
    if (!carousel) return;

    const scrollLeft = carousel.scrollLeft;
    const cardWidth = carousel.clientWidth;
    const newActiveSection = Math.round(scrollLeft / cardWidth);

    if (newActiveSection !== activeSection && newActiveSection >= 0 && newActiveSection < 7) {
      setActiveSection(newActiveSection);
    }
  };

  // Scroll to specific section in mobile carousel
  const scrollToMobileSection = (index: number) => {
    const carousel = mobileCarouselRef.current;
    if (!carousel) return;

    const cardWidth = carousel.clientWidth;
    carousel.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  };

  // Reset mobile carousel position when role changes
  useEffect(() => {
    if (mobileCarouselRef.current) {
      mobileCarouselRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [selectedRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Honeypot check: if bot filled the hidden field, fake success silently
    if (isBot()) {
      // Simulate normal delay then show "success" to not tip off the bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isSignUp) {
        setMessage(t('hero.login.checkEmail'));
      }
      setLoading(false);
      return;
    }

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              intended_role: selectedRole,
              // Store language selection in user metadata for email confirmation flow
              // (localStorage may not be available when user clicks confirmation link)
              native_language: nativeLanguage || 'en',
              target_language: selectedTargetLanguage || 'pl'
            }
          }
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else if (isSignUp) {
      setMessage(t('hero.login.checkEmail'));
    } else {
      // For sign-in: Update profile with user's language selection from Hero page
      // This ensures localStorage languages override database defaults (pl/en)
      const storedTarget = localStorage.getItem('preferredTargetLanguage');
      const storedNative = localStorage.getItem('preferredLanguage');

      if (storedTarget || storedNative) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({
            active_language: storedTarget || 'pl',
            native_language: storedNative || 'en',
            languages: [storedTarget || 'pl']
          }).eq('id', user.id);
        }
      }
    }

    setLoading(false);
  };

  const sections = selectedRole === 'student' ? getStudentSections(t) : getTutorSections(t);
  const contexts = selectedRole === 'student' ? getStudentContexts(t) : getTutorContexts(t);
  const currentContext = contexts[activeSection] || contexts[0];
  const isStudent = selectedRole === 'student';
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: isStudent ? '#FFF0F3' : '#ccfbf1',
        color: '#1a1a2e',
        // Prevent inherited CSS variables from affecting this component
        isolation: 'isolate',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Mobile: Full-screen layout with horizontal swipe carousel */}
      <div className="md:hidden flex flex-col h-screen overflow-hidden">
        {/* Top: Logo on left, Learn/Teach Toggle on right */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div
              className="p-1.5 rounded-lg shadow-md"
              style={{ backgroundColor: accentColor, boxShadow: `0 4px 8px -2px ${accentShadow}` }}
            >
              <ICONS.Heart className="text-white fill-white w-4 h-4" />
            </div>
            <span className="text-base font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </span>
          </div>
          {/* Learn/Teach Toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={isStudent
                ? { backgroundColor: BRAND.primary, boxShadow: `0 4px 8px -2px ${BRAND.shadow}`, color: '#ffffff' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              <ICONS.Heart className="w-3.5 h-3.5" style={{ color: isStudent ? '#ffffff' : '#4b5563', fill: isStudent ? '#ffffff' : 'none' }} />
              <span>{t('hero.toggle.learn')}</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 4px 8px -2px ${BRAND.tealShadow}`, color: '#ffffff' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              <ICONS.Sparkles className="w-3.5 h-3.5" style={{ color: !isStudent ? '#ffffff' : '#4b5563' }} />
              <span>{t('hero.toggle.teach')}</span>
            </button>
          </div>
        </div>

        {/* Middle: 3-Step Horizontal Swipe Carousel */}
        <div className="flex-1 relative overflow-hidden min-h-0">
          {/* Floating hearts background */}
          <InteractiveHearts
            accentColor={accentColor}
            activeSection={currentStep === 'marketing' ? activeSection : 0}
            containerRef={mobileStepCarouselRef as React.RefObject<HTMLDivElement>}
            isMobile={true}
          />

          {/* 3-Step swipeable carousel */}
          <div
            ref={mobileStepCarouselRef}
            className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory h-full hide-scrollbar"
            onScroll={handleMobileStepScroll}
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* Step 1: Native Language Selection */}
            <div className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center px-6 py-4 overflow-y-auto">
              <p className="text-base font-bold mb-4" style={{ color: '#4b5563' }}>
                {t('hero.languageSelector.nativePrompt')}
              </p>
              {/* Paginated language grid with arrows */}
              {(() => {
                const allLangs = Object.values(LANGUAGE_CONFIGS);
                const perPage = 6;
                const totalPages = Math.ceil(allLangs.length / perPage);
                const startIdx = mobileNativePage * perPage;
                const pageLangs = allLangs.slice(startIdx, startIdx + perPage);

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {/* Left arrow */}
                      <button
                        onClick={() => setMobileNativePage(p => Math.max(0, p - 1))}
                        disabled={mobileNativePage === 0}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileNativePage > 0 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
                      >
                        <ICONS.ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                      </button>

                      {/* Language grid - 3 cols x 2 rows */}
                      <div className="flex-1 grid grid-cols-3 gap-2.5">
                        {pageLangs.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => handleNativeSelect(lang.code)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-0"
                            style={{
                              borderColor: nativeLanguage === lang.code ? accentColor : '#e5e7eb',
                              backgroundColor: nativeLanguage === lang.code ? (isStudent ? BRAND.light : BRAND.tealLight) : '#ffffff',
                              boxShadow: nativeLanguage === lang.code ? `0 4px 12px -2px ${accentColor}40` : 'none',
                            }}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-[11px] font-bold text-gray-700 truncate w-full text-center">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right arrow */}
                      <button
                        onClick={() => setMobileNativePage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={mobileNativePage >= totalPages - 1}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileNativePage < totalPages - 1 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
                      >
                        <ICONS.ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                      </button>
                    </div>

                    {/* Page dots */}
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMobileNativePage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${mobileNativePage === i ? 'scale-125' : 'opacity-40'}`}
                          style={{ backgroundColor: accentColor }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Step 2: Target Language Selection */}
            <div className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center px-6 py-4 overflow-y-auto">
              <p className="text-base font-bold mb-4" style={{ color: '#4b5563' }}>
                {isStudent ? t('hero.languageSelector.targetPrompt') : t('hero.languageSelector.targetPromptTutor')}
              </p>
              {/* Paginated language grid with arrows */}
              {(() => {
                const allLangs = Object.values(LANGUAGE_CONFIGS).filter(lang => lang.code !== nativeLanguage);
                const perPage = 6;
                const totalPages = Math.ceil(allLangs.length / perPage);
                const startIdx = mobileTargetPage * perPage;
                const pageLangs = allLangs.slice(startIdx, startIdx + perPage);

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {/* Left arrow */}
                      <button
                        onClick={() => setMobileTargetPage(p => Math.max(0, p - 1))}
                        disabled={mobileTargetPage === 0}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileTargetPage > 0 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
                      >
                        <ICONS.ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                      </button>

                      {/* Language grid - 3 cols x 2 rows */}
                      <div className="flex-1 grid grid-cols-3 gap-2.5">
                        {pageLangs.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => handleTargetSelect(lang.code)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-0"
                            style={{
                              borderColor: selectedTargetLanguage === lang.code ? accentColor : '#e5e7eb',
                              backgroundColor: selectedTargetLanguage === lang.code ? (isStudent ? BRAND.light : BRAND.tealLight) : '#ffffff',
                              boxShadow: selectedTargetLanguage === lang.code ? `0 4px 12px -2px ${accentColor}40` : 'none',
                            }}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-[11px] font-bold text-gray-700 truncate w-full text-center">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right arrow */}
                      <button
                        onClick={() => setMobileTargetPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={mobileTargetPage >= totalPages - 1}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileTargetPage < totalPages - 1 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
                      >
                        <ICONS.ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                      </button>
                    </div>

                    {/* Page dots */}
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMobileTargetPage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${mobileTargetPage === i ? 'scale-125' : 'opacity-40'}`}
                          style={{ backgroundColor: accentColor }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Step 3: Marketing Content (nested carousel) */}
            <div className="flex-shrink-0 w-full h-full snap-start relative">
              {/* Marketing content carousel */}
              <div
                ref={mobileCarouselRef}
                className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory h-full hide-scrollbar"
                onScroll={handleMobileCarouselScroll}
                style={{ scrollBehavior: 'smooth' }}
              >
                {/* Sections 0-2 */}
                {sections.slice(0, 3).map((section, i) => (
                  <MobileSection
                    key={`mobile-${selectedRole}-${i}`}
                    {...section}
                    index={i}
                    isStudent={isStudent}
                  />
                ))}

                {/* Section 3: GameShowcase */}
                <div
                  data-section={3}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center items-center px-4"
                >
                  <GameShowcase isStudent={isStudent} accentColor={accentColor} sectionIndex={3} isMobile={true} targetLanguage={selectedTargetLanguage} nativeLanguage={nativeLanguage} />
                </div>

                {/* Sections 4-6 */}
                {sections.slice(3).map((section, i) => (
                  <MobileSection
                    key={`mobile-${selectedRole}-${i + 4}`}
                    {...section}
                    index={i + 4}
                    isStudent={isStudent}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Bottom: Fixed Login Form (~45%) */}
        <div
          className="flex-shrink-0 rounded-t-3xl shadow-2xl px-6 pt-4 pb-6 relative overflow-hidden"
          style={{ backgroundColor: '#ffffff', maxHeight: '45vh', minHeight: '320px' }}
        >
          <ICONS.Heart className="absolute -bottom-16 -right-16 w-48 h-48 opacity-[0.03] pointer-events-none" style={{ color: accentColor }} />

          {/* Progress dots at TOP of login section - all steps (native, target, + 7 marketing sections) */}
          <div className="flex justify-center gap-1.5 mb-4 flex-wrap max-w-xs mx-auto">
            {/* Native language step */}
            <button
              onClick={() => {
                mobileStepCarouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'native' ? 'scale-150' : 'opacity-40'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Native language"
            />
            {/* Target language step */}
            <button
              onClick={() => {
                const stepWidth = mobileStepCarouselRef.current?.clientWidth || 0;
                mobileStepCarouselRef.current?.scrollTo({ left: stepWidth, behavior: 'smooth' });
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'target' ? 'scale-150' : 'opacity-40'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Target language"
            />
            {/* Divider */}
            <div className="w-px h-2 bg-gray-300 mx-1" />
            {/* Marketing sections (7 dots) */}
            {Array.from({ length: 7 }).map((_, i) => (
              <button
                key={`section-${i}`}
                onClick={() => {
                  const stepWidth = mobileStepCarouselRef.current?.clientWidth || 0;
                  mobileStepCarouselRef.current?.scrollTo({ left: 2 * stepWidth, behavior: 'smooth' });
                  // Also scroll to the section within marketing carousel
                  setTimeout(() => {
                    const carousel = mobileCarouselRef.current;
                    if (carousel) {
                      carousel.scrollTo({ left: i * carousel.clientWidth, behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'marketing' && activeSection === i ? 'scale-150' : 'opacity-40'
                }`}
                style={{ backgroundColor: accentColor }}
                aria-label={`Section ${i + 1}`}
              />
            ))}
          </div>

          {/* Compact Login Form */}
          <div className="w-full max-w-sm mx-auto relative z-10">
            <div className="text-center mb-5">
              <h3
                className="text-2xl font-black mb-1 font-header transition-all duration-300"
                style={{ color: '#1a1a2e' }}
              >
                {currentContext.header}
              </h3>
              <p className="font-semibold text-sm transition-all duration-300" style={{ color: '#9ca3af' }}>
                {currentContext.subtext}
              </p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: honeypotStyles }} />
            <form onSubmit={handleAuth} className="space-y-3">
              {/* Inline error message */}
              {mobileHasError && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-semibold animate-shake">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{message}</span>
                </div>
              )}
              {/* Honeypot field - hidden from users, bots fill it */}
              <input {...honeypotProps} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
                required
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-sm"
                style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: mobileHasError ? '#ef4444' : '#e5e7eb' }}
                onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : '#e5e7eb'}
                placeholder={t('hero.login.emailPlaceholder')}
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
                required
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-sm"
                style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: mobileHasError ? '#ef4444' : '#e5e7eb' }}
                onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : '#e5e7eb'}
                placeholder={t('hero.login.passwordPlaceholder')}
              />

              <button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="w-full text-white font-black py-3 rounded-2xl shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.15em]"
                style={{ backgroundColor: accentColor, boxShadow: `0 15px 30px -8px ${accentShadow}` }}
              >
                {loading ? t('hero.login.entering') : currentContext.cta}
              </button>
            </form>

            {/* Mobile OAuth Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {t('hero.login.orContinueWith', 'or')}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Mobile OAuth Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMobileOAuthSignIn('google')}
                disabled={loading || oauthLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-sm transition-all hover:border-gray-300 disabled:opacity-50"
              >
                {oauthLoading === 'google' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileOAuthSignIn('apple')}
                disabled={loading || oauthLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-sm transition-all hover:border-gray-300 disabled:opacity-50"
              >
                {oauthLoading === 'apple' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                )}
                <span>Apple</span>
              </button>
            </div>

            {/* Success messages only */}
            {message && message.toLowerCase().includes('check') && (
              <div className="mt-3 p-3 rounded-xl text-xs font-bold text-center bg-green-50 text-green-700">
                {message}
              </div>
            )}

            <div className="mt-3 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                className={`text-xs font-bold transition-all hover:opacity-70 ${
                  mobileIsCredentialsError && !isSignUp ? 'animate-pulse-glow' : ''
                }`}
                style={{
                  color: accentColor,
                  textShadow: mobileIsCredentialsError && !isSignUp ? `0 0 15px ${accentColor}, 0 0 30px ${accentColor}` : 'none'
                }}
              >
                {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
                {mobileIsCredentialsError && !isSignUp && ' ←'}
              </button>
            </div>

            {/* Legal links */}
            <div className="mt-4 flex justify-center gap-4 text-xs" style={{ color: '#9ca3af' }}>
              <a href="#/terms" className="hover:underline">{t('hero.legal.terms')}</a>
              <span>|</span>
              <a href="#/privacy" className="hover:underline">{t('hero.legal.privacy')}</a>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Split screen layout */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Left: Step-based content with background effects */}
        <div
          ref={scrollRef}
          className={`flex-1 h-screen relative hide-scrollbar ${
            currentStep === 'marketing' ? 'overflow-y-auto snap-y snap-mandatory' : 'overflow-hidden flex items-center justify-center'
          }`}
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Background effects container - fixed position so hearts stay visible during scroll */}
          <div className="fixed top-0 left-0 bottom-0 pointer-events-none z-0" style={{ width: '50%' }}>
            {/* Word particle effect - only show when languages are selected */}
            {currentStep === 'marketing' && nativeLanguage && selectedTargetLanguage && (
              <WordParticleEffect
                accentColor={accentColor}
                containerRef={scrollRef as React.RefObject<HTMLDivElement>}
                targetLanguage={selectedTargetLanguage}
                nativeLanguage={nativeLanguage}
              />
            )}
            {/* Interactive floating hearts */}
            <InteractiveHearts
              accentColor={accentColor}
              activeSection={activeSection}
              containerRef={scrollRef as React.RefObject<HTMLDivElement>}
            />
          </div>

          {/* Step 1: Native Language Selection */}
          {currentStep === 'native' && (
            <div
              className={`relative z-10 w-full max-h-full overflow-y-auto px-8 md:px-16 py-8 transition-all duration-300 ${
                stepTransition === 'exiting' ? 'opacity-0 translate-x-[-20px]' :
                stepTransition === 'entering' ? 'opacity-0 translate-x-[20px]' : 'opacity-100'
              }`}
            >
              {/* Logo - sticky at top */}
              <div className="sticky top-0 pb-6 pt-2 -mt-2 z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl shadow-lg"
                    style={{ backgroundColor: accentColor, boxShadow: `0 10px 20px -5px ${accentShadow}` }}
                  >
                    <ICONS.Heart className="text-white fill-white w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
                    Love Languages
                  </h1>
                </div>
              </div>
              <LanguageGrid
                onSelect={handleNativeSelect}
                selectedCode={nativeLanguage}
                isStudent={isStudent}
                title={t('hero.languageSelector.nativeTitle')}
                subtitle={t('hero.languageSelector.nativeSubtitle')}
              />
            </div>
          )}

          {/* Step 2: Target Language Selection */}
          {currentStep === 'target' && (
            <div
              className={`relative z-10 w-full max-h-full overflow-y-auto px-8 md:px-16 py-8 transition-all duration-300 ${
                stepTransition === 'exiting' ? 'opacity-0 translate-x-[-20px]' :
                stepTransition === 'entering' ? 'opacity-0 translate-x-[20px]' : 'opacity-100'
              }`}
            >
              <LanguageGrid
                onSelect={handleTargetSelect}
                selectedCode={selectedTargetLanguage}
                excludeCode={nativeLanguage}
                isStudent={isStudent}
                title={t('hero.languageSelector.targetTitle')}
                subtitle={t('hero.languageSelector.targetSubtitle')}
                onBack={handleBack}
                showBackButton={true}
              />
            </div>
          )}

          {/* Step 3: Marketing Content */}
          {currentStep === 'marketing' && (
            <>
              {/* Sticky language indicator at top - each language clickable separately */}
              {nativeLanguage && selectedTargetLanguage && (
                <div className="sticky top-0 z-20 pb-8 pt-4">
                  <div className="mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md w-fit">
                    {/* Native language - click to change */}
                    <button
                      onClick={() => setCurrentStep('native')}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
                      title={t('hero.languageSelector.changeNative')}
                    >
                      <span className="text-lg">{LANGUAGE_CONFIGS[nativeLanguage]?.flag}</span>
                      <span className="text-sm font-bold text-gray-600">{LANGUAGE_CONFIGS[nativeLanguage]?.nativeName}</span>
                    </button>
                    <span className="text-gray-400">→</span>
                    {/* Target language - click to change */}
                    <button
                      onClick={() => setCurrentStep('target')}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
                      title={t('hero.languageSelector.changeTarget')}
                    >
                      <span className="text-lg">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.flag}</span>
                      <span className="text-sm font-bold text-gray-600">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.nativeName}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* First 3 sections (indices 0, 1, 2) */}
              {sections.slice(0, 3).map((section, i) => (
                <Section
                  key={`desktop-${selectedRole}-${i}`}
                  {...section}
                  index={i}
                  isStudent={isStudent}
                  isVisible={visibleSections.has(i)}
                />
              ))}

              {/* Game Showcase - section index 3 */}
              <GameShowcase isStudent={isStudent} accentColor={accentColor} sectionIndex={3} targetLanguage={selectedTargetLanguage} nativeLanguage={nativeLanguage} />

              {/* Remaining sections (indices 4, 5, 6) */}
              {sections.slice(3).map((section, i) => (
                <Section
                  key={`desktop-${selectedRole}-${i + 4}`}
                  {...section}
                  index={i + 4}
                  isStudent={isStudent}
                  isVisible={visibleSections.has(i + 4)}
                />
              ))}

            </>
          )}
        </div>

        {/* Right: Sticky panel with toggle + login form */}
        <div
          className="flex-1 flex flex-col items-center justify-start pt-6 px-8 pb-8 rounded-l-[4rem] shadow-2xl relative overflow-hidden h-screen sticky top-0"
          style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
        >
          <ICONS.Heart
            className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none transition-colors duration-500"
            style={{ color: accentColor }}
          />

          {/* Section indicator dots - all steps (native, target, + 7 marketing sections) */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {/* Native language step */}
            <button
              onClick={() => setCurrentStep('native')}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'native' ? 'scale-150' : 'opacity-30 hover:opacity-60'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Native language"
            />
            {/* Target language step */}
            <button
              onClick={() => nativeLanguage && setCurrentStep('target')}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'target' ? 'scale-150' : 'opacity-30 hover:opacity-60'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Target language"
            />
            {/* Divider */}
            <div className="w-2 h-px bg-gray-300 my-1" />
            {/* Marketing sections (7 dots) */}
            {Array.from({ length: 7 }).map((_, i) => (
              <button
                key={`section-${i}`}
                onClick={() => {
                  if (nativeLanguage && selectedTargetLanguage) {
                    setCurrentStep('marketing');
                    setTimeout(() => {
                      const section = scrollRef.current?.querySelector(`[data-section="${i}"]`);
                      section?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'marketing' && activeSection === i
                    ? 'scale-150'
                    : 'opacity-30 hover:opacity-60'
                }`}
                style={{ backgroundColor: accentColor }}
                aria-label={`Section ${i + 1}`}
              />
            ))}
          </div>

          {/* Toggle above login form */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={isStudent
                ? { backgroundColor: BRAND.primary, boxShadow: `0 10px 25px -5px ${BRAND.shadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <ICONS.Heart className="w-5 h-5" style={{ color: isStudent ? '#ffffff' : '#9ca3af', fill: isStudent ? '#ffffff' : 'none' }} />
              <span className="font-bold text-sm">{t('hero.toggle.learn')}</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 10px 25px -5px ${BRAND.tealShadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <ICONS.Sparkles className="w-5 h-5" style={{ color: !isStudent ? '#ffffff' : '#9ca3af' }} />
              <span className="font-bold text-sm">{t('hero.toggle.teach')}</span>
            </button>
          </div>

          <LoginForm
            context={currentContext}
            isStudent={isStudent}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            message={message}
            onSubmit={handleAuth}
            selectedRole={selectedRole}
            setMessage={setMessage}
          />

          {/* Legal links */}
          <div className="mt-6 flex justify-center gap-6 text-sm" style={{ color: '#9ca3af' }}>
            <a href="#/terms" className="hover:underline">{t('hero.legal.termsOfService')}</a>
            <span>|</span>
            <a href="#/privacy" className="hover:underline">{t('hero.legal.privacyPolicy')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
