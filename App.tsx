
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Profile } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './i18n';
import { useI18nSync } from './hooks/useI18nSync';
import { trackPageView, analytics, captureReferralSource, getReferralData, initWebVitals } from './services/analytics';
import { offline } from './services/offline';
import { migrateFromLocalStorage } from './services/offline-db';
import { sounds } from './services/sounds';
import { configurePurchases, identifyUser, getCustomerInfo, hasActiveEntitlement, isIAPAvailable, logOutPurchases } from './services/purchases';
import NewWordsNotification from './components/NewWordsNotification';
import { ExtractedWord } from './types';
import Landing from './components/Landing';
import { SUPPORTED_LANGUAGE_CODES } from './constants/language-config';
import Navbar from './components/Navbar';
import ChatArea from './components/ChatArea';
import LoveLog from './components/LoveLog';
import FlashcardGame from './components/FlashcardGame';
import ProfileView from './components/ProfileView';
import Progress from './components/Progress';
import LevelTest from './components/LevelTest';
import JoinInvite from './components/JoinInvite';
import { Onboarding } from './components/onboarding/Onboarding';
import SubscriptionRequired from './components/SubscriptionRequired';
import TrialReminderNotification from './components/TrialReminderNotification';
// RoleSelection removed — role selection is now step 1 of onboarding
// import RoleSelection from './components/RoleSelection';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQ from './components/FAQ';
import Method from './components/Method';
import Pricing from './components/Pricing';
import ResetPassword from './components/ResetPassword';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import PromoExpiredBanner from './components/PromoExpiredBanner';

// Beta testers who get free access (add emails here)
const BETA_TESTERS = [
  // Add beta tester emails here:
  // 'friend@example.com',
];

const isBetaTester = (email: string): boolean => {
  return BETA_TESTERS.some(e => e.toLowerCase() === email.toLowerCase());
};

// Wrapper component that keeps main tabs mounted to preserve state
const PersistentTabs: React.FC<{ profile: Profile; onRefresh: () => void }> = ({ profile, onRefresh }) => {
  const location = useLocation();
  const path = location.pathname;

  // These tabs will stay mounted to preserve their state
  const persistentPaths = ['/', '/log', '/play', '/progress'];
  const isPersistentPath = persistentPaths.includes(path);

  return (
    <>
      {/* Persistent tabs - always mounted, shown/hidden via CSS */}
      <div className={path === '/' ? 'h-full' : 'hidden'}>
        <ErrorBoundary>
          <ChatArea profile={profile} />
        </ErrorBoundary>
      </div>
      <div className={path === '/log' ? 'h-full' : 'hidden'}>
        <ErrorBoundary>
          <LoveLog profile={profile} />
        </ErrorBoundary>
      </div>
      <div className={path === '/play' ? 'h-full' : 'hidden'}>
        <ErrorBoundary>
          <FlashcardGame profile={profile} />
        </ErrorBoundary>
      </div>
      <div className={path === '/progress' ? 'h-full' : 'hidden'}>
        <ErrorBoundary>
          <Progress profile={profile} />
        </ErrorBoundary>
      </div>

      {/* Non-persistent routes - mounted/unmounted normally */}
      {!isPersistentPath && (
        <Routes>
          <Route path="/test" element={<LevelTest profile={profile} />} />
          <Route path="/profile" element={<ProfileView profile={profile} onRefresh={onRefresh} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </>
  );
};

// Wrapper component that syncs i18n with native language (must be inside LanguageProvider)
const I18nSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useI18nSync();
  return <>{children}</>;
};

// Analytics wrapper - tracks page views on route changes
const AnalyticsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Track page views on route changes (GA4 initialized in index.html)
  useEffect(() => {
    trackPageView(location.pathname + location.hash);
  }, [location]);

  return <>{children}</>;
};

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
          <span className="text-xl">💕</span>
        </div>
        <div>
          <p className="font-bold text-gray-800">{message}</p>
          <p className="text-sm text-gray-500">Let's start learning together!</p>
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

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [newWordsNotification, setNewWordsNotification] = useState<ExtractedWord[]>([]);
  const [isExtractingWords, setIsExtractingWords] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Capture UTM params from blog referrals on first load
  useEffect(() => {
    captureReferralSource();
    initWebVitals();
    migrateFromLocalStorage();
  }, []);

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
        // Log out of RevenueCat when user signs out
        if (isIAPAvailable()) logOutPurchases();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for subscription success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      setSuccessToast("You're all set!");

      // Track subscription completed
      // Note: Actual plan/price details would come from the Stripe webhook
      // This is a fallback client-side tracking
      analytics.track('subscription_completed', {
        plan: 'unknown', // Will be enriched by Stripe webhook data
        billing_period: 'unknown',
        price: 0,
        currency: 'EUR',
      });

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      url.searchParams.delete('onboarding');
      window.history.replaceState({}, '', url.pathname + url.hash);
    }
  }, []);

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

  const fetchProfile = async (userId: string) => {
    try {
      setDbError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Fix: PostgrestError does not have a status property.
        // PGRST116 is the code for "no rows returned" when using .single()
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            // Read language selection from user metadata (set during signup)
            // Fall back to localStorage (set during Landing page interaction)
            // Final fallback to defaults for edge cases
            const userMeta = userData.user.user_metadata || {};
            const storedTarget = userMeta.target_language
              || localStorage.getItem('preferredTargetLanguage')
              || 'pl';
            const storedNative = userMeta.native_language
              || localStorage.getItem('preferredNativeLanguage')
              || localStorage.getItem('preferredLanguage')  // Legacy key fallback
              || 'en';

            // Read intended role from user metadata (set during onboarding)
            // Fall back to localStorage for OAuth signups
            const intendedRole = userMeta.intended_role
              || localStorage.getItem('intended_role')
              || null;
            // Clear localStorage after reading
            if (localStorage.getItem('intended_role')) {
              localStorage.removeItem('intended_role');
            }

            // For Apple Sign In: name is only sent on FIRST authorization
            // Native iOS captures it in localStorage; web gets it from user_metadata
            const appleDisplayName = localStorage.getItem('apple_display_name');
            const displayName = userData.user.user_metadata.full_name
              || appleDisplayName
              || 'Lover';
            // Clear the one-time Apple name after reading
            if (appleDisplayName) localStorage.removeItem('apple_display_name');

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                full_name: displayName,
                // Set languages from signup metadata or localStorage selection
                active_language: storedTarget,
                native_language: storedNative,
                languages: [storedTarget],
                // Set role from signup selection (tutor or student)
                role: intendedRole === 'tutor' || intendedRole === 'student' ? intendedRole : null
              })
              .select()
              .single();

            // Track signup completed for new users
            if (newProfile) {
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
              // Duplicate key error (23505) means profile was created by auth trigger - fetch and update it
              if (createError.code === '23505') {
                // If we have an intended role from signup, update the profile with it
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
                // Fallback: just fetch the existing profile
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
        // Initialize analytics for returning users (enables event tracking)
        analytics.identify(userId, {
          signup_date: data.created_at,
          native_language: data.native_language,
          target_language: data.active_language,
          subscription_plan: data.subscription_plan || 'free',
        });
        // Pre-cache vocabulary for offline mode
        if (data?.active_language) {
          offline.preCacheOnLogin(userId, data.active_language);
        }
        // Sync localStorage with profile settings (self-healing if localStorage is stale)
        if (data?.active_language) {
          localStorage.setItem('preferredTargetLanguage', data.active_language);
        }
        if (data?.native_language) {
          localStorage.setItem('preferredNativeLanguage', data.native_language);
        }
        // Initialize RevenueCat for iOS in-app purchases (non-blocking)
        if (isIAPAvailable()) {
          configurePurchases(userId).then(() => {
            identifyUser(userId);
            // Reconcile: check if iOS subscription status differs from DB
            getCustomerInfo().then(info => {
              if (!info) return;
              const entitlement = hasActiveEntitlement(info);
              if (entitlement.isActive && data.subscription_status !== 'active') {
                // User has active App Store subscription but DB doesn't reflect it
                // This can happen if webhook was delayed — update DB
                supabase.from('profiles').update({
                  subscription_plan: entitlement.plan,
                  subscription_status: 'active',
                  subscription_source: 'app_store',
                }).eq('id', userId).then(() => {
                  // Refetch profile to get updated state
                  fetchProfile(userId);
                });
              }
            });
          });
        }
      }
    } catch (err: any) {
      setDbError(`Unexpected error connecting to Supabase: ${err?.message || 'Unknown error'}`);
      console.error("Unexpected Error in fetchProfile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FFF0F3]">
        <div className="animate-bounce text-6xl">❤️</div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-[var(--accent-color)] font-bold font-header text-xl">Love Languages</p>
          <p className="text-[var(--accent-border)] text-sm animate-pulse">Syncing your progress...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
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

  return (
    <ThemeProvider userId={profile?.id} profileTheme={profile ? { accent_color: profile.accent_color, dark_mode: profile.dark_mode, font_size: profile.font_size, font_preset: profile.font_preset, font_weight: profile.font_weight } : null}>
      <LanguageProvider profile={profile}>
        <I18nSyncWrapper>
        <HashRouter>
          <AnalyticsWrapper>
          <div className="h-screen-safe text-[var(--text-primary)] transition-colors duration-300 overflow-hidden app-bg-decor">
          {/* Success toast */}
          {successToast && (
            <SuccessToast message={successToast} onClose={() => setSuccessToast(null)} />
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
          {profile && (
            <PromoExpiredBanner promoExpiresAt={(profile as any).promo_expires_at} />
          )}
          <Routes>
            {/* Public routes - accessible without auth */}
            <Route path="/join/:token" element={<JoinInvite />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/method" element={<Method />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Target language routes - /pl, /es, /fr, etc. */}
            {/* Only match actual language codes, not app routes like /log, /play */}
            {SUPPORTED_LANGUAGE_CODES.map(lang => (
              <Route key={lang} path={`/${lang}`} element={
                session && profile ? (
                  // Authenticated users go to main app
                  <Navigate to="/" />
                ) : (
                  <Landing />
                )
              } />
            ))}

            {/* All other routes */}
            <Route path="*" element={
              session && profile ? (
                // Step 1: Check if onboarding is completed (role + language selection now part of onboarding)
                !profile.onboarding_completed_at ? (
                  <Onboarding
                    role={profile.role}
                    userId={profile.id}
                    onComplete={() => fetchProfile(profile.id)}
                    onQuit={() => supabase.auth.signOut()}
                    hasInheritedSubscription={!!profile.subscription_granted_by || profile.subscription_status === 'active'}
                  />
                ) : // Step 3: Check subscription/access status
                // Allow if: subscription active, inherited access, active promo, active trial, or beta tester
                (() => {
                  const hasActiveSubscription = profile.subscription_status === 'active';
                  const hasInheritedAccess = !!profile.subscription_granted_by;
                  const hasActivePromo = profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date();
                  const hasChosenFreeTier = !!profile.free_tier_chosen_at;
                  const betaTester = isBetaTester(profile.email || '');

                  // Trial expiry check
                  const trialExpiresAt = profile.trial_expires_at;
                  const trialExpired = trialExpiresAt && new Date(trialExpiresAt) <= new Date();
                  // Grandfathered: has free tier but no trial_expires_at (old users)
                  const isGrandfathered = hasChosenFreeTier && !trialExpiresAt;
                  // Active trial: has chosen free tier, has expiry, and not expired
                  const hasActiveTrial = hasChosenFreeTier && trialExpiresAt && !trialExpired;

                  // Calculate days remaining for trial reminder (floor so day 0 = last day)
                  const daysRemaining = trialExpiresAt
                    ? Math.max(0, Math.floor((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : null;
                  const hoursRemaining = daysRemaining === 0 && trialExpiresAt
                    ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
                    : null;
                  const showTrialReminder = daysRemaining !== null && [5, 3, 1, 0].includes(daysRemaining) && !trialExpired;

                  const hasAccess = hasActiveSubscription || hasInheritedAccess || hasActivePromo || isGrandfathered || hasActiveTrial || betaTester;

                  // If trial expired and no other access, show paywall with trial expired message
                  if (trialExpired && !hasActiveSubscription && !hasInheritedAccess && !hasActivePromo && !betaTester) {
                    return (
                      <SubscriptionRequired
                        profile={profile}
                        onSubscribed={() => fetchProfile(profile.id)}
                        trialExpired={true}
                      />
                    );
                  }

                  return !hasAccess ? (
                    <SubscriptionRequired
                      profile={profile}
                      onSubscribed={() => fetchProfile(profile.id)}
                    />
                  ) : (
                    <div className="flex flex-col h-full">
                      <Navbar profile={profile} />
                      {/* Trial reminder notification */}
                      {showTrialReminder && daysRemaining !== null && (
                        <TrialReminderNotification
                          daysRemaining={daysRemaining}
                          hoursRemaining={hoursRemaining}
                        />
                      )}
                      <main className="flex-1 h-0 overflow-hidden relative z-0">
                        <PersistentTabs profile={profile} onRefresh={() => fetchProfile(profile.id)} />
                      </main>
                    </div>
                  );
                })()
              ) : (
                <Landing />
              )
            } />
          </Routes>
          {/* Cookie consent banner */}
          <CookieConsent />
        </div>
          </AnalyticsWrapper>
        </HashRouter>
        </I18nSyncWrapper>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
