import { XMLParser } from 'fast-xml-parser';
import { Channel, Video } from '../types';
import { Platform } from 'react-native';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export const YouTubeService = {
  /**
   * Normalizes input into Channel or Playlist identifier.
   */
  parseInput(input: string): { type: 'PLAYLIST' | 'CHANNEL_ID' | 'HANDLE' | 'UNKNOWN'; value: string } {
    const trimmed = input.trim();

    // Playlist check (?list=PL... or PL...)
    const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/) || trimmed.match(/^(PL[a-zA-Z0-9_-]+)$/);
    if (playlistMatch) {
      return { type: 'PLAYLIST', value: playlistMatch[1] };
    }

    // Direct Channel ID pattern (UC followed by 22 chars)
    const channelIdRegex = /UC[a-zA-Z0-9_-]{22}/;
    const directMatch = trimmed.match(channelIdRegex);
    if (directMatch) {
      return { type: 'CHANNEL_ID', value: directMatch[0] };
    }

    // Handle extraction
    const handleRegex = /@([a-zA-Z0-9_.-]+)/;
    const handleMatch = trimmed.match(handleRegex);
    if (handleMatch) {
      return { type: 'HANDLE', value: `@${handleMatch[1]}` };
    }

    // Naked handle without @
    if (/^[a-zA-Z0-9_.-]{3,30}$/.test(trimmed)) {
      return { type: 'HANDLE', value: `@${trimmed}` };
    }

    return { type: 'UNKNOWN', value: trimmed };
  },

  /**
   * Resolves a channel or playlist by URL, handle or ID.
   */
  async resolveChannel(input: string, apiKey?: string): Promise<Channel> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Por favor, informe o link do canal ou da playlist.');
    }

    // 1. If running on Web, use server API to avoid browser CORS issues
    if (Platform.OS === 'web') {
      try {
        const apiUrl = `/api/resolve?input=${encodeURIComponent(trimmed)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.success && data.item) {
          return data.item;
        }
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('fetch')) {
          throw err;
        }
        console.warn('API proxy error, attempting direct resolution:', err);
      }
    }

    // 2. Direct Resolution (Native Android / iOS)
    const parsed = this.parseInput(trimmed);

    // If Playlist
    if (parsed.type === 'PLAYLIST') {
      const playlistId = parsed.value;
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
      const res = await fetch(rssUrl);
      if (res.ok) {
        const text = await res.text();
        const parsedXml = xmlParser.parse(text);
        const title = parsedXml?.feed?.title || `Playlist (${playlistId.slice(0, 8)})`;
        let avatarUrl = undefined;
        const firstEntry = Array.isArray(parsedXml?.feed?.entry) ? parsedXml.feed.entry[0] : parsedXml?.feed?.entry;
        if (firstEntry && firstEntry['media:group']?.['media:thumbnail']?.['@_url']) {
          avatarUrl = firstEntry['media:group']['media:thumbnail']['@_url'];
        }
        return {
          id: playlistId,
          type: 'PLAYLIST',
          title: title.replace(/ - YouTube$/, ''),
          handle: 'Playlist',
          avatarUrl,
          addedAt: Date.now(),
          enabled: true,
        };
      }
      throw new Error('Playlist não encontrada ou privada no YouTube.');
    }

    // If Channel ID
    if (parsed.type === 'CHANNEL_ID') {
      const channelId = parsed.value;
      try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const res = await fetch(rssUrl);
        if (res.ok) {
          const text = await res.text();
          const parsedXml = xmlParser.parse(text);
          const title = parsedXml?.feed?.title || `Canal (${channelId.slice(0, 8)})`;
          return {
            id: channelId,
            type: 'CHANNEL',
            title: title.replace(/ - YouTube$/, ''),
            avatarUrl: `https://yt3.googleusercontent.com/ytc/AIdro_placeholder=s176-c-k-c0x00ffffff-no-rj`,
            addedAt: Date.now(),
            enabled: true,
          };
        }
      } catch (e) {
        console.warn('Could not fetch channel RSS:', e);
      }

      return {
        id: channelId,
        type: 'CHANNEL',
        title: `Canal ${channelId.slice(0, 8)}`,
        avatarUrl: `https://yt3.googleusercontent.com/ytc/AIdro_placeholder=s176-c-k-c0x00ffffff-no-rj`,
        addedAt: Date.now(),
        enabled: true,
      };
    }

    // If Handle
    if (parsed.type === 'HANDLE') {
      const handle = parsed.value;
      const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
      const pageUrl = `https://www.youtube.com/${cleanHandle}`;
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        }
      });
      
      if (res.ok) {
        const html = await res.text();
        const channelIdMatch = 
          html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
          html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/) ||
          html.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/) ||
          html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/) ||
          html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
        
        const channelId = channelIdMatch?.[1];
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
        const title = titleMatch ? titleMatch[1] : cleanHandle;
        const avatarMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
        const avatarUrl = avatarMatch?.[1] || undefined;

        if (channelId) {
          return {
            id: channelId,
            type: 'CHANNEL',
            title: title.replace(/ - YouTube$/, ''),
            handle: cleanHandle,
            avatarUrl,
            addedAt: Date.now(),
            enabled: true,
          };
        }
      }
    }

    throw new Error(`Não foi possível localizar o canal ou playlist para "${trimmed}". Verifique o link e tente novamente.`);
  },

  /**
   * Search channels directly on YouTube by keyword and nationality
   */
  async searchChannels(query: string, country?: string): Promise<Channel[]> {
    if (!query.trim()) return [];

    if (Platform.OS === 'web') {
      try {
        const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
        const apiUrl = `/api/search-channels?query=${encodeURIComponent(query.trim())}${countryParam}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.success && Array.isArray(data.channels)) {
          return data.channels;
        }
      } catch (err) {
        console.warn('Error searching channels via web API:', err);
      }
    }

    return [];
  },

  /**
   * Bulk resolve multiple channels/playlists at once
   */
  async bulkResolve(lines: string[]): Promise<{ success: Channel[]; failed: string[] }> {
    const success: Channel[] = [];
    const failed: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        const item = await this.resolveChannel(line);
        success.push(item);
      } catch (e) {
        failed.push(line);
      }
    }

    return { success, failed };
  },

  /**
   * Fetches latest videos for a specific channel or playlist.
   */
  async fetchChannelVideos(channel: Channel): Promise<Video[]> {
    if (!channel.enabled) return [];

    try {
      const isPlaylist = channel.type === 'PLAYLIST' || channel.id.startsWith('PL');
      let rssUrl = '';

      if (Platform.OS === 'web') {
        const handleParam = channel.handle ? `&handle=${encodeURIComponent(channel.handle)}` : '';
        rssUrl = isPlaylist
          ? `/api/rss?playlist_id=${channel.id}`
          : `/api/rss?channel_id=${channel.id}${handleParam}`;
      } else {
        rssUrl = isPlaylist
          ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${channel.id}`
          : `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
      }

      const res = await fetch(rssUrl);
      if (!res.ok) {
        return [];
      }

      const xmlText = await res.text();
      const parsed = xmlParser.parse(xmlText);
      const feed = parsed?.feed;
      if (!feed || !feed.entry) return [];

      const rawEntries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
      const videos: Video[] = rawEntries.map((entry: any) => {
        const videoId = entry['yt:videoId'] || '';
        const title = entry.title || 'Vídeo';
        const publishedAt = entry.published || new Date().toISOString();
        const group = entry['media:group'] || {};
        const description = group['media:description'] || '';
        const thumbnailUrl = group['media:thumbnail']?.['@_url'] || 
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title,
          description,
          thumbnailUrl,
          channelId: channel.id,
          channelTitle: channel.title,
          channelAvatarUrl: channel.avatarUrl,
          publishedAt,
          categoryId: channel.categoryId,
          isFromPlaylist: isPlaylist,
        };
      }).filter((v: Video) => Boolean(v.id));

      return videos;
    } catch (e) {
      console.error(`Error fetching RSS videos for ${channel.title}:`, e);
      return [];
    }
  },

  /**
   * Fetches videos from all enabled channels and playlists, merges and sorts them.
   */
  async fetchFeed(channels: Channel[]): Promise<Video[]> {
    const enabledChannels = channels.filter(c => c.enabled);
    if (enabledChannels.length === 0) return [];

    const promises = enabledChannels.map(channel => this.fetchChannelVideos(channel));
    const results = await Promise.allSettled(promises);

    const allVideos: Video[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allVideos.push(...result.value);
      }
    }

    const uniqueMap = new Map<string, Video>();
    for (const v of allVideos) {
      uniqueMap.set(v.id, v);
    }

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
  },

  /**
   * Safe search strictly scoped inside allowed channels and playlists!
   */
  searchVideos(query: string, allVideos: Video[], activeChannelId?: string, activeCategoryId?: string): Video[] {
    const q = query.toLowerCase().trim();
    let filtered = allVideos;
    if (activeCategoryId) {
      filtered = filtered.filter(v => v.categoryId === activeCategoryId);
    }
    if (activeChannelId) {
      filtered = filtered.filter(v => v.channelId === activeChannelId);
    }
    if (!q) return filtered;

    return filtered.filter(v => 
      v.title.toLowerCase().includes(q) || 
      (v.description && v.description.toLowerCase().includes(q)) ||
      v.channelTitle.toLowerCase().includes(q)
    );
  }
};
