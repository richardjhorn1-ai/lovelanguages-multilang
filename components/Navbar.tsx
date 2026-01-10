
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { Profile, Notification } from '../types';
import { supabase } from '../services/supabase';
import { getLevelFromXP, getLevelProgress, getTierColor } from '../services/level-utils';
import { useTheme } from '../context/ThemeContext';
import { HelpGuide } from './HelpGuide';
import { BugReportModal } from './BugReportModal';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { accentHex, isDark } = useTheme();

  // Calculate level info from XP
  const levelInfo = useMemo(() => getLevelFromXP(profile.xp || 0), [profile.xp]);
  const levelProgress = useMemo(() => getLevelProgress(profile.xp || 0), [profile.xp]);
  const tierColor = useMemo(() => getTierColor(levelInfo.tier), [levelInfo.tier]);

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
    { path: '/', label: 'Chat', icon: ICONS.MessageCircle, hideOnMobile: false },
    { path: '/log', label: 'Love Log', icon: ICONS.Book, hideOnMobile: false },
    { path: '/play', label: 'Play', icon: ICONS.Play, hideOnMobile: false },
    { path: '/progress', label: 'Progress', icon: ICONS.TrendingUp, hideOnMobile: true },
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
          <ICONS.Heart style={{ color: accentHex, fill: accentHex }} className="w-5 h-5 md:w-6 md:h-6" />
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
            title="Report a Bug"
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
            title="Help & Guide"
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
                  <span className="text-sm font-bold text-[var(--text-primary)]">Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <span className="text-2xl mb-2 block">🔔</span>
                      <p className="text-sm text-[var(--text-secondary)]">No notifications yet</p>
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
              <span className="text-[8px] uppercase tracking-[0.2em] font-black" style={{ color: tierColor }}>{levelInfo.displayName} {profile.role}</span>
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
                <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">View Profile</span>
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
                <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">My Progress</span>
              </button>

              <button
                onClick={() => { navigate('/log'); setIsProfileDropdownOpen(false); }}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-[var(--bg-primary)] transition-colors"
              >
                <ICONS.Book className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)]" />
                <span className="text-xs md:text-sm font-medium text-[var(--text-primary)]">Love Log</span>
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
                  <span className="text-xs font-medium text-[var(--text-primary)]">Report a Bug</span>
                </button>

                <button
                  onClick={() => {
                    setIsHelpOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ICONS.HelpCircle className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Help & Guide</span>
                </button>

                <button
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ICONS.Bell className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Notifications</span>
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
                  onClick={async () => {
                    setIsProfileDropdownOpen(false);
                    await supabase.auth.signOut({ scope: 'local' });
                  }}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left flex items-center gap-2 md:gap-3 hover:bg-red-500/10 transition-colors text-red-500"
                >
                  <ICONS.LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">Sign Out</span>
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
              <span className="text-base font-bold text-[var(--text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                >
                  {unreadCount} new
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
                <p className="text-sm text-[var(--text-secondary)]">No notifications yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">You're all caught up!</p>
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
