import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Channel, Video, Category, KidProfile } from '../types';
import { THEME } from '../constants/theme';
import { Header } from '../components/Header';
import { FolderTabs } from '../components/FolderTabs';
import { HeroBanner } from '../components/HeroBanner';
import { ChannelProfilesRail } from '../components/ChannelProfilesRail';
import { NetflixRail } from '../components/NetflixRail';
import {
  ShieldAlert,
  PlusCircle,
  Sparkles,
  ArrowLeft,
  Play,
  ShieldCheck,
  ListVideo,
  Tv,
  LayoutGrid,
} from 'lucide-react-native';

interface HomeScreenProps {
  channels: Channel[];
  categories: Category[];
  videos: Video[];
  loading: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (catId: string | null) => void;
  onRefresh: () => void;
  onSelectVideo: (video: Video) => void;
  onOpenSearch: () => void;
  onOpenParental: () => void;
  onOpenProfileSelector?: () => void;
  onOpenMindGym?: () => void;
  activeProfile?: KidProfile;
  learningEconomyEnabled?: boolean;
  channelViewMode?: 'grid' | 'horizontal';
}

interface GridVideoCardProps {
  video: Video;
  columnWidth: number;
  isTablet: boolean;
  onSelectVideo: (video: Video) => void;
}

const GridVideoCard = React.memo<GridVideoCardProps>(
  ({ video, columnWidth, isTablet, onSelectVideo }) => {
    const optimizedThumb = video.thumbnailUrl
      ? video.thumbnailUrl.replace('maxresdefault.jpg', 'mqdefault.jpg')
      : video.thumbnailUrl;

    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: columnWidth }]}
        onPress={() => onSelectVideo(video)}
        activeOpacity={0.8}
        accessibilityLabel={`Assistir ${video.title}`}
      >
        <View style={styles.gridThumbnailWrapper}>
          <Image
            source={{ uri: optimizedThumb, cache: 'force-cache' }}
            style={styles.gridThumbnail}
            resizeMode="cover"
          />
          <View style={styles.gridPlayOverlay}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          {video.isFromPlaylist ? (
            <View style={styles.gridBadge}>
              <ListVideo size={12} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.gridBadge}>
              <ShieldCheck size={12} color="#34D399" />
            </View>
          )}
        </View>

        <View style={styles.gridCardInfo}>
          <Text style={[styles.gridVideoTitle, isTablet && { fontSize: 14 }]} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.gridVideoChannel} numberOfLines={1}>
            {video.channelTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.video.id === next.video.id && prev.columnWidth === next.columnWidth
);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  channels,
  categories,
  videos,
  loading,
  selectedCategoryId,
  onSelectCategory,
  onRefresh,
  onSelectVideo,
  onOpenSearch,
  onOpenParental,
  onOpenProfileSelector,
  onOpenMindGym,
  activeProfile,
  learningEconomyEnabled,
  channelViewMode = 'grid',
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [visibleChannelVideoCount, setVisibleChannelVideoCount] = useState<number>(18);
  const { width } = useWindowDimensions();

  // Responsive grid calculation for phones and tablets
  const isTablet = width >= 600;
  const numColumns = width >= 1024 ? 4 : width >= 600 ? 3 : 2;
  const gridGap = 12;
  const horizontalPadding = 16;
  const maxContainerWidth = 1280;
  const effectiveWidth = Math.min(width, maxContainerWidth);
  const columnWidth = Math.floor(
    (effectiveWidth - (horizontalPadding * 2) - (gridGap * (numColumns - 1))) / numColumns
  );

  // 1. Filter channels by folder if selected
  const categoryChannels = useMemo(() => {
    return selectedCategoryId
      ? channels.filter(c => c.categoryId === selectedCategoryId)
      : channels;
  }, [channels, selectedCategoryId]);

  // 2. Active enabled channels
  const enabledChannels = useMemo(() => {
    return categoryChannels.filter(c => c.enabled);
  }, [categoryChannels]);

  // 3. Round-robin interleaving for the main discovery feed (varied options across all channels)
  const interleavedVideos = useMemo(() => {
    const activeChans = enabledChannels;
    if (activeChans.length <= 1) return videos;

    const map = new Map<string, Video[]>();
    for (const c of activeChans) {
      map.set(c.id, []);
    }
    for (const v of videos) {
      const list = map.get(v.channelId);
      if (list) {
        list.push(v);
      }
    }

    const queues = Array.from(map.values()).filter(q => q.length > 0);
    if (queues.length === 0) return videos;

    const result: Video[] = [];
    let max = 0;
    for (const q of queues) {
      if (q.length > max) max = q.length;
    }

    for (let i = 0; i < max; i++) {
      for (const q of queues) {
        if (i < q.length) {
          result.push(q[i]);
        }
      }
    }

    return result.length > 0 ? result : videos;
  }, [enabledChannels, videos]);

  // 4. Selected channel metadata and videos (when inside a specific channel)
  const selectedChannel = useMemo(() => {
    return channels.find(c => c.id === selectedChannelId) || null;
  }, [channels, selectedChannelId]);

  const selectedChannelVideos = useMemo(() => {
    if (!selectedChannelId) return [];
    return videos.filter(v => v.channelId === selectedChannelId);
  }, [videos, selectedChannelId]);

  // 5. Precompute map of videos by channel for instant rail rendering without filtering on every frame
  const channelVideosMap = useMemo(() => {
    const map = new Map<string, Video[]>();
    for (const c of enabledChannels) {
      map.set(c.id, []);
    }
    for (const v of videos) {
      const list = map.get(v.channelId);
      if (list) list.push(v);
    }
    return map;
  }, [enabledChannels, videos]);

  // 6. Precompute playlist videos
  const playlistVideos = useMemo(() => {
    return videos.filter(v => v.isFromPlaylist);
  }, [videos]);

  // 7. Pick the featured hero video (first video from interleaved varied pool)
  const heroVideo = interleavedVideos.length > 0 ? interleavedVideos[0] : null;

  // 8. Varied discovery videos for the top mixed rail
  const variedDiscoveryVideos = useMemo(() => {
    return heroVideo
      ? interleavedVideos.slice(1, 16)
      : interleavedVideos.slice(0, 16);
  }, [heroVideo, interleavedVideos]);

  const enabledChannelsCount = channels.filter(c => c.enabled).length;

  return (
    <View style={styles.container}>
      {/* Netflix Floating Header */}
      <Header
        onOpenSearch={onOpenSearch}
        onOpenParental={onOpenParental}
        onOpenProfileSelector={onOpenProfileSelector}
        onOpenMindGym={onOpenMindGym}
        activeProfile={activeProfile}
        learningEconomyEnabled={learningEconomyEnabled}
        showSearch={true}
      />

      {/* Netflix Category Pills */}
      <FolderTabs
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(catId) => {
          onSelectCategory(catId);
          setSelectedChannelId(null);
        }}
      />

      {/* Feed Container */}
      {loading && videos.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Carregando o catálogo seguro...</Text>
        </View>
      ) : enabledChannelsCount === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <ShieldAlert size={48} color={THEME.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum canal ativo</Text>
          <Text style={styles.emptyDescription}>
            Os pais precisam aprovar canais ou playlists do YouTube para que os vídeos apareçam no catálogo.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={onOpenParental}
            activeOpacity={0.8}
          >
            <PlusCircle size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Configurar Conteúdos Aprovados</Text>
          </TouchableOpacity>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles size={40} color="#737373" />
          <Text style={styles.emptyTitle}>Nenhum vídeo nesta categoria</Text>
          <Text style={styles.emptyDescription}>
            Nenhum conteúdo disponível nesta seleção. Selecione "Tudo" ou adicione mais canais.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor={THEME.colors.primary}
              colors={[THEME.colors.primary]}
            />
          }
        >
          {/* ========================================================= */}
          {/* SCENARIO A: SINGLE CHANNEL SELECTED (LIBRARY VIEW)       */}
          {/* ========================================================= */}
          {selectedChannelId !== null && selectedChannel ? (
            <View style={styles.channelLibraryContainer}>
              {/* Channels avatars rail to quickly switch channels */}
              <ChannelProfilesRail
                channels={categoryChannels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
                onAddChannel={onOpenParental}
              />

              {/* Channel Header Banner */}
              <View style={styles.channelHeaderCard}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedChannelId(null)}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={18} color="#FFFFFF" />
                  <Text style={styles.backButtonText}>Todos os Canais</Text>
                </TouchableOpacity>

                <View style={styles.channelHeaderContent}>
                  {selectedChannel.avatarUrl ? (
                    <Image
                      source={{ uri: selectedChannel.avatarUrl }}
                      style={styles.channelHeaderAvatar}
                    />
                  ) : (
                    <View style={[styles.channelHeaderAvatar, styles.channelHeaderAvatarPlaceholder]}>
                      <Tv size={28} color="#94A3B8" />
                    </View>
                  )}

                  <View style={styles.channelHeaderTextGroup}>
                    <View style={styles.channelTitleRow}>
                      <Text style={styles.channelHeaderTitle} numberOfLines={1}>
                        {selectedChannel.title}
                      </Text>
                      {selectedChannel.type === 'PLAYLIST' && (
                        <View style={styles.playlistBadge}>
                          <ListVideo size={12} color="#FFFFFF" />
                          <Text style={styles.playlistBadgeText}>Playlist</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.channelHeaderSub}>
                      {selectedChannelVideos.length} {selectedChannelVideos.length === 1 ? 'vídeo disponível' : 'vídeos disponíveis'}
                    </Text>
                  </View>

                  <View style={styles.viewModeIndicator}>
                    {channelViewMode === 'grid' ? (
                      <View style={styles.viewModePill}>
                        <LayoutGrid size={14} color="#38BDF8" />
                        <Text style={styles.viewModePillText}>Grade</Text>
                      </View>
                    ) : (
                      <View style={styles.viewModePill}>
                        <ListVideo size={14} color="#38BDF8" />
                        <Text style={styles.viewModePillText}>Carrossel</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Display Mode: GRID (Vertical Mosaic with Windowing) */}
              {channelViewMode === 'grid' ? (
                <>
                  <View style={styles.gridContainer}>
                    {selectedChannelVideos.slice(0, visibleChannelVideoCount).map((video) => (
                      <GridVideoCard
                        key={video.id}
                        video={video}
                        columnWidth={columnWidth}
                        isTablet={isTablet}
                        onSelectVideo={onSelectVideo}
                      />
                    ))}
                  </View>

                  {selectedChannelVideos.length > visibleChannelVideoCount && (
                    <TouchableOpacity
                      style={styles.loadMoreBtn}
                      onPress={() => setVisibleChannelVideoCount(prev => prev + 18)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loadMoreText}>
                        Mostrar mais vídeos ({selectedChannelVideos.length - visibleChannelVideoCount} restantes) ↓
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                /* Display Mode: HORIZONTAL CAROUSEL */
                <View style={styles.channelHorizontalContainer}>
                  <NetflixRail
                    title={`Todos os vídeos de ${selectedChannel.title}`}
                    videos={selectedChannelVideos}
                    onSelectVideo={onSelectVideo}
                  />
                </View>
              )}
            </View>
          ) : (
            /* ========================================================= */
            /* SCENARIO B: "TODOS" (ALL CHANNELS - VARIETY & NETFLIX RAILS) */
            /* ========================================================= */
            <>
              {/* 1. HERO BILLBOARD (Varied featured video at top) */}
              {heroVideo && (
                <HeroBanner
                  video={heroVideo}
                  onPlay={onSelectVideo}
                />
              )}

              {/* 2. CHANNELS PROFILES RAIL (Circular Netflix-Kids Avatars) */}
              <ChannelProfilesRail
                channels={categoryChannels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
                onAddChannel={onOpenParental}
              />

              {/* 3. VARIED DISCOVERY RAIL (Interleaved from all channels so kid has variety) */}
              {variedDiscoveryVideos.length > 0 && (
                <NetflixRail
                  title="✨ Descobertas & Variedades"
                  icon="🌟"
                  videos={variedDiscoveryVideos}
                  onSelectVideo={onSelectVideo}
                />
              )}

              {/* 4. INDIVIDUAL NETFLIX RAILS FOR EACH ACTIVE CHANNEL */}
              {enabledChannels.map((channel) => {
                const channelVideos = channelVideosMap.get(channel.id) || [];
                if (channelVideos.length === 0) return null;

                return (
                  <NetflixRail
                    key={channel.id}
                    title={channel.title}
                    videos={channelVideos}
                    onSelectVideo={onSelectVideo}
                    onSeeAll={() => setSelectedChannelId(channel.id)}
                  />
                );
              })}

              {/* 5. PLAYLISTS & SERIES RAIL (If any exists) */}
              {playlistVideos.length > 0 && (
                <NetflixRail
                  title="🎬 Playlists e Séries Autorizadas"
                  icon="🍿"
                  videos={playlistVideos}
                  onSelectVideo={onSelectVideo}
                />
              )}
            </>
          )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#141414',
  },
  scrollContent: {
    paddingBottom: 20,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Channel Library Header Styles */
  channelLibraryContainer: {
    width: '100%',
  },
  channelHeaderCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1F1F1F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  channelHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  channelHeaderAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  channelHeaderAvatarPlaceholder: {
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHeaderTextGroup: {
    flex: 1,
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  channelHeaderSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  playlistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playlistBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  viewModeIndicator: {
    alignItems: 'flex-end',
  },
  viewModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewModePillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Grid Layout Styles */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  gridThumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
  },
  gridPlayOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  gridBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridCardInfo: {
    padding: 10,
  },
  gridVideoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  gridVideoChannel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  channelHorizontalContainer: {
    marginTop: 10,
  },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#1E2235',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E3550',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
