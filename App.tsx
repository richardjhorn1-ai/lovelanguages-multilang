
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Profile } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './i18n';
import { useI18nSync } from './hooks/useI18nSync';
import { trackPageView, analytics } from './services/analytics';
import Hero from './components/Hero';
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
import RoleSelection from './components/RoleSelection';
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
            // Fall back to localStorage (set during Hero page interaction)
            // Final fallback to defaults for edge cases
            const userMeta = userData.user.user_metadata || {};
            const storedTarget = userMeta.target_language
              || localStorage.getItem('preferredTargetLanguage')
              || 'pl';
            const storedNative = userMeta.native_language
              || localStorage.getItem('preferredNativeLanguage')
              || localStorage.getItem('preferredLanguage')  // Legacy key fallback
              || 'en';

            // Read intended role from user metadata (set during signup in Hero)
            // Fall back to localStorage for OAuth signups
            const intendedRole = userMeta.intended_role
              || localStorage.getItem('intended_role')
              || null;
            // Clear localStorage after reading
            if (localStorage.getItem('intended_role')) {
              localStorage.removeItem('intended_role');
            }

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                full_name: userData.user.user_metadata.full_name || 'Lover',
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
              analytics.trackSignupCompleted({
                method: provider as 'google' | 'apple' | 'email',
                referral_source: document.referrer || 'direct',
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
        // Sync localStorage with profile settings (self-healing if localStorage is stale)
        if (data?.active_language) {
          localStorage.setItem('preferredTargetLanguage', data.active_language);
        }
        if (data?.native_language) {
          localStorage.setItem('preferredNativeLanguage', data.native_language);
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
          <div className="h-screen-safe bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden">
          {/* Success toast */}
          {successToast && (
            <SuccessToast message={successToast} onClose={() => setSuccessToast(null)} />
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
                  <Hero />
                )
              } />
            ))}

            {/* All other routes */}
            <Route path="*" element={
              session && profile ? (
                // Step 1: Check if user has confirmed their role (skip for existing users who completed onboarding)
                !profile.role_confirmed_at && !profile.onboarding_completed_at ? (
                  <RoleSelection
                    userId={profile.id}
                    profile={profile}
                    onRoleSelected={() => fetchProfile(profile.id)}
                  />
                ) : // Step 2: Check if onboarding is completed
                !profile.onboarding_completed_at ? (
                  <Onboarding
                    role={profile.role}
                    userId={profile.id}
                    onComplete={() => fetchProfile(profile.id)}
                    onQuit={() => supabase.auth.signOut()}
                    hasInheritedSubscription={!!profile.subscription_granted_by}
                  />
                ) : // Step 3: Check subscription/access status
                // Allow if: subscription active, inherited access, active promo, free tier chosen, or beta tester
                (() => {
                  const hasActiveSubscription = profile.subscription_status === 'active';
                  const hasInheritedAccess = !!profile.subscription_granted_by;
                  const hasActivePromo = (profile as any).promo_expires_at && new Date((profile as any).promo_expires_at) > new Date();
                  const hasChosenFreeTier = !!(profile as any).free_tier_chosen_at;
                  const betaTester = isBetaTester(profile.email || '');

                  const hasAccess = hasActiveSubscription || hasInheritedAccess || hasActivePromo || hasChosenFreeTier || betaTester;

                  return !hasAccess ? (
                    <SubscriptionRequired
                      profile={profile}
                      onSubscribed={() => fetchProfile(profile.id)}
                    />
                  ) : (
                    <div className="flex flex-col h-full">
                      <Navbar profile={profile} />
                      <main className="flex-1 h-0 overflow-hidden">
                        <PersistentTabs profile={profile} onRefresh={() => fetchProfile(profile.id)} />
                      </main>
                    </div>
                  );
                })()
              ) : (
                <Hero />
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
