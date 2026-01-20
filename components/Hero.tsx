
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import { DEFAULT_THEME, applyTheme } from '../services/theme';
import { GameShowcase } from './hero/GameShowcase';
import { HeroFAQ, HeroRALL, HeroBlog, HeroFooter } from './hero/HeroBottomSections';
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

// Helper to render text with multiple highlights and optional links
const renderWithHighlights = (
  text: string,
  highlights: string[],
  isStudent: boolean,
  underlinedPhrase?: string,
  links?: Record<string, string> // Maps text to URL
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

    // Check if this part has a link
    const linkUrl = links ? Object.entries(links).find(([linkText]) =>
      linkText.toLowerCase() === part.toLowerCase()
    )?.[1] : undefined;

    if (isHighlight) {
      const highlighted = (
        <Highlight key={i} isStudent={isStudent} glow underline={isUnderlined}>
          {part}
        </Highlight>
      );

      if (linkUrl) {
        return (
          <a
            key={i}
            href={linkUrl}
            className="hover:opacity-80 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            {highlighted}
          </a>
        );
      }
      return highlighted;
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
  // Fixed heart count - no scaling with section
  const baseCount = 30;
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
  copyLinks?: Record<string, string>; // Maps text to URL for clickable links
}

// Section content for both arcs - functions that use t() for translations
const getStudentSections = (t: TFunction): SectionContent[] => [
  // Section 0: What is Love Languages (same for both roles)
  {
    headline: t('hero.shared.section0.headline'),
    headlineHighlights: [t('hero.shared.section0.highlight1')],
    copy: t('hero.shared.section0.copy'),
    copyHighlights: [t('hero.shared.section0.copyHighlight1'), t('hero.shared.section0.copyHighlight2'), t('hero.shared.section0.copyHighlight3')],
    underlinedPhrase: t('hero.shared.section0.underline'),
    // copyLinks removed - RALL now in bottom sections
  },
  {
    headline: t('hero.student.section1.headline'),
    headlineHighlights: [t('hero.student.section1.highlight1'), t('hero.student.section1.highlight2'), t('hero.student.section1.highlight3')],
    copy: t('hero.student.section1.copy'),
  },
  {
    headline: t('hero.student.section2.headline'),
    headlineHighlights: [t('hero.student.section2.highlight1'), t('hero.student.section2.highlight2')],
    copy: t('hero.student.section2.copy'),
  },
  {
    headline: t('hero.student.section3.headline'),
    headlineHighlights: [t('hero.student.section3.highlight1')],
    copy: t('hero.student.section3.copy'),
  },
  {
    headline: t('hero.student.section4.headline'),
    headlineHighlights: [t('hero.student.section4.highlight1')],
    copy: t('hero.student.section4.copy'),
  },
];

const getTutorSections = (t: TFunction): SectionContent[] => [
  // Section 0: What is Love Languages (same for both roles)
  {
    headline: t('hero.shared.section0.headline'),
    headlineHighlights: [t('hero.shared.section0.highlight1')],
    copy: t('hero.shared.section0.copy'),
    copyHighlights: [t('hero.shared.section0.copyHighlight1'), t('hero.shared.section0.copyHighlight2'), t('hero.shared.section0.copyHighlight3')],
    underlinedPhrase: t('hero.shared.section0.underline'),
    // copyLinks removed - RALL now in bottom sections
  },
  {
    headline: t('hero.tutor.section1.headline'),
    headlineHighlights: [t('hero.tutor.section1.highlight1')],
    copy: t('hero.tutor.section1.copy'),
  },
  {
    headline: t('hero.tutor.section2.headline'),
    headlineHighlights: [t('hero.tutor.section2.highlight1')],
    copy: t('hero.tutor.section2.copy'),
  },
  {
    headline: t('hero.tutor.section3.headline'),
    headlineHighlights: [t('hero.tutor.section3.highlight1')],
    copy: t('hero.tutor.section3.copy'),
  },
  {
    headline: t('hero.tutor.section4.headline'),
    headlineHighlights: [t('hero.tutor.section4.highlight1')],
    copy: t('hero.tutor.section4.copy'),
  },
];

// Context-aware login form content (8 items: intro section, sections 1-3, GameShowcase, sections 4-6)
const getStudentContexts = (t: TFunction) => [
  { header: t('hero.shared.context0.header'), cta: t('hero.shared.context0.cta'), subtext: t('hero.shared.context0.subtext') },
  { header: t('hero.student.context1.header'), cta: t('hero.student.context1.cta'), subtext: t('hero.student.context1.subtext') },
  { header: t('hero.student.context2.header'), cta: t('hero.student.context2.cta'), subtext: t('hero.student.context2.subtext') },
  { header: t('hero.student.context3.header'), cta: t('hero.student.context3.cta'), subtext: t('hero.student.context3.subtext') },
  { header: t('hero.student.context4.header'), cta: t('hero.student.context4.cta'), subtext: t('hero.student.context4.subtext') },
];

const getTutorContexts = (t: TFunction) => [
  { header: t('hero.shared.context0.header'), cta: t('hero.shared.context0.cta'), subtext: t('hero.shared.context0.subtext') },
  { header: t('hero.tutor.context1.header'), cta: t('hero.tutor.context1.cta'), subtext: t('hero.tutor.context1.subtext') },
  { header: t('hero.tutor.context2.header'), cta: t('hero.tutor.context2.cta'), subtext: t('hero.tutor.context2.subtext') },
  { header: t('hero.tutor.context3.header'), cta: t('hero.tutor.context3.cta'), subtext: t('hero.tutor.context3.subtext') },
  { header: t('hero.tutor.context4.header'), cta: t('hero.tutor.context4.cta'), subtext: t('hero.tutor.context4.subtext') },
];

// Context for native language selection step (same for both roles)
const getNativeStepContext = (t: TFunction) => ({
  header: t('hero.nativeStep.header'),
  cta: t('hero.nativeStep.cta'),
  subtext: t('hero.nativeStep.subtext'),
});

// Context for target language selection step (different for student/tutor)
const getStudentTargetStepContext = (t: TFunction) => ({
  header: t('hero.studentTargetStep.header'),
  cta: t('hero.studentTargetStep.cta'),
  subtext: t('hero.studentTargetStep.subtext'),
});

const getTutorTargetStepContext = (t: TFunction) => ({
  header: t('hero.tutorTargetStep.header'),
  cta: t('hero.tutorTargetStep.cta'),
  subtext: t('hero.tutorTargetStep.subtext'),
});

// Section component
const Section: React.FC<{
  headline: string;
  headlineHighlights: string[];
  subhead?: string;
  copy: string;
  copyHighlights?: string[];
  underlinedPhrase?: string;
  copyLinks?: Record<string, string>;
  index: number;
  isStudent: boolean;
  isVisible: boolean;
}> = ({ headline, headlineHighlights, subhead, copy, copyHighlights, underlinedPhrase, copyLinks, index, isStudent, isVisible }) => {
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  return (
    <section
      data-section={index}
      className="min-h-screen snap-start flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 relative z-10"
    >
      <div className={`max-w-xl section-content ${isVisible ? 'visible' : ''}`}>
        {/* Show logo only on first section */}
        {index === 0 && (
          <div className="flex items-center gap-5 mb-14">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-[90px] h-[90px] md:w-[110px] md:h-[110px] shrink-0"
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37 l62 1 -5 -34 c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169 l-34 58 34 28 c32 27 33 29 30 99 l-3 71 53 25 c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94 c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z m795 -348 c0 -13 73 -78 87 -78 6 0 13 -4 15 -8 2 -4 36 -25 76 -45 93 -47 191 -120 220 -166 36 -53 49 -130 33 -189 -6 -26 -17 -51 -22 -57 -15 -15 -29 14 -29 65 0 48 -19 113 -38 132 -7 7 -12 17 -12 23 0 25 -156 158 -217 185 -13 5 -23 14 -23 20 0 5 -6 10 -14 10 -8 0 -39 24 -70 53 -43 40 -56 60 -56 82 l0 28 25 -23 c14 -13 25 -27 25 -32z m10 -133 c13 -14 48 -42 79 -62 72 -50 169 -140 189 -178 26 -48 42 -106 42 -158 l0 -48 -50 -21 c-38 -16 -56 -31 -75 -63 -34 -59 -140 -137 -159 -118 -3 4 -6 40 -6 80 0 41 -4 93 -10 116 -5 23 -14 94 -19 157 -5 63 -17 153 -25 199 -15 80 -14 121 3 121 4 0 18 -11 31 -25z m403 -512 c13 -8 8 -31 -9 -37 -9 -3 -35 -6 -59 -6 -43 0 -43 0 -43 -36 0 -37 -25 -74 -50 -74 -7 0 -26 -6 -40 -14 -63 -32 -142 -66 -156 -66 -21 0 -30 18 -16 35 6 7 34 22 62 32 55 19 118 73 139 119 20 41 74 66 124 58 22 -3 43 -8 48 -11z m95 -15 c4 -19 -21 -49 -57 -68 -36 -19 -42 1 -14 48 19 32 31 42 47 40 11 -2 22 -11 24 -20z m2 -114 c0 -8 -8 -17 -17 -21 -10 -3 -25 -12 -33 -19 -27 -23 -69 -28 -76 -9 -9 22 3 32 62 54 52 19 64 18 64 -5z m23 -57 c7 -17 -23 -51 -62 -72 -29 -14 -35 -15 -48 -3 -20 21 -8 40 40 65 50 25 63 27 70 10z m-227 -41 c3 -14 3 -30 -1 -35 -8 -14 -40 -14 -64 -2 -17 10 -81 -6 -98 -23 -14 -14 -75 -36 -84 -30 -18 11 -8 35 19 44 15 6 35 15 44 20 10 6 29 10 42 10 14 0 28 5 31 11 10 15 45 28 77 28 21 1 29 -5 34 -23z m-306 -4 c0 -22 -19 -42 -39 -42 -9 0 -29 -7 -45 -15 -15 -8 -35 -15 -43 -15 -8 0 -27 -6 -41 -14 -15 -8 -45 -21 -67 -29 -154 -57 -272 -105 -308 -123 -34 -17 -53 -18 -63 -3 -9 16 35 49 67 49 14 0 29 4 35 9 9 9 77 36 119 48 11 3 40 14 65 25 43 19 58 25 128 54 74 32 108 47 132 60 35 19 60 17 60 -4z m5 -83 c7 -11 -22 -49 -38 -49 -5 0 -23 -6 -40 -14 -18 -7 -52 -21 -77 -31 -52 -21 -123 -51 -160 -67 -58 -25 -90 -38 -175 -74 -49 -20 -111 -47 -137 -60 -56 -29 -68 -30 -68 -6 0 36 44 70 121 95 42 14 99 34 125 45 27 11 76 30 109 43 33 13 64 27 70 31 5 4 15 8 21 8 14 0 17 1 139 53 90 39 101 41 110 26z m282 -4 c63 0 78 -26 76 -135 -1 -75 -5 -94 -36 -160 -21 -45 -60 -103 -97 -145 -34 -38 -67 -80 -73 -92 -10 -23 -31 -30 -41 -15 -3 5 -8 47 -10 93 -10 152 -18 223 -33 302 -16 83 -13 107 13 107 15 0 31 8 104 46 14 8 32 10 40 7 8 -4 34 -7 57 -8z m166 -12 c28 -32 57 -126 57 -184 0 -105 -53 -179 -248 -349 -57 -49 -115 -151 -106 -185 3 -11 -2 -29 -10 -40 -14 -17 -17 -18 -26 -5 -17 23 -3 95 26 142 15 24 62 79 103 123 90 94 130 146 153 196 25 55 41 152 34 201 -4 23 -9 60 -12 81 -7 40 4 47 29 20z m-3349 -173 c89 -23 118 -40 148 -89 12 -20 27 -40 33 -46 7 -5 27 -30 45 -55 19 -25 47 -57 62 -71 15 -14 28 -29 28 -33 0 -5 -18 -28 -39 -52 -40 -45 -111 -158 -111 -175 0 -25 -41 -87 -62 -93 -48 -12 -77 -7 -94 20 -16 24 -16 29 0 74 10 27 15 58 11 70 -9 29 -58 26 -95 -6 -29 -27 -61 -48 -90 -59 -8 -4 -23 -11 -32 -16 -49 -26 -98 1 -98 54 0 27 12 43 72 99 40 38 76 68 80 68 4 0 8 13 8 28 0 20 -7 33 -24 41 -20 11 -31 9 -77 -12 -103 -47 -147 -57 -258 -56 -123 0 -182 21 -213 76 -17 28 -17 35 -5 65 37 87 179 165 342 188 89 13 282 2 369 -20z m2096 -125 c0 -8 -9 -23 -20 -32 -11 -10 -20 -21 -20 -26 0 -4 -27 -44 -60 -87 -33 -43 -60 -82 -60 -86 0 -6 -32 -47 -75 -96 -8 -10 -15 -21 -15 -24 0 -6 -66 -91 -80 -104 -3 -3 -21 -25 -40 -50 -19 -25 -75 -93 -125 -151 -136 -160 -168 -199 -190 -230 -11 -16 -27 -29 -36 -29 -9 0 -55 29 -102 65 -48 36 -89 65 -92 65 -2 0 -51 34 -107 75 -57 41 -113 82 -125 90 -33 23 -29 33 20 55 31 15 65 20 129 20 130 0 198 37 198 107 0 24 8 45 22 60 l21 23 -23 24 c-26 28 -21 56 10 56 28 0 128 34 225 76 17 7 68 27 115 44 130 48 163 61 192 76 14 8 32 14 40 14 7 0 49 18 93 40 88 43 105 47 105 25z m-1660 -312 c0 -13 -4 -23 -8 -23 -16 0 -52 -59 -64 -103 -22 -84 32 -139 120 -122 42 8 144 42 182 60 14 6 41 19 60 28 84 37 157 70 188 84 30 14 92 81 92 99 0 11 41 54 52 54 12 0 10 -34 -4 -48 -18 -18 9 -34 45 -27 25 4 27 2 25 -23 -3 -24 1 -27 30 -30 19 -2 44 4 57 12 47 31 73 13 38 -26 -11 -12 -30 -18 -59 -18 -24 0 -45 -4 -48 -9 -6 -10 20 -35 47 -44 10 -4 17 -13 15 -20 -3 -8 -39 -14 -114 -17 -83 -4 -118 -10 -146 -25 -277 -148 -466 -214 -607 -215 -84 0 -136 24 -147 67 -20 78 15 192 111 358 52 91 53 91 97 48 22 -22 38 -47 38 -60z m741 22 c0 -13 -41 -19 -41 -7 0 11 20 22 33 18 5 -1 8 -6 8 -11z m-654 -91 c15 -14 39 -34 53 -44 23 -17 24 -20 9 -35 -8 -8 -43 -20 -77 -26 -80 -14 -95 -5 -78 49 27 87 47 99 93 56z m468 -384 c10 -11 24 -20 31 -20 7 0 16 -9 19 -20 5 -15 -5 -34 -37 -73 -24 -28 -52 -63 -63 -76 -93 -113 -238 -267 -266 -282 -18 -9 -61 2 -224 58 -38 14 -83 28 -100 33 -16 5 -68 23 -115 41 -47 17 -104 38 -128 47 l-42 14 -80 -76 c-90 -86 -124 -106 -143 -87 -19 19 43 131 150 270 5 8 64 2 76 -7 7 -5 48 -21 92 -35 44 -14 139 -47 210 -73 169 -60 218 -74 247 -67 42 10 209 199 292 331 29 46 53 53 81 22z m591 -102 c-7 -40 -33 -128 -52 -183 -8 -23 -14 -47 -14 -55 0 -26 -68 -227 -85 -254 -10 -14 -26 -26 -36 -26 -10 0 -20 -4 -24 -10 -3 -5 -20 -14 -38 -19 -18 -5 -52 -17 -77 -27 -25 -9 -76 -23 -115 -30 -124 -22 -189 -35 -241 -50 -28 -8 -60 -14 -72 -14 -12 0 -40 -7 -62 -16 -44 -18 -72 -59 -84 -126 -4 -20 -13 -50 -21 -65 -8 -15 -15 -35 -15 -44 0 -18 -46 -46 -57 -35 -12 11 -4 136 13 226 12 63 22 89 38 101 12 8 77 30 146 48 69 18 143 39 165 46 22 7 69 20 105 30 36 9 81 23 100 30 19 7 62 20 95 30 101 31 118 56 161 240 11 46 26 80 43 100 45 50 91 112 91 124 0 6 10 11 21 11 19 0 21 -4 15 -32z"/>
                <path d="M3547 3638 c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
                <path d="M2826 3435 c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
                <path d="M3153 3281 c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
                <path d="M3305 3131 c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
              </g>
            </svg>
            <h1 className="text-3xl md:text-4xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>
        )}

        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-black font-header leading-[1.1] mb-5 tracking-tight"
          style={{ color: '#1a1a2e' }}
        >
          {renderWithHighlights(headline, headlineHighlights, isStudent)}
        </h2>

        {subhead && (
          <p className="text-scale-heading mb-6 font-semibold italic" style={{ color: accentColor }}>
            {subhead}
          </p>
        )}

        <p className="text-scale-body leading-relaxed font-medium" style={{ color: '#4b5563' }}>
          {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase, copyLinks)}
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
  currentStep: SelectionStep;
}> = ({ context, isStudent, email, setEmail, password, setPassword, loading, isSignUp, setIsSignUp, message, onSubmit, selectedRole, setMessage, currentStep }) => {
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
        <p className="font-semibold text-scale-body transition-all duration-300" style={{ color: '#9ca3af' }}>
          {context.subtext}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Inline error message */}
        {hasError && (
          <div className="flex items-center gap-2 text-red-500 text-scale-label font-semibold animate-shake">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        <div>
          <label className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: hasError ? '#ef4444' : '#9ca3af' }}>
            {t('hero.login.emailLabel')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
            required
            className="w-full px-6 py-5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-body"
            style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: hasError ? errorBorderColor : '#e5e7eb' }}
            onFocus={(e) => e.target.style.borderColor = hasError ? errorBorderColor : accentColor}
            onBlur={(e) => e.target.style.borderColor = hasError ? errorBorderColor : '#e5e7eb'}
            placeholder={t('hero.login.emailPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: hasError ? '#ef4444' : '#9ca3af' }}>
            {t('hero.login.passwordLabel')}
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
            required
            className="w-full px-6 py-5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-body"
            style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: hasError ? errorBorderColor : '#e5e7eb' }}
            onFocus={(e) => e.target.style.borderColor = hasError ? errorBorderColor : accentColor}
            onBlur={(e) => e.target.style.borderColor = hasError ? errorBorderColor : '#e5e7eb'}
            placeholder={t('hero.login.passwordPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="w-full text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em] mt-4 hover:scale-[1.02]"
          style={{ backgroundColor: accentColor, boxShadow: `0 20px 40px -10px ${accentShadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
        >
          {loading ? t('hero.login.entering') : (
            currentStep === 'marketing' ? context.cta : (
              isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')
            )
          )}
        </button>
      </form>

      {/* OAuth Divider */}
      <div className="flex items-center gap-4 mt-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-scale-caption font-bold uppercase tracking-widest text-gray-400">
          {t('hero.login.orContinueWith', 'or continue with')}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* OAuth Buttons */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading || oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-gray-200 bg-white font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
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
          <span>{t('hero.login.continueWithGoogle')}</span>
        </button>
      </div>

      {/* Success messages (like email confirmation) */}
      {message && message.toLowerCase().includes('check') && (
        <div className="mt-6 p-4 rounded-2xl text-scale-label font-bold text-center bg-green-50 text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
          className={`text-scale-label font-black uppercase tracking-widest transition-all hover:opacity-70 ${
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
  copyLinks?: Record<string, string>;
  index: number;
  isStudent: boolean;
  showLogo?: boolean;
}> = ({ headline, headlineHighlights, subhead, copy, copyHighlights, underlinedPhrase, copyLinks, index, isStudent, showLogo }) => {
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
          <div className="flex items-center gap-3 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-16 h-16 shrink-0"
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37 l62 1 -5 -34 c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169 l-34 58 34 28 c32 27 33 29 30 99 l-3 71 53 25 c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94 c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z m795 -348 c0 -13 73 -78 87 -78 6 0 13 -4 15 -8 2 -4 36 -25 76 -45 93 -47 191 -120 220 -166 36 -53 49 -130 33 -189 -6 -26 -17 -51 -22 -57 -15 -15 -29 14 -29 65 0 48 -19 113 -38 132 -7 7 -12 17 -12 23 0 25 -156 158 -217 185 -13 5 -23 14 -23 20 0 5 -6 10 -14 10 -8 0 -39 24 -70 53 -43 40 -56 60 -56 82 l0 28 25 -23 c14 -13 25 -27 25 -32z m10 -133 c13 -14 48 -42 79 -62 72 -50 169 -140 189 -178 26 -48 42 -106 42 -158 l0 -48 -50 -21 c-38 -16 -56 -31 -75 -63 -34 -59 -140 -137 -159 -118 -3 4 -6 40 -6 80 0 41 -4 93 -10 116 -5 23 -14 94 -19 157 -5 63 -17 153 -25 199 -15 80 -14 121 3 121 4 0 18 -11 31 -25z m403 -512 c13 -8 8 -31 -9 -37 -9 -3 -35 -6 -59 -6 -43 0 -43 0 -43 -36 0 -37 -25 -74 -50 -74 -7 0 -26 -6 -40 -14 -63 -32 -142 -66 -156 -66 -21 0 -30 18 -16 35 6 7 34 22 62 32 55 19 118 73 139 119 20 41 74 66 124 58 22 -3 43 -8 48 -11z m95 -15 c4 -19 -21 -49 -57 -68 -36 -19 -42 1 -14 48 19 32 31 42 47 40 11 -2 22 -11 24 -20z m2 -114 c0 -8 -8 -17 -17 -21 -10 -3 -25 -12 -33 -19 -27 -23 -69 -28 -76 -9 -9 22 3 32 62 54 52 19 64 18 64 -5z m23 -57 c7 -17 -23 -51 -62 -72 -29 -14 -35 -15 -48 -3 -20 21 -8 40 40 65 50 25 63 27 70 10z m-227 -41 c3 -14 3 -30 -1 -35 -8 -14 -40 -14 -64 -2 -17 10 -81 -6 -98 -23 -14 -14 -75 -36 -84 -30 -18 11 -8 35 19 44 15 6 35 15 44 20 10 6 29 10 42 10 14 0 28 5 31 11 10 15 45 28 77 28 21 1 29 -5 34 -23z m-306 -4 c0 -22 -19 -42 -39 -42 -9 0 -29 -7 -45 -15 -15 -8 -35 -15 -43 -15 -8 0 -27 -6 -41 -14 -15 -8 -45 -21 -67 -29 -154 -57 -272 -105 -308 -123 -34 -17 -53 -18 -63 -3 -9 16 35 49 67 49 14 0 29 4 35 9 9 9 77 36 119 48 11 3 40 14 65 25 43 19 58 25 128 54 74 32 108 47 132 60 35 19 60 17 60 -4z m5 -83 c7 -11 -22 -49 -38 -49 -5 0 -23 -6 -40 -14 -18 -7 -52 -21 -77 -31 -52 -21 -123 -51 -160 -67 -58 -25 -90 -38 -175 -74 -49 -20 -111 -47 -137 -60 -56 -29 -68 -30 -68 -6 0 36 44 70 121 95 42 14 99 34 125 45 27 11 76 30 109 43 33 13 64 27 70 31 5 4 15 8 21 8 14 0 17 1 139 53 90 39 101 41 110 26z m282 -4 c63 0 78 -26 76 -135 -1 -75 -5 -94 -36 -160 -21 -45 -60 -103 -97 -145 -34 -38 -67 -80 -73 -92 -10 -23 -31 -30 -41 -15 -3 5 -8 47 -10 93 -10 152 -18 223 -33 302 -16 83 -13 107 13 107 15 0 31 8 104 46 14 8 32 10 40 7 8 -4 34 -7 57 -8z m166 -12 c28 -32 57 -126 57 -184 0 -105 -53 -179 -248 -349 -57 -49 -115 -151 -106 -185 3 -11 -2 -29 -10 -40 -14 -17 -17 -18 -26 -5 -17 23 -3 95 26 142 15 24 62 79 103 123 90 94 130 146 153 196 25 55 41 152 34 201 -4 23 -9 60 -12 81 -7 40 4 47 29 20z m-3349 -173 c89 -23 118 -40 148 -89 12 -20 27 -40 33 -46 7 -5 27 -30 45 -55 19 -25 47 -57 62 -71 15 -14 28 -29 28 -33 0 -5 -18 -28 -39 -52 -40 -45 -111 -158 -111 -175 0 -25 -41 -87 -62 -93 -48 -12 -77 -7 -94 20 -16 24 -16 29 0 74 10 27 15 58 11 70 -9 29 -58 26 -95 -6 -29 -27 -61 -48 -90 -59 -8 -4 -23 -11 -32 -16 -49 -26 -98 1 -98 54 0 27 12 43 72 99 40 38 76 68 80 68 4 0 8 13 8 28 0 20 -7 33 -24 41 -20 11 -31 9 -77 -12 -103 -47 -147 -57 -258 -56 -123 0 -182 21 -213 76 -17 28 -17 35 -5 65 37 87 179 165 342 188 89 13 282 2 369 -20z m2096 -125 c0 -8 -9 -23 -20 -32 -11 -10 -20 -21 -20 -26 0 -4 -27 -44 -60 -87 -33 -43 -60 -82 -60 -86 0 -6 -32 -47 -75 -96 -8 -10 -15 -21 -15 -24 0 -6 -66 -91 -80 -104 -3 -3 -21 -25 -40 -50 -19 -25 -75 -93 -125 -151 -136 -160 -168 -199 -190 -230 -11 -16 -27 -29 -36 -29 -9 0 -55 29 -102 65 -48 36 -89 65 -92 65 -2 0 -51 34 -107 75 -57 41 -113 82 -125 90 -33 23 -29 33 20 55 31 15 65 20 129 20 130 0 198 37 198 107 0 24 8 45 22 60 l21 23 -23 24 c-26 28 -21 56 10 56 28 0 128 34 225 76 17 7 68 27 115 44 130 48 163 61 192 76 14 8 32 14 40 14 7 0 49 18 93 40 88 43 105 47 105 25z m-1660 -312 c0 -13 -4 -23 -8 -23 -16 0 -52 -59 -64 -103 -22 -84 32 -139 120 -122 42 8 144 42 182 60 14 6 41 19 60 28 84 37 157 70 188 84 30 14 92 81 92 99 0 11 41 54 52 54 12 0 10 -34 -4 -48 -18 -18 9 -34 45 -27 25 4 27 2 25 -23 -3 -24 1 -27 30 -30 19 -2 44 4 57 12 47 31 73 13 38 -26 -11 -12 -30 -18 -59 -18 -24 0 -45 -4 -48 -9 -6 -10 20 -35 47 -44 10 -4 17 -13 15 -20 -3 -8 -39 -14 -114 -17 -83 -4 -118 -10 -146 -25 -277 -148 -466 -214 -607 -215 -84 0 -136 24 -147 67 -20 78 15 192 111 358 52 91 53 91 97 48 22 -22 38 -47 38 -60z m741 22 c0 -13 -41 -19 -41 -7 0 11 20 22 33 18 5 -1 8 -6 8 -11z m-654 -91 c15 -14 39 -34 53 -44 23 -17 24 -20 9 -35 -8 -8 -43 -20 -77 -26 -80 -14 -95 -5 -78 49 27 87 47 99 93 56z m468 -384 c10 -11 24 -20 31 -20 7 0 16 -9 19 -20 5 -15 -5 -34 -37 -73 -24 -28 -52 -63 -63 -76 -93 -113 -238 -267 -266 -282 -18 -9 -61 2 -224 58 -38 14 -83 28 -100 33 -16 5 -68 23 -115 41 -47 17 -104 38 -128 47 l-42 14 -80 -76 c-90 -86 -124 -106 -143 -87 -19 19 43 131 150 270 5 8 64 2 76 -7 7 -5 48 -21 92 -35 44 -14 139 -47 210 -73 169 -60 218 -74 247 -67 42 10 209 199 292 331 29 46 53 53 81 22z m591 -102 c-7 -40 -33 -128 -52 -183 -8 -23 -14 -47 -14 -55 0 -26 -68 -227 -85 -254 -10 -14 -26 -26 -36 -26 -10 0 -20 -4 -24 -10 -3 -5 -20 -14 -38 -19 -18 -5 -52 -17 -77 -27 -25 -9 -76 -23 -115 -30 -124 -22 -189 -35 -241 -50 -28 -8 -60 -14 -72 -14 -12 0 -40 -7 -62 -16 -44 -18 -72 -59 -84 -126 -4 -20 -13 -50 -21 -65 -8 -15 -15 -35 -15 -44 0 -18 -46 -46 -57 -35 -12 11 -4 136 13 226 12 63 22 89 38 101 12 8 77 30 146 48 69 18 143 39 165 46 22 7 69 20 105 30 36 9 81 23 100 30 19 7 62 20 95 30 101 31 118 56 161 240 11 46 26 80 43 100 45 50 91 112 91 124 0 6 10 11 21 11 19 0 21 -4 15 -32z"/>
                <path d="M3547 3638 c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
                <path d="M2826 3435 c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
                <path d="M3153 3281 c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
                <path d="M3305 3131 c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
              </g>
            </svg>
            <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>
        )}

        <h2
          className="text-2xl font-black font-header leading-[1.15] mb-3 tracking-tight"
          style={{ color: '#1a1a2e' }}
        >
          {renderWithHighlights(headline, headlineHighlights, isStudent)}
        </h2>

        {subhead && (
          <p className="text-scale-body mb-3 font-semibold italic" style={{ color: accentColor }}>
            {subhead}
          </p>
        )}

        <p className="text-scale-label leading-relaxed font-medium" style={{ color: '#4b5563' }}>
          {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase, copyLinks)}
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
          className="flex items-center gap-2 mb-6 text-scale-label font-bold transition-all hover:opacity-70"
          style={{ color: accentColor }}
        >
          <ICONS.ChevronLeft className="w-4 h-4" />
          {t('hero.languageSelector.back')}
        </button>
      )}

      <h2 className="text-2xl md:text-3xl font-black font-header mb-2" style={{ color: '#1a1a2e' }}>
        {title}
      </h2>
      <p className="text-scale-body mb-6 font-medium" style={{ color: '#6b7280' }}>
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
            <span className="text-scale-micro font-bold text-gray-700">{lang.nativeName}</span>
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
          <span className="text-scale-label font-bold" style={{ color: accentColor }}>
            {t('hero.languageSelector.showAll')}
          </span>
          <span className="text-scale-caption font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: accentLight, color: accentColor }}>
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
          <span className="text-scale-caption font-bold text-gray-400 uppercase tracking-wider">More languages</span>
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
              <span className="text-scale-micro font-bold text-gray-600 truncate w-full text-center">{lang.nativeName}</span>
            </button>
          ))}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 hover:opacity-70"
          style={{ backgroundColor: accentLight, color: accentColor }}
        >
          <span className="text-scale-caption font-bold">{t('hero.languageSelector.showLess')}</span>
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
        <span className="text-scale-label font-bold text-gray-700">{nativeConfig?.nativeName}</span>
      </div>
      <span className="text-gray-400">→</span>
      <div className="flex items-center gap-2">
        <span className="text-xl">{targetConfig?.flag}</span>
        <span className="text-scale-label font-bold text-gray-700">{targetConfig?.nativeName}</span>
      </div>
      <button
        onClick={onChangeClick}
        className="ml-2 text-scale-caption font-bold transition-all hover:opacity-70"
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

  // Mobile bottom sheet state
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const sheetDragStart = useRef<{ y: number; expanded: boolean } | null>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  // Bottom sheet touch handlers
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetDragStart.current = {
      y: e.touches[0].clientY,
      expanded: sheetExpanded
    };
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!sheetDragStart.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = sheetDragStart.current.y - currentY; // positive = dragging up

    // Clamp the offset
    const maxExpand = window.innerHeight * 0.35; // Can expand 35% more
    const maxCollapse = window.innerHeight * 0.35; // Can collapse 35%

    let newOffset = deltaY;
    if (sheetDragStart.current.expanded) {
      // Already expanded, limit how much further up we can go
      newOffset = Math.max(-maxCollapse, Math.min(50, deltaY));
    } else {
      // Collapsed, limit expansion
      newOffset = Math.max(-50, Math.min(maxExpand, deltaY));
    }

    setSheetDragOffset(newOffset);
  };

  const handleSheetTouchEnd = () => {
    if (!sheetDragStart.current) return;

    const threshold = 80; // px threshold to trigger state change

    if (sheetDragStart.current.expanded) {
      // Was expanded - check if should collapse
      if (sheetDragOffset < -threshold) {
        setSheetExpanded(false);
      }
    } else {
      // Was collapsed - check if should expand
      if (sheetDragOffset > threshold) {
        setSheetExpanded(true);
      }
    }

    setSheetDragOffset(0);
    sheetDragStart.current = null;
  };

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

    if (newActiveSection !== activeSection && newActiveSection >= 0 && newActiveSection < 12) {
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
    }
    // For sign-in: Do NOT override database preferences
    // User's existing account settings take precedence over localStorage
    // localStorage is only used for the landing page UI before login

    setLoading(false);
  };

  const sections = selectedRole === 'student' ? getStudentSections(t) : getTutorSections(t);
  const contexts = selectedRole === 'student' ? getStudentContexts(t) : getTutorContexts(t);
  const isStudent = selectedRole === 'student';

  // Step-aware context: show different right-side content based on current step
  const currentContext = (() => {
    if (currentStep === 'native') {
      return getNativeStepContext(t);
    }
    if (currentStep === 'target') {
      return isStudent ? getStudentTargetStepContext(t) : getTutorTargetStepContext(t);
    }
    // Marketing step: use section-based contexts
    return contexts[activeSection] || contexts[0];
  })();
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
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between safe-area-top">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-10 h-10 shrink-0"
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37 l62 1 -5 -34 c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169 l-34 58 34 28 c32 27 33 29 30 99 l-3 71 53 25 c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94 c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z m795 -348 c0 -13 73 -78 87 -78 6 0 13 -4 15 -8 2 -4 36 -25 76 -45 93 -47 191 -120 220 -166 36 -53 49 -130 33 -189 -6 -26 -17 -51 -22 -57 -15 -15 -29 14 -29 65 0 48 -19 113 -38 132 -7 7 -12 17 -12 23 0 25 -156 158 -217 185 -13 5 -23 14 -23 20 0 5 -6 10 -14 10 -8 0 -39 24 -70 53 -43 40 -56 60 -56 82 l0 28 25 -23 c14 -13 25 -27 25 -32z m10 -133 c13 -14 48 -42 79 -62 72 -50 169 -140 189 -178 26 -48 42 -106 42 -158 l0 -48 -50 -21 c-38 -16 -56 -31 -75 -63 -34 -59 -140 -137 -159 -118 -3 4 -6 40 -6 80 0 41 -4 93 -10 116 -5 23 -14 94 -19 157 -5 63 -17 153 -25 199 -15 80 -14 121 3 121 4 0 18 -11 31 -25z m403 -512 c13 -8 8 -31 -9 -37 -9 -3 -35 -6 -59 -6 -43 0 -43 0 -43 -36 0 -37 -25 -74 -50 -74 -7 0 -26 -6 -40 -14 -63 -32 -142 -66 -156 -66 -21 0 -30 18 -16 35 6 7 34 22 62 32 55 19 118 73 139 119 20 41 74 66 124 58 22 -3 43 -8 48 -11z m95 -15 c4 -19 -21 -49 -57 -68 -36 -19 -42 1 -14 48 19 32 31 42 47 40 11 -2 22 -11 24 -20z m2 -114 c0 -8 -8 -17 -17 -21 -10 -3 -25 -12 -33 -19 -27 -23 -69 -28 -76 -9 -9 22 3 32 62 54 52 19 64 18 64 -5z m23 -57 c7 -17 -23 -51 -62 -72 -29 -14 -35 -15 -48 -3 -20 21 -8 40 40 65 50 25 63 27 70 10z m-227 -41 c3 -14 3 -30 -1 -35 -8 -14 -40 -14 -64 -2 -17 10 -81 -6 -98 -23 -14 -14 -75 -36 -84 -30 -18 11 -8 35 19 44 15 6 35 15 44 20 10 6 29 10 42 10 14 0 28 5 31 11 10 15 45 28 77 28 21 1 29 -5 34 -23z m-306 -4 c0 -22 -19 -42 -39 -42 -9 0 -29 -7 -45 -15 -15 -8 -35 -15 -43 -15 -8 0 -27 -6 -41 -14 -15 -8 -45 -21 -67 -29 -154 -57 -272 -105 -308 -123 -34 -17 -53 -18 -63 -3 -9 16 35 49 67 49 14 0 29 4 35 9 9 9 77 36 119 48 11 3 40 14 65 25 43 19 58 25 128 54 74 32 108 47 132 60 35 19 60 17 60 -4z m5 -83 c7 -11 -22 -49 -38 -49 -5 0 -23 -6 -40 -14 -18 -7 -52 -21 -77 -31 -52 -21 -123 -51 -160 -67 -58 -25 -90 -38 -175 -74 -49 -20 -111 -47 -137 -60 -56 -29 -68 -30 -68 -6 0 36 44 70 121 95 42 14 99 34 125 45 27 11 76 30 109 43 33 13 64 27 70 31 5 4 15 8 21 8 14 0 17 1 139 53 90 39 101 41 110 26z m282 -4 c63 0 78 -26 76 -135 -1 -75 -5 -94 -36 -160 -21 -45 -60 -103 -97 -145 -34 -38 -67 -80 -73 -92 -10 -23 -31 -30 -41 -15 -3 5 -8 47 -10 93 -10 152 -18 223 -33 302 -16 83 -13 107 13 107 15 0 31 8 104 46 14 8 32 10 40 7 8 -4 34 -7 57 -8z m166 -12 c28 -32 57 -126 57 -184 0 -105 -53 -179 -248 -349 -57 -49 -115 -151 -106 -185 3 -11 -2 -29 -10 -40 -14 -17 -17 -18 -26 -5 -17 23 -3 95 26 142 15 24 62 79 103 123 90 94 130 146 153 196 25 55 41 152 34 201 -4 23 -9 60 -12 81 -7 40 4 47 29 20z m-3349 -173 c89 -23 118 -40 148 -89 12 -20 27 -40 33 -46 7 -5 27 -30 45 -55 19 -25 47 -57 62 -71 15 -14 28 -29 28 -33 0 -5 -18 -28 -39 -52 -40 -45 -111 -158 -111 -175 0 -25 -41 -87 -62 -93 -48 -12 -77 -7 -94 20 -16 24 -16 29 0 74 10 27 15 58 11 70 -9 29 -58 26 -95 -6 -29 -27 -61 -48 -90 -59 -8 -4 -23 -11 -32 -16 -49 -26 -98 1 -98 54 0 27 12 43 72 99 40 38 76 68 80 68 4 0 8 13 8 28 0 20 -7 33 -24 41 -20 11 -31 9 -77 -12 -103 -47 -147 -57 -258 -56 -123 0 -182 21 -213 76 -17 28 -17 35 -5 65 37 87 179 165 342 188 89 13 282 2 369 -20z m2096 -125 c0 -8 -9 -23 -20 -32 -11 -10 -20 -21 -20 -26 0 -4 -27 -44 -60 -87 -33 -43 -60 -82 -60 -86 0 -6 -32 -47 -75 -96 -8 -10 -15 -21 -15 -24 0 -6 -66 -91 -80 -104 -3 -3 -21 -25 -40 -50 -19 -25 -75 -93 -125 -151 -136 -160 -168 -199 -190 -230 -11 -16 -27 -29 -36 -29 -9 0 -55 29 -102 65 -48 36 -89 65 -92 65 -2 0 -51 34 -107 75 -57 41 -113 82 -125 90 -33 23 -29 33 20 55 31 15 65 20 129 20 130 0 198 37 198 107 0 24 8 45 22 60 l21 23 -23 24 c-26 28 -21 56 10 56 28 0 128 34 225 76 17 7 68 27 115 44 130 48 163 61 192 76 14 8 32 14 40 14 7 0 49 18 93 40 88 43 105 47 105 25z m-1660 -312 c0 -13 -4 -23 -8 -23 -16 0 -52 -59 -64 -103 -22 -84 32 -139 120 -122 42 8 144 42 182 60 14 6 41 19 60 28 84 37 157 70 188 84 30 14 92 81 92 99 0 11 41 54 52 54 12 0 10 -34 -4 -48 -18 -18 9 -34 45 -27 25 4 27 2 25 -23 -3 -24 1 -27 30 -30 19 -2 44 4 57 12 47 31 73 13 38 -26 -11 -12 -30 -18 -59 -18 -24 0 -45 -4 -48 -9 -6 -10 20 -35 47 -44 10 -4 17 -13 15 -20 -3 -8 -39 -14 -114 -17 -83 -4 -118 -10 -146 -25 -277 -148 -466 -214 -607 -215 -84 0 -136 24 -147 67 -20 78 15 192 111 358 52 91 53 91 97 48 22 -22 38 -47 38 -60z m741 22 c0 -13 -41 -19 -41 -7 0 11 20 22 33 18 5 -1 8 -6 8 -11z m-654 -91 c15 -14 39 -34 53 -44 23 -17 24 -20 9 -35 -8 -8 -43 -20 -77 -26 -80 -14 -95 -5 -78 49 27 87 47 99 93 56z m468 -384 c10 -11 24 -20 31 -20 7 0 16 -9 19 -20 5 -15 -5 -34 -37 -73 -24 -28 -52 -63 -63 -76 -93 -113 -238 -267 -266 -282 -18 -9 -61 2 -224 58 -38 14 -83 28 -100 33 -16 5 -68 23 -115 41 -47 17 -104 38 -128 47 l-42 14 -80 -76 c-90 -86 -124 -106 -143 -87 -19 19 43 131 150 270 5 8 64 2 76 -7 7 -5 48 -21 92 -35 44 -14 139 -47 210 -73 169 -60 218 -74 247 -67 42 10 209 199 292 331 29 46 53 53 81 22z m591 -102 c-7 -40 -33 -128 -52 -183 -8 -23 -14 -47 -14 -55 0 -26 -68 -227 -85 -254 -10 -14 -26 -26 -36 -26 -10 0 -20 -4 -24 -10 -3 -5 -20 -14 -38 -19 -18 -5 -52 -17 -77 -27 -25 -9 -76 -23 -115 -30 -124 -22 -189 -35 -241 -50 -28 -8 -60 -14 -72 -14 -12 0 -40 -7 -62 -16 -44 -18 -72 -59 -84 -126 -4 -20 -13 -50 -21 -65 -8 -15 -15 -35 -15 -44 0 -18 -46 -46 -57 -35 -12 11 -4 136 13 226 12 63 22 89 38 101 12 8 77 30 146 48 69 18 143 39 165 46 22 7 69 20 105 30 36 9 81 23 100 30 19 7 62 20 95 30 101 31 118 56 161 240 11 46 26 80 43 100 45 50 91 112 91 124 0 6 10 11 21 11 19 0 21 -4 15 -32z"/>
                <path d="M3547 3638 c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
                <path d="M2826 3435 c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
                <path d="M3153 3281 c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
                <path d="M3305 3131 c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
              </g>
            </svg>
            <span className="text-scale-body font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </span>
          </div>
          {/* Learn/Teach Toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-scale-caption font-bold transition-all"
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
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-scale-caption font-bold transition-all"
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
        <div
          className="flex-1 relative overflow-hidden min-h-0"
          style={{
            transform: `translateY(calc(${sheetExpanded ? '-35vh' : '0px'} - ${sheetDragOffset}px))`,
            transition: sheetDragOffset === 0 ? 'transform 0.3s ease-out' : 'none',
            zIndex: 1
          }}
        >
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
              <p className="text-scale-body font-bold mb-4" style={{ color: '#4b5563' }}>
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
                            <span className="text-scale-micro font-bold text-gray-700 truncate w-full text-center">{lang.nativeName}</span>
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
              <p className="text-scale-body font-bold mb-4" style={{ color: '#4b5563' }}>
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
                            <span className="text-scale-micro font-bold text-gray-700 truncate w-full text-center">{lang.nativeName}</span>
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
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
              >
                {/* Sections 0-3 */}
                {sections.slice(0, 4).map((section, i) => (
                  <MobileSection
                    key={`mobile-${selectedRole}-${i}`}
                    {...section}
                    index={i}
                    isStudent={isStudent}
                  />
                ))}

                {/* Section 4: GameShowcase */}
                <div
                  data-section={4}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center items-center px-4 py-4"
                >
                  <GameShowcase isStudent={isStudent} accentColor={accentColor} sectionIndex={4} isMobile={true} targetLanguage={selectedTargetLanguage} nativeLanguage={nativeLanguage} />
                </div>

                {/* Sections 5-7 */}
                {sections.slice(4).map((section, i) => (
                  <MobileSection
                    key={`mobile-${selectedRole}-${i + 5}`}
                    {...section}
                    index={i + 5}
                    isStudent={isStudent}
                  />
                ))}

                {/* Bottom Sections as horizontal slides (indices 6-8, footer combined with blog) */}
                <div
                  data-section={6}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col px-6 pt-4 relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                    <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                  </div>
                </div>
                <div
                  data-section={7}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col px-6 pt-4 relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                    <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                  </div>
                </div>
                <div
                  data-section={8}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col px-6 pt-4 relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                    <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
                    <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom: Draggable Login Sheet */}
        <div
          ref={bottomSheetRef}
          className="flex-shrink-0 rounded-t-3xl shadow-2xl px-6 pt-2 pb-6 relative overflow-y-auto overflow-x-hidden"
          style={{
            backgroundColor: '#ffffff',
            height: `calc(${sheetExpanded ? '80vh' : '45vh'} + ${sheetDragOffset}px)`,
            minHeight: '320px',
            maxHeight: '85vh',
            transition: sheetDragOffset === 0 ? 'height 0.3s ease-out' : 'none',
            zIndex: 10
          }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: '#d1d5db' }}
            />
          </div>

          {/* Content area */}
          <div className="pb-4">
          <ICONS.Heart className="absolute -bottom-16 -right-16 w-48 h-48 opacity-[0.03] pointer-events-none" style={{ color: accentColor }} />

          {/* Progress dots at TOP of login section - all steps (native, target, + 8 marketing sections) */}
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
            {/* Marketing sections + bottom sections (9 dots on mobile: 0-5 marketing, 6-8 bottom) */}
            {Array.from({ length: 9 }).map((_, i) => (
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
              <p className="font-semibold text-scale-label transition-all duration-300" style={{ color: '#9ca3af' }}>
                {currentContext.subtext}
              </p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: honeypotStyles }} />
            <form onSubmit={handleAuth} className="space-y-3">
              {/* Inline error message */}
              {mobileHasError && (
                <div className="flex items-center gap-2 text-red-500 text-scale-caption font-semibold animate-shake">
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
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
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
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
                style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: mobileHasError ? '#ef4444' : '#e5e7eb' }}
                onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : '#e5e7eb'}
                placeholder={t('hero.login.passwordPlaceholder')}
              />

              <button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="w-full text-white font-black py-3 rounded-2xl shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-scale-label uppercase tracking-[0.15em]"
                style={{ backgroundColor: accentColor, boxShadow: `0 15px 30px -8px ${accentShadow}` }}
              >
                {loading ? t('hero.login.entering') : (
                  currentStep === 'marketing' ? currentContext.cta : (
                    isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')
                  )
                )}
              </button>
            </form>

            {/* Mobile OAuth Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-scale-micro font-bold uppercase tracking-widest text-gray-400">
                {t('hero.login.orContinueWith', 'or')}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Mobile OAuth Buttons */}
            <div>
              <button
                type="button"
                onClick={() => handleMobileOAuthSignIn('google')}
                disabled={loading || oauthLoading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-scale-label transition-all hover:border-gray-300 disabled:opacity-50"
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
                <span>{t('hero.login.continueWithGoogle')}</span>
              </button>
            </div>

            {/* Success messages only */}
            {message && message.toLowerCase().includes('check') && (
              <div className="mt-3 p-3 rounded-xl text-scale-caption font-bold text-center bg-green-50 text-green-700">
                {message}
              </div>
            )}

            <div className="mt-3 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                className={`text-scale-caption font-bold transition-all hover:opacity-70 ${
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
            <div className="mt-4 flex justify-center gap-4 text-scale-caption" style={{ color: '#9ca3af' }}>
              <a href="#/terms" className="hover:underline">{t('hero.legal.terms')}</a>
              <span>|</span>
              <a href="#/privacy" className="hover:underline">{t('hero.legal.privacy')}</a>
            </div>
          </div>
          </div>{/* Close scrollable content area */}
        </div>
      </div>

      {/* Desktop: Split screen layout */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Left: Step-based content with background effects */}
        <div
          ref={scrollRef}
          className={`flex-1 h-screen relative hide-scrollbar overflow-x-hidden ${
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 600.000000 600.000000"
                    preserveAspectRatio="xMidYMid meet"
                    fill={accentColor}
                    className="w-[60px] h-[60px] shrink-0"
                  >
                    <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                      <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37 l62 1 -5 -34 c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169 l-34 58 34 28 c32 27 33 29 30 99 l-3 71 53 25 c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94 c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z m795 -348 c0 -13 73 -78 87 -78 6 0 13 -4 15 -8 2 -4 36 -25 76 -45 93 -47 191 -120 220 -166 36 -53 49 -130 33 -189 -6 -26 -17 -51 -22 -57 -15 -15 -29 14 -29 65 0 48 -19 113 -38 132 -7 7 -12 17 -12 23 0 25 -156 158 -217 185 -13 5 -23 14 -23 20 0 5 -6 10 -14 10 -8 0 -39 24 -70 53 -43 40 -56 60 -56 82 l0 28 25 -23 c14 -13 25 -27 25 -32z m10 -133 c13 -14 48 -42 79 -62 72 -50 169 -140 189 -178 26 -48 42 -106 42 -158 l0 -48 -50 -21 c-38 -16 -56 -31 -75 -63 -34 -59 -140 -137 -159 -118 -3 4 -6 40 -6 80 0 41 -4 93 -10 116 -5 23 -14 94 -19 157 -5 63 -17 153 -25 199 -15 80 -14 121 3 121 4 0 18 -11 31 -25z m403 -512 c13 -8 8 -31 -9 -37 -9 -3 -35 -6 -59 -6 -43 0 -43 0 -43 -36 0 -37 -25 -74 -50 -74 -7 0 -26 -6 -40 -14 -63 -32 -142 -66 -156 -66 -21 0 -30 18 -16 35 6 7 34 22 62 32 55 19 118 73 139 119 20 41 74 66 124 58 22 -3 43 -8 48 -11z m95 -15 c4 -19 -21 -49 -57 -68 -36 -19 -42 1 -14 48 19 32 31 42 47 40 11 -2 22 -11 24 -20z m2 -114 c0 -8 -8 -17 -17 -21 -10 -3 -25 -12 -33 -19 -27 -23 -69 -28 -76 -9 -9 22 3 32 62 54 52 19 64 18 64 -5z m23 -57 c7 -17 -23 -51 -62 -72 -29 -14 -35 -15 -48 -3 -20 21 -8 40 40 65 50 25 63 27 70 10z m-227 -41 c3 -14 3 -30 -1 -35 -8 -14 -40 -14 -64 -2 -17 10 -81 -6 -98 -23 -14 -14 -75 -36 -84 -30 -18 11 -8 35 19 44 15 6 35 15 44 20 10 6 29 10 42 10 14 0 28 5 31 11 10 15 45 28 77 28 21 1 29 -5 34 -23z m-306 -4 c0 -22 -19 -42 -39 -42 -9 0 -29 -7 -45 -15 -15 -8 -35 -15 -43 -15 -8 0 -27 -6 -41 -14 -15 -8 -45 -21 -67 -29 -154 -57 -272 -105 -308 -123 -34 -17 -53 -18 -63 -3 -9 16 35 49 67 49 14 0 29 4 35 9 9 9 77 36 119 48 11 3 40 14 65 25 43 19 58 25 128 54 74 32 108 47 132 60 35 19 60 17 60 -4z m5 -83 c7 -11 -22 -49 -38 -49 -5 0 -23 -6 -40 -14 -18 -7 -52 -21 -77 -31 -52 -21 -123 -51 -160 -67 -58 -25 -90 -38 -175 -74 -49 -20 -111 -47 -137 -60 -56 -29 -68 -30 -68 -6 0 36 44 70 121 95 42 14 99 34 125 45 27 11 76 30 109 43 33 13 64 27 70 31 5 4 15 8 21 8 14 0 17 1 139 53 90 39 101 41 110 26z m282 -4 c63 0 78 -26 76 -135 -1 -75 -5 -94 -36 -160 -21 -45 -60 -103 -97 -145 -34 -38 -67 -80 -73 -92 -10 -23 -31 -30 -41 -15 -3 5 -8 47 -10 93 -10 152 -18 223 -33 302 -16 83 -13 107 13 107 15 0 31 8 104 46 14 8 32 10 40 7 8 -4 34 -7 57 -8z m166 -12 c28 -32 57 -126 57 -184 0 -105 -53 -179 -248 -349 -57 -49 -115 -151 -106 -185 3 -11 -2 -29 -10 -40 -14 -17 -17 -18 -26 -5 -17 23 -3 95 26 142 15 24 62 79 103 123 90 94 130 146 153 196 25 55 41 152 34 201 -4 23 -9 60 -12 81 -7 40 4 47 29 20z m-3349 -173 c89 -23 118 -40 148 -89 12 -20 27 -40 33 -46 7 -5 27 -30 45 -55 19 -25 47 -57 62 -71 15 -14 28 -29 28 -33 0 -5 -18 -28 -39 -52 -40 -45 -111 -158 -111 -175 0 -25 -41 -87 -62 -93 -48 -12 -77 -7 -94 20 -16 24 -16 29 0 74 10 27 15 58 11 70 -9 29 -58 26 -95 -6 -29 -27 -61 -48 -90 -59 -8 -4 -23 -11 -32 -16 -49 -26 -98 1 -98 54 0 27 12 43 72 99 40 38 76 68 80 68 4 0 8 13 8 28 0 20 -7 33 -24 41 -20 11 -31 9 -77 -12 -103 -47 -147 -57 -258 -56 -123 0 -182 21 -213 76 -17 28 -17 35 -5 65 37 87 179 165 342 188 89 13 282 2 369 -20z m2096 -125 c0 -8 -9 -23 -20 -32 -11 -10 -20 -21 -20 -26 0 -4 -27 -44 -60 -87 -33 -43 -60 -82 -60 -86 0 -6 -32 -47 -75 -96 -8 -10 -15 -21 -15 -24 0 -6 -66 -91 -80 -104 -3 -3 -21 -25 -40 -50 -19 -25 -75 -93 -125 -151 -136 -160 -168 -199 -190 -230 -11 -16 -27 -29 -36 -29 -9 0 -55 29 -102 65 -48 36 -89 65 -92 65 -2 0 -51 34 -107 75 -57 41 -113 82 -125 90 -33 23 -29 33 20 55 31 15 65 20 129 20 130 0 198 37 198 107 0 24 8 45 22 60 l21 23 -23 24 c-26 28 -21 56 10 56 28 0 128 34 225 76 17 7 68 27 115 44 130 48 163 61 192 76 14 8 32 14 40 14 7 0 49 18 93 40 88 43 105 47 105 25z m-1660 -312 c0 -13 -4 -23 -8 -23 -16 0 -52 -59 -64 -103 -22 -84 32 -139 120 -122 42 8 144 42 182 60 14 6 41 19 60 28 84 37 157 70 188 84 30 14 92 81 92 99 0 11 41 54 52 54 12 0 10 -34 -4 -48 -18 -18 9 -34 45 -27 25 4 27 2 25 -23 -3 -24 1 -27 30 -30 19 -2 44 4 57 12 47 31 73 13 38 -26 -11 -12 -30 -18 -59 -18 -24 0 -45 -4 -48 -9 -6 -10 20 -35 47 -44 10 -4 17 -13 15 -20 -3 -8 -39 -14 -114 -17 -83 -4 -118 -10 -146 -25 -277 -148 -466 -214 -607 -215 -84 0 -136 24 -147 67 -20 78 15 192 111 358 52 91 53 91 97 48 22 -22 38 -47 38 -60z m741 22 c0 -13 -41 -19 -41 -7 0 11 20 22 33 18 5 -1 8 -6 8 -11z m-654 -91 c15 -14 39 -34 53 -44 23 -17 24 -20 9 -35 -8 -8 -43 -20 -77 -26 -80 -14 -95 -5 -78 49 27 87 47 99 93 56z m468 -384 c10 -11 24 -20 31 -20 7 0 16 -9 19 -20 5 -15 -5 -34 -37 -73 -24 -28 -52 -63 -63 -76 -93 -113 -238 -267 -266 -282 -18 -9 -61 2 -224 58 -38 14 -83 28 -100 33 -16 5 -68 23 -115 41 -47 17 -104 38 -128 47 l-42 14 -80 -76 c-90 -86 -124 -106 -143 -87 -19 19 43 131 150 270 5 8 64 2 76 -7 7 -5 48 -21 92 -35 44 -14 139 -47 210 -73 169 -60 218 -74 247 -67 42 10 209 199 292 331 29 46 53 53 81 22z m591 -102 c-7 -40 -33 -128 -52 -183 -8 -23 -14 -47 -14 -55 0 -26 -68 -227 -85 -254 -10 -14 -26 -26 -36 -26 -10 0 -20 -4 -24 -10 -3 -5 -20 -14 -38 -19 -18 -5 -52 -17 -77 -27 -25 -9 -76 -23 -115 -30 -124 -22 -189 -35 -241 -50 -28 -8 -60 -14 -72 -14 -12 0 -40 -7 -62 -16 -44 -18 -72 -59 -84 -126 -4 -20 -13 -50 -21 -65 -8 -15 -15 -35 -15 -44 0 -18 -46 -46 -57 -35 -12 11 -4 136 13 226 12 63 22 89 38 101 12 8 77 30 146 48 69 18 143 39 165 46 22 7 69 20 105 30 36 9 81 23 100 30 19 7 62 20 95 30 101 31 118 56 161 240 11 46 26 80 43 100 45 50 91 112 91 124 0 6 10 11 21 11 19 0 21 -4 15 -32z"/>
                      <path d="M3547 3638 c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
                      <path d="M2826 3435 c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
                      <path d="M3153 3281 c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
                      <path d="M3305 3131 c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
                    </g>
                  </svg>
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
                      <span className="text-scale-label font-bold text-gray-600">{LANGUAGE_CONFIGS[nativeLanguage]?.nativeName}</span>
                    </button>
                    <span className="text-gray-400">→</span>
                    {/* Target language - click to change */}
                    <button
                      onClick={() => setCurrentStep('target')}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
                      title={t('hero.languageSelector.changeTarget')}
                    >
                      <span className="text-lg">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.flag}</span>
                      <span className="text-scale-label font-bold text-gray-600">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.nativeName}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* First 4 sections (indices 0, 1, 2, 3) */}
              {sections.slice(0, 4).map((section, i) => (
                <Section
                  key={`desktop-${selectedRole}-${i}`}
                  {...section}
                  index={i}
                  isStudent={isStudent}
                  isVisible={visibleSections.has(i)}
                />
              ))}

              {/* Game Showcase - section index 4 */}
              <GameShowcase isStudent={isStudent} accentColor={accentColor} sectionIndex={4} targetLanguage={selectedTargetLanguage} nativeLanguage={nativeLanguage} />

              {/* Remaining sections (indices 5, 6, 7) */}
              {sections.slice(4).map((section, i) => (
                <Section
                  key={`desktop-${selectedRole}-${i + 5}`}
                  {...section}
                  index={i + 5}
                  isStudent={isStudent}
                  isVisible={visibleSections.has(i + 5)}
                />
              ))}

              {/* Bottom Sections - FAQ, RALL, Blog, Footer (indices 6-9) */}
              <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={visibleSections.has(6)} />
              <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={visibleSections.has(7)} />
              <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={visibleSections.has(8)} />
              <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={visibleSections.has(9)} />

            </>
          )}
        </div>

        {/* Right: Sticky panel with toggle + login form */}
        <div
          className="flex-1 flex flex-col items-center justify-start pt-6 px-8 pb-8 rounded-l-[4rem] shadow-2xl relative overflow-y-auto overflow-x-hidden h-screen sticky top-0"
          style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
        >
          <ICONS.Heart
            className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none transition-colors duration-500"
            style={{ color: accentColor }}
          />

          {/* Section indicator dots - all steps (native, target, + 8 marketing sections) */}
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
            {/* Marketing sections + bottom sections (10 dots: 0-5 marketing, 6-9 bottom) */}
            {Array.from({ length: 10 }).map((_, i) => (
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
              <span className="font-bold text-scale-label">{t('hero.toggle.learn')}</span>
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
              <span className="font-bold text-scale-label">{t('hero.toggle.teach')}</span>
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
            currentStep={currentStep}
          />

          {/* Legal links */}
          <div className="mt-6 flex justify-center gap-6 text-scale-label" style={{ color: '#9ca3af' }}>
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
