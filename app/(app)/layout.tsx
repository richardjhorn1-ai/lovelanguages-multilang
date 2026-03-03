'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../../services/supabase';
import { Profile, ExtractedWord } from '../../types';
import { Providers } from '../providers';
import { ProfileProvider } from '../../context/ProfileContext';
import { trackPageView, analytics, captureReferralSource, getReferralData, initWebVitals } from '../../services/analytics';
import { offline } from '../../services/offline';
import { migrateFromLocalStorage } from '../../services/offline-db';
import { sounds } from '../../services/sounds';
import { configurePurchases, identifyUser, getCustomerInfo, hasActiveEntitlement, isIAPAvailable, logOutPurchases } from '../../services/purchases';
import ErrorBoundary from '../../components/ErrorBoundary';
import Landing from '../../components/Landing';
import { Onboarding } from '../../components/onboarding/Onboarding';
import SubscriptionRequired from '../../components/SubscriptionRequired';
import Navbar from '../../components/Navbar';
import ChatArea from '../../components/ChatArea';
import LoveLog from '../../components/LoveLog';
import FlashcardGame from '../../components/FlashcardGame';
import Progress from '../../components/Progress';
import NewWordsNotification from '../../components/NewWordsNotification';
import PromoExpiredBanner from '../../components/PromoExpiredBanner';
import CookieConsent from '../../components/CookieConsent';
import TrialReminderNotification from '../../components/TrialReminderNotification';

// Beta testers who get free access (add emails here)
const BETA_TESTERS: string[] = [
  // 'friend@example.com',
];

const isBetaTester = (email: string): boolean =>
  BETA_TESTERS.some(e => e.toLowerCase() === email.toLowerCase());

// Success toast component
const SuccessToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
      <div className="bg-white rounded-2xl shadow-lg border border-rose-100 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-xl">{'\uD83D\uDC95'}</span>
        </div>
        <div>
          <p className="font-bold text-gray-800">{message}</p>
          <p className="text-sm text-gray-500">Let&apos;s start learning together!</p>
        </div>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Normalize pathname for matching (trailingSlash: true means /log/ but / for root)
  const normPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const persistentPaths = ['/', '/log', '/play', '/progress'];
  const isPersistentPath = persistentPaths.includes(normPath);

  // ─── State ───────────────────────────────────────────────────────
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [successToast, setSuccessToastMsg] = useState<string | null>(null);
  const [newWordsNotification, setNewWordsNotification] = useState<ExtractedWord[]>([]);
  const [isExtractingWords, setIsExtractingWords] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signupTrackingRef = useRef(false);
  const trialConvertedRef = useRef(false);

  // ─── One-time init ───────────────────────────────────────────────
  useEffect(() => {
    captureReferralSource();
    initWebVitals();
    migrateFromLocalStorage();
  }, []);

  // Redirect legacy /#/ hash URLs to clean paths
  useEffect(() => {
    const { hash } = window.location;
    if (hash.startsWith('#/')) {
      const cleanPath = hash.slice(1); // '#/play' -> '/play'
      window.location.replace(cleanPath);
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // ─── Auth ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to get session:', error);
        setDbError('Failed to connect to authentication service. Please refresh the page.');
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
        if (isIAPAvailable()) logOutPurchases();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for subscription success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      setSuccessToastMsg("You're all set!");
      sessionStorage.setItem('subscription_just_completed', 'true');
      analytics.track('subscription_completed', {
        plan: 'unknown',
        billing_period: 'unknown',
        price: 0,
        currency: 'EUR',
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      url.searchParams.delete('onboarding');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  // Track trial conversion once profile is loaded (after Stripe redirect)
  useEffect(() => {
    if (profile?.free_tier_chosen_at && !trialConvertedRef.current) {
      const wasSubscriptionSuccess = sessionStorage.getItem('subscription_just_completed');
      if (wasSubscriptionSuccess) {
        trialConvertedRef.current = true;
        sessionStorage.removeItem('subscription_just_completed');
        analytics.track('trial_converted', {
          trial_duration_ms: profile.trial_expires_at
            ? new Date(profile.trial_expires_at).getTime() - new Date(profile.free_tier_chosen_at).getTime()
            : undefined,
        });
      }
    }
  }, [profile]);

  // Listen for word extraction events from ChatArea (visible on all tabs)
  useEffect(() => {
    const handleExtracted = (e: Event) => {
      const { words } = (e as CustomEvent).detail;
      if (words?.length > 0) {
        setIsExtractingWords(false);
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        setNewWordsNotification(words);
        sounds.play('new-words');
        notificationTimerRef.current = setTimeout(() => setNewWordsNotification([]), 6000);
      }
    };
    const handleExtracting = (e: Event) => {
      const { active } = (e as CustomEvent).detail;
      setIsExtractingWords(active);
    };
    window.addEventListener('new-words-extracted', handleExtracted);
    window.addEventListener('words-extracting', handleExtracting);
    return () => {
      window.removeEventListener('new-words-extracted', handleExtracted);
      window.removeEventListener('words-extracting', handleExtracting);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  // ─── fetchProfile ────────────────────────────────────────────────
  const fetchProfile = async (userId: string) => {
    try {
      setDbError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile yet — create one
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const userMeta = userData.user.user_metadata || {};
            const storedTarget = userMeta.target_language
              || localStorage.getItem('preferredTargetLanguage')
              || 'pl';
            const storedNative = userMeta.native_language
              || localStorage.getItem('preferredNativeLanguage')
              || localStorage.getItem('preferredLanguage')
              || 'en';

            const intendedRole = userMeta.intended_role
              || localStorage.getItem('intended_role')
              || null;
            if (localStorage.getItem('intended_role')) {
              localStorage.removeItem('intended_role');
            }

            const appleDisplayName = localStorage.getItem('apple_display_name');
            const displayName = userData.user.user_metadata.full_name
              || appleDisplayName
              || 'Lover';
            if (appleDisplayName) localStorage.removeItem('apple_display_name');

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                full_name: displayName,
                active_language: storedTarget,
                native_language: storedNative,
                languages: [storedTarget],
                role: intendedRole === 'tutor' || intendedRole === 'student' ? intendedRole : null
              })
              .select()
              .single();

            // Track signup completed for new users
            if (newProfile && !signupTrackingRef.current) {
              signupTrackingRef.current = true;
              localStorage.setItem(`signup_tracked_${userId}`, 'true');
              const provider = userData.user.app_metadata?.provider || 'email';
              analytics.identify(userData.user.id, {
                signup_date: new Date().toISOString(),
                native_language: storedNative,
                target_language: storedTarget,
                subscription_plan: 'free',
              });
              const referralData = getReferralData();
              analytics.trackSignupCompleted({
                method: provider as 'google' | 'apple' | 'email',
                referral_source: referralData?.source || document.referrer || 'direct',
                ...(referralData && {
                  utm_medium: referralData.medium,
                  utm_campaign: referralData.campaign,
                  article_slug: referralData.content,
                  ref_native_lang: referralData.refNative,
                  ref_target_lang: referralData.refTarget,
                }),
              });
            }

            if (createError) {
              if (createError.code === '23505') {
                // Duplicate key — auth trigger created profile first
                if (!signupTrackingRef.current) {
                  signupTrackingRef.current = true;
                  localStorage.setItem(`signup_tracked_${userId}`, 'true');
                  const provider = userData.user.app_metadata?.provider || 'email';
                  analytics.identify(userData.user.id, {
                    signup_date: new Date().toISOString(),
                    native_language: storedNative,
                    target_language: storedTarget,
                    subscription_plan: 'free',
                  });
                  const referralData = getReferralData();
                  analytics.trackSignupCompleted({
                    method: provider as 'google' | 'apple' | 'email',
                    referral_source: referralData?.source || document.referrer || 'direct',
                    ...(referralData && {
                      utm_medium: referralData.medium,
                      utm_campaign: referralData.campaign,
                      article_slug: referralData.content,
                      ref_native_lang: referralData.refNative,
                      ref_target_lang: referralData.refTarget,
                    }),
                  });
                }

                const validRole = intendedRole === 'tutor' || intendedRole === 'student' ? intendedRole : null;
                if (validRole) {
                  const { data: updatedProfile, error: updateError } = await supabase
                    .from('profiles')
                    .update({
                      role: validRole,
                      active_language: storedTarget,
                      native_language: storedNative,
                      languages: [storedTarget]
                    })
                    .eq('id', userData.user.id)
                    .select()
                    .single();
                  if (updatedProfile) {
                    setProfile(updatedProfile);
                    return;
                  }
                  if (updateError) {
                    console.error('Failed to update profile with role:', updateError);
                  }
                }
                const { data: existingProfile, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userData.user.id)
                  .single();
                if (existingProfile) {
                  setProfile(existingProfile);
                  return;
                }
                if (fetchError) {
                  console.error('Failed to fetch existing profile:', fetchError);
                }
              }
              const msg = `Database Error: ${createError.message}. Did you run the SQL schema in Supabase?`;
              console.error(msg, createError);
              setDbError(msg);
              return;
            }
            setProfile(newProfile);
          }
        } else {
          setDbError(`Supabase Error: ${error.message}`);
          console.error("Supabase Error:", error);
        }
      } else {
        setProfile(data);

        // Detect new signup (profile created within last 5 minutes)
        const profileAge = Date.now() - new Date(data.created_at).getTime();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const trackingKey = `signup_tracked_${userId}`;

        if (profileAge < FIVE_MINUTES && !signupTrackingRef.current && !localStorage.getItem(trackingKey)) {
          signupTrackingRef.current = true;
          localStorage.setItem(trackingKey, 'true');
          const { data: userData } = await supabase.auth.getUser();
          const provider = userData?.user?.app_metadata?.provider || 'email';
          analytics.identify(userId, {
            signup_date: data.created_at,
            native_language: data.native_language,
            target_language: data.active_language,
            subscription_plan: data.subscription_plan || 'free',
          });
          const referralData = getReferralData();
          analytics.trackSignupCompleted({
            method: provider as 'google' | 'apple' | 'email',
            referral_source: referralData?.source || document.referrer || 'direct',
            ...(referralData && {
              utm_medium: referralData.medium,
              utm_campaign: referralData.campaign,
              article_slug: referralData.content,
              ref_native_lang: referralData.refNative,
              ref_target_lang: referralData.refTarget,
            }),
          });
        } else {
          // Returning user
          analytics.identify(userId, {
            signup_date: data.created_at,
            native_language: data.native_language,
            target_language: data.active_language,
            subscription_plan: data.subscription_plan || 'free',
          });
          const loginSessionKey = `login_tracked_${userId}`;
          if (!sessionStorage.getItem(loginSessionKey)) {
            sessionStorage.setItem(loginSessionKey, 'true');
            const { data: userData } = await supabase.auth.getUser();
            const provider = userData?.user?.app_metadata?.provider || 'email';
            analytics.trackLogin(provider as 'google' | 'apple' | 'email');
          }
        }
        // Pre-cache vocabulary for offline mode
        if (data?.active_language) {
          offline.preCacheOnLogin(userId, data.active_language);
        }
        // Sync localStorage with profile settings
        if (data?.active_language) {
          localStorage.setItem('preferredTargetLanguage', data.active_language);
        }
        if (data?.native_language) {
          localStorage.setItem('preferredNativeLanguage', data.native_language);
        }
        // Initialize RevenueCat for iOS in-app purchases (non-blocking)
        if (isIAPAvailable()) {
          configurePurchases(userId)
            .then(() => {
              identifyUser(userId);
              return getCustomerInfo();
            })
            .then(info => {
              if (!info) return;
              const entitlement = hasActiveEntitlement(info);
              if (entitlement.isActive && data.subscription_status !== 'active') {
                return supabase.from('profiles').update({
                  subscription_plan: entitlement.plan,
                  subscription_status: 'active',
                  subscription_source: 'app_store',
                }).eq('id', userId).then(() => {
                  fetchProfile(userId);
                });
              }
            })
            .catch(err => console.error('[RevenueCat] Init/reconcile failed:', err));
        }
      }
    } catch (err: any) {
      setDbError(`Unexpected error connecting to Supabase: ${err?.message || 'Unknown error'}`);
      console.error("Unexpected Error in fetchProfile:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Gate: Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FFF0F3]">
        <div className="animate-bounce text-6xl">{'\u2764\uFE0F'}</div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-[var(--accent-color)] font-bold font-header text-xl">Love Languages</p>
          <p className="text-[var(--accent-border)] text-sm animate-pulse">Syncing your progress...</p>
        </div>
      </div>
    );
  }

  // ─── Gate: DB Error ──────────────────────────────────────────────
  if (dbError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <div className="text-6xl mb-4">{'\u26A0\uFE0F'}</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Connection Issue</h2>
        <p className="text-red-600 max-w-md mb-6">{dbError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // ─── Gate: Not authenticated ─────────────────────────────────────
  if (!session || !profile) {
    return <Landing />;
  }

  // ─── Gate: Onboarding ────────────────────────────────────────────
  if (!profile.onboarding_completed_at) {
    return (
      <Onboarding
        role={profile.role}
        userId={profile.id}
        onComplete={() => fetchProfile(profile.id)}
        onQuit={() => supabase.auth.signOut()}
        hasInheritedSubscription={!!profile.subscription_granted_by || profile.subscription_status === 'active'}
        isInvitedUser={!!profile.linked_user_id && !profile.onboarding_completed_at}
        inviterName={typeof window !== 'undefined' ? localStorage.getItem('inviter_name') || undefined : undefined}
      />
    );
  }

  // ─── Gate: Subscription / access check ───────────────────────────
  const hasActiveSubscription = profile.subscription_status === 'active';
  const hasInheritedAccess = !!profile.subscription_granted_by;
  const hasActivePromo = profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date();
  const hasChosenFreeTier = !!profile.free_tier_chosen_at;
  const betaTester = isBetaTester(profile.email || '');
  const trialExpiresAt = profile.trial_expires_at;
  const trialExpired = trialExpiresAt && new Date(trialExpiresAt) <= new Date();
  const isGrandfathered = hasChosenFreeTier && !trialExpiresAt;
  const hasActiveTrial = hasChosenFreeTier && trialExpiresAt && !trialExpired;

  const daysRemaining = trialExpiresAt
    ? Math.max(0, Math.floor((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const hoursRemaining = daysRemaining === 0 && trialExpiresAt
    ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;
  const showTrialReminder = daysRemaining !== null && [5, 3, 1, 0].includes(daysRemaining) && !trialExpired;

  const hasAccess = hasActiveSubscription || hasInheritedAccess || hasActivePromo || isGrandfathered || hasActiveTrial || betaTester;

  // Trial expired — paywall
  if (trialExpired && !hasActiveSubscription && !hasInheritedAccess && !hasActivePromo && !betaTester) {
    return (
      <SubscriptionRequired
        profile={profile}
        onSubscribed={() => fetchProfile(profile.id)}
        trialExpired={true}
      />
    );
  }

  // No access — paywall
  if (!hasAccess) {
    return (
      <SubscriptionRequired
        profile={profile}
        onSubscribed={() => fetchProfile(profile.id)}
      />
    );
  }

  // ─── Authenticated app shell ─────────────────────────────────────
  const profileTheme = {
    accent_color: profile.accent_color,
    dark_mode: profile.dark_mode,
    font_size: profile.font_size,
    font_preset: profile.font_preset,
    font_weight: profile.font_weight,
    background_style: profile.background_style,
  };

  return (
    <Providers userId={profile.id} profile={profile} profileTheme={profileTheme}>
      <ProfileProvider profile={profile} refreshProfile={() => fetchProfile(profile.id)}>
        <div className="h-screen-safe text-[var(--text-primary)] transition-colors duration-300 app-bg-decor">
          {/* Success toast */}
          {successToast && (
            <SuccessToast message={successToast} onClose={() => setSuccessToastMsg(null)} />
          )}

          {/* New words notification - visible on all tabs */}
          {(isExtractingWords || newWordsNotification.length > 0) && (
            <NewWordsNotification
              words={newWordsNotification}
              isExtracting={isExtractingWords}
              onClose={() => {
                setNewWordsNotification([]);
                setIsExtractingWords(false);
                if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
              }}
            />
          )}

          {/* Promo expired banner */}
          <PromoExpiredBanner promoExpiresAt={(profile as any).promo_expires_at} />

          <div className="flex flex-col h-full overflow-hidden">
            <Navbar profile={profile} />

            {/* Trial reminder */}
            {showTrialReminder && daysRemaining !== null && (
              <TrialReminderNotification
                daysRemaining={daysRemaining}
                hoursRemaining={hoursRemaining}
              />
            )}

            <main className="flex-1 h-0 overflow-hidden relative z-0">
              {/* Persistent tabs — always mounted, shown/hidden via CSS */}
              <div className={normPath === '/' ? 'h-full' : 'hidden'}>
                <ErrorBoundary>
                  <ChatArea profile={profile} />
                </ErrorBoundary>
              </div>
              <div className={normPath === '/log' ? 'h-full' : 'hidden'}>
                <ErrorBoundary>
                  <LoveLog profile={profile} />
                </ErrorBoundary>
              </div>
              <div className={normPath === '/play' ? 'h-full' : 'hidden'}>
                <ErrorBoundary>
                  <FlashcardGame profile={profile} />
                </ErrorBoundary>
              </div>
              <div className={normPath === '/progress' ? 'h-full' : 'hidden'}>
                <ErrorBoundary>
                  <Progress profile={profile} />
                </ErrorBoundary>
              </div>

              {/* Non-persistent routes (rendered via page components) */}
              {!isPersistentPath && children}
            </main>
          </div>

          {/* Cookie consent banner */}
          <CookieConsent />
        </div>
      </ProfileProvider>
    </Providers>
  );
}
