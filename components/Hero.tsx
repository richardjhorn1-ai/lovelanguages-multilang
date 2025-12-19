
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
            <ICONS.Heart className="text-rose-500 fill-rose-500 w-12 h-12" />
            <h1 className="text-4xl font-bold font-header text-rose-600 tracking-tight">Love Languages</h1>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 text-[#292F36]">
            Language learning <span className="text-rose-500 italic">made for two.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            Master Polish together. Share a dictionary, practice with AI, and track each other's progress in the most romantic way possible.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
              <div className="w-2 h-2 rounded-full bg-rose-400"></div>
              <span className="text-sm font-bold text-gray-700">Gemini 3 Flash Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
              <span className="text-sm font-bold text-gray-700">Couples Linking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login/Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white md:rounded-l-[4rem] shadow-2xl">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-3 text-[#292F36]">Welcome Home</h3>
            <p className="text-gray-500 font-medium">Sign in to start your journey to Poland</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#292F36] mb-2 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl bg-[#3D3D3D] text-white border-none focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-gray-500"
                placeholder="you@love.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#292F36] mb-2 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl bg-[#3D3D3D] text-white border-none focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-gray-500"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FF4761] hover:bg-[#E63E56] text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 text-lg mt-4"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Start Learning')}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-bold text-center ${message.includes('check') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message}
            </div>
          )}

          <div className="mt-10 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#FF4761] font-bold hover:underline transition-all"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
