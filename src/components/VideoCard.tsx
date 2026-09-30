import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Video } from '../types';
import { THEME } from '../constants/theme';
import { ShieldCheck } from 'lucide-react-native';

interface VideoCardProps {
  video: Video;
  onPress: (video: Video) => void;
}

export const VideoCard = React.memo<VideoCardProps>(
  ({ video, onPress }) => {
    // Format publication date to friendly portuguese
    const formatTimeAgo = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        const diffMs = Date.now() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 30) {
          const months = Math.floor(diffDays / 30);
          return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
        }
        if (diffDays > 0) {
          return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
        }
        if (diffHours > 0) {
          return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        }
        return 'Recente';
      } catch {
        return '';
      }
    };

    const optimizedThumb = video.thumbnailUrl
      ? video.thumbnailUrl.replace('maxresdefault.jpg', 'mqdefault.jpg')
      : video.thumbnailUrl;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(video)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Assistir ${video.title} de ${video.channelTitle}`}
      >
        {/* Thumbnail Banner */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: optimizedThumb, cache: 'force-cache' }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        <View style={styles.verifiedOverlay}>
          <ShieldCheck size={14} color="#FFFFFF" />
          <Text style={styles.verifiedOverlayText}>Canal Aprovado</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        {/* Channel Avatar */}
        {video.channelAvatarUrl ? (
          <Image
            source={{ uri: video.channelAvatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {video.channelTitle.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Text Metadata */}
        <View style={styles.metaContainer}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {video.title}
          </Text>
          <View style={styles.channelRow}>
            <Text style={styles.channelTitle} numberOfLines={1}>
              {video.channelTitle}
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(video.publishedAt)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
},
(prev, next) => prev.video.id === next.video.id
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    marginBottom: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  verifiedOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  metaContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    maxWidth: '60%',
  },
  dotSeparator: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  timeAgo: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
});
