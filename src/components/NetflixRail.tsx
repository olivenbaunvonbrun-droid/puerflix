import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Video } from '../types';
import { NetflixCard } from './NetflixCard';
import { ChevronRight } from 'lucide-react-native';

interface NetflixRailProps {
  title: string;
  icon?: string;
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  onSeeAll?: () => void;
}

export const NetflixRail: React.FC<NetflixRailProps> = React.memo(({
  title,
  icon,
  videos,
  onSelectVideo,
  onSeeAll,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const renderItem = useCallback(
    ({ item }: { item: Video }) => (
      <NetflixCard video={item} onPress={onSelectVideo} />
    ),
    [onSelectVideo]
  );

  const keyExtractor = useCallback((item: Video) => item.id, []);

  if (videos.length === 0) return null;

  const cardWidth = isTablet ? 260 : Math.max(180, Math.min(215, Math.floor(width * 0.52)));
  const itemTotalWidth = cardWidth + 12;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemTotalWidth,
      offset: itemTotalWidth * index,
      index,
    }),
    [itemTotalWidth]
  );

  return (
    <View style={styles.container}>
      {/* Rail Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        {onSeeAll && (
          <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
            <Text style={styles.seeAllText}>Ver tudo</Text>
            <ChevronRight size={14} color="#E2E8F0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Virtualized Horizontal Cards Rail */}
      <FlatList
        horizontal
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={isTablet ? 3 : 2}
        maxToRenderPerBatch={2}
        windowSize={2}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 26,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});
