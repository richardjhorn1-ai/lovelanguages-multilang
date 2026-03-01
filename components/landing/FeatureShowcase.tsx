import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import type { LanguageCode } from '../../constants/language-config';
import { getDemoContent } from './showcase/demoContent';
import type { LanguageDemoContent } from './showcase/demoContent';
import DemoLanguageSelector from './showcase/DemoLanguageSelector';

// Student demos
import DemoSmartGames from './showcase/DemoSmartGames';
import DemoConversation from './showcase/DemoConversation';
import DemoWeakestWords from './showcase/DemoWeakestWords';
import DemoListenMode from './showcase/DemoListenMode';
import DemoLoveLog from './showcase/DemoLoveLog';
import DemoVoiceChat from './showcase/DemoVoiceChat';

// Tutor demos
import DemoAgenticCoach from './showcase/DemoAgenticCoach';
import DemoWordGifts from './showcase/DemoWordGifts';
import DemoProgressTracking from './showcase/DemoProgressTracking';
import DemoPartnerChallenges from './showcase/DemoPartnerChallenges';
import DemoAITeaching from './showcase/DemoAITeaching';
import DemoActivityFeed from './showcase/DemoActivityFeed';

type HeroRole = 'student' | 'tutor';
type DemoContentKey = keyof Omit<LanguageDemoContent, 'meta'>;

interface FeatureConfig {
  key: string;
  icon: React.FC<any>;
  Demo: React.FC<any>;
  contentKey: DemoContentKey;
}

const STUDENT_FEATURES: FeatureConfig[] = [
  { key: 'feature3', icon: ICONS.Gamepad2, Demo: DemoSmartGames, contentKey: 'smartGames' },
  { key: 'feature4', icon: ICONS.MessageCircle, Demo: DemoConversation, contentKey: 'conversation' },
  { key: 'feature5', icon: ICONS.Target, Demo: DemoWeakestWords, contentKey: 'weakestWords' },
  { key: 'feature1', icon: ICONS.Mic, Demo: DemoListenMode, contentKey: 'listenMode' },
  { key: 'feature2', icon: ICONS.Heart, Demo: DemoLoveLog, contentKey: 'loveLog' },
  { key: 'feature6', icon: ICONS.Volume2, Demo: DemoVoiceChat, contentKey: 'voiceChat' },
];

const TUTOR_FEATURES: FeatureConfig[] = [
  { key: 'feature1', icon: ICONS.Lightbulb, Demo: DemoAgenticCoach, contentKey: 'agenticCoach' },
  { key: 'feature2', icon: ICONS.Gift, Demo: DemoWordGifts, contentKey: 'wordGifts' },
  { key: 'feature3', icon: ICONS.TrendingUp, Demo: DemoProgressTracking, contentKey: 'progressTracking' },
  { key: 'feature4', icon: ICONS.Target, Demo: DemoPartnerChallenges, contentKey: 'partnerChallenges' },
  { key: 'feature5', icon: ICONS.Sparkles, Demo: DemoAITeaching, contentKey: 'aiTeaching' },
  { key: 'feature6', icon: ICONS.Users, Demo: DemoActivityFeed, contentKey: 'activityFeed' },
];

const CYCLE_MS = 13000;
const CROSSFADE_MS = 300;

interface FeatureShowcaseProps {
  role: HeroRole;
  accentColor: string;
  demoLanguage: LanguageCode;
  onDemoLanguageChange: (lang: LanguageCode) => void;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ role, accentColor, demoLanguage, onDemoLanguageChange }) => {
  const { t } = useTranslation();
  const features = role === 'student' ? STUDENT_FEATURES : TUTOR_FEATURES;
  const langContent = getDemoContent(demoLanguage);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver
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
  }, [role]);

  // Auto-cycle
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % features.length);
        setIsTransitioning(false);
      }, CROSSFADE_MS);
    }, CYCLE_MS);
    return () => clearTimeout(timer);
  }, [currentIndex, isVisible, features.length]);

  const handleSelect = useCallback((i: number) => {
    if (isTransitioning || i === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(i);
      setIsTransitioning(false);
    }, CROSSFADE_MS);
  }, [isTransitioning, currentIndex]);

  const { key, icon: Icon, Demo, contentKey } = features[currentIndex];
  const name = t(`hero.bottomSections.rall.offer.${role}.${key}.feature`);
  const pain = t(`hero.bottomSections.rall.offer.${role}.${key}.pain`);

  return (
    <div ref={containerRef} className="flex flex-col h-full p-4">
      {/* Header: current feature info + counter + language selector inline */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${accentColor}15`,
            opacity: isTransitioning ? 0 : 1,
            transition: `opacity ${CROSSFADE_MS}ms ease`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div
          className="min-w-0 flex-1"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(2px)' : 'translateY(0)',
            transition: `opacity ${CROSSFADE_MS}ms ease, transform ${CROSSFADE_MS}ms ease`,
          }}
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-[0.06em] leading-none font-header" style={{ color: accentColor }}>
              {name}
            </p>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50">
              {currentIndex + 1}/{features.length}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2">
            {pain}
          </p>
        </div>
        {/* Language selector — inline with title */}
        <div className="flex-shrink-0">
          <DemoLanguageSelector value={demoLanguage} onChange={onDemoLanguageChange} accentColor={accentColor} />
        </div>
      </div>

      {/* Demo area — takes remaining space */}
      <div
        className="flex-1 min-w-0 relative overflow-hidden rounded-xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}
      >
        <div
          key={`${demoLanguage}-${key}`}
          className="h-full"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(4px)' : 'translateY(0)',
            transition: `opacity ${CROSSFADE_MS}ms ease, transform ${CROSSFADE_MS}ms ease`,
          }}
        >
          <Demo accentColor={accentColor} content={langContent[contentKey]} meta={langContent.meta} />
        </div>
      </div>

      {/* Bottom: icon tab navigation */}
      <div className="flex items-center justify-center gap-2 mt-2.5 flex-shrink-0">
        {features.map((f, i) => {
          const FIcon = f.icon;
          const isActive = i === currentIndex;
          return (
            <button
              key={f.key}
              onClick={() => handleSelect(i)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                backgroundColor: isActive ? `${accentColor}15` : 'transparent',
                border: `1.5px solid ${isActive ? `${accentColor}40` : 'transparent'}`,
              }}
              title={t(`hero.bottomSections.rall.offer.${role}.${f.key}.feature`)}
            >
              <FIcon
                className="w-4 h-4"
                style={{ color: isActive ? accentColor : 'var(--text-secondary)', opacity: isActive ? 1 : 0.5 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureShowcase;
