import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Video } from '../types';
import { THEME } from '../constants/theme';
import { Play, Info, ShieldCheck } from 'lucide-react-native';

interface HeroBannerProps {
  video: Video;
  onPlay: (video: Video) => void;
  onInfo?: (video: Video) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ video, onPlay, onInfo }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const bannerHeight = isTablet ? 400 : Math.min(Math.max(width * 0.62, 220), 300);

  return (
    <View style={[styles.container, { height: bannerHeight }]}>
      {/* Background Image */}
      <Image
        source={{ uri: video.thumbnailUrl }}
        style={styles.backdropImage}
        resizeMode="cover"
      />

      {/* Dark Vignette Gradients */}
      <View style={styles.topVignette} />
      <View style={styles.bottomVignette} />

      {/* Foreground Content */}
      <View style={[styles.contentOverlay, isTablet && styles.contentOverlayTablet]}>
        <View style={styles.tagRow}>
          <View style={styles.netflixBadge}>
            <Text style={styles.netflixBadgeN}>P</Text>
          </View>
          <View style={styles.featuredBadge}>
            <ShieldCheck size={13} color={THEME.colors.mint} />
            <Text style={styles.featuredBadgeText}>DESTAQUE SEGURO</Text>
          </View>
        </View>

        <Text style={[styles.title, isTablet && styles.titleTablet]} numberOfLines={2}>
          {video.title}
        </Text>

        <View style={styles.channelRow}>
          {video.channelAvatarUrl ? (
            <Image source={{ uri: video.channelAvatarUrl }} style={styles.channelAvatar} />
          ) : null}
          <Text style={styles.channelTitle}>{video.channelTitle}</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => onPlay(video)}
            activeOpacity={0.8}
          >
            <Play size={20} color="#000000" fill="#000000" />
            <Text style={styles.playButtonText}>Assistir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => onPlay(video)}
            activeOpacity={0.8}
          >
            <Info size={18} color="#FFFFFF" />
            <Text style={styles.infoButtonText}>Detalhes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
  },
  backdropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },
  contentOverlay: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
    gap: 8,
    zIndex: 2,
  },
  contentOverlayTablet: {
    paddingHorizontal: THEME.spacing.xxl,
    paddingBottom: THEME.spacing.xxl,
    maxWidth: 900,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  netflixBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netflixBadgeN: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.mintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.mint,
  },
  featuredBadgeText: {
    color: THEME.colors.mint,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 28,
  },
  titleTablet: {
    fontSize: 30,
    lineHeight: 38,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E5E5',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 6,
    elevation: 3,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
