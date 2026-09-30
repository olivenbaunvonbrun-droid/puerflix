import { Channel, Category, ParentSettings, UserProfile } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CLOUD_USER_KEY = '@puerflix_cloud_user';

function getApiBase(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export interface CloudUserData {
  userProfile: UserProfile;
  channels: Channel[];
  playlists?: any[];
  categories: Category[];
  history: any[];
  settings: ParentSettings | null;
  updatedAt?: number;
}

export const CloudService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(CLOUD_USER_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error getting current cloud user:', e);
    }
    return null;
  },

  async setCurrentUser(profile: UserProfile | null): Promise<void> {
    try {
      if (profile) {
        await AsyncStorage.setItem(CLOUD_USER_KEY, JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem(CLOUD_USER_KEY);
      }
    } catch (e) {
      console.error('Error setting current cloud user:', e);
    }
  },

  /**
   * Log in with Google account (or Google One-Tap / OAuth mock token)
   */
  async loginWithGoogle(payload: { email: string; name?: string; avatarUrl?: string; googleId?: string }): Promise<{ user: UserProfile; data?: CloudUserData }> {
    const res = await fetch(`${getApiBase()}/api/cloud/auth-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Falha no login Google (${res.status})`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Erro no login Google');
    }

    await this.setCurrentUser(json.user);
    return { user: json.user, data: json.data };
  },

  async logout(): Promise<void> {
    await this.setCurrentUser(null);
  },

  /**
   * Fetch all user data directly from the Cloud database
   */
  async fetchUserData(userId: string): Promise<CloudUserData | null> {
    try {
      const res = await fetch(`${getApiBase()}/api/cloud/data?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      console.error('Error fetching user data from cloud:', e);
    }
    return null;
  },

  /**
   * Sync local updates to Cloud database
   */
  async syncToCloud(payload: {
    userId: string;
    channels?: Channel[];
    categories?: Category[];
    settings?: ParentSettings;
    history?: any[];
  }): Promise<number | null> {
    try {
      const res = await fetch(`${getApiBase()}/api/cloud/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return json.lastSyncedAt;
        }
      }
    } catch (e) {
      console.error('Error syncing to cloud:', e);
    }
    return null;
  },

  /**
   * Create shareable code and link for channels list
   */
  async createShareCode(channels: Channel[], sharedBy: string = 'Pais PuerFlix'): Promise<{ code: string; shareUrl: string }> {
    const res = await fetch(`${getApiBase()}/api/cloud/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels, sharedBy }),
    });

    if (!res.ok) {
      throw new Error(`Erro ao gerar compartilhamento (${res.status})`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Erro ao gerar código de compartilhamento');
    }

    return { code: json.code, shareUrl: json.shareUrl };
  },

  /**
   * Get shared channels by code
   */
  async getSharedChannels(code: string): Promise<{ channels: Channel[]; sharedBy: string; createdAt: number } | null> {
    try {
      const res = await fetch(`${getApiBase()}/api/cloud/share?code=${encodeURIComponent(code)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.share) {
        return json.share;
      }
    } catch (e) {
      console.error('Error getting shared channels:', e);
    }
    return null;
  },
};
