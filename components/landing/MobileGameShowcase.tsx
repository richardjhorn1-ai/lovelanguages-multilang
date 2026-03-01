import React, { useState, useEffect, useCallback } from 'react';
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

const CYCLE_MS = 3500;
const CROSSFADE_MS = 300;

interface MobileGameShowcaseProps {
  role: HeroRole;
  accentColor: string;
  demoLanguage: LanguageCode;
  onDemoLanguageChange: (lang: LanguageCode) => void;
}

const MobileGameShowcase: React.FC<MobileGameShowcaseProps> = ({ role, accentColor, demoLanguage, onDemoLanguageChange }) => {
  const { t } = useTranslation();
  const features = role === 'student' ? STUDENT_FEATURES : TUTOR_FEATURES;
  const langContent = getDemoContent(demoLanguage);

  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-cycle collapsed label
  useEffect(() => {
    if (expanded) return;
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % features.length);
        setIsTransitioning(false);
      }, CROSSFADE_MS);
    }, CYCLE_MS);
    return () => clearTimeout(timer);
  }, [currentIndex, expanded, features.length]);

  // Reset on role change
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(false);
    setExpanded(false);
  }, [role]);

  const handleTabClick = useCallback((i: number) => {
    if (isTransitioning || i === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(i);
      setIsTransitioning(false);
    }, CROSSFADE_MS);
  }, [isTransitioning, currentIndex]);

  const { key, icon: Icon, Demo, contentKey } = features[currentIndex];
  const name = t(`hero.bottomSections.rall.offer.${role}.${key}.feature`);

  return (
    <div>
      {/* Collapsed header — always visible, tap to toggle */}
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Icon
              className="w-4 h-4"
              style={{
                color: accentColor,
                opacity: isTransitioning ? 0 : 1,
                transition: `opacity ${CROSSFADE_MS}ms ease`,
              }}
            />
          </div>
          <div
            className="flex-1 text-left min-w-0"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transition: `opacity ${CROSSFADE_MS}ms ease`,
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: accentColor }}>
              {name}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">
              {expanded ? 'Tap to collapse' : 'See it in action'}
            </p>
          </div>
          <span
            className="text-xs text-[var(--text-secondary)] flex-shrink-0"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.3s ease',
            }}
          >
            ▾
          </span>
        </button>
        {/* Language selector — inline with header */}
        <div className="flex-shrink-0">
          <DemoLanguageSelector value={demoLanguage} onChange={onDemoLanguageChange} accentColor={accentColor} />
        </div>
      </div>

      {/* Expanded demo area */}
      <div
        style={{
          maxHeight: expanded ? '60vh' : '0',
          overflow: 'hidden',
          transition: expanded ? 'max-height 0.4s ease-out' : 'max-height 0.4s ease-in',
        }}
      >

        {/* Phone frame with demo */}
        <div className="px-3 pb-2">
          <div
            className="rounded-3xl overflow-hidden mx-auto"
            style={{
              maxWidth: '320px',
              height: '280px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 8px 32px -8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              key={`${demoLanguage}-${key}`}
              className="h-full"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transition: `opacity ${CROSSFADE_MS}ms ease`,
              }}
            >
              <Demo accentColor={accentColor} content={langContent[contentKey]} meta={langContent.meta} />
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="flex items-center justify-center gap-2 px-3 py-3">
          {features.map((f, i) => {
            const FIcon = f.icon;
            const isActive = i === currentIndex;
            return (
              <button
                key={f.key}
                onClick={() => handleTabClick(i)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? `${accentColor}15` : 'transparent',
                  border: `1.5px solid ${isActive ? `${accentColor}40` : 'transparent'}`,
                }}
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
    </div>
  );
};

export default MobileGameShowcase;
