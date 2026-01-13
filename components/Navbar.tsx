
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { Profile, Notification } from '../types';
import { supabase } from '../services/supabase';
import { getLevelFromXP, getLevelProgress, getTierColor, translateLevel } from '../services/level-utils';
import { useTheme } from '../context/ThemeContext';
import { HelpGuide } from './HelpGuide';
import { BugReportModal } from './BugReportModal';
import { sounds } from '../services/sounds';

interface NavbarProps {
  profile: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const [requestCount, setRequestCount] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSoundMuted, setIsSoundMuted] = useState(sounds.isMuted());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { accentHex, isDark } = useTheme();
  const { t } = useTranslation();

  // Calculate level info from XP
  const levelInfo = useMemo(() => getLevelFromXP(profile.xp || 0), [profile.xp]);
  const levelProgress = useMemo(() => getLevelProgress(profile.xp || 0), [profile.xp]);
  const tierColor = useMemo(() => getTierColor(levelInfo.tier), [levelInfo.tier]);

  useEffect(() => {
    const fetchRequestCount = async () => {
      try {
        const { count, error } = await supabase
          .from('link_requests')
          .select('*', { count: 'exact', head: true })
          .eq('target_email', profile.email.toLowerCase())
          .eq('status', 'pending');

        // Silently ignore if table doesn't exist (404)
        if (!error && count !== null) setRequestCount(count);
      } catch {
        // Table may not exist yet - ignore
      }
    };

    fetchRequestCount();

    // Only subscribe if we successfully fetched (table exists)
    // Skip subscription to avoid repeated errors if table doesn't exist
  }, [profile.email]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter(n => !n.read_at).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissNotification = async (notificationId: string) => {
    // Check if notification was unread before dismissing
    const wasUnread = notifications.find(n => n.id === notificationId)?.read_at === null;

    await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    // Update unread count if the dismissed notification was unread
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'challenge_received': return '🎮';
      case 'challenge_completed': return '🏆';
      case 'word_gift_received': return '🎁';
      case 'word_gift_completed': return '✨';
      default: return '💌';
    }
  };

  const navItems = [
    { path: '/', label: t('nav.chat'), icon: ICONS.MessageCircle, hideOnMobile: false },
    { path: '/log', label: t('nav.log'), icon: ICONS.Book, hideOnMobile: false },
    { path: '/play', label: t('nav.play'), icon: ICONS.Play, hideOnMobile: false },
    { path: '/progress', label: t('nav.progress'), icon: ICONS.TrendingUp, hideOnMobile: true },
  ];

  return (
    <>
      {/* XP PROGRESS BAR - shows progress within current level */}
      <div className="w-full h-1 bg-[var(--bg-primary)] flex">
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${levelProgress}%`,
            backgroundColor: tierColor,
            boxShadow: `0 0 8px ${tierColor}50`
          }}
        />
      </div>

      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 md:px-6 py-2 md:py-3 flex items-center justify-between z-50 sticky top-1">
        {/* Left: Logo - fixed width on mobile for centering */}
        <div className="flex items-center gap-2 w-10 md:w-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 600"
            fill={accentHex}
            className="w-7 h-7 md:w-8 md:h-8"
          >
            <g transform="translate(0,600) scale(0.1,-0.1)">
              <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37l62 1 -5 -34c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169l-34 58 34 28c32 27 33 29 30 99l-3 71 53 25c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z"/>
              <path d="M3547 3638c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
              <path d="M2826 3435c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
              <path d="M3153 3281c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
              <path d="M3305 3131c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
            </g>
          </svg>
          <span className="font-header font-bold text-lg hidden sm:inline text-[var(--text-primary)]">Love Languages</span>
        </div>

        {/* Center: Nav items - centered on mobile */}
        <div className="flex-1 flex justify-center md:justify-center gap-1 md:gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${item.hideOnMobile ? 'hidden md:flex' : 'flex'} items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-xl transition-all relative ${
                  isActive
                    ? 'font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: `${accentHex}15`, color: accentHex } : {}}
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden md:inline text-xs uppercase font-black tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Bug Report Button - Hidden on mobile, shown in profile dropdown instead */}
          <button
            onClick={() => {
              setIsBugReportOpen(true);
              setIsNotificationsOpen(false);
              setIsProfileDropdownOpen(false);
            }}
            className="hidden md:block p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all"
            title={t('nav.reportBug')}
          >
            <ICONS.Bug className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>

          {/* Help Guide Button - Hidden on mobile, shown in profile dropdown instead */}
          <button
            onClick={() => {
              setIsHelpOpen(true);
              setIsNotificationsOpen(false);
              setIsProfileDropdownOpen(false);
            }}
            className="hidden md:block p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all"
            title={t('nav.helpGuide')}
          >
            <ICONS.HelpCircle className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>

          {/* Notifications Bell - Hidden on mobile, shown in profile dropdown instead */}
          <div className="relative hidden md:block" ref={notificationsRef}>
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileDropdownOpen(false);
              }}
              className="relative p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all"
            >
              <ICONS.Bell className="w-5 h-5 text-[var(--text-secondary)]" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-[var(--bg-card)] font-bold"
                  style={{ backgroundColor: accentHex }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{t('nav.notifications')}</span>
                  {unreadCount > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                    >
                      {t('nav.newCount', { count: unreadCount })}
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <span className="text-2xl mb-2 block">🔔</span>
                      <p className="text-sm text-[var(--text-secondary)]">{t('nav.noNotifications')}</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer`}
                        style={!notification.read_at ? { backgroundColor: `${accentHex}10` } : {}}
                        onClick={() => {
                          if (!notification.read_at) markAsRead(notification.id);
                          // Navigate based on notification type
                          if (notification.type.includes('challenge')) {
                            navigate('/play');
                          } else if (notification.type.includes('word_gift')) {
                            navigate('/play');
                          }
                          setIsNotificationsOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg shrink-0">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{notification.title}</p>
                            {notification.message && (
                              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{notification.message}</p>
                            )}
                            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="p-1 hover:bg-[var(--bg-primary)] rounded transition-colors shrink-0"
                          >
                            <ICONS.X className="w-3 h-3 text-[var(--text-secondary)]" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 hover:bg-[var(--bg-primary)] rounded-xl px-1 md:px-2 py-1 md:py-1.5 transition-all"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black truncate max-w-[120px] text-[var(--text-primary)]">{profile.full_name}</span>
              <span className="text-[8px] uppercase tracking-[0.2em] font-black" style={{ color: tierColor }}>{translateLevel(levelInfo.displayName, t)} {profile.role}</span>
            </div>
            <div className="relative">
              <div
                className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-black shadow-sm shrink-0 text-xs md:text-sm overflow-hidden"
                style={{ backgroundColor: `${accentHex}20`, color: accentHex, border: `1px solid ${accentHex}30` }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profile.full_name?.[0] || '?').toUpperCase()
                )}
              </div>
              {/* Mobile badge: combined requests + notifications */}
              {(requestCount + unreadCount > 0) && (
                <span
                  className="md:hidden absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-[var(--bg-card)] animate-pulse"
                  style={{ backgroundColor: accentHex }}
                >
                  {requestCount + unreadCount > 9 ? '9+' : requestCount + unreadCount}
                </span>
              )}
              {/* Desktop badge: just requests (notifications have their own bell) */}
              {requestCount > 0 && (
                <span
                  className="hidden md:flex absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] items-center justify-center rounded-full border-2 border-[var(--bg-card)] animate-pulse"
                  style={{ backgroundColor: accentHex }}
                >
                  {requestCount > 9 ? '9+' : requestCount}
                </span>
              )}
            </div>
            <ICONS.ChevronDown className={`hidden md:block w-4 h-4 text-[var(--text-secondary)] transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-1.5 md:mt-2 w-48 md:w-56 bg-[var(--bg-card)] rounded-xl md:rounded-2xl shadow-xl border border-[var(--border-color)] py-1.5 md:py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 md:px-4 py-2 md:py-3 border-b border-[var(--border-color)]">
                <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] truncate">{profile.full_name}</p>
                <p className="text-[9px] md:text-[10px] text-[var(--text-secondary)] truncate">{profile.email}</p>
              </div>

              <button
                onClick={() => { navigate('/profile'); setIsProfileDropdownOpen(false); }}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-[var(--bg-primary)] transition-colors"
              >
                <ICONS.User className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)]" />
                <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">{t('nav.viewProfile')}</span>
                {requestCount > 0 && (
                  <span
                    className="ml-auto text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                  >
                    {requestCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { navigate('/progress'); setIsProfileDropdownOpen(false); }}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-[var(--bg-primary)] transition-colors"
              >
                <ICONS.TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)]" />
                <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">{t('nav.myProgress')}</span>
              </button>

              <button
                onClick={() => { navigate('/log'); setIsProfileDropdownOpen(false); }}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-[var(--bg-primary)] transition-colors"
              >
                <ICONS.Book className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)]" />
                <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">{t('nav.log')}</span>
              </button>

              {/* Mobile-only: Help, Bug Report & Notifications (hidden on desktop where they have dedicated buttons) */}
              <div className="md:hidden border-t border-[var(--border-color)] mt-1.5 pt-1.5">
                <button
                  onClick={() => {
                    setIsBugReportOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ICONS.Bug className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{t('nav.reportBug')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsHelpOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ICONS.HelpCircle className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{t('nav.helpGuide')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ICONS.Bell className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{t('nav.notifications')}</span>
                  {unreadCount > 0 && (
                    <span
                      className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="border-t border-[var(--border-color)] mt-1.5 md:mt-2 pt-1.5 md:pt-2">
                <button
                  onClick={() => {
                    const newMuted = sounds.toggleMute();
                    setIsSoundMuted(newMuted);
                    if (!newMuted) sounds.play('notification');
                  }}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  {isSoundMuted ? (
                    <ICONS.VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)]" />
                  ) : (
                    <ICONS.Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)]" />
                  )}
                  <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">
                    {isSoundMuted ? t('nav.unmuteSounds') : t('nav.muteSounds')}
                  </span>
                </button>
                <button
                  onClick={async () => {
                    setIsProfileDropdownOpen(false);
                    await supabase.auth.signOut({ scope: 'local' });
                  }}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-red-500/10 transition-colors text-red-500"
                >
                  <ICONS.LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">{t('nav.signOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </nav>

      {/* Mobile Notifications Panel - slide-in from right */}
      <div
        className={`md:hidden fixed inset-0 z-[200] transition-all duration-300 ${
          isNotificationsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setIsNotificationsOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--bg-card)] shadow-2xl transform transition-transform duration-300 ${
            isNotificationsOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <ICONS.Bell className="w-5 h-5" style={{ color: accentHex }} />
              <span className="text-base font-bold text-[var(--text-primary)]">{t('nav.notifications')}</span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                >
                  {t('nav.newCount', { count: unreadCount })}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors"
            >
              <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-3xl mb-3 block">🔔</span>
                <p className="text-sm text-[var(--text-secondary)]">{t('nav.noNotifications')}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{t('nav.allCaughtUp')}</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer`}
                  style={!notification.read_at ? { backgroundColor: `${accentHex}10` } : {}}
                  onClick={() => {
                    if (!notification.read_at) markAsRead(notification.id);
                    if (notification.type.includes('challenge') || notification.type.includes('word_gift')) {
                      navigate('/play');
                    }
                    setIsNotificationsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{notification.title}</p>
                      {notification.message && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{notification.message}</p>
                      )}
                      <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg transition-colors shrink-0"
                    >
                      <ICONS.X className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Help Guide Panel */}
      <HelpGuide
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        role={profile.role}
      />

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
        profile={profile}
      />
    </>
  );
};

export default Navbar;
