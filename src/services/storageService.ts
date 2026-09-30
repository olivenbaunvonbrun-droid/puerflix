import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, ParentSettings, UsageStats, Category, KidProfile, Video } from '../types';
import { PRESET_CHANNELS } from '../constants/presets';
import { CloudService } from './cloudService';

const STORAGE_KEYS = {
  CHANNELS: '@puertube_channels',
  SETTINGS: '@puertube_parent_settings',
  USAGE: '@puertube_usage_stats',
  CATEGORIES: '@puertube_categories',
  PROFILES: '@puertube_profiles',
  ACTIVE_PROFILE: '@puertube_active_profile_id',
  VIDEOS: '@puertube_cached_videos',
};

export const DEFAULT_PROFILES: KidProfile[] = [
  {
    id: 'kid-default',
    name: 'Crianças',
    avatarEmoji: '🦁',
    ageGroup: '6-8',
    dailyTimeLimitMinutes: 0, // 0 = Sem limite por padrão
    allowedChannelIds: [], // all channels allowed
    screenTimeBalanceMinutes: 30,
    bedtimeModeEnabled: true,
    realWorldMissionsEnabled: true,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'ciencia', name: 'Ciência & Experimentos', icon: '🔬', color: '#3B82F6' },
  { id: 'desenhos', name: 'Desenhos & Animações', icon: '🎨', color: '#EC4899' },
  { id: 'musicas', name: 'Músicas & Cantigas', icon: '🎵', color: '#8B5CF6' },
  { id: 'curiosidades', name: 'Curiosidades & Histórias', icon: '📚', color: '#10B981' },
];

const DEFAULT_SETTINGS: ParentSettings = {
  isConfigured: false,
  pin: '1234', // Default initial PIN before setup
  securityQuestion: 'Qual o nome do primeiro animal de estimação da família?',
  securityAnswer: 'amigo',
  dailyTimeLimitMinutes: 0, // 0 means no time limit
  youtubeApiKey: '',
  preferredCountry: 'BR', // Default channel search country
  learningEconomyEnabled: true,
  bedtimeModeEnabled: true,
  bedtimeStartHour: 19,
  bedtimeEndHour: 7,
  realWorldMissionsEnabled: true,
  channelViewMode: 'grid',
};

export const StorageService = {
  /**
   * CATEGORIES / FOLDERS MANAGEMENT
   */
  async getCategories(): Promise<Category[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    } catch (e) {
      console.error('Error loading categories:', e);
      return DEFAULT_CATEGORIES;
    }
  },

  async saveCategories(categories: Category[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      const user = await CloudService.getCurrentUser();
      if (user && user.id) {
        CloudService.syncToCloud({ userId: user.id, categories });
      }
    } catch (e) {
      console.error('Error saving categories:', e);
    }
  },

  async addCategory(category: Category): Promise<Category[]> {
    const categories = await this.getCategories();
    const updated = [...categories.filter(c => c.id !== category.id), category];
    await this.saveCategories(updated);
    return updated;
  },

  async deleteCategory(categoryId: string): Promise<Category[]> {
    const categories = await this.getCategories();
    const updated = categories.filter(c => c.id !== categoryId);
    await this.saveCategories(updated);

    // Also unassign channels from this deleted category
    const channels = await this.getChannels();
    const updatedChannels = channels.map(c => 
      c.categoryId === categoryId ? { ...c, categoryId: undefined } : c
    );
    await this.saveChannels(updatedChannels);
    return updated;
  },

  /**
   * CHANNELS & PLAYLISTS MANAGEMENT
   */
  async getChannels(): Promise<Channel[]> {
    try {
      const EXCLUDED_IDS = new Set(['UCzBTlYfHYMwVEru4hmLM8hg', 'UCn9Erjy00mpnWeLnRqhsA1g']);
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (data) {
        let stored: Channel[] = JSON.parse(data);
        // Exclude removed channels
        stored = stored.filter(
          c =>
            !EXCLUDED_IDS.has(c.id) &&
            !c.title.toLowerCase().includes('manual do mundo') &&
            !c.title.toLowerCase().includes('ciência todo dia')
        );

        // Ensure any preset native channels are merged in case new ones were added
        const storedIds = new Set(stored.map(c => c.id));
        const missingPresets = PRESET_CHANNELS.filter(p => !storedIds.has(p.id));
        if (missingPresets.length > 0) {
          const merged = [...stored, ...missingPresets];
          await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(merged));
          return merged;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(stored));
        return stored;
      }
      // First run: save presets as initial channels
      await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(PRESET_CHANNELS));
      return PRESET_CHANNELS;
    } catch (e) {
      console.error('Error loading channels:', e);
      return PRESET_CHANNELS;
    }
  },


  async saveChannels(channels: Channel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
      const user = await CloudService.getCurrentUser();
      if (user && user.id) {
        CloudService.syncToCloud({ userId: user.id, channels });
      }
    } catch (e) {
      console.error('Error saving channels:', e);
    }
  },

  async addChannel(channel: Channel): Promise<Channel[]> {
    const channels = await this.getChannels();
    // Prevent duplicates
    const filtered = channels.filter(c => c.id !== channel.id);
    const updated = [channel, ...filtered];
    await this.saveChannels(updated);
    return updated;
  },

  async removeChannel(channelId: string): Promise<Channel[]> {
    const channels = await this.getChannels();
    const updated = channels.filter(c => c.id !== channelId);
    await this.saveChannels(updated);
    return updated;
  },

  async toggleChannel(channelId: string): Promise<Channel[]> {
    const channels = await this.getChannels();
    const updated = channels.map(c => 
      c.id === channelId ? { ...c, enabled: !c.enabled } : c
    );
    await this.saveChannels(updated);
    return updated;
  },

  async assignChannelCategory(channelId: string, categoryId?: string): Promise<Channel[]> {
    const channels = await this.getChannels();
    const updated = channels.map(c => 
      c.id === channelId ? { ...c, categoryId } : c
    );
    await this.saveChannels(updated);
    return updated;
  },

  /**
   * Parental Settings Management
   */
  async getSettings(): Promise<ParentSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error loading settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: ParentSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      const user = await CloudService.getCurrentUser();
      if (user && user.id) {
        CloudService.syncToCloud({ userId: user.id, settings });
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  /**
   * Overwrites local state with account data from the cloud database
   */
  async loadCloudAccountData(cloudData: {
    channels?: Channel[];
    categories?: Category[];
    settings?: ParentSettings | null;
  }): Promise<void> {
    try {
      if (cloudData.channels && Array.isArray(cloudData.channels)) {
        await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(cloudData.channels));
      }
      if (cloudData.categories && Array.isArray(cloudData.categories)) {
        await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudData.categories));
      }
      if (cloudData.settings) {
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudData.settings));
      }
    } catch (e) {
      console.error('Error applying cloud account data:', e);
    }
  },

  async verifyPin(enteredPin: string): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.pin === enteredPin;
  },

  /**
   * Screen Time Management
   */
  async getUsageToday(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USAGE);
      if (data) {
        const stats: UsageStats = JSON.parse(data);
        if (stats.date === today) {
          return stats.minutesUsed;
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },

  async addUsageMinutes(minutes: number): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const current = await this.getUsageToday();
      const updatedMinutes = current + minutes;
      const stats: UsageStats = {
        date: today,
        minutesUsed: updatedMinutes,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(stats));
      return updatedMinutes;
    } catch (e) {
      return 0;
    }
  },

  async grantExtraMinutes(minutes: number): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const current = await this.getUsageToday();
      const updatedMinutes = Math.max(0, current - minutes);
      const stats: UsageStats = {
        date: today,
        minutesUsed: updatedMinutes,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(stats));
      return updatedMinutes;
    } catch (e) {
      return 0;
    }
  },

  async resetUsageToday(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats: UsageStats = {
        date: today,
        minutesUsed: 0,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(stats));
    } catch (e) {
      console.error('Error resetting usage stats:', e);
    }
  },

  /**
   * KID PROFILES MANAGEMENT ("Quem está assistindo?")
   */
  async getProfiles(): Promise<KidProfile[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILES);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    } catch (e) {
      console.error('Error loading kid profiles:', e);
      return DEFAULT_PROFILES;
    }
  },

  async saveProfiles(profiles: KidProfile[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      const user = await CloudService.getCurrentUser();
      if (user && user.id) {
        const settings = await this.getSettings();
        CloudService.syncToCloud({ userId: user.id, settings: { ...settings, profiles } });
      }
    } catch (e) {
      console.error('Error saving kid profiles:', e);
    }
  },

  async getActiveProfileId(): Promise<string> {
    try {
      const id = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
      if (id) return id;
      const profiles = await this.getProfiles();
      const firstId = profiles[0]?.id || 'kid-default';
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, firstId);
      return firstId;
    } catch (e) {
      return 'kid-default';
    }
  },

  async setActiveProfileId(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, id);
    } catch (e) {
      console.error('Error setting active profile:', e);
    }
  },

  async addProfile(profile: KidProfile): Promise<KidProfile[]> {
    const profiles = await this.getProfiles();
    const updated = [...profiles, profile];
    await this.saveProfiles(updated);
    return updated;
  },

  async updateProfile(profile: KidProfile): Promise<KidProfile[]> {
    const profiles = await this.getProfiles();
    const updated = profiles.map(p => (p.id === profile.id ? profile : p));
    await this.saveProfiles(updated);
    return updated;
  },

  async deleteProfile(id: string): Promise<KidProfile[]> {
    const profiles = await this.getProfiles();
    if (profiles.length <= 1) return profiles; // Don't delete the last profile
    const updated = profiles.filter(p => p.id !== id);
    await this.saveProfiles(updated);
    const active = await this.getActiveProfileId();
    if (active === id) {
      await this.setActiveProfileId(updated[0].id);
    }
    return updated;
  },

  async addProfileScreenTime(profileId: string, minutes: number): Promise<number> {
    const profiles = await this.getProfiles();
    let newBalance = 0;
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        newBalance = Math.max(0, (p.screenTimeBalanceMinutes || 0) + minutes);
        return { ...p, screenTimeBalanceMinutes: newBalance };
      }
      return p;
    });
    await this.saveProfiles(updated);
    return newBalance;
  },

  /**
   * High-Performance Instant Video Cache
   */
  async getCachedVideos(): Promise<Video[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveCachedVideos(videos: Video[]): Promise<void> {
    try {
      if (videos && videos.length > 0) {
        // Save top 200 videos to keep disk I/O lightweight (<150KB)
        await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos.slice(0, 200)));
      }
    } catch (e) {
      console.warn('Error saving cached videos:', e);
    }
  },
};
