
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS, COLORS } from '../constants';
import { Profile } from '../types';

interface NavbarProps {
  profile: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const navItems = [
    { path: '/', label: 'Chat', icon: ICONS.MessageCircle },
    { path: '/log', label: 'Love Log', icon: ICONS.Book },
    { path: '/play', label: 'Play', icon: ICONS.Play },
    { path: '/profile', label: 'Profile', icon: ICONS.User },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
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
              `flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                isActive ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-500 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="hidden md:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold">{profile.full_name}</span>
          <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">{profile.role}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold border-2 border-white shadow-sm">
          {profile.full_name[0].toUpperCase()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
