
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../constants';
import { Profile } from '../types';
import { supabase } from '../services/supabase';

interface NavbarProps {
  profile: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const [requestCount, setRequestCount] = useState(0);

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

  const navItems = [
    { path: '/', label: 'Chat', icon: ICONS.MessageCircle },
    { path: '/log', label: 'Love Log', icon: ICONS.Book },
    { path: '/play', label: 'Play', icon: ICONS.Play },
    { path: '/profile', label: 'Profile', icon: ICONS.User, hasBadge: requestCount > 0 },
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
              {item.hasBadge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {requestCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-black truncate max-w-[120px]">{profile.full_name}</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#FF4761] font-black">Level {profile.level || 1} {profile.role}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-[#FF4761] font-black border border-rose-100 shadow-sm shrink-0 text-sm">
            {profile.full_name[0].toUpperCase()}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
