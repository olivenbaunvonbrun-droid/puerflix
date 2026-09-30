import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchEvent, AnalyticsReport, DayUsage, ChannelStat, VideoStat, Video } from '../types';

const STORAGE_KEYS = {
  WATCH_EVENTS: '@puertube_watch_events',
};

export const AnalyticsService = {
  /**
   * Records a video playback event in history, optionally scoped by profileId
   */
  async logWatch(video: Video, durationMinutes: number = 3, profileId?: string): Promise<void> {
    try {
      const event: WatchEvent = {
        videoId: video.id,
        videoTitle: video.title,
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        channelAvatarUrl: video.channelAvatarUrl,
        thumbnailUrl: video.thumbnailUrl,
        timestamp: Date.now(),
        durationMinutes,
        profileId,
      };

      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.WATCH_EVENTS);
      const events: WatchEvent[] = existingData ? JSON.parse(existingData) : [];
      
      // Keep last 300 events to conserve storage
      const updated = [event, ...events].slice(0, 300);
      await AsyncStorage.setItem(STORAGE_KEYS.WATCH_EVENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error logging watch event:', e);
    }
  },

  /**
   * Retrieves all recorded watch events, optionally filtered by kid profile
   */
  async getEvents(profileId?: string): Promise<WatchEvent[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATCH_EVENTS);
      const allEvents: WatchEvent[] = data ? JSON.parse(data) : [];
      if (profileId) {
        return allEvents.filter(ev => !ev.profileId || ev.profileId === profileId);
      }
      return allEvents;
    } catch (e) {
      return [];
    }
  },

  /**
   * Generates a structured 7-day Analytics Report with charts data
   */
  async getAnalyticsReport(profileId?: string): Promise<AnalyticsReport> {
    const events = await this.getEvents(profileId);
    const now = new Date();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // 1. Build last 7 days buckets
    const dailyMap = new Map<string, { dayLabel: string; minutes: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];
      dailyMap.set(isoDate, { dayLabel, minutes: 0 });
    }

    // 2. Aggregate channel stats & video stats
    const channelMap = new Map<string, { title: string; avatarUrl?: string; minutes: number; viewsCount: number }>();
    const videoMap = new Map<string, { title: string; channelTitle: string; thumbnailUrl: string; viewsCount: number }>();

    let totalMinutesThisWeek = 0;
    let totalViewsThisWeek = 0;

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const ev of events) {
      if (ev.timestamp >= sevenDaysAgo) {
        totalViewsThisWeek++;
        totalMinutesThisWeek += ev.durationMinutes || 3;

        // Daily usage
        const eventDate = new Date(ev.timestamp).toISOString().split('T')[0];
        if (dailyMap.has(eventDate)) {
          const cur = dailyMap.get(eventDate)!;
          cur.minutes += ev.durationMinutes || 3;
        }

        // Channels
        if (!channelMap.has(ev.channelId)) {
          channelMap.set(ev.channelId, {
            title: ev.channelTitle,
            avatarUrl: ev.channelAvatarUrl,
            minutes: 0,
            viewsCount: 0,
          });
        }
        const cStat = channelMap.get(ev.channelId)!;
        cStat.minutes += ev.durationMinutes || 3;
        cStat.viewsCount += 1;

        // Videos
        if (!videoMap.has(ev.videoId)) {
          videoMap.set(ev.videoId, {
            title: ev.videoTitle,
            channelTitle: ev.channelTitle,
            thumbnailUrl: ev.thumbnailUrl,
            viewsCount: 0,
          });
        }
        const vStat = videoMap.get(ev.videoId)!;
        vStat.viewsCount += 1;
      }
    }

    // Format daily usage array
    const dailyUsage: DayUsage[] = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      dayLabel: val.dayLabel,
      minutes: val.minutes,
    }));

    // Top channels (sorted by views / minutes)
    const topChannels: ChannelStat[] = Array.from(channelMap.entries())
      .map(([channelId, val]) => ({
        channelId,
        title: val.title,
        avatarUrl: val.avatarUrl,
        minutes: val.minutes,
        viewsCount: val.viewsCount,
      }))
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 5);

    // Top videos (sorted by view count)
    const topVideos: VideoStat[] = Array.from(videoMap.entries())
      .map(([videoId, val]) => ({
        videoId,
        title: val.title,
        channelTitle: val.channelTitle,
        thumbnailUrl: val.thumbnailUrl,
        viewsCount: val.viewsCount,
      }))
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 5);

    const dailyAverageMinutes = Math.round(totalMinutesThisWeek / 7);

    return {
      dailyUsage,
      topChannels,
      topVideos,
      totalMinutesThisWeek,
      dailyAverageMinutes,
      totalViewsThisWeek,
    };
  },

  /**
   * Reset / clear watch history
   */
  async clearAnalytics(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.WATCH_EVENTS);
    } catch (e) {
      console.error('Error clearing analytics:', e);
    }
  },
};
