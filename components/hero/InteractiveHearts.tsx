import React, { useRef, useEffect } from 'react';

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

interface InteractiveHeartsProps {
  accentColor: string;
  activeSection: number;
  containerRef: React.RefObject<HTMLDivElement>;
  isMobile?: boolean;
}

const InteractiveHearts: React.FC<InteractiveHeartsProps> = ({ accentColor, activeSection, containerRef, isMobile = false }) => {
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
  }, [heartCount, isMobile]);

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

export default InteractiveHearts;
