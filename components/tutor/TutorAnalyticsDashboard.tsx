import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Profile, TutorAnalytics, TutorStats, WordScore, DictionaryEntry } from '../../types';
import { getTutorTierFromXP, getTutorTierProgress, getXPToNextTutorTier, TUTOR_TIERS } from '../../constants/levels';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ICONS } from '../../constants';

// Sub-components
import TeachingImpactCard from './TeachingImpactCard';
import WeakSpotIntelligence from './WeakSpotIntelligence';
import TrendCharts from './TrendCharts';
import ActivityFeed from '../engagement/ActivityFeed';
import LoveNoteComposer from '../engagement/LoveNoteComposer';

interface TutorAnalyticsDashboardProps {
  profile: Profile;
}

const TutorAnalyticsDashboard: React.FC<TutorAnalyticsDashboardProps> = ({ profile }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accentHex } = useTheme();
  const { targetLanguage } = useLanguage();

  const [analytics, setAnalytics] = useState<TutorAnalytics | null>(null);
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'teaching' | 'partner'>('teaching');
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [showLoveNote, setShowLoveNote] = useState(false);

  // Cache analytics by period+language for instant switching
  const analyticsCache = useRef<Record<string, { data: TutorAnalytics; timestamp: number }>>({});

  // Track current request to prevent stale responses from overwriting newer data
  const currentRequestRef = useRef(0);

  // Calculate tier info
  const tutorXp = profile.tutor_xp || 0;
  const tier = getTutorTierFromXP(tutorXp);
  const tierProgress = getTutorTierProgress(tutorXp);
  const xpToNext = getXPToNextTutorTier(tutorXp);
  const tierColor = accentHex;

  useEffect(() => {
    fetchAnalytics();
    fetchPartnerProfile();
    // Clear cache when language changes to avoid showing wrong language data
    if (targetLanguage) {
      // Invalidate cache entries for other languages
      const currentLangPrefix = `${period}-${targetLanguage}`;
      Object.keys(analyticsCache.current).forEach(key => {
        if (!key.endsWith(`-${targetLanguage}`)) {
          delete analyticsCache.current[key];
        }
      });
    }
  }, [profile.id, targetLanguage, period]);

  // Note: Removed redundant language-switched event listener
  // The main useEffect already has targetLanguage as a dependency

  const fetchAnalytics = async () => {
    // Track this request to prevent stale responses from overwriting newer data
    const thisRequest = ++currentRequestRef.current;

    // Include targetLanguage in cache key to avoid showing wrong language data
    const cacheKey = `${period}-${targetLanguage}`;
    const cached = analyticsCache.current[cacheKey];
    const CACHE_TTL = 60 * 1000; // 1 minute cache validity

    // Show cached data immediately if available (instant switching)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setAnalytics(cached.data);
      // Still refresh in background if cache is older than 10 seconds
      if (Date.now() - cached.timestamp > 10 * 1000) {
        setRefreshing(true);
      } else {
        setInitialLoading(false);
        return; // Fresh cache, no need to fetch
      }
    } else if (cached) {
      // Stale cache - show it but fetch fresh data
      setAnalytics(cached.data);
      setRefreshing(true);
    } else if (!analytics) {
      // No cache, first load
      setInitialLoading(true);
    } else {
      // No cache for this period, show spinner
      setRefreshing(true);
    }

    try {
      const response = await fetch(`/api/tutor-analytics/?period=${period}`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      // Check if this is still the current request before updating state
      if (thisRequest !== currentRequestRef.current) {
        return; // Stale request, ignore response
      }

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        // Store in cache
        analyticsCache.current[cacheKey] = {
          data: data.analytics,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }

    // Check again before updating loading states
    if (thisRequest !== currentRequestRef.current) {
      return; // Stale request
    }

    // Also fetch tutor stats (only on initial load, not cached per period)
    if (!stats) {
      try {
        const response = await fetch('/api/tutor-stats/', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.tutor.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }

    setInitialLoading(false);
    setRefreshing(false);
  };

  const fetchPartnerProfile = async () => {
    if (!profile.linked_user_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.linked_user_id)
        .single();

      if (error) {
        console.error('Failed to fetch partner profile:', error);
        return;
      }

      if (data) {
        setPartnerProfile(data);
      }
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <ICONS.RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

        {/* Tutor Tier Card */}
        <div
          className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 opacity-10">
            <ICONS.Star className="w-20 h-20 md:w-28 md:h-28" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/60 text-scale-micro font-black uppercase tracking-widest mb-1">
                {t('tutor.tier.yourLevel', 'Your Teaching Level')}
              </p>
              <h2 className="text-scale-heading font-black font-header">{tier.name}</h2>
              <p className="text-white/70 text-scale-caption mt-1">
                Tier {tier.tier} of {TUTOR_TIERS.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-scale-heading font-black">{tutorXp}</p>
              <p className="text-white/60 text-scale-micro font-black uppercase tracking-widest">
                {t('tutor.tier.teachingXp', 'Teaching XP')}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {xpToNext && (
            <div className="mt-4 relative z-10">
              <div className="flex justify-between text-scale-micro font-bold text-white/60 mb-1">
                <span>
                  {t('tutor.tier.progressTo', 'Progress to')} {TUTOR_TIERS[tier.tier]?.name || 'Max'}
                </span>
                <span>{tierProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--bg-card)] rounded-full transition-all duration-1000"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              <p className="text-scale-micro text-white/50 mt-1">
                {xpToNext} XP to next tier
              </p>
            </div>
          )}

          {/* Teaching Streak */}
          {stats && stats.teachingStreak > 0 && (
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                <ICONS.Zap className="w-5 h-5 text-white" />
                <span className="font-bold text-scale-label">
                  {stats.teachingStreak} day streak
                </span>
              </div>
              {stats.longestStreak > stats.teachingStreak && (
                <span className="text-scale-micro text-white/50">
                  Best: {stats.longestStreak}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 glass-card p-1 rounded-xl" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'teaching'}
            onClick={() => setActiveTab('teaching')}
            className={`flex-1 py-2 px-4 rounded-lg text-scale-label font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${
              activeTab === 'teaching'
                ? 'bg-[var(--accent-color)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            <ICONS.BarChart className="w-4 h-4 inline-block mr-2" />
            {t('tutor.tabs.teaching', 'My Teaching')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'partner'}
            onClick={() => setActiveTab('partner')}
            className={`flex-1 py-2 px-4 rounded-lg text-scale-label font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${
              activeTab === 'partner'
                ? 'bg-[var(--accent-color)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            <ICONS.User className="w-4 h-4 inline-block mr-2" />
            {t('tutor.tabs.partner', "Partner's Progress")}
          </button>
        </div>

        {activeTab === 'teaching' ? (
          <>
            {/* Teaching Impact Card */}
            {analytics && (
              <TeachingImpactCard
                xpContributed={analytics.xp_contributed}
                wordsMastered={analytics.words_mastered}
                challengeSuccessRate={analytics.challenge_success_rate}
                partnerName={partnerProfile?.full_name || t('common.partner', 'Partner')}
                tierColor={tierColor}
              />
            )}

            {/* Period Selector */}
            <div className="flex gap-2 justify-center items-center">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  disabled={refreshing}
                  className={`px-4 py-1.5 rounded-full text-scale-caption font-bold transition-all ${
                    period === p
                      ? 'text-white'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={period === p ? { backgroundColor: tierColor } : {}}
                >
                  {p === 'week' ? t('tutor.period.week', 'Week') :
                   p === 'month' ? t('tutor.period.month', 'Month') :
                   t('tutor.period.allTime', 'All Time')}
                </button>
              ))}
              {refreshing && (
                <ICONS.RefreshCw className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
              )}
            </div>

            {/* Trend Charts */}
            {analytics && (
              <TrendCharts
                xpTrend={analytics.xp_trend}
                wordsTrend={analytics.words_trend}
                accuracyTrend={analytics.accuracy_trend}
                tierColor={tierColor}
              />
            )}

            {/* Weak Spot Intelligence */}
            {analytics && analytics.stuck_words?.length > 0 && (
              <WeakSpotIntelligence
                stuckWords={analytics.stuck_words}
                improvingWords={analytics.improving_words}
                onCreateChallenge={() => navigate('/play')}
                tierColor={tierColor}
              />
            )}

            {/* Recommendations */}
            {analytics && analytics.recommendations?.length > 0 && (
              <div className="glass-card p-4 md:p-6 rounded-xl md:rounded-2xl">
                <h3 className="text-scale-micro font-black font-header uppercase text-[var(--text-secondary)] tracking-widest mb-3 flex items-center gap-2">
                  <ICONS.Lightbulb className="w-4 h-4" style={{ color: tierColor }} />
                  {t('tutor.recommendations.title', 'Suggestions')}
                </h3>
                <div className="space-y-2">
                  {analytics.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border flex items-center justify-between gap-3"
                      style={{ backgroundColor: `${tierColor}08`, borderColor: `${tierColor}20` }}
                    >
                      <p className="text-scale-label text-[var(--text-primary)]">{rec.message}</p>
                      {rec.action_type && (
                        <button
                          onClick={() => {
                            if (rec.action_type === 'challenge') navigate('/play');
                            else if (rec.action_type === 'love_note') setShowLoveNote(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-scale-micro font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: tierColor }}
                        >
                          {rec.action_type === 'challenge'
                            ? t('tutor.recommendations.createChallenge', 'Create')
                            : t('tutor.recommendations.sendNote', 'Send Note')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {stats.challengesCreated}
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.stats.challenges', 'Challenges')}
                  </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {stats.giftsSent}
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.stats.gifts', 'Gifts Sent')}
                  </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {stats.perfectScores}
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.stats.perfects', 'Perfect Scores')}
                  </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {stats.wordsMastered}
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.stats.mastered', 'Mastered')}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Partner's Progress Tab */
          <>
            {/* Partner XP & Level Card */}
            {partnerProfile && (
              <div
                className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)`,
                }}
              >
                <div className="absolute top-0 right-0 opacity-10">
                  <ICONS.TrendingUp className="w-20 h-20 md:w-28 md:h-28" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-white/60 text-scale-micro font-black uppercase tracking-widest mb-1">
                      {partnerProfile.full_name || t('common.partner', 'Partner')}
                    </p>
                    <h2 className="text-scale-heading font-black font-header">
                      {t('tutor.partner.learningProgress', 'Learning Progress')}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-scale-heading font-black">{partnerProfile.xp || 0}</p>
                    <p className="text-white/60 text-scale-micro font-black uppercase tracking-widest">
                      {t('common.totalXp', 'Total XP')}
                    </p>
                  </div>
                </div>

                {partnerProfile.last_practice_at && (
                  <div className="mt-4 flex items-center gap-2 relative z-10">
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                      <ICONS.Clock className="w-4 h-4" />
                      <span className="font-bold text-scale-label">
                        {t('tutor.partner.lastPractice', 'Last practice')}: {new Date(partnerProfile.last_practice_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Partner Stats Grid */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {analytics.words_per_week || 0}
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.partner.wordsThisWeek', 'Words This Week')}
                  </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {analytics.words_mastered || 0}
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.partner.wordsMastered', 'Words Mastered')}
                  </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {analytics.practice_consistency || 0}/7
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.partner.activeDays', 'Active Days')}
                  </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl text-center">
                  <div className="text-scale-heading font-black" style={{ color: tierColor }}>
                    {analytics.challenge_success_rate || 0}%
                  </div>
                  <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
                    {t('tutor.partner.avgScore', 'Avg Score')}
                  </div>
                </div>
              </div>
            )}

            {/* Period Selector for Partner Tab */}
            <div className="flex gap-2 justify-center items-center">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  disabled={refreshing}
                  className={`px-4 py-1.5 rounded-full text-scale-caption font-bold transition-all ${
                    period === p
                      ? 'text-white'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={period === p ? { backgroundColor: tierColor } : {}}
                >
                  {p === 'week' ? t('tutor.period.week', 'Week') :
                   p === 'month' ? t('tutor.period.month', 'Month') :
                   t('tutor.period.allTime', 'All Time')}
                </button>
              ))}
              {refreshing && (
                <ICONS.RefreshCw className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
              )}
            </div>

            {/* Partner Trend Charts - only show if there's some data */}
            {analytics && !(analytics.xp_trend?.every(d => d.value === 0) && analytics.words_trend?.every(d => d.value === 0)) && (
              <TrendCharts
                xpTrend={analytics.xp_trend}
                wordsTrend={analytics.words_trend}
                accuracyTrend={analytics.accuracy_trend}
                tierColor={tierColor}
              />
            )}

            {/* Empty State for New Partnerships - show only when no activity data */}
            {analytics && analytics.xp_trend?.every(d => d.value === 0) && analytics.words_trend?.every(d => d.value === 0) && (
              <div className="glass-card p-6 rounded-xl text-center">
                <span className="mb-3 block"><ICONS.Book className="w-10 h-10 text-[var(--text-secondary)] mx-auto" /></span>
                <p className="text-scale-label font-bold text-[var(--text-primary)] mb-1">
                  {t('tutor.partner.noActivityYet', "Your partner hasn't started practicing yet!")}
                </p>
                <p className="text-scale-caption text-[var(--text-secondary)]">
                  {t('tutor.partner.sendChallenge', 'Send them a challenge or word gift to get started.')}
                </p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="glass-card p-4 md:p-6 rounded-xl md:rounded-2xl">
              <h3 className="text-scale-micro font-black font-header uppercase text-[var(--text-secondary)] tracking-widest mb-3 flex items-center gap-2">
                <ICONS.Clock className="w-4 h-4" style={{ color: tierColor }} />
                {t('tutor.partner.recentActivity', 'Recent Activity')}
              </h3>
              <ActivityFeed partnerId={profile.linked_user_id || undefined} />
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <button
            onClick={() => navigate('/play')}
            className="glass-card p-3 md:p-5 rounded-xl md:rounded-[1.5rem] text-center hover:shadow-md transition-all"
          >
            <ICONS.Target className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-1.5" style={{ color: tierColor }} />
            <p className="text-scale-label font-bold text-[var(--text-primary)]">
              {t('tutor.actions.createChallenge', 'Challenge')}
            </p>
          </button>
          <button
            onClick={() => navigate('/play')}
            className="glass-card p-3 md:p-5 rounded-xl md:rounded-[1.5rem] text-center hover:shadow-md transition-all"
          >
            <ICONS.Gift className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-1.5" style={{ color: tierColor }} />
            <p className="text-scale-label font-bold text-[var(--text-primary)]">
              {t('tutor.actions.sendGift', 'Word Gift')}
            </p>
          </button>
          <button
            onClick={() => setShowLoveNote(true)}
            className="glass-card p-3 md:p-5 rounded-xl md:rounded-[1.5rem] text-center hover:shadow-md transition-all group"
          >
            <ICONS.Heart className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-1.5 group-hover:text-red-500 transition-colors" style={{ color: tierColor }} />
            <p className="text-scale-label font-bold text-[var(--text-primary)]">
              {t('tutor.actions.loveNote', 'Love Note')}
            </p>
          </button>
        </div>
      </div>

      {/* Love Note Modal */}
      {showLoveNote && profile.linked_user_id && (
        <LoveNoteComposer
          partnerName={partnerProfile?.full_name || 'Partner'}
          onClose={() => setShowLoveNote(false)}
        />
      )}
    </div>
  );
};

export default TutorAnalyticsDashboard;
