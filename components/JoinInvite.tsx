import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

interface InviterInfo {
  name: string;
  email: string;
}

const JoinInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inviter, setInviter] = useState<InviterInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('No invite token provided');
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[JoinInvite] Validating token:', token);
      const response = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      console.log('[JoinInvite] Response status:', response.status);

      // Check if we got HTML instead of JSON (common when API doesn't exist)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[JoinInvite] Non-JSON response:', contentType);
        const text = await response.text();
        console.error('[JoinInvite] Response body:', text.substring(0, 200));
        throw new Error('API endpoint not available. Please ensure the server is running.');
      }

      const data = await response.json();
      console.log('[JoinInvite] Response data:', data);

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid invite link');
        setLoading(false);
        return;
      }

      setInviter(data.inviter);
    } catch (e: any) {
      console.error('[JoinInvite] Error:', e);
      setError(e.message || 'Failed to validate invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    try {
      if (isSignUp) {
        // Sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0] // Default name from email
            }
          }
        });

        if (signUpError) throw signUpError;

        // Check if email confirmation is required
        if (signUpData.user && !signUpData.session) {
          setAuthMessage('Check your email for confirmation, then sign in!');
          setIsSignUp(false);
          setAuthLoading(false);
          return;
        }

        // If we have a session, complete the invite
        if (signUpData.session) {
          await completeInvite(signUpData.session.access_token);
        }
      } else {
        // Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        if (signInData.session) {
          await completeInvite(signInData.session.access_token);
        }
      }
    } catch (e: any) {
      setAuthMessage(e.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const completeInvite = async (accessToken: string) => {
    setValidating(true);

    try {
      console.log('[JoinInvite] Completing invite with token:', token);
      const response = await fetch('/api/complete-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token })
      });

      // Check if we got HTML instead of JSON (API not available)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[JoinInvite] complete-invite API not available');
        throw new Error('API endpoint not available. Are you running vercel dev?');
      }

      const data = await response.json();
      console.log('[JoinInvite] Complete invite response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete invite');
      }

      // Success! Force a full page reload to get fresh profile data
      console.log('[JoinInvite] Success! Reloading to fetch updated profile...');
      window.location.href = '/';
    } catch (e: any) {
      console.error('[JoinInvite] Complete invite error:', e);
      setAuthMessage(e.message || 'Failed to link accounts');
      setValidating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3]">
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-4">💕</div>
          <p className="text-[var(--accent-color)] font-bold animate-pulse">Validating invite...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3] p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ICONS.X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">Invalid Invite</h2>
          <p className="text-gray-500 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[var(--accent-color)] text-white px-8 py-4 rounded-2xl font-bold shadow-lg"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Completing invite state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3]">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">🔗</div>
          <p className="text-[var(--accent-color)] font-bold animate-pulse">Linking your accounts...</p>
        </div>
      </div>
    );
  }

  // Main invite UI
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF0F3]">
      {/* Left: Invitation Context */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-24">
        <div className="max-w-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-[var(--accent-color)] p-3 rounded-2xl shadow-lg shadow-[var(--accent-shadow)] animate-pulse">
              <ICONS.Heart className="text-white fill-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-header text-[var(--accent-color)]">Love Languages</h1>
          </div>

          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6 text-[#292F36]">
            {inviter?.name || 'Your partner'} wants you to join their Polish learning journey!
          </h2>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            They're learning Polish to connect with you on a deeper level. As their language coach, you'll:
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <ICONS.TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Track Their Progress</p>
                <p className="text-sm text-gray-500">See what words they've learned and where they need help</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <ICONS.MessageCircle className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Get Conversation Starters</p>
                <p className="text-sm text-gray-500">AI suggests Polish phrases to use together based on their vocabulary</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <ICONS.Heart className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Encourage & Celebrate</p>
                <p className="text-sm text-gray-500">Help them stay motivated and celebrate milestones together</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white md:rounded-l-[5rem] shadow-2xl relative overflow-hidden">
        <ICONS.Heart className="absolute -bottom-20 -right-20 w-80 h-80 text-[var(--accent-light)] opacity-[0.03] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black text-[var(--accent-color)]">
              {inviter?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <h3 className="text-2xl font-black text-[#292F36] mb-2">
              Join {inviter?.name}
            </h3>
            <p className="text-gray-400 text-sm font-medium">
              {isSignUp ? 'Create your account to become their coach' : 'Sign in to connect'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-800 border-2 border-transparent focus:bg-white focus:border-[var(--accent-border)] focus:outline-none transition-all font-bold text-sm"
                placeholder="you@love.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-800 border-2 border-transparent focus:bg-white focus:border-[var(--accent-border)] focus:outline-none transition-all font-bold text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-[var(--accent-shadow)] transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.2em] mt-4"
            >
              {authLoading ? 'Connecting...' : (isSignUp ? 'Join as Coach' : 'Sign In & Connect')}
            </button>
          </form>

          {authMessage && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold text-center ${
              authMessage.includes('Check') || authMessage.includes('success')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {authMessage}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[var(--accent-color)] text-xs font-black uppercase tracking-widest hover:text-[var(--accent-color)] transition-all"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinInvite;
