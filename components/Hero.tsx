
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import { DEFAULT_THEME, applyTheme } from '../services/theme';

type HeroRole = 'student' | 'tutor';

// Fixed brand colors for landing page - not affected by user personalization
const BRAND = {
  primary: '#FF4761',
  primaryHover: '#E63E56',
  light: '#FFF0F3',
  border: '#FECDD3',
  shadow: 'rgba(255, 71, 97, 0.25)',
};

const Hero: React.FC = () => {
  // Reset to light theme on login page to avoid dark mode artifacts
  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<HeroRole>('student');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { intended_role: selectedRole }
          }
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setMessage(error.message);
    else if (isSignUp) setMessage('Check your email for confirmation!');
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF0F3]">
      {/* Left Content Area */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-24">
        <div className="max-w-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className={`bg-[${BRAND.primary}] p-2.5 rounded-2xl shadow-lg`} style={{ backgroundColor: BRAND.primary, boxShadow: `0 10px 15px -3px ${BRAND.shadow}` }}>
              <ICONS.Heart className="text-white fill-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-header tracking-tight" style={{ color: BRAND.primary }}>Love Languages</h1>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setSelectedRole('student')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                selectedRole === 'student'
                  ? 'text-white shadow-lg'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
              style={selectedRole === 'student' ? { backgroundColor: BRAND.primary, boxShadow: `0 10px 15px -3px ${BRAND.shadow}` } : {}}
            >
              I want to learn
            </button>
            <button
              onClick={() => setSelectedRole('tutor')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                selectedRole === 'tutor'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              I want to help them learn
            </button>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 text-[#292F36] tracking-tight">
            {selectedRole === 'student' ? (
              <>Speak the language of <span className="italic underline underline-offset-8" style={{ color: BRAND.primary, textDecorationColor: BRAND.border }}>their heart.</span></>
            ) : (
              <>Help them fall in love with <span className="text-teal-500 italic underline decoration-teal-200 underline-offset-8">your language.</span></>
            )}
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            {selectedRole === 'student'
              ? "This isn't just about verbs and cases—it's about building a bridge to the person you love. Create a secret world where every new word is a shared promise and every sentence is a deeper act of intimacy."
              : "Share the beauty of Polish with someone you love. Guide them word by word into your world—your culture, your family, your heart."}
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2.5 bg-white/70 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-sm border border-white">
              <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: selectedRole === 'student' ? BRAND.primary : '#2dd4bf' }}></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-700">
                {selectedRole === 'student' ? 'AI-Guided Intimacy' : 'AI-Powered Coaching'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/70 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-sm border border-white">
              <div className={`w-2 h-2 rounded-full ${selectedRole === 'student' ? 'bg-teal-400' : 'bg-amber-400'}`}></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-700">
                {selectedRole === 'student' ? 'Soul Connection' : 'Progress Tracking'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login/Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white md:rounded-l-[5rem] shadow-2xl relative overflow-hidden">
        {/* Subtle decorative heart in background */}
        <ICONS.Heart className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none" style={{ color: BRAND.light }} />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black mb-3 text-[#292F36] font-header">
              {selectedRole === 'student' ? 'Begin your journey' : 'Become their guide'}
            </h3>
            <p className="text-gray-400 font-medium text-sm">
              {selectedRole === 'student'
                ? 'Step into a world built for the two of you.'
                : 'Help someone you love discover Polish.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-800 border-2 border-transparent focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 font-bold text-sm"
                style={{ '--tw-ring-color': BRAND.border } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = BRAND.border}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                placeholder="you@love.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Secret Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-800 border-2 border-transparent focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 font-bold text-sm"
                onFocus={(e) => e.target.style.borderColor = BRAND.border}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-black py-5 rounded-[2rem] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.2em] mt-4 ${
                selectedRole === 'tutor' ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-100' : ''
              }`}
              style={selectedRole === 'student' ? { backgroundColor: BRAND.primary, boxShadow: `0 10px 15px -3px ${BRAND.shadow}` } : {}}
              onMouseEnter={(e) => { if (selectedRole === 'student') e.currentTarget.style.backgroundColor = BRAND.primaryHover; }}
              onMouseLeave={(e) => { if (selectedRole === 'student') e.currentTarget.style.backgroundColor = BRAND.primary; }}
            >
              {loading ? 'Entering...' : (
                isSignUp
                  ? (selectedRole === 'student' ? 'Create our world' : 'Become their guide')
                  : (selectedRole === 'student' ? 'Start learning' : 'Start helping')
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold text-center ${message.includes('check') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-black uppercase tracking-widest transition-all"
              style={{ color: BRAND.primary }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "New to Love Languages? Join us!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
