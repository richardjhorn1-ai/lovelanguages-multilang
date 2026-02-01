import React, { useState, useEffect, useRef, createContext, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../../services/supabase';
import type { OnboardingData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';
import { analytics } from '../../services/analytics';

// Context for sharing onQuit across all step components
export const OnboardingContext = createContext<{
  onQuit?: () => void;
}>({});

// Shared steps
import { NameStep } from './steps/shared/NameStep';
import { PartnerNameStep } from './steps/shared/PartnerNameStep';
// LanguageConfirmStep removed - now handled in RoleSelection before onboarding
import { ValidationModeStep } from './steps/shared/ValidationModeStep';
import { PlanSelectionStep } from './steps/shared/PlanSelectionStep';

// Student steps
import { VibeStep } from './steps/student/VibeStep';
import { PhotoStep } from './steps/student/PhotoStep';
import { WhyStep } from './steps/student/WhyStep';
import { TimeStep } from './steps/student/TimeStep';
import { WhenStep } from './steps/student/WhenStep';
import { FearStep } from './steps/student/FearStep';
import { PriorStep } from './steps/student/PriorStep';
import { LearnHelloStep } from './steps/student/LearnHelloStep';
import { LearnLoveStep } from './steps/student/LearnLoveStep';
import { TryItStep } from './steps/student/TryItStep';
import { CelebrationStep } from './steps/student/CelebrationStep';
import { GoalStep } from './steps/student/GoalStep';
import { StartStep } from './steps/student/StartStep';

// Tutor steps
import { RelationStep } from './steps/tutor/RelationStep';
import { LanguageConnectionStep } from './steps/tutor/LanguageConnectionStep';
import { OriginStep } from './steps/tutor/OriginStep';
import { DreamPhraseStep } from './steps/tutor/DreamPhraseStep';
import { TeachingStyleStep } from './steps/tutor/TeachingStyleStep';
import { TutorPreviewStep } from './steps/tutor/TutorPreviewStep';
import { TutorStartStep } from './steps/tutor/TutorStartStep';

// ============================================
// Word Particle Types
// ============================================
interface WordParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  alpha: number;
  size: number;
  angle: number;
  speed: number;
}

type WordEventState = 'spawning' | 'showing_word' | 'transforming' | 'showing_translation' | 'forming_heart' | 'floating' | 'done';

interface WordEvent {
  id: number;
  word: string;
  translation: string;
  particles: WordParticle[];
  state: WordEventState;
  stateStartTime: number;
  centerX: number;
  centerY: number;
  rotation: number;
  wordPositions: { x: number; y: number }[];
  translationPositions: { x: number; y: number }[];
  heartPositions: { x: number; y: number }[];
  floatY: number;
  opacity: number;
}

// ============================================
// Word Particle Background Component
// ============================================
const WordParticleBackground: React.FC<{
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}> = ({ currentStep, totalSteps, accentColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventsRef = useRef<WordEvent[]>([]);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const eventIdRef = useRef<number>(0);

  // Get current language settings
  const { targetLanguage, nativeLanguage } = useLanguage();
  const targetConfig = LANGUAGE_CONFIGS[targetLanguage];
  const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];

  // Build word pairs from language configs
  const wordPairs = useMemo(() => {
    // Core examples from language config
    const pairs = [
      {
        word: targetConfig?.examples.hello || 'Hello',
        translation: nativeConfig?.examples.hello || 'Hello'
      },
      {
        word: targetConfig?.examples.iLoveYou || 'I love you',
        translation: nativeConfig?.examples.iLoveYou || 'I love you'
      },
      {
        word: targetConfig?.examples.thankYou || 'Thank you',
        translation: nativeConfig?.examples.thankYou || 'Thank you'
      },
    ];

    // Add some universal romantic concepts (emoji pairs for visual variety)
    const romanticConcepts = [
      { word: '❤️', translation: '💕' },
      { word: '💗', translation: '💖' },
      { word: '✨', translation: '💫' },
      { word: '💋', translation: '😘' },
      { word: '🌹', translation: '💐' },
      { word: '💝', translation: '💞' },
    ];

    // Mix language examples with romantic emojis for visual variety
    return [...pairs, ...romanticConcepts];
  }, [targetConfig, nativeConfig]);

  // Progressive timing: faster as steps increase
  const progress = (currentStep - 1) / Math.max(totalSteps - 1, 1);
  const spawnInterval = 5000 - progress * 2500; // 5s → 2.5s
  const timeScale = 1 - progress * 0.35; // 1.0 → 0.65 (faster animations)
  const maxConcurrent = Math.min(2 + Math.floor(progress * 2), 4); // 2 → 4

  // Convert text to particle positions
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

    offscreen.width = 300;
    offscreen.height = 80;

    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, offscreen.width / 2, offscreen.height / 2);

    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const positions: { x: number; y: number }[] = [];
    const sampleRate = 2;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    for (let y = 0; y < offscreen.height; y += sampleRate) {
      for (let x = 0; x < offscreen.width; x += sampleRate) {
        const i = (y * offscreen.width + x) * 4;
        if (imageData.data[i + 3] > 128) {
          const localX = x - offscreen.width / 2;
          const localY = y - offscreen.height / 2;
          const rotatedX = localX * cos - localY * sin;
          const rotatedY = localX * sin + localY * cos;
          positions.push({ x: centerX + rotatedX, y: centerY + rotatedY });
        }
      }
    }
    return positions;
  };

  // Generate heart-shaped positions
  const getHeartPositions = (
    centerX: number,
    centerY: number,
    scale: number,
    count: number
  ): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];
    const gridSize = Math.ceil(Math.sqrt(count * 1.5));

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const x = (gx / gridSize - 0.5) * 34 * scale;
        const y = (gy / gridSize - 0.5) * 34 * scale;
        const nx = x / (16 * scale);
        const ny = -y / (13 * scale);
        const term1 = nx * nx + ny * ny - 1;
        const inside = term1 * term1 * term1 - nx * nx * ny * ny * ny < 0;
        if (inside) {
          positions.push({ x: centerX + x, y: centerY + y });
        }
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions.slice(0, count);
  };

  // Spawn word event at edge positions
  const spawnWordEvent = (canvasWidth: number, canvasHeight: number): WordEvent => {
    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];

    // Spawn at edges, avoiding center form area
    const edge = Math.floor(Math.random() * 4);
    let centerX: number, centerY: number;
    switch (edge) {
      case 0: // Left
        centerX = canvasWidth * (0.08 + Math.random() * 0.12);
        centerY = canvasHeight * (0.2 + Math.random() * 0.6);
        break;
      case 1: // Right
        centerX = canvasWidth * (0.80 + Math.random() * 0.12);
        centerY = canvasHeight * (0.2 + Math.random() * 0.6);
        break;
      case 2: // Top corners
        centerX = Math.random() < 0.5
          ? canvasWidth * (0.1 + Math.random() * 0.15)
          : canvasWidth * (0.75 + Math.random() * 0.15);
        centerY = canvasHeight * (0.08 + Math.random() * 0.12);
        break;
      default: // Bottom
        centerX = canvasWidth * (0.15 + Math.random() * 0.7);
        centerY = canvasHeight * (0.82 + Math.random() * 0.1);
    }

    const rotation = (Math.random() - 0.5) * Math.PI * 0.6;
    const fontSize = 28;

    const wordPositions = getTextParticlePositions(pair.word, centerX, centerY, fontSize, rotation);
    const translationPositions = getTextParticlePositions(pair.translation, centerX, centerY, fontSize, rotation);
    const particleCount = Math.max(wordPositions.length, translationPositions.length);
    const heartScale = Math.sqrt(particleCount / 80) * 2.2;
    const heartPositions = getHeartPositions(centerX, centerY, heartScale, particleCount);

    while (wordPositions.length < particleCount) {
      wordPositions.push(wordPositions[Math.floor(Math.random() * wordPositions.length)]);
    }
    while (translationPositions.length < particleCount) {
      translationPositions.push(translationPositions[Math.floor(Math.random() * translationPositions.length)]);
    }

    const particles: WordParticle[] = wordPositions.slice(0, particleCount).map((pos) => ({
      x: pos.x + (Math.random() - 0.5) * 80,
      y: pos.y + (Math.random() - 0.5) * 80,
      originX: pos.x,
      originY: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      alpha: 0,
      size: 0.8 + Math.random() * 0.6,
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Timing (scaled by timeScale for progressive speed)
    const SPAWNING = 1200 * timeScale;
    const SHOWING_WORD = 1800 * timeScale;
    const TRANSFORMING = 1200 * timeScale;
    const SHOWING_TRANSLATION = 1800 * timeScale;
    const FORMING_HEART = 1600 * timeScale;
    const FLOATING = 3000 * timeScale;

    // Lighter accent color
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lr = Math.round(r + (255 - r) * 0.25);
    const lg = Math.round(g + (255 - g) * 0.25);
    const lb = Math.round(b + (255 - b) * 0.25);
    const softColor = `rgb(${lr}, ${lg}, ${lb})`;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      // Spawn new events
      const activeEvents = eventsRef.current.filter(e => e.state !== 'done');
      if (activeEvents.length < maxConcurrent && now - lastSpawnRef.current > spawnInterval) {
        eventsRef.current.push(spawnWordEvent(canvas.width, canvas.height));
        lastSpawnRef.current = now;
      }

      // Update each event
      eventsRef.current.forEach((event) => {
        const elapsed = now - event.stateStartTime;

        switch (event.state) {
          case 'spawning': {
            const prog = Math.min(elapsed / SPAWNING, 1);
            const ease = 1 - Math.pow(1 - prog, 3);
            event.particles.forEach((p, i) => {
              const target = event.wordPositions[i];
              p.x += (target.x - p.x) * 0.08;
              p.y += (target.y - p.y) * 0.08;
              p.alpha = ease * 0.5;
            });
            if (prog >= 1) { event.state = 'showing_word'; event.stateStartTime = now; }
            break;
          }
          case 'showing_word': {
            const breathe = Math.sin(elapsed * 0.003) * 0.05;
            event.particles.forEach((p, i) => {
              const target = event.wordPositions[i];
              p.x += (target.x - p.x) * 0.1;
              p.y += (target.y - p.y) * 0.1;
              p.alpha = 0.45 + breathe;
            });
            if (elapsed > SHOWING_WORD) { event.state = 'transforming'; event.stateStartTime = now; }
            break;
          }
          case 'transforming': {
            const prog = Math.min(elapsed / TRANSFORMING, 1);
            const ease = prog < 0.5 ? 4 * prog * prog * prog : 1 - Math.pow(-2 * prog + 2, 3) / 2;
            event.particles.forEach((p, i) => {
              const from = event.wordPositions[i];
              const to = event.translationPositions[i];
              const spiralRadius = Math.sin(prog * Math.PI) * 25;
              const spiralAngle = p.angle + prog * Math.PI * 2;
              const baseX = from.x + (to.x - from.x) * ease;
              const baseY = from.y + (to.y - from.y) * ease;
              p.targetX = baseX + Math.cos(spiralAngle) * spiralRadius;
              p.targetY = baseY + Math.sin(spiralAngle) * spiralRadius;
              p.x += (p.targetX - p.x) * 0.15;
              p.y += (p.targetY - p.y) * 0.15;
              p.alpha = 0.4 + Math.sin(prog * Math.PI) * 0.15;
            });
            if (prog >= 1) { event.state = 'showing_translation'; event.stateStartTime = now; }
            break;
          }
          case 'showing_translation': {
            const breathe = Math.sin(elapsed * 0.003) * 0.05;
            event.particles.forEach((p, i) => {
              const target = event.translationPositions[i];
              p.x += (target.x - p.x) * 0.1;
              p.y += (target.y - p.y) * 0.1;
              p.alpha = 0.45 + breathe;
            });
            if (elapsed > SHOWING_TRANSLATION) { event.state = 'forming_heart'; event.stateStartTime = now; }
            break;
          }
          case 'forming_heart': {
            const prog = Math.min(elapsed / FORMING_HEART, 1);
            const ease = 1 - Math.pow(1 - prog, 4);
            event.particles.forEach((p, i) => {
              const from = event.translationPositions[i];
              const to = event.heartPositions[i % event.heartPositions.length];
              const spiralRadius = (1 - prog) * 40;
              const spiralAngle = p.angle + prog * Math.PI * 3;
              const baseX = from.x + (to.x - from.x) * ease;
              const baseY = from.y + (to.y - from.y) * ease;
              p.targetX = baseX + Math.cos(spiralAngle) * spiralRadius * (1 - ease);
              p.targetY = baseY + Math.sin(spiralAngle) * spiralRadius * (1 - ease);
              p.x += (p.targetX - p.x) * 0.12;
              p.y += (p.targetY - p.y) * 0.12;
              p.alpha = 0.45;
            });
            if (prog >= 1) { event.state = 'floating'; event.stateStartTime = now; }
            break;
          }
          case 'floating': {
            const prog = Math.min(elapsed / FLOATING, 1);
            event.floatY = prog * 120;
            event.opacity = 1 - prog;
            event.particles.forEach((p, i) => {
              const target = event.heartPositions[i % event.heartPositions.length];
              p.x += (target.x - p.x) * 0.05;
              p.y += (target.y - event.floatY - p.y) * 0.05;
              p.alpha = 0.45 * event.opacity;
              p.x += (Math.random() - 0.5) * prog * 1.5;
              p.y += (Math.random() - 0.5) * prog * 1.5;
            });
            if (prog >= 1) { event.state = 'done'; }
            break;
          }
        }

        // Render particles
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

      eventsRef.current = eventsRef.current.filter(e => e.state !== 'done');
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start first word after short delay
    lastSpawnRef.current = Date.now() - spawnInterval + 1500;
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [accentColor, spawnInterval, timeScale, maxConcurrent]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none hidden md:block z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// ============================================
// Floating Hearts Background Component
// ============================================
interface FloatingHeart {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

const FloatingHeartsBackground: React.FC<{
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}> = ({ currentStep, totalSteps, accentColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<FloatingHeart[]>([]);
  const animationRef = useRef<number>(0);
  const rgbRef = useRef({ r: 255, g: 71, b: 97 });

  // Calculate target heart count: 7 at step 1, +3 each step
  const targetCount = 7 + (currentStep - 1) * 3;

  // Parse accent color to RGB (update ref when color changes)
  useEffect(() => {
    const hex = accentColor.replace('#', '');
    rgbRef.current = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }, [accentColor]);

  // Create a new heart at random position
  const createHeart = (canvasWidth: number, canvasHeight: number): FloatingHeart => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: 12 + Math.random() * 16,
    speed: 0.3 + Math.random() * 0.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.01 + Math.random() * 0.02,
    opacity: 0.08 + Math.random() * 0.12,
  });

  // Add hearts when step increases (separate effect from animation)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add hearts up to target count
    while (heartsRef.current.length < targetCount) {
      heartsRef.current.push(createHeart(canvas.width, canvas.height));
    }
  }, [targetCount]);

  // Main animation loop - runs once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match actual rendered dimensions (fixes iOS stretching)
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize with starting hearts
    const initialCount = 7;
    for (let i = 0; i < initialCount; i++) {
      heartsRef.current.push(createHeart(canvas.width, canvas.height));
    }

    // Draw heart shape using bezier curves
    const isNative = Capacitor.isNativePlatform();
    const drawHeart = (x: number, y: number, size: number, opacity: number) => {
      const { r, g, b } = rgbRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 30, size / 30);
      ctx.beginPath();
      if (isNative) {
        // More proportional heart shape for native iOS app
        ctx.moveTo(0, -8);
        ctx.bezierCurveTo(-8, -18, -15, -8, -15, 0);
        ctx.bezierCurveTo(-15, 10, 0, 18, 0, 18);
        ctx.bezierCurveTo(0, 18, 15, 10, 15, 0);
        ctx.bezierCurveTo(15, -8, 8, -18, 0, -8);
      } else {
        // Original heart shape for web
        ctx.moveTo(0, -5);
        ctx.bezierCurveTo(-10, -15, -20, 0, 0, 15);
        ctx.bezierCurveTo(20, 0, 10, -15, 0, -5);
      }
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.fill();
      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      heartsRef.current.forEach(heart => {
        // Float upward
        heart.y -= heart.speed;
        heart.wobble += heart.wobbleSpeed;
        const wobbleX = Math.sin(heart.wobble) * 20;

        // Reset when off screen (top)
        if (heart.y < -30) {
          heart.y = canvas.height + 30;
          heart.x = Math.random() * canvas.width;
        }

        drawHeart(heart.x + wobbleX, heart.y, heart.size, heart.opacity);
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - runs once on mount, reads from refs

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// ============================================
// Main Onboarding Component
// ============================================
interface OnboardingProps {
  role: 'student' | 'tutor';
  userId: string;
  onComplete: () => void;
  onQuit?: () => void;
  hasInheritedSubscription?: boolean;  // Skip plan selection if user already has access via partner
}

const STUDENT_TOTAL_STEPS = 17;  // Removed LanguageConfirmStep (now handled in RoleSelection)
const TUTOR_TOTAL_STEPS = 11;   // Removed LanguageConfirmStep (now handled in RoleSelection)

const STORAGE_KEY = 'onboarding_progress';

export const Onboarding: React.FC<OnboardingProps> = ({
  role,
  userId,
  onComplete,
  onQuit,
  hasInheritedSubscription = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);
  const [trialActivating, setTrialActivating] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Get setLanguageOverride to update language context during onboarding
  const { setLanguageOverride } = useLanguage();

  // When user has inherited subscription, skip the PlanSelectionStep
  const totalSteps = role === 'student'
    ? (hasInheritedSubscription ? STUDENT_TOTAL_STEPS - 1 : STUDENT_TOTAL_STEPS)
    : (hasInheritedSubscription ? TUTOR_TOTAL_STEPS - 1 : TUTOR_TOTAL_STEPS);
  // Use consistent red/rose theme for both roles after login
  const accentColor = '#FF4761';

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.userId === userId && parsed.role === role) {
          setCurrentStep(parsed.step || 1);
          setData(parsed.data || {});
          // Restore language override from saved onboarding data
          if (parsed.data?.targetLanguage || parsed.data?.nativeLanguage) {
            setLanguageOverride({
              targetLanguage: parsed.data.targetLanguage,
              nativeLanguage: parsed.data.nativeLanguage,
            });
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [userId, role, setLanguageOverride]);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userId,
      role,
      step: currentStep,
      data
    }));
  }, [userId, role, currentStep, data]);

  const goNext = () => setCurrentStep(s => Math.min(s + 1, totalSteps));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1));

  // Track onboarding step changes for analytics
  const stepStartTime = useRef(Date.now());
  useEffect(() => {
    // Get step name based on role and step number
    const getStepName = (step: number): string => {
      if (role === 'student') {
        const studentSteps = ['name', 'partner_name', 'photo', 'why', 'time', 'when', 'fear', 'prior', 'vibe', 'learn_hello', 'learn_love', 'try_it', 'celebration', 'goal', 'validation', 'plan', 'start'];
        return studentSteps[step - 1] || `step_${step}`;
      } else {
        const tutorSteps = ['name', 'partner_name', 'relation', 'language_connection', 'origin', 'dream_phrase', 'teaching_style', 'preview', 'validation', 'plan', 'start'];
        return tutorSteps[step - 1] || `step_${step}`;
      }
    };

    analytics.track('onboarding_step', {
      step_number: currentStep,
      step_name: getStepName(currentStep),
      role: role,
      total_steps: totalSteps,
      time_on_previous_step_ms: Date.now() - stepStartTime.current,
    });
    stepStartTime.current = Date.now();
  }, [currentStep, role, totalSteps]);

  // Handle quitting onboarding - clear progress and call onQuit
  const handleQuit = () => {
    localStorage.removeItem(STORAGE_KEY);
    onQuit?.();
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setData(prev => {
      const newData = { ...prev, [key]: value };

      // Update language context override when languages change
      // This ensures subsequent onboarding steps see the updated language
      if (key === 'targetLanguage' || key === 'nativeLanguage') {
        setLanguageOverride({
          targetLanguage: key === 'targetLanguage' ? value : prev.targetLanguage,
          nativeLanguage: key === 'nativeLanguage' ? value : prev.nativeLanguage,
        });
      }

      return newData;
    });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const partnerNameValue = role === 'tutor' ? data.learnerName : data.partnerName;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.userName || 'Friend',
          partner_name: partnerNameValue || null,
          onboarding_data: data,
          onboarding_completed_at: new Date().toISOString(),
          role: role,
          smart_validation: data.smartValidation ?? true,
          native_language: data.nativeLanguage,
          active_language: data.targetLanguage
        })
        .eq('id', userId);

      if (error) throw error;

      // Clear language override - profile now has the correct languages
      setLanguageOverride(null);

      if (role === 'student') {
        // Save onboarding words to dictionary and award XP
        const targetLanguage = data.targetLanguage || 'pl';
        const targetConfig = (await import('../../constants/language-config')).LANGUAGE_CONFIGS[targetLanguage];
        const nativeLanguage = data.nativeLanguage || 'en';
        const nativeConfig = (await import('../../constants/language-config')).LANGUAGE_CONFIGS[nativeLanguage];

        // Words learned in onboarding
        const onboardingWords = [
          {
            user_id: userId,
            word: (targetConfig?.examples.hello || 'hello').toLowerCase(),
            translation: nativeConfig?.examples.hello || 'hello',
            word_type: 'phrase',
            language_code: targetLanguage,
            source: 'onboarding',
            pro_tip: 'Your first word! Use it to greet your partner.',
            example_sentence: `${targetConfig?.examples.hello || 'Hello'}! (${nativeConfig?.examples.hello || 'Hello'}!)`
          },
          {
            user_id: userId,
            word: (targetConfig?.examples.iLoveYou || 'i love you').toLowerCase(),
            translation: nativeConfig?.examples.iLoveYou || 'I love you',
            word_type: 'phrase',
            language_code: targetLanguage,
            source: 'onboarding',
            pro_tip: 'The most important phrase! Say it often.',
            example_sentence: `${targetConfig?.examples.iLoveYou || 'I love you'}, ${data.partnerName || 'my love'}! (${nativeConfig?.examples.iLoveYou || 'I love you'}!)`
          }
        ];

        // Save words to dictionary (don't await)
        supabase.from('dictionary').upsert(onboardingWords, {
          onConflict: 'user_id,word,language_code',
          ignoreDuplicates: true
        }).then(() => {
          window.dispatchEvent(new CustomEvent('dictionary-updated', { detail: { count: 2 } }));
        }).catch(() => {});

        // Award 1 XP per word (2 words = 2 XP)
        supabase.auth.getSession().then(({ data: sessionData }) => {
          if (sessionData.session?.access_token) {
            fetch('/api/increment-xp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
              body: JSON.stringify({ amount: onboardingWords.length })
            }).catch(() => {}); // Ignore errors
          }
        });
      }

      localStorage.removeItem(STORAGE_KEY);

      // Track onboarding completion
      analytics.track('onboarding_completed', {
        role: role,
        total_steps: totalSteps,
        target_language: data.targetLanguage,
        native_language: data.nativeLanguage,
        selected_plan: data.selectedPlan || 'none',
        has_inherited_subscription: hasInheritedSubscription,
      });

      // Handle plan selection
      console.log('[Onboarding] Selected plan:', data.selectedPlan, 'Price ID:', data.selectedPriceId);

      if (data.selectedPlan === 'free') {
        // User chose free tier - call API with bulletproof retry
        console.log('[Onboarding] Activating free trial...');
        setTrialActivating(true);
        setTrialError(null);

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          console.error('[Onboarding] No auth token available');
          setTrialError('Session expired. Please refresh and try again.');
          setTrialActivating(false);
          return; // Block progression
        }

        // Retry logic: 3 attempts with exponential backoff
        const maxAttempts = 3;
        const delays = [0, 1000, 2000]; // 0s, 1s, 2s

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            if (attempt > 1) {
              console.log(`[Onboarding] Retry attempt ${attempt}/${maxAttempts}...`);
              await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
            }

            const response = await fetch('/api/choose-free-tier', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            const result = await response.json();
            console.log('[Onboarding] Free trial API response:', response.status, result);

            if (response.ok) {
              // Success! Store the trial expiry and proceed
              if (result.trialExpiresAt) {
                updateData('trialExpiresAt', result.trialExpiresAt);
              }
              setTrialActivating(false);
              onComplete();
              return;
            }

            // Handle specific error codes
            if (result.code === 'ALREADY_FREE_TIER') {
              // User already has trial - just proceed
              console.log('[Onboarding] User already has trial, proceeding...');
              setTrialActivating(false);
              onComplete();
              return;
            }

            // Other errors - retry if attempts remaining
            if (attempt === maxAttempts) {
              console.error('[Onboarding] Free trial activation failed after retries:', result);
              setTrialError(result.error || 'Failed to start trial. Please try again.');
              setTrialActivating(false);
              return; // Block progression
            }
          } catch (networkErr) {
            console.error(`[Onboarding] Network error (attempt ${attempt}):`, networkErr);
            if (attempt === maxAttempts) {
              setTrialError('Network error. Please check your connection and try again.');
              setTrialActivating(false);
              return; // Block progression
            }
          }
        }
      } else if (data.selectedPriceId) {
        // User chose paid plan - redirect to Stripe
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;

          if (token) {
            const response = await fetch('/api/create-checkout-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                priceId: data.selectedPriceId,
                successUrl: `${window.location.origin}/#/?onboarding=complete&subscription=success`,
                cancelUrl: `${window.location.origin}/#/?onboarding=complete&subscription=canceled`
              })
            });

            const checkoutData = await response.json();

            if (checkoutData.url) {
              window.location.href = checkoutData.url;
              return;
            }
          }
        } catch (stripeErr) {
          console.error('Error creating checkout session:', stripeErr);
        }
        onComplete();
      } else {
        // No plan selected (shouldn't happen) - just complete
        onComplete();
      }
    } catch (err) {
      console.error('Error saving onboarding:', err);
      localStorage.removeItem(STORAGE_KEY);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Get step content WITHOUT returning from component
  // This allows us to have a single return with hearts + content
  // ============================================
  const getStepContent = (): React.ReactNode => {
    if (role === 'student') {
      switch (currentStep) {
        case 1:
          return (
            <NameStep
              currentStep={1}
              totalSteps={totalSteps}
              initialValue={data.userName}
              onNext={(name) => { updateData('userName', name); goNext(); }}
              accentColor={accentColor}
            />
          );
        case 2:
          return (
            <PartnerNameStep
              currentStep={2}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              role="student"
              initialValue={data.partnerName}
              onNext={(name) => { updateData('partnerName', name); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 3:
          return (
            <VibeStep
              currentStep={3}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              initialValue={data.relationshipVibe}
              onNext={(vibe) => { updateData('relationshipVibe', vibe); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 4:
          return (
            <PhotoStep
              currentStep={4}
              totalSteps={totalSteps}
              userId={userId}
              userName={data.userName || 'User'}
              initialValue={data.couplePhotoUrl}
              onNext={(url) => { updateData('couplePhotoUrl', url); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 5:
          return (
            <WhyStep
              currentStep={5}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              initialValue={data.learningReason}
              onNext={(reason) => { updateData('learningReason', reason); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 6:
          return (
            <TimeStep
              currentStep={6}
              totalSteps={totalSteps}
              initialValue={data.dailyTime}
              onNext={(time) => { updateData('dailyTime', time); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 7:
          return (
            <WhenStep
              currentStep={7}
              totalSteps={totalSteps}
              initialValue={data.preferredTime}
              onNext={(when) => { updateData('preferredTime', when); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 8:
          return (
            <FearStep
              currentStep={8}
              totalSteps={totalSteps}
              initialValue={data.biggestFear}
              onNext={(fear) => { updateData('biggestFear', fear); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 9:
          return (
            <PriorStep
              currentStep={9}
              totalSteps={totalSteps}
              initialValue={data.priorExperience}
              onNext={(prior) => { updateData('priorExperience', prior); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 10:
          return (
            <ValidationModeStep
              currentStep={10}
              totalSteps={totalSteps}
              initialValue={data.smartValidation}
              onNext={(mode) => { updateData('smartValidation', mode); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 11:
          return (
            <LearnHelloStep
              currentStep={11}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 12:
          return (
            <LearnLoveStep
              currentStep={12}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 13:
          return (
            <TryItStep
              currentStep={13}
              totalSteps={totalSteps}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 14:
          return (
            <CelebrationStep
              currentStep={14}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={goNext}
              accentColor={accentColor}
            />
          );
        case 15:
          return (
            <GoalStep
              currentStep={15}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              initialValue={data.firstGoal}
              onNext={(goal) => { updateData('firstGoal', goal); goNext(); }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 16:
          // Skip PlanSelectionStep if user has inherited subscription
          if (hasInheritedSubscription) {
            return (
              <StartStep
                currentStep={16}
                totalSteps={totalSteps}
                userName={data.userName || 'Friend'}
                partnerName={data.partnerName || 'them'}
                onComplete={handleComplete}
                accentColor={accentColor}
              />
            );
          }
          return (
            <PlanSelectionStep
              currentStep={16}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              onNext={(plan, priceId) => {
                updateData('selectedPlan', plan);
                updateData('selectedPriceId', priceId);
                goNext();
              }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 17:
          return (
            <StartStep
              currentStep={17}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              partnerName={data.partnerName || 'them'}
              onComplete={handleComplete}
              accentColor={accentColor}
              loading={trialActivating}
              error={trialError}
            />
          );
        default:
          return null;
      }
    }

    // Tutor flow
    switch (currentStep) {
      case 1:
        return (
          <NameStep
            currentStep={1}
            totalSteps={totalSteps}
            initialValue={data.userName}
            onNext={(name) => { updateData('userName', name); goNext(); }}
            accentColor={accentColor}
          />
        );
      case 2:
        return (
          <PartnerNameStep
            currentStep={2}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            role="tutor"
            initialValue={data.learnerName}
            onNext={(name) => { updateData('learnerName', name); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 3:
        return (
          <RelationStep
            currentStep={3}
            totalSteps={totalSteps}
            learnerName={data.learnerName || 'them'}
            initialValue={data.relationshipType}
            onNext={(relation) => { updateData('relationshipType', relation); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 4:
        return (
          <LanguageConnectionStep
            currentStep={4}
            totalSteps={totalSteps}
            initialValue={data.languageConnection || data.polishConnection}
            onNext={(connection) => { updateData('languageConnection', connection); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 5:
        return (
          <OriginStep
            currentStep={5}
            totalSteps={totalSteps}
            initialValue={data.languageOrigin || data.polishOrigin}
            onNext={(origin) => { updateData('languageOrigin', origin); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 6:
        return (
          <DreamPhraseStep
            currentStep={6}
            totalSteps={totalSteps}
            learnerName={data.learnerName || 'them'}
            initialValue={data.dreamPhrase}
            onNext={(phrase) => { updateData('dreamPhrase', phrase); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 7:
        return (
          <TeachingStyleStep
            currentStep={7}
            totalSteps={totalSteps}
            initialValue={data.teachingStyle}
            onNext={(style) => { updateData('teachingStyle', style); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 8:
        return (
          <ValidationModeStep
            currentStep={8}
            totalSteps={totalSteps}
            initialValue={data.smartValidation}
            onNext={(mode) => { updateData('smartValidation', mode); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 9:
        return (
          <TutorPreviewStep
            currentStep={9}
            totalSteps={totalSteps}
            learnerName={data.learnerName || 'them'}
            onNext={goNext}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 10:
        // Skip PlanSelectionStep if user has inherited subscription
        if (hasInheritedSubscription) {
          return (
            <TutorStartStep
              currentStep={10}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              learnerName={data.learnerName || 'them'}
              onComplete={handleComplete}
              accentColor={accentColor}
            />
          );
        }
        return (
          <PlanSelectionStep
            currentStep={10}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            onNext={(plan, priceId) => {
              updateData('selectedPlan', plan);
              updateData('selectedPriceId', priceId);
              goNext();
            }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 11:
        return (
          <TutorStartStep
            currentStep={11}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            learnerName={data.learnerName || 'them'}
            onComplete={handleComplete}
            accentColor={accentColor}
            loading={trialActivating}
            error={trialError}
          />
        );
      default:
        return null;
    }
  };

  // ============================================
  // SINGLE RETURN - Hearts always in same tree position
  // This prevents remounting when step changes
  // ============================================
  return (
    <OnboardingContext.Provider value={{ onQuit: handleQuit }}>
      <div className="relative min-h-screen overflow-hidden bg-[#fdfcfd]">
        <FloatingHeartsBackground
          currentStep={currentStep}
          totalSteps={totalSteps}
          accentColor={accentColor}
        />
        <WordParticleBackground
          currentStep={currentStep}
          totalSteps={totalSteps}
          accentColor={accentColor}
        />
        {getStepContent()}
      </div>
    </OnboardingContext.Provider>
  );
};
