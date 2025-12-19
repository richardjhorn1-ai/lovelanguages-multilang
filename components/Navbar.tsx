
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS, COLORS } from '../constants';
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
    
    // Set up real-time subscription for new link requests
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
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-2">
        <ICONS.Heart className="text-rose-500 fill-rose-500 w-6 h-6" />
        <span className="font-header font-bold text-lg hidden sm:inline">Love Languages</span>
      </div>

      <div className="flex gap-2 sm:gap-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-full transition-all relative ${
                isActive ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-500 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="hidden md:inline">{item.label}</span>
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
          <span className="text-sm font-bold truncate max-w-[120px]">{profile.full_name}</span>
          <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">{profile.role}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold border-2 border-white shadow-sm shrink-0">
          {profile.full_name[0].toUpperCase()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
