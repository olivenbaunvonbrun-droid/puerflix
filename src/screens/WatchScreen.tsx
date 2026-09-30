import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video, Channel } from '../types';
import { THEME } from '../constants/theme';
import { SafePlayer } from '../components/SafePlayer';
import { VideoCard } from '../components/VideoCard';
import { ArrowLeft, ShieldCheck, ChevronDown, ChevronUp, ShieldAlert, Minimize2 } from 'lucide-react-native';

interface WatchScreenProps {
  video: Video;
  allVideos: Video[];
  channels: Channel[];
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
}

export const WatchScreen: React.FC<WatchScreenProps> = ({
  video,
  allVideos,
  channels,
  onBack,
  onSelectVideo,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recommendationsReady, setRecommendationsReady] = useState(false);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  // Defer heavy list rendering by 50ms so player transition is 60 FPS
  useEffect(() => {
    setRecommendationsReady(false);
    const timer = setTimeout(() => {
      setRecommendationsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [video.id]);

  // Intercept Android hardware back button when in fullscreen
  useEffect(() => {
    if (!isFullScreen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsFullScreen(false);
      return true;
    });
    return () => sub.remove();
  }, [isFullScreen]);

  // Exact column width on tablet so player never overflows the left column
  const maxContainerWidth = 1280;
  const effectiveContainerWidth = Math.min(width, maxContainerWidth);
  const tabletLeftColWidth = isTablet
    ? Math.floor(((effectiveContainerWidth - 32 - 20) * 1.6) / 2.6)
    : width;

  // Fail-Closed Guard: Ensure video belongs to an enabled & permitted channel
  const isVideoAllowed = channels.length === 0 || !video.channelId || channels.some(c => c.id === video.channelId);

  // Recommendations: ONLY from whitelisted channels, capped at 16 for fast tablet rendering
  const relatedVideos = React.useMemo(() => {
    const channelIdSet = new Set(channels.map(c => c.id));
    return allVideos
      .filter(v => v.id !== video.id && (channels.length === 0 || (v.channelId ? channelIdSet.has(v.channelId) : true)))
      .slice(0, 16);
  }, [allVideos, video.id, channels]);

  // Find channel details
  const channel = channels.find(c => c.id === video.channelId);

  if (!isVideoAllowed) {
    return (
      <View style={[styles.container, styles.failClosedContainer]}>
        <View style={[styles.topBar, isTablet && styles.topBarTablet]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={22} color={THEME.colors.textPrimary} />
            <Text style={styles.backText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.failClosedContent}>
          <ShieldAlert size={64} color="#EF4444" />
          <Text style={styles.failClosedTitle}>Vídeo Não Autorizado</Text>
          <Text style={styles.failClosedMessage}>
            Este vídeo pertence a um canal que não está liberado para o perfil atual.
          </Text>
          <TouchableOpacity style={styles.failClosedBtn} onPress={onBack}>
            <Text style={styles.failClosedBtnText}>Ver Vídeos Liberados</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderVideoDetails = () => (
    <View style={styles.detailsContainer}>
      <Text style={[styles.title, isTablet && styles.titleTablet]}>{video.title}</Text>

      {/* Channel Info Card */}
      <View style={styles.channelRow}>
        {channel?.avatarUrl || video.channelAvatarUrl ? (
          <Image
            source={{ uri: channel?.avatarUrl || video.channelAvatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {video.channelTitle.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.channelMeta}>
          <Text style={styles.channelTitle}>{video.channelTitle}</Text>
          <Text style={styles.channelBadge}>Canal Aprovado pelos Pais</Text>
        </View>
      </View>

      {/* Video Description (Optional Expandable) */}
      {video.description ? (
        <TouchableOpacity
          style={styles.descriptionBox}
          onPress={() => setShowFullDescription(!showFullDescription)}
          activeOpacity={0.7}
        >
          <Text
            style={styles.descriptionText}
            numberOfLines={showFullDescription ? undefined : 2}
          >
            {video.description}
          </Text>
          <View style={styles.expandRow}>
            <Text style={styles.expandText}>
              {showFullDescription ? 'Menos' : 'Mais detalhes'}
            </Text>
            {showFullDescription ? (
              <ChevronUp size={16} color={THEME.colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={THEME.colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.recommendationsContainer}>
      <View style={styles.recHeaderRow}>
        <Text style={styles.recommendationsTitle}>Mais vídeos autorizados</Text>
        <ShieldCheck size={16} color={THEME.colors.parental} />
      </View>

      {recommendationsReady && relatedVideos.map((item) => (
        <VideoCard
          key={item.id}
          video={item}
          onPress={(v) => {
            setShowFullDescription(false);
            onSelectVideo(v);
          }}
        />
      ))}
    </View>
  );

  if (isFullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar hidden={true} />
        <SafePlayer
          videoId={video.id}
          isFullScreen={true}
          onToggleFullScreen={() => setIsFullScreen(false)}
        />
        {/* Floating Top Bar with Exit Button */}
        <View style={styles.fullScreenOverlayBar}>
          <TouchableOpacity
            style={styles.exitFullScreenBtn}
            onPress={() => setIsFullScreen(false)}
            activeOpacity={0.8}
            accessibilityLabel="Sair da tela cheia"
          >
            <Minimize2 size={18} color="#FFFFFF" />
            <Text style={styles.exitFullScreenText}>Sair da Tela Cheia</Text>
          </TouchableOpacity>
          <Text style={styles.fullScreenVideoTitle} numberOfLines={1}>
            {video.title}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} style="light" />
      {/* Top Bar with Back Navigation */}
      <View style={[styles.topBar, isTablet && styles.topBarTablet]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={22} color={THEME.colors.textPrimary} />
          <Text style={styles.backText}>Voltar aos vídeos</Text>
        </TouchableOpacity>
        <View style={styles.safeBadge}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.safeBadgeText}>Ambiente Seguro</Text>
        </View>
      </View>

      {isTablet ? (
        /* TABLET & DESKTOP 2-COLUMN SPLIT VIEW */
        <View style={styles.tabletWrapper}>
          <ScrollView style={styles.tabletLeftCol} showsVerticalScrollIndicator={false}>
            <SafePlayer
              videoId={video.id}
              isFullScreen={false}
              onToggleFullScreen={() => setIsFullScreen(true)}
              customWidth={tabletLeftColWidth}
            />
            {renderVideoDetails()}
          </ScrollView>
          <ScrollView style={styles.tabletRightCol} showsVerticalScrollIndicator={false}>
            {renderRecommendations()}
          </ScrollView>
        </View>
      ) : (
        /* MOBILE SINGLE COLUMN */
        <View style={{ flex: 1 }}>
          <SafePlayer
            videoId={video.id}
            isFullScreen={false}
            onToggleFullScreen={() => setIsFullScreen(true)}
            customWidth={width}
          />
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {renderVideoDetails()}
            {renderRecommendations()}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  topBarTablet: {
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
  },
  tabletWrapper: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 20,
  },
  tabletLeftCol: {
    flex: 1.6,
    overflow: 'hidden',
  },
  tabletRightCol: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  contentScroll: {
    flex: 1,
  },
  detailsContainer: {
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    lineHeight: 23,
    marginBottom: THEME.spacing.md,
  },
  titleTablet: {
    fontSize: 22,
    lineHeight: 28,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: THEME.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  channelMeta: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  channelBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  descriptionBox: {
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  descriptionText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  recommendationsContainer: {
    padding: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: THEME.spacing.md,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  failClosedContainer: {
    justifyContent: 'flex-start',
  },
  failClosedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  failClosedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  failClosedMessage: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 22,
  },
  failClosedBtn: {
    marginTop: 12,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.full,
  },
  failClosedBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenOverlayBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  exitFullScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 4,
  },
  exitFullScreenText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fullScreenVideoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
});
