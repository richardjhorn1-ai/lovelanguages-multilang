import React, { useState, useEffect, useRef, useCallback, createContext, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../../services/supabase';
import type { OnboardingData, OnboardingFlowKey, OnboardingStatus, OnboardingStepKey, Profile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';
import { analytics } from '../../services/analytics';
import { haptics } from '../../services/haptics';
import { apiFetch, APP_URL } from '../../services/api-config';
import { BRAND } from '../hero/heroConstants';
import { useTheme } from '../../context/ThemeContext';
import { ACCENT_COLORS, DARK_MODE_STYLES } from '../../services/theme';
import {
  getFlowSteps,
  getInitialStepKey,
  getStepNumber,
  resolveOnboardingFlowKey,
} from '../../utils/onboarding-state';

// Context for sharing onQuit across all step components
export const OnboardingContext = createContext<{
  onQuit?: () => void;
}>({});

// Shared steps (new)
import { RoleStep } from './steps/shared/RoleStep';
import { NativeLanguageStep } from './steps/shared/NativeLanguageStep';
import { LanguageStep } from './steps/shared/LanguageStep';
import { CombinedNamesStep } from './steps/shared/CombinedNamesStep';
import { PlanSelectionStep } from './steps/shared/PlanSelectionStep';
import { InvitePartnerStep } from './steps/shared/InvitePartnerStep';

// Student steps
import { LearnHelloStep } from './steps/student/LearnHelloStep';
import { LearnLoveStep } from './steps/student/LearnLoveStep';
import { CelebrationStep } from './steps/student/CelebrationStep';
import { PersonalizationStep } from './steps/student/PersonalizationStep';
import { ThemeCustomizationStep } from './steps/student/ThemeCustomizationStep';
import { StartStep } from './steps/student/StartStep';

// Tutor steps
import { TeachingStyleStep } from './steps/tutor/TeachingStyleStep';
import { TutorPreviewStep } from './steps/tutor/TutorPreviewStep';
import { TutorPersonalizationStep } from './steps/tutor/TutorPersonalizationStep';
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

    return pairs;
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

  // Calculate target heart count: 5 at step 1, +2 each step (max ~25)
  const targetCount = 5 + (currentStep - 1) * 2;

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
    opacity: 0.08 + Math.random() * 0.10,
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
  }, []); // Empty deps - runs once on mount, reads from refs

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[20]"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// ============================================
// Main Onboarding Component
// ============================================
interface OnboardingProps {
  profile: Profile;
  onComplete: () => void;
  onQuit?: () => void;
  hasInheritedSubscription?: boolean;  // Skip plan selection if user already has access via partner
  isInvitedUser?: boolean;             // Shortened flow for users who joined via invite
  inviterName?: string;                // Name of the person who invited them
}

const STORAGE_KEY = 'onboarding_progress';

interface OnboardingStatusResponse {
  success: boolean;
  snapshot: {
    profile: Profile;
    hasAppAccess: boolean;
    inviteSummary: {
      inviteLink: string;
      expiresAt: string;
      isExisting: boolean;
    } | null;
  };
}

export const Onboarding: React.FC<OnboardingProps> = ({
  profile,
  onComplete,
  onQuit,
  hasInheritedSubscription = false,
  isInvitedUser = false,
  inviterName
}) => {
  const userId = profile.id;
  const initialRole = profile.onboarding_data?.role || profile.role;
  const initialFlowKey = profile.onboarding_flow_key || resolveOnboardingFlowKey(initialRole, isInvitedUser);
  const initialStepKey = profile.onboarding_step_key || getInitialStepKey(initialFlowKey);

  const [data, setData] = useState<Partial<OnboardingData>>(profile.onboarding_data || {});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [trialActivating, setTrialActivating] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(
    profile.onboarding_status || 'not_started'
  );
  const onboardingStartTime = useRef(Date.now());

  // Active role — from prop (returning user) or from RoleStep selection (new user)
  const [selectedRole, setSelectedRole] = useState<'student' | 'tutor' | null>(initialRole);
  const activeRole = selectedRole || 'student'; // Default to student for step count before selection
  const [currentFlowKey, setCurrentFlowKey] = useState<OnboardingFlowKey>(initialFlowKey);
  const [currentStepKey, setCurrentStepKey] = useState<OnboardingStepKey>(initialStepKey);
  const currentStep = getStepNumber(
    currentFlowKey,
    currentStepKey,
    { skipPlanStep: hasInheritedSubscription }
  );

  // Get setLanguageOverride to update language context during onboarding
  const { targetLanguage: contextTargetLang, nativeLanguage: contextNativeLang, setLanguageOverride } = useLanguage();

  const totalSteps = getFlowSteps(
    currentFlowKey,
    { skipPlanStep: hasInheritedSubscription }
  ).length;
  // Theme-aware accent color for onboarding backgrounds
  const { theme } = useTheme();
  const [hasVisitedThemeStep, setHasVisitedThemeStep] = useState(false);

  // Sticky flag: once user reaches theme step (student step 9), enable theme-driven decorations.
  // Sticky because applyTheme() already set CSS vars globally — going back shouldn't revert the gradient.
  useEffect(() => {
    if (!isInvitedUser && activeRole === 'student' && currentStep >= 9) {
      setHasVisitedThemeStep(true);
    }
  }, [currentStep, activeRole, isInvitedUser]);

  const roleAccent = activeRole === 'tutor' ? BRAND.teal : BRAND.primary;
  const accentColor = hasVisitedThemeStep ? ACCENT_COLORS[theme.accentColor].primary : roleAccent;

  // Background gradient — theme-aware after the theme customization step
  const bgGradient = (() => {
    if (!hasVisitedThemeStep) {
      // Pre-theme: hardcoded role gradients (existing behavior)
      return activeRole === 'tutor'
        ? 'linear-gradient(145deg, #f0fdfa 0%, #e0f2f1 35%, #f0fdfa 65%, #f5fffe 100%)'
        : activeRole === 'student'
          ? 'linear-gradient(145deg, #FFF0F3 0%, #fce4ec 35%, #FFF0F3 65%, #fff5f7 100%)'
          : 'linear-gradient(145deg, #fdfcfd 0%, #f5f0f2 35%, #fdfcfd 65%, #fefcfd 100%)';
    }
    const isDark = theme.darkMode !== 'off';
    const darkBg = DARK_MODE_STYLES[theme.darkMode].bgPrimary;
    const accent = ACCENT_COLORS[theme.accentColor];
    // Clean mode: flat solid background, no gradient or tint
    if (theme.backgroundStyle === 'clean') {
      return isDark ? darkBg : '#ffffff';
    }
    if (isDark) {
      return `linear-gradient(145deg, color-mix(in srgb, ${accent.primary} 8%, ${darkBg}) 0%, ${darkBg} 50%, color-mix(in srgb, ${accent.primary} 4%, ${darkBg}) 100%)`;
    }
    return `linear-gradient(145deg, ${accent.light} 0%, ${accent.lightHover} 35%, ${accent.light} 65%, #fff 100%)`;
  })();

  // Clean mode: hide decorative elements (hearts, orbs, word particles) after user selects it
  const isCleanMode = hasVisitedThemeStep && theme.backgroundStyle === 'clean';

  const buildSignature = useCallback((
    flowKey: OnboardingFlowKey,
    stepKey: OnboardingStepKey,
    nextData: Partial<OnboardingData>
  ) => JSON.stringify({ flowKey, stepKey, data: nextData }), []);
  const lastSyncedSignatureRef = useRef(
    buildSignature(initialFlowKey, initialStepKey, profile.onboarding_data || {})
  );

  const applySnapshot = useCallback((snapshotProfile: Profile) => {
    const snapshotData = snapshotProfile.onboarding_data || {};
    const snapshotRole = snapshotData.role || snapshotProfile.role || 'student';
    const snapshotFlow =
      snapshotProfile.onboarding_flow_key ||
      resolveOnboardingFlowKey(snapshotRole, isInvitedUser);
    const availableSteps = getFlowSteps(
      snapshotFlow,
      { skipPlanStep: hasInheritedSubscription }
    );
    const snapshotStep =
      snapshotProfile.onboarding_step_key && availableSteps.includes(snapshotProfile.onboarding_step_key)
        ? snapshotProfile.onboarding_step_key
        : availableSteps[0];

    setData(snapshotData);
    setSelectedRole(snapshotRole);
    setCurrentFlowKey(snapshotFlow);
    setCurrentStepKey(snapshotStep);
    setOnboardingStatus(snapshotProfile.onboarding_status || 'not_started');
    lastSyncedSignatureRef.current = buildSignature(snapshotFlow, snapshotStep, snapshotData);

    if (snapshotData.targetLanguage || snapshotData.nativeLanguage) {
      setLanguageOverride({
        targetLanguage: snapshotData.targetLanguage,
        nativeLanguage: snapshotData.nativeLanguage,
      });
    }
  }, [buildSignature, hasInheritedSubscription, isInvitedUser, setLanguageOverride]);

  const restoreLocalProgress = useCallback((parsed: {
    userId?: string;
    role?: string;
    flowKey?: OnboardingFlowKey;
    stepKey?: OnboardingStepKey;
    step?: number;
    data?: Partial<OnboardingData>;
    status?: OnboardingStatus;
  }) => {
    const restoredData = parsed.data || {};
    const restoredRole = (restoredData.role || parsed.role || initialRole || 'student') as 'student' | 'tutor';
    const restoredFlow = parsed.flowKey || resolveOnboardingFlowKey(restoredRole, isInvitedUser);
    const flowSteps = getFlowSteps(
      restoredFlow,
      { skipPlanStep: hasInheritedSubscription }
    );
    const restoredStep = parsed.stepKey && flowSteps.includes(parsed.stepKey)
      ? parsed.stepKey
      : flowSteps[Math.min(Math.max((parsed.step || 1) - 1, 0), flowSteps.length - 1)];

    setData(restoredData);
    setSelectedRole(restoredRole);
    setCurrentFlowKey(restoredFlow);
    setCurrentStepKey(restoredStep);
    setOnboardingStatus(parsed.status || 'in_progress');
    lastSyncedSignatureRef.current = buildSignature(restoredFlow, restoredStep, restoredData);

    if (restoredData.targetLanguage || restoredData.nativeLanguage) {
      setLanguageOverride({
        targetLanguage: restoredData.targetLanguage,
        nativeLanguage: restoredData.nativeLanguage,
      });
    }
  }, [buildSignature, hasInheritedSubscription, initialRole, isInvitedUser, setLanguageOverride]);

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const fetchOnboardingStatus = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Session expired. Please refresh and try again.');
    }

    const response = await apiFetch('/api/onboarding/status/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json() as OnboardingStatusResponse;
    if (!response.ok) {
      throw new Error((result as any).error || 'Failed to load onboarding status');
    }

    applySnapshot(result.snapshot.profile);
    return result.snapshot;
  }, [applySnapshot, getAccessToken]);

  const persistStep = useCallback(async (
    answers: Partial<OnboardingData>,
    direction: 'next' | 'back' | 'stay' = 'stay',
    flowOverride?: OnboardingFlowKey
  ) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Session expired. Please refresh and try again.');
    }

    const response = await apiFetch('/api/onboarding/save-step/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flowKey: flowOverride || currentFlowKey,
        stepKey: currentStepKey,
        answers,
        direction,
      }),
    });

    const result = await response.json() as OnboardingStatusResponse;
    if (!response.ok) {
      throw new Error((result as any).error || 'Failed to save onboarding step');
    }

    applySnapshot(result.snapshot.profile);
    return result.snapshot;
  }, [applySnapshot, currentFlowKey, currentStepKey, getAccessToken]);

  // Load server-backed onboarding state first, then fall back to local storage cache.
  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      try {
        const snapshot = await fetchOnboardingStatus();
        if (!cancelled) {
          applySnapshot(snapshot.profile);
          setHydrated(true);
        }
        return;
      } catch {
        if (cancelled) {
          return; // Supabase had progress, use it
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.userId === userId) {
            restoreLocalProgress(parsed);
            setHydrated(true);
            return;
          }
        } catch {
          // Ignore parse errors and fall through to profile defaults.
        }
      }

      if (!cancelled) {
        applySnapshot(profile);
        setHydrated(true);
      }
    };

    loadProgress();
    return () => { cancelled = true; };
  }, [applySnapshot, fetchOnboardingStatus, profile, restoreLocalProgress, userId]);

  // Ensure language data is populated from context (RoleSelection sets these in DB)
  useEffect(() => {
    setData(prev => {
      if (prev.targetLanguage && prev.nativeLanguage) return prev; // Already set (e.g., from localStorage)
      return {
        ...prev,
        targetLanguage: prev.targetLanguage || contextTargetLang,
        nativeLanguage: prev.nativeLanguage || contextNativeLang,
      };
    });
  }, [contextTargetLang, contextNativeLang]);

  // Save local cache immediately and sync canonical onboarding_data in the background.
  const serverSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTransitionInFlightRef = useRef(false);

  const clearPendingServerSave = useCallback(() => {
    if (serverSaveTimer.current) {
      clearTimeout(serverSaveTimer.current);
      serverSaveTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const progressPayload = {
      userId,
      role: activeRole,
      flowKey: currentFlowKey,
      stepKey: currentStepKey,
      status: onboardingStatus,
      step: currentStep,
      data
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressPayload));

    if (!hydrated || saving || trialActivating || stepTransitionInFlightRef.current) {
      return;
    }

    const signature = buildSignature(currentFlowKey, currentStepKey, data);
    if (signature === lastSyncedSignatureRef.current) {
      return;
    }

    clearPendingServerSave();
    serverSaveTimer.current = setTimeout(() => {
      if (stepTransitionInFlightRef.current) {
        return;
      }
      persistStep(data, 'stay').catch((error) => {
        console.warn('[Onboarding] Background save failed:', error);
      });
    }, 800);

    return () => {
      clearPendingServerSave();
    };
  }, [
    activeRole,
    buildSignature,
    clearPendingServerSave,
    currentFlowKey,
    currentStep,
    currentStepKey,
    data,
    hydrated,
    onboardingStatus,
    persistStep,
    saving,
    trialActivating,
    userId,
  ]);

  const goBack = async () => {
    haptics.trigger('selection');
    analytics.track('onboarding_back_clicked', {
      flow_key: currentFlowKey,
      step_key: currentStepKey,
      role: activeRole,
      is_invited_user: isInvitedUser,
      native_language: data.nativeLanguage,
      target_language: data.targetLanguage,
      plan_intent: data.selectedPlan === 'free' ? 'free' : data.selectedPlan ? 'paid' : undefined,
    });
    stepTransitionInFlightRef.current = true;
    clearPendingServerSave();
    try {
      await persistStep({}, 'back');
    } finally {
      stepTransitionInFlightRef.current = false;
    }
  };

  // Track onboarding step changes for analytics
  const stepStartTime = useRef(Date.now());
  useEffect(() => {
    analytics.track('onboarding_step_viewed', {
      flow_key: currentFlowKey,
      step_key: currentStepKey,
      step_number: currentStep,
      role: activeRole,
      total_steps: totalSteps,
      time_on_previous_step_ms: Date.now() - stepStartTime.current,
      is_invited_user: isInvitedUser,
      native_language: data.nativeLanguage,
      target_language: data.targetLanguage,
      plan_intent: data.selectedPlan === 'free' ? 'free' : data.selectedPlan ? 'paid' : undefined,
    });

    if (currentStepKey === 'plan') {
      analytics.track('onboarding_plan_viewed', {
        flow_key: currentFlowKey,
        step_key: currentStepKey,
        role: activeRole,
        is_invited_user: isInvitedUser,
        native_language: data.nativeLanguage,
        target_language: data.targetLanguage,
      });
    }

    stepStartTime.current = Date.now();
  }, [activeRole, currentFlowKey, currentStep, currentStepKey, data.nativeLanguage, data.selectedPlan, data.targetLanguage, isInvitedUser, totalSteps]);

  useEffect(() => {
    if (onboardingStatus !== 'pending_checkout') {
      return;
    }

    const timer = setInterval(() => {
      fetchOnboardingStatus()
        .then((snapshot) => {
          if (snapshot.profile.onboarding_status === 'completed') {
            onComplete();
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(timer);
  }, [fetchOnboardingStatus, onComplete, onboardingStatus]);

  // Handle quitting onboarding - keep progress so user can resume on next login
  const handleQuit = () => {
    // Don't clear localStorage - user can resume where they left off
    onQuit?.();
  };

  const continueWithStep = async (
    patch: Partial<OnboardingData>,
    flowOverride?: OnboardingFlowKey
  ) => {
    haptics.trigger('selection');
    setSaveError(null);
    setTrialError(null);
    stepTransitionInFlightRef.current = true;
    clearPendingServerSave();

    const nextData = { ...data, ...patch };
    setData(nextData);

    try {
      const snapshot = await persistStep(nextData, 'next', flowOverride);
      analytics.track('onboarding_step_saved', {
        flow_key: flowOverride || currentFlowKey,
        step_key: currentStepKey,
        next_step_key: snapshot.profile.onboarding_step_key,
        step_number: currentStep,
        role: activeRole,
        is_invited_user: isInvitedUser,
        native_language: nextData.nativeLanguage,
        target_language: nextData.targetLanguage,
        plan_intent: nextData.selectedPlan === 'free' ? 'free' : nextData.selectedPlan ? 'paid' : undefined,
      });
      return snapshot;
    } finally {
      stepTransitionInFlightRef.current = false;
    }
  };

  const goNext = async () => continueWithStep({});

  const awardOnboardingWords = async (resolvedData: Partial<OnboardingData>) => {
    if (activeRole !== 'student') {
      return;
    }

    const targetLanguage = resolvedData.targetLanguage;
    const nativeLanguage = resolvedData.nativeLanguage || 'en';
    if (!targetLanguage) {
      return;
    }
    const targetConfig = (await import('../../constants/language-config')).LANGUAGE_CONFIGS[targetLanguage];
    const nativeConfig = (await import('../../constants/language-config')).LANGUAGE_CONFIGS[nativeLanguage];

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
        example_sentence: `${targetConfig?.examples.iLoveYou || 'I love you'}, ${resolvedData.partnerName || 'my love'}! (${nativeConfig?.examples.iLoveYou || 'I love you'}!)`
      }
    ];

    Promise.resolve(supabase.from('dictionary').upsert(onboardingWords, {
      onConflict: 'user_id,word,language_code',
      ignoreDuplicates: true
    })).then(() => {
      window.dispatchEvent(new CustomEvent('dictionary-updated', { detail: { count: 2 } }));
    }).catch(err => console.error('Failed to save onboarding words:', err));

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session?.access_token) {
        apiFetch('/api/increment-xp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
          body: JSON.stringify({ amount: onboardingWords.length })
        }).catch(() => {});
      }
    });
  };

  const finishClientOnboarding = async (resolvedData: Partial<OnboardingData>) => {
    setLanguageOverride(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('inviter_name');

    await awardOnboardingWords(resolvedData);

    analytics.track('onboarding_completed', {
      flow_key: currentFlowKey,
      role: activeRole,
      total_steps: totalSteps,
      steps_completed: currentStep,
      total_time_ms: Date.now() - onboardingStartTime.current,
      target_language: resolvedData.targetLanguage,
      native_language: resolvedData.nativeLanguage,
      selected_plan: resolvedData.selectedPlan || 'none',
      has_inherited_subscription: hasInheritedSubscription,
      is_invited_user: isInvitedUser,
    });

    onComplete();
  };

  const handleComplete = async () => {
    setSaving(true);
    setSaveError(null);
    setTrialError(null);

    let resolvedData: Partial<OnboardingData> = { ...data };

    // Invited users skip personalization — set sensible defaults
    if (isInvitedUser) {
      if (activeRole === 'student') {
        if (!resolvedData.relationshipVibe) resolvedData.relationshipVibe = 'balanced';
        if (!resolvedData.dailyTime) resolvedData.dailyTime = 'coffee';
        if (!resolvedData.priorExperience) resolvedData.priorExperience = 'no';
      } else {
        if (!resolvedData.relationshipType) resolvedData.relationshipType = 'partner';
        if (!resolvedData.languageConnection) resolvedData.languageConnection = 'native';
        if (!resolvedData.teachingStyle) resolvedData.teachingStyle = 'balanced';
      }
    }

    try {
      if (JSON.stringify(resolvedData) !== JSON.stringify(data)) {
        setData(resolvedData);
        await persistStep(resolvedData, 'stay');
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error('Session expired. Please refresh and try again.');
      }

      if (
        hasInheritedSubscription ||
        resolvedData.selectedPlan === 'free' ||
        onboardingStatus === 'pending_checkout'
      ) {
        setTrialActivating(true);

        const response = await apiFetch('/api/onboarding/finalize-free/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json() as OnboardingStatusResponse & { error?: string; code?: string };
        if (!response.ok) {
          analytics.track('onboarding_free_activation_failed', {
            flow_key: currentFlowKey,
            step_key: currentStepKey,
            role: activeRole,
            error_code: result.code || 'FINALIZE_FAILED',
          });
          setTrialError(result.error || 'Failed to finalize onboarding. Please try again.');
          return;
        }

        applySnapshot(result.snapshot.profile);
        analytics.track('onboarding_free_activation_succeeded', {
          flow_key: currentFlowKey,
          step_key: currentStepKey,
          role: activeRole,
          completion_reason: result.snapshot.profile.onboarding_completion_reason,
        });
        await finishClientOnboarding(result.snapshot.profile.onboarding_data || resolvedData);
        return;
      }

      if (resolvedData.selectedPriceId) {
        analytics.track('onboarding_plan_selected_paid', {
          flow_key: currentFlowKey,
          step_key: 'plan',
          role: activeRole,
          plan_intent: 'paid',
        });

        const response = await apiFetch('/api/onboarding/start-paid-checkout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId: resolvedData.selectedPriceId,
            successUrl: `${APP_URL}/?subscription=success&onboarding=return`,
            cancelUrl: `${APP_URL}/?subscription=canceled&onboarding=return`,
          })
        });

        const checkoutData = await response.json() as OnboardingStatusResponse & { error?: string; url?: string | null };
        if (!response.ok) {
          setTrialError(checkoutData.error || 'Failed to start checkout. Please try again.');
          return;
        }

        if (checkoutData.snapshot?.profile) {
          applySnapshot(checkoutData.snapshot.profile);
        }

        analytics.track('onboarding_checkout_started', {
          flow_key: currentFlowKey,
          step_key: currentStepKey,
          role: activeRole,
          native_language: resolvedData.nativeLanguage,
          target_language: resolvedData.targetLanguage,
          plan_intent: 'paid',
        });

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }

      setTrialError('We are still waiting for payment confirmation. Please try again in a moment.');
    } catch (err) {
      console.error('Error saving onboarding:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save your progress. Please try again.');
      return;
    } finally {
      setTrialActivating(false);
      setSaving(false);
    }
  };

  // ============================================
  // Get step content WITHOUT returning from component
  // This allows us to have a single return with hearts + content
  // ============================================
  const getStepContent = (): React.ReactNode => {
    const isPaidStart = data.selectedPlan === 'standard' || data.selectedPlan === 'unlimited';
    const startButtonLabel = onboardingStatus === 'pending_checkout'
      ? 'Finish setup'
      : isPaidStart && !hasInheritedSubscription
        ? 'Continue to secure checkout'
        : undefined;
    const startLoadingLabel = onboardingStatus === 'pending_checkout'
      ? 'Checking your purchase...'
      : isPaidStart && !hasInheritedSubscription
        ? 'Opening secure checkout...'
        : 'Starting your access...';

    // ============================================
    // Shortened flow for invited users
    // Skips: Role, NativeLang, TargetLang, Personalization, InvitePartner
    // ============================================
    if (isInvitedUser) {
      if (activeRole === 'student') {
        // Invited student: Names→Hello→Love→Celebrate→Plan→Start
        switch (currentStep) {
          case 1:
            return (
              <CombinedNamesStep
                currentStep={1}
                totalSteps={totalSteps}
                role="student"
                initialUserName={data.userName}
                initialPartnerName={data.partnerName || inviterName}
                onNext={(userName, partnerName) => continueWithStep({ userName, partnerName })}
                accentColor={accentColor}
              />
            );
          case 2:
            return (
              <LearnHelloStep
                currentStep={2}
                totalSteps={totalSteps}
                partnerName={data.partnerName || inviterName || 'them'}
                onNext={goNext}
                onBack={goBack}
                accentColor={accentColor}
              />
            );
          case 3:
            return (
              <LearnLoveStep
                currentStep={3}
                totalSteps={totalSteps}
                partnerName={data.partnerName || inviterName || 'them'}
                onNext={goNext}
                onBack={goBack}
                accentColor={accentColor}
              />
            );
          case 4:
            return (
              <CelebrationStep
                currentStep={4}
                totalSteps={totalSteps}
                partnerName={data.partnerName || inviterName || 'them'}
                onNext={goNext}
                onBack={goBack}
                accentColor={accentColor}
              />
            );
          case 5:
            if (hasInheritedSubscription) {
              return (
                <StartStep
                  currentStep={5}
                  totalSteps={totalSteps}
                  userName={data.userName || 'Friend'}
                  partnerName={data.partnerName || inviterName || 'them'}
                  onComplete={handleComplete}
                  onBack={goBack}
                  accentColor={accentColor}
                />
              );
            }
            return (
              <PlanSelectionStep
              currentStep={5}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              onNext={(plan, priceId, billingPeriod) => {
                analytics.track(plan === 'free' ? 'onboarding_plan_selected_free' : 'onboarding_plan_selected_paid', {
                  flow_key: currentFlowKey,
                  step_key: currentStepKey,
                  role: activeRole,
                  plan_intent: plan === 'free' ? 'free' : 'paid',
                });
                return continueWithStep({
                  selectedPlan: plan,
                  selectedPriceId: priceId || undefined,
                  selectedBillingPeriod: billingPeriod,
                });
              }}
              onBack={goBack}
              accentColor={accentColor}
            />
            );
          case 6:
            return (
              <StartStep
                currentStep={6}
                totalSteps={totalSteps}
                userName={data.userName || 'Friend'}
                partnerName={data.partnerName || inviterName || 'them'}
                  onComplete={handleComplete}
                  onBack={goBack}
                  accentColor={accentColor}
                  loading={trialActivating}
                  error={saveError || trialError}
                  buttonLabel={startButtonLabel}
                  loadingLabel={startLoadingLabel}
                />
              );
          default:
            return null;
        }
      }

      // Invited tutor: Names→Style→Preview→Plan→Start
      switch (currentStep) {
        case 1:
          return (
            <CombinedNamesStep
              currentStep={1}
              totalSteps={totalSteps}
              role="tutor"
              initialUserName={data.userName}
              initialPartnerName={data.learnerName || inviterName}
              onNext={(userName, learnerName) => continueWithStep({ userName, learnerName })}
              accentColor={accentColor}
            />
          );
        case 2:
          return (
            <TeachingStyleStep
              currentStep={2}
              totalSteps={totalSteps}
              initialValue={data.teachingStyle}
              onNext={(style) => continueWithStep({ teachingStyle: style })}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 3:
          return (
            <TutorPreviewStep
              currentStep={3}
              totalSteps={totalSteps}
              learnerName={data.learnerName || inviterName || 'them'}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 4:
          if (hasInheritedSubscription) {
            return (
              <TutorStartStep
                currentStep={4}
                totalSteps={totalSteps}
                userName={data.userName || 'Friend'}
                learnerName={data.learnerName || inviterName || 'them'}
                onComplete={handleComplete}
                onBack={goBack}
                accentColor={accentColor}
              />
            );
          }
          return (
            <PlanSelectionStep
              currentStep={4}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              onNext={(plan, priceId, billingPeriod) => {
                analytics.track(plan === 'free' ? 'onboarding_plan_selected_free' : 'onboarding_plan_selected_paid', {
                  flow_key: currentFlowKey,
                  step_key: currentStepKey,
                  role: activeRole,
                  plan_intent: plan === 'free' ? 'free' : 'paid',
                });
                return continueWithStep({
                  selectedPlan: plan,
                  selectedPriceId: priceId || undefined,
                  selectedBillingPeriod: billingPeriod,
                });
              }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 5:
          return (
            <TutorStartStep
              currentStep={5}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              learnerName={data.learnerName || inviterName || 'them'}
                onComplete={handleComplete}
                onBack={goBack}
                accentColor={accentColor}
                loading={trialActivating}
                error={saveError || trialError}
                buttonLabel={startButtonLabel}
                loadingLabel={startLoadingLabel}
              />
            );
        default:
          return null;
      }
    }

    // ============================================
    // Normal flow (non-invited users)
    // ============================================
    // Step 1: Native language selection (shared)
    if (currentStep === 1) {
      return (
        <NativeLanguageStep
          currentStep={1}
          totalSteps={totalSteps}
          role={activeRole}
          initialNative={data.nativeLanguage || localStorage.getItem('preferredNativeLanguage') || undefined}
          onNext={(native) => continueWithStep({ nativeLanguage: native })}
          accentColor={accentColor}
        />
      );
    }

    // Step 2: Role selection (shared for both flows)
    if (currentStep === 2) {
      return (
        <RoleStep
          currentStep={2}
          totalSteps={totalSteps}
          initialValue={selectedRole || ''}
          onNext={(r) => {
            setSelectedRole(r);
            const nextFlowKey = resolveOnboardingFlowKey(r, isInvitedUser);
            return continueWithStep({ role: r }, nextFlowKey);
          }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    }

    // Step 3: Target language selection (shared, role-aware framing)
    if (currentStep === 3) {
      return (
        <LanguageStep
          currentStep={3}
          totalSteps={totalSteps}
          role={activeRole}
          initialNative={data.nativeLanguage}
          initialTarget={data.targetLanguage}
          onNext={(target, native) => continueWithStep({ targetLanguage: target, nativeLanguage: native })}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    }

    // Step 4: Combined names (shared, role-aware labels)
    if (currentStep === 4) {
      return (
        <CombinedNamesStep
          currentStep={4}
          totalSteps={totalSteps}
          role={activeRole}
          initialUserName={data.userName}
          initialPartnerName={activeRole === 'tutor' ? data.learnerName : data.partnerName}
          onNext={(userName, partnerName) => {
            return continueWithStep(
              activeRole === 'tutor'
                ? { userName, learnerName: partnerName }
                : { userName, partnerName }
            );
          }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    }

    // Steps 5+ diverge based on role
    if (activeRole === 'student') {
      switch (currentStep) {
        case 5:
          return (
            <LearnHelloStep
              currentStep={5}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 6:
          return (
            <LearnLoveStep
              currentStep={6}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 7:
          return (
            <CelebrationStep
              currentStep={7}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={goNext}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 8:
          return (
            <InvitePartnerStep
              currentStep={8}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              onNext={(intent) => continueWithStep({ invitePartnerIntent: intent || null })}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 9:
          return (
            <ThemeCustomizationStep
              currentStep={9}
              totalSteps={totalSteps}
              onNext={() => continueWithStep({
                themeAccentColor: theme.accentColor,
                themeDarkMode: theme.darkMode,
                themeFontSize: theme.fontSize,
                themeFontPreset: theme.fontPreset,
                themeFontWeight: theme.fontWeight,
                themeBackgroundStyle: theme.backgroundStyle,
              })}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 10:
          return (
            <PersonalizationStep
              currentStep={10}
              totalSteps={totalSteps}
              partnerName={data.partnerName || 'them'}
              initialVibe={data.relationshipVibe}
              initialTime={data.dailyTime}
              initialPrior={data.priorExperience}
              onNext={(vibe, time, prior) => continueWithStep({
                relationshipVibe: vibe,
                dailyTime: time,
                priorExperience: prior,
              })}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 11:
          // Skip PlanSelectionStep if user has inherited subscription
          if (hasInheritedSubscription) {
            return (
              <StartStep
                currentStep={11}
                totalSteps={totalSteps}
                userName={data.userName || 'Friend'}
                partnerName={data.partnerName || 'them'}
                onComplete={handleComplete}
                onBack={goBack}
                accentColor={accentColor}
              />
            );
          }
          return (
            <PlanSelectionStep
              currentStep={11}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              onNext={(plan, priceId, billingPeriod) => {
                analytics.track(plan === 'free' ? 'onboarding_plan_selected_free' : 'onboarding_plan_selected_paid', {
                  flow_key: currentFlowKey,
                  step_key: currentStepKey,
                  role: activeRole,
                  plan_intent: plan === 'free' ? 'free' : 'paid',
                });
                return continueWithStep({
                  selectedPlan: plan,
                  selectedPriceId: priceId || undefined,
                  selectedBillingPeriod: billingPeriod,
                });
              }}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        case 12:
          return (
            <StartStep
              currentStep={12}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              partnerName={data.partnerName || 'them'}
              onComplete={handleComplete}
              onBack={goBack}
              accentColor={accentColor}
              loading={trialActivating}
              error={saveError || trialError}
              buttonLabel={startButtonLabel}
              loadingLabel={startLoadingLabel}
            />
          );
        default:
          return null;
      }
    }

    // Tutor flow — steps 5+
    switch (currentStep) {
      case 5:
        return (
          <TeachingStyleStep
            currentStep={5}
            totalSteps={totalSteps}
            initialValue={data.teachingStyle}
            onNext={(style) => continueWithStep({ teachingStyle: style })}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 6:
        return (
          <TutorPreviewStep
            currentStep={6}
            totalSteps={totalSteps}
            learnerName={data.learnerName || 'them'}
            onNext={goNext}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 7:
        return (
          <InvitePartnerStep
            currentStep={7}
            totalSteps={totalSteps}
            partnerName={data.learnerName || 'them'}
            onNext={(intent) => continueWithStep({ invitePartnerIntent: intent || null })}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 8:
        return (
          <TutorPersonalizationStep
            currentStep={8}
            totalSteps={totalSteps}
            learnerName={data.learnerName || 'them'}
            initialRelation={data.relationshipType}
            initialConnection={data.languageConnection}
            initialOrigin={data.languageOrigin}
            onNext={(relation, connection, origin) => continueWithStep({
              relationshipType: relation,
              languageConnection: connection,
              languageOrigin: origin,
            })}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 9:
        // Skip PlanSelectionStep if user has inherited subscription
        if (hasInheritedSubscription) {
          return (
            <TutorStartStep
              currentStep={9}
              totalSteps={totalSteps}
              userName={data.userName || 'Friend'}
              learnerName={data.learnerName || 'them'}
              onComplete={handleComplete}
              onBack={goBack}
              accentColor={accentColor}
            />
          );
        }
        return (
          <PlanSelectionStep
            currentStep={9}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            onNext={(plan, priceId, billingPeriod) => {
              analytics.track(plan === 'free' ? 'onboarding_plan_selected_free' : 'onboarding_plan_selected_paid', {
                flow_key: currentFlowKey,
                step_key: currentStepKey,
                role: activeRole,
                plan_intent: plan === 'free' ? 'free' : 'paid',
              });
              return continueWithStep({
                selectedPlan: plan,
                selectedPriceId: priceId || undefined,
                selectedBillingPeriod: billingPeriod,
              });
            }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 10:
        return (
          <TutorStartStep
            currentStep={10}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            learnerName={data.learnerName || 'them'}
            onComplete={handleComplete}
            onBack={goBack}
            accentColor={accentColor}
            loading={trialActivating}
            error={saveError || trialError}
            buttonLabel={startButtonLabel}
            loadingLabel={startLoadingLabel}
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
      <div
        className="fixed inset-x-0 top-0 h-screen-safe overflow-hidden"
        style={{
          background: bgGradient,
          transition: 'background 0.4s ease',
        }}
      >
        {/* Gradient blobs, hearts & word particles — hidden in clean mode */}
        {!isCleanMode && (
          <>
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div
                className="absolute rounded-full"
                style={{
                  width: '60vw', height: '60vw',
                  top: '-15vw', right: '-15vw',
                  background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: '50vw', height: '50vw',
                  bottom: '-10vw', left: '-15vw',
                  background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: '40vw', height: '40vw',
                  bottom: '20vh', right: '10vw',
                  background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
                  filter: 'blur(60px)',
                }}
              />
            </div>
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
          </>
        )}
        {getStepContent()}
      </div>
    </OnboardingContext.Provider>
  );
};
