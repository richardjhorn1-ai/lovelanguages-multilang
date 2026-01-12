
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Profile } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './i18n';
import { useI18nSync } from './hooks/useI18nSync';
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
        <ChatArea profile={profile} />
      </div>
      <div className={path === '/log' ? 'h-full' : 'hidden'}>
        <LoveLog profile={profile} />
      </div>
      <div className={path === '/play' ? 'h-full' : 'hidden'}>
        <FlashcardGame profile={profile} />
      </div>
      <div className={path === '/progress' ? 'h-full' : 'hidden'}>
        <Progress profile={profile} />
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
              || localStorage.getItem('preferredLanguage')
              || 'en';

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                full_name: userData.user.user_metadata.full_name || 'Lover',
                // Set languages from signup metadata or localStorage selection
                active_language: storedTarget,
                native_language: storedNative,
                languages: [storedTarget]
                // role intentionally not set - user will choose in RoleSelection
              })
              .select()
              .single();
            
            if (createError) {
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
    <ThemeProvider userId={profile?.id}>
      <LanguageProvider profile={profile}>
        <I18nSyncWrapper>
        <HashRouter>
          <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
          {/* Success toast */}
          {successToast && (
            <SuccessToast message={successToast} onClose={() => setSuccessToast(null)} />
          )}
          <Routes>
            {/* Public routes - accessible without auth */}
            <Route path="/join/:token" element={<JoinInvite />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

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
                // Step 1: Check if user has selected a role
                !profile.role ? (
                  <RoleSelection
                    userId={profile.id}
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
                ) : // Step 3: Check if user has active subscription (direct or inherited) or is beta tester
                !profile.subscription_status || (
                  profile.subscription_status !== 'active' &&
                  !profile.subscription_granted_by &&  // Partner with inherited access
                  !isBetaTester(profile.email)
                ) ? (
                  <SubscriptionRequired
                    profile={profile}
                    onSubscribed={() => fetchProfile(profile.id)}
                  />
                ) : (
                  <div className="flex flex-col h-screen">
                    <Navbar profile={profile} />
                    <main className="flex-1 overflow-hidden">
                      <PersistentTabs profile={profile} onRefresh={() => fetchProfile(profile.id)} />
                    </main>
                  </div>
                )
              ) : (
                <Hero />
              )
            } />
          </Routes>
        </div>
        </HashRouter>
        </I18nSyncWrapper>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
