
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Profile } from './types';
import { ThemeProvider } from './context/ThemeContext';
import Hero from './components/Hero';
import Navbar from './components/Navbar';
import ChatArea from './components/ChatArea';
import LoveLog from './components/LoveLog';
import FlashcardGame from './components/FlashcardGame';
import ProfileView from './components/ProfileView';
import Progress from './components/Progress';
import LevelTest from './components/LevelTest';
import JoinInvite from './components/JoinInvite';
import { Onboarding } from './components/onboarding/Onboarding';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
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
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                email: userData.user.email,
                full_name: userData.user.user_metadata.full_name || 'Lover',
                role: 'student'
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
      <HashRouter>
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
          <Routes>
            {/* Partner invite route - accessible without auth */}
            <Route path="/join/:token" element={<JoinInvite />} />

            {/* All other routes */}
            <Route path="*" element={
              session && profile ? (
                // Check if onboarding is completed
                !profile.onboarding_completed_at ? (
                  <Onboarding
                    role={profile.role}
                    userId={profile.id}
                    onComplete={() => fetchProfile(profile.id)}
                  />
                ) : (
                  <div className="flex flex-col h-screen">
                    <Navbar profile={profile} />
                    <main className="flex-1 overflow-hidden">
                      <Routes>
                        <Route path="/" element={<ChatArea profile={profile} />} />
                        <Route path="/log" element={<LoveLog profile={profile} />} />
                        <Route path="/play" element={<FlashcardGame profile={profile} />} />
                        <Route path="/progress" element={<Progress profile={profile} />} />
                        <Route path="/test" element={<LevelTest profile={profile} />} />
                        <Route path="/profile" element={<ProfileView profile={profile} onRefresh={() => fetchProfile(profile.id)} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
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
    </ThemeProvider>
  );
};

export default App;
