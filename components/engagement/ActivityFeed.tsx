import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { ICONS } from '../../constants';
import { ActivityFeedEvent, ActivityEventType } from '../../types';

interface ActivityFeedProps {
  partnerId?: string;
  limit?: number;
}

interface FormattedEvent {
  id: string;
  eventType: ActivityEventType;
  title: string;
  subtitle?: string;
  data?: Record<string, any>;
  languageCode?: string;
  createdAt: string;
  userId: string;
  userName: string;
  isOwnEvent: boolean;
}

const EVENT_ICONS: Record<ActivityEventType, React.ReactNode> = {
  word_mastered: <ICONS.Star className="w-4 h-4" />,
  level_up: <ICONS.Sparkles className="w-4 h-4" />,
  challenge_completed: <ICONS.Trophy className="w-4 h-4" />,
  challenge_sent: <ICONS.Target className="w-4 h-4" />,
  challenge_request: <ICONS.Mail className="w-4 h-4" />,
  gift_sent: <ICONS.Gift className="w-4 h-4" />,
  gift_received: <ICONS.Gift className="w-4 h-4" />,
  streak_milestone: <ICONS.Zap className="w-4 h-4" />,
  achievement_unlocked: <ICONS.Award className="w-4 h-4" />,
  love_note: <ICONS.Heart className="w-4 h-4" />,
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ partnerId, limit = 20 }) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<FormattedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine' | 'partner'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, [partnerId, filter]);

  const fetchEvents = async (loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
      setOffset(0);
    }

    try {
      const session = await supabase.auth.getSession();
      const newOffset = loadMore ? offset : 0;

      const response = await fetch(
        `/api/activity-feed?limit=${limit}&offset=${newOffset}&filter=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${session.data.session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (loadMore) {
          setEvents(prev => [...prev, ...data.events]);
        } else {
          setEvents(data.events);
        }
        setHasMore(data?.pagination?.hasMore ?? false);
        setOffset(newOffset + data.events.length);
      }
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('time.justNow', 'Just now');
    if (diffMins < 60) return t('time.minutesAgo', '{{count}}m ago', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', '{{count}}h ago', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', '{{count}}d ago', { count: diffDays });

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getEventColor = (eventType: ActivityEventType, isOwn: boolean): string => {
    const colors: Record<ActivityEventType, string> = {
      word_mastered: '#F59E0B', // Amber
      level_up: '#10B981', // Emerald
      challenge_completed: '#8B5CF6', // Purple
      challenge_sent: '#3B82F6', // Blue
      challenge_request: '#3B82F6', // Blue
      gift_sent: '#EC4899', // Pink
      gift_received: '#EC4899', // Pink
      streak_milestone: '#EF4444', // Red
      achievement_unlocked: '#F59E0B', // Amber
      love_note: '#EC4899', // Pink
    };
    return colors[eventType] || '#6B7280';
  };

  return (
    <div className="glass-card rounded-xl md:rounded-[2rem]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-scale-micro font-black font-header uppercase text-[var(--text-secondary)] tracking-widest flex items-center gap-2">
            <ICONS.Clock className="w-4 h-4 text-[var(--accent-color)]" />
            {t('activityFeed.title', 'Together')}
          </h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 glass-card p-1 rounded-lg" role="group" aria-label="Activity filter">
          {(['all', 'mine', 'partner'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`flex-1 py-1.5 px-3 rounded-md text-scale-micro font-bold transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${
                filter === f
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {f === 'all'
                ? t('activityFeed.filter.all', 'All')
                : f === 'mine'
                ? t('activityFeed.filter.mine', 'Mine')
                : t('activityFeed.filter.partner', 'Partner')}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <ICONS.RefreshCw className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl mb-2 block">📭</span>
            <p className="text-[var(--text-secondary)] text-scale-caption">
              {t('activityFeed.empty', 'No activity yet. Start practicing together!')}
            </p>
          </div>
        ) : (
          <>
            {events.map((event) => {
              const eventColor = getEventColor(event.eventType, event.isOwnEvent);
              const icon = EVENT_ICONS[event.eventType] || <ICONS.FileText className="w-4 h-4" />;

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-[var(--bg-primary)]"
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${eventColor}15` }}
                  >
                    <span style={{ color: eventColor }}>{icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-scale-micro font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: event.isOwnEvent ? '#10B98115' : '#3B82F615',
                          color: event.isOwnEvent ? '#10B981' : '#3B82F6',
                        }}
                      >
                        {event.isOwnEvent ? t('activityFeed.you', 'You') : event.userName}
                      </span>
                      <span className="text-scale-micro text-[var(--text-secondary)]">
                        {formatTime(event.createdAt)}
                      </span>
                    </div>
                    <p className="font-bold text-scale-label text-[var(--text-primary)] mt-0.5">
                      {event.title}
                    </p>
                    {event.subtitle && (
                      <p className="text-scale-caption text-[var(--text-secondary)]">
                        {event.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={() => fetchEvents(true)}
                className="w-full py-2 text-scale-caption font-bold text-[var(--accent-color)] hover:text-[var(--accent-color)]/80"
              >
                {t('activityFeed.loadMore', 'Load more')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
