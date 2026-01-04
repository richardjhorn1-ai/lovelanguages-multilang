
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { Profile } from '../types';
import { supabase } from '../services/supabase';

interface NavbarProps {
  profile: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const [requestCount, setRequestCount] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequestCount = async () => {
      const { count, error } = await supabase
        .from('link_requests')
        .select('*', { count: 'exact', head: true })
        .eq('target_email', profile.email.toLowerCase())
        .eq('status', 'pending');

      if (!error && count !== null) setRequestCount(count);
    };

    fetchRequestCount();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'link_requests',
          filter: `target_email=eq.${profile.email.toLowerCase()}`
        },
        () => fetchRequestCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', label: 'Chat', icon: ICONS.MessageCircle },
    { path: '/log', label: 'Love Log', icon: ICONS.Book },
    { path: '/play', label: 'Play', icon: ICONS.Play },
    { path: '/progress', label: 'Progress', icon: ICONS.TrendingUp },
  ];

  return (
    <>
      {/* XP PROGRESS BAR */}
      <div className="w-full h-1 bg-gray-50 flex">
        <div className="h-full bg-[#FF4761] shadow-[0_0_8px_rgba(255,71,97,0.5)] transition-all duration-1000" style={{ width: `${(profile.xp || 0) % 100}%` }}></div>
      </div>
      
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between z-10 sticky top-1">
        <div className="flex items-center gap-2">
          <ICONS.Heart className="text-[#FF4761] fill-[#FF4761] w-6 h-6" />
          <span className="font-header font-bold text-lg hidden sm:inline">Love Languages</span>
        </div>

        <div className="flex gap-2 sm:gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl transition-all relative ${
                  isActive ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-500 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden md:inline text-xs uppercase font-black tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-all"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black truncate max-w-[120px]">{profile.full_name}</span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-[#FF4761] font-black">Level {profile.level || 1} {profile.role}</span>
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-[#FF4761] font-black border border-rose-100 shadow-sm shrink-0 text-sm">
                {profile.full_name[0].toUpperCase()}
              </div>
              {requestCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {requestCount}
                </span>
              )}
            </div>
            <ICONS.ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-800">{profile.full_name}</p>
                <p className="text-[10px] text-gray-400">{profile.email}</p>
              </div>

              <button
                onClick={() => { navigate('/profile'); setIsProfileDropdownOpen(false); }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <ICONS.User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">View Profile</span>
                {requestCount > 0 && (
                  <span className="ml-auto bg-rose-100 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {requestCount} request{requestCount > 1 ? 's' : ''}
                  </span>
                )}
              </button>

              <button
                onClick={() => { navigate('/progress'); setIsProfileDropdownOpen(false); }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <ICONS.TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">My Progress</span>
              </button>

              <button
                onClick={() => { navigate('/log'); setIsProfileDropdownOpen(false); }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <ICONS.Book className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Love Log</span>
              </button>

              <div className="border-t border-gray-50 mt-2 pt-2">
                <button
                  onClick={() => { supabase.auth.signOut(); setIsProfileDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 transition-colors text-red-500"
                >
                  <ICONS.LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
