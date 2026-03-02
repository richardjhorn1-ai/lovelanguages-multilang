import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import InPlaceFlipCard from './FlipExpandCard';

/**
 * FeatureCard — Single card that cycles through all 6 features.
 *
 * Front: icon + name + tagline, auto-cycling with dot indicators.
 * Click → in-place flip revealing pain text + full description.
 */

type HeroRole = 'student' | 'tutor';

interface FeatureConfig {
  key: string;
  icon: React.FC<any>;
}

const STUDENT_FEATURES: FeatureConfig[] = [
  { key: 'feature1', icon: ICONS.Mic },
  { key: 'feature2', icon: ICONS.Heart },
  { key: 'feature3', icon: ICONS.Gamepad2 },
  { key: 'feature4', icon: ICONS.MessageCircle },
  { key: 'feature5', icon: ICONS.Target },
  { key: 'feature6', icon: ICONS.Volume2 },
];

const TUTOR_FEATURES: FeatureConfig[] = [
  { key: 'feature1', icon: ICONS.Lightbulb },
  { key: 'feature2', icon: ICONS.Gift },
  { key: 'feature3', icon: ICONS.TrendingUp },
  { key: 'feature4', icon: ICONS.Target },
  { key: 'feature5', icon: ICONS.Sparkles },
  { key: 'feature6', icon: ICONS.Users },
];

const CYCLE_MS = 3500;
const CROSSFADE_MS = 350;

// ─── Dot Indicators ─────────────────────────────────────────

const DotIndicators: React.FC<{
  count: number;
  active: number;
  accentColor: string;
  onDotClick: (i: number) => void;
}> = ({ count, active, accentColor, onDotClick }) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: count }, (_, i) => (
      <button
        key={i}
        onClick={(e) => { e.stopPropagation(); onDotClick(i); }}
        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
        style={{
          backgroundColor: i === active ? accentColor : 'rgba(0,0,0,0.12)',
          transform: i === active ? 'scale(1.3)' : 'scale(1)',
          opacity: i === active ? 1 : 0.5,
        }}
        aria-label={`Feature ${i + 1}`}
      />
    ))}
  </div>
);

// ─── FeatureCard ────────────────────────────────────────────

interface FeatureCardProps {
  role: HeroRole;
  accentColor: string;
  accentShadow: string;
  isDesktop: boolean;
  staticOpen?: boolean; // When true, show rich content directly (no flip)
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  role,
  accentColor,
  isDesktop,
  staticOpen = false,
}) => {
  const { t } = useTranslation();
  const features = role === 'student' ? STUDENT_FEATURES : TUTOR_FEATURES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver — don't cycle until visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset on role change
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(false);
    setIsFlipped(false);
  }, [role]);

  // Auto-cycle (paused when flipped)
  useEffect(() => {
    if (!isVisible || isFlipped) return;
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % features.length);
        setIsTransitioning(false);
      }, CROSSFADE_MS);
    }, CYCLE_MS);
    return () => clearTimeout(timer);
  }, [currentIndex, isVisible, isFlipped, features.length]);

  const handleDotClick = useCallback((i: number) => {
    if (isTransitioning || i === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(i);
      setIsTransitioning(false);
    }, CROSSFADE_MS);
  }, [isTransitioning, currentIndex]);

  const handleFlipChange = useCallback((flipped: boolean) => {
    setIsFlipped(flipped);
  }, []);

  const { key, icon: Icon } = features[currentIndex];
  const name = t(`hero.bottomSections.rall.offer.${role}.${key}.feature`);
  const pain = t(`hero.bottomSections.rall.offer.${role}.${key}.pain`);
  const desc = t(`hero.bottomSections.rall.offer.${role}.${key}.desc`);

  const frontContent = (
    <div className={`flex flex-col items-center justify-center text-center ${isDesktop ? 'py-6 px-4' : 'py-6 px-4'}`}>
      <div
        className="flex flex-col items-center gap-2"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(4px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        <div
          className={`${isDesktop ? 'w-10 h-10' : 'w-10 h-10'} rounded-2xl flex items-center justify-center`}
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className={`${isDesktop ? 'w-5 h-5' : 'w-5 h-5'}`} style={{ color: accentColor }} />
        </div>
        <span
          className={`${isDesktop ? 'text-sm' : 'text-xs'} font-bold uppercase tracking-[0.1em]`}
          style={{ color: accentColor }}
        >
          {name}
        </span>
        <p className={`${isDesktop ? 'text-xs' : 'text-[11px]'} text-[var(--text-secondary)] leading-snug max-w-[280px]`}>
          {pain}
        </p>
      </div>
      <div className="mt-2">
        <DotIndicators count={features.length} active={currentIndex} accentColor={accentColor} onDotClick={handleDotClick} />
      </div>
    </div>
  );

  const backContent = (
    <div className={`${isDesktop ? 'p-6' : 'p-5'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <span className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: accentColor }}>
          {name}
        </span>
      </div>
      <div className="h-[2px] w-8 rounded-full mb-3" style={{ backgroundColor: accentColor, opacity: 0.25 }} />
      <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed mb-3">
        {desc}
      </p>
      <DotIndicators count={features.length} active={currentIndex} accentColor={accentColor} onDotClick={handleDotClick} />
    </div>
  );

  return (
    <div ref={containerRef}>
      {staticOpen ? (
        /* Static open mode — show rich content directly, no flip */
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(4px)' : 'translateY(0)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: accentColor }}>
                {name}
              </span>
            </div>
            <p className="text-xs font-semibold italic text-[var(--text-primary)] leading-snug mb-1.5">
              &ldquo;{pain}&rdquo;
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-2">
              {desc}
            </p>
            <DotIndicators count={features.length} active={currentIndex} accentColor={accentColor} onDotClick={handleDotClick} />
          </div>
        </div>
      ) : (
        <InPlaceFlipCard
          front={frontContent}
          back={backContent}
          accentColor={accentColor}
          isFlipped={isFlipped}
          onFlipChange={handleFlipChange}
        />
      )}
    </div>
  );
};

export { FeatureCard, STUDENT_FEATURES, TUTOR_FEATURES };
