import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Video } from '../types';
import { THEME } from '../constants/theme';
import { Play, ShieldCheck, ListVideo } from 'lucide-react-native';

interface NetflixCardProps {
  video: Video;
  onPress: (video: Video) => void;
}

export const NetflixCard = React.memo<NetflixCardProps>(
  ({ video, onPress }) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 600;
    // Phone: ~190-210px (fits ~1.8 cards peek); Tablet: 260px (fits ~3.5 cards peek)
    const cardWidth = isTablet ? 260 : Math.max(180, Math.min(215, Math.floor(width * 0.52)));

    // Optimize thumbnail resolution for fast mobile/tablet rendering
    const optimizedThumb = video.thumbnailUrl
      ? video.thumbnailUrl.replace('maxresdefault.jpg', 'mqdefault.jpg')
      : video.thumbnailUrl;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        onPress={() => onPress(video)}
        activeOpacity={0.8}
        accessibilityLabel={`Assistir ${video.title}`}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: optimizedThumb, cache: 'force-cache' }}
            style={styles.thumbnail}
            resizeMode="cover"
          />

          {/* Play icon overlay on hover/center */}
          <View style={styles.playBadge}>
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>

          {/* Playlist or Safe Badge */}
          {video.isFromPlaylist ? (
            <View style={styles.badgeTopRight}>
              <ListVideo size={12} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.badgeTopRight}>
              <ShieldCheck size={12} color="#34D399" />
            </View>
          )}
        </View>

        <View style={styles.metaContainer}>
          <Text style={[styles.title, isTablet && { fontSize: 14 }]} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={[styles.channelTitle, isTablet && { fontSize: 12 }]} numberOfLines={1}>
            {video.channelTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.video.id === next.video.id
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  metaContainer: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 17,
    marginBottom: 4,
  },
  channelTitle: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '700',
  },
});
