
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

const Hero: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
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
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-rose-500 p-2.5 rounded-2xl shadow-lg shadow-rose-200">
              <ICONS.Heart className="text-white fill-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-header text-rose-600 tracking-tight">Love Languages</h1>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 text-[#292F36] tracking-tight">
            Speak the language of <span className="text-rose-500 italic underline decoration-rose-200 underline-offset-8">their heart.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            This isn't just about verbs and cases—it's about building a bridge to the person you love. Create a secret world where every new word is a shared promise and every sentence is a deeper act of intimacy.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2.5 bg-white/70 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-sm border border-white">
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-700">AI-Guided Intimacy</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/70 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-sm border border-white">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-700">Soul Connection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login/Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white md:rounded-l-[5rem] shadow-2xl relative overflow-hidden">
        {/* Subtle decorative heart in background */}
        <ICONS.Heart className="absolute -bottom-20 -right-20 w-80 h-80 text-rose-50 opacity-[0.03] pointer-events-none" />
        
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black mb-3 text-[#292F36] font-header">Begin your journey</h3>
            <p className="text-gray-400 font-medium text-sm">Step into a world built for the two of you.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-800 border-2 border-transparent focus:bg-white focus:border-rose-100 focus:outline-none transition-all placeholder:text-gray-300 font-bold text-sm"
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
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-800 border-2 border-transparent focus:bg-white focus:border-rose-100 focus:outline-none transition-all placeholder:text-gray-300 font-bold text-sm"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FF4761] hover:bg-[#E63E56] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-rose-100 transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.2em] mt-4"
            >
              {loading ? 'Entering...' : (isSignUp ? 'Create our world' : 'Start learning')}
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
              className="text-rose-400 text-xs font-black uppercase tracking-widest hover:text-rose-600 transition-all"
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
