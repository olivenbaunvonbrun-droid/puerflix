import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { AnalyticsReport } from '../types';
import { THEME } from '../constants/theme';
import { Clock, Eye, TrendingUp, Award, Video as VideoIcon } from 'lucide-react-native';

interface AnalyticsChartProps {
  report: AnalyticsReport;
  dailyLimitMinutes: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  report,
  dailyLimitMinutes,
}) => {
  const maxMinutes = Math.max(...report.dailyUsage.map(d => d.minutes), dailyLimitMinutes || 30, 20);

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <View style={styles.container}>
      {/* 3 Metric Cards */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Clock size={18} color={THEME.colors.parental} />
          </View>
          <Text style={styles.metricValue}>{formatMinutes(report.totalMinutesThisWeek)}</Text>
          <Text style={styles.metricLabel}>Total na Semana</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <TrendingUp size={18} color="#D97706" />
          </View>
          <Text style={styles.metricValue}>{formatMinutes(report.dailyAverageMinutes)}</Text>
          <Text style={styles.metricLabel}>Média Diária</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Eye size={18} color="#059669" />
          </View>
          <Text style={styles.metricValue}>{report.totalViewsThisWeek}</Text>
          <Text style={styles.metricLabel}>Vídeos Vistos</Text>
        </View>
      </View>

      {/* Weekly Usage Bar Chart */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tempo de Uso nos Últimos 7 Dias</Text>
          {dailyLimitMinutes > 0 && (
            <Text style={styles.limitBadge}>Limite: {dailyLimitMinutes} min/dia</Text>
          )}
        </View>

        <View style={styles.barsContainer}>
          {report.dailyUsage.map((day, idx) => {
            const barHeightPercent = Math.max(Math.min((day.minutes / maxMinutes) * 100, 100), 6);
            const isOverLimit = dailyLimitMinutes > 0 && day.minutes > dailyLimitMinutes;

            return (
              <View key={day.date + idx} style={styles.barCol}>
                <Text style={styles.barValueText}>
                  {day.minutes > 0 ? `${day.minutes}m` : ''}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${barHeightPercent}%`,
                        backgroundColor: isOverLimit ? '#EF4444' : day.minutes > 0 ? THEME.colors.parental : '#CBD5E1',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barDayLabel}>{day.dayLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Channels Ranking */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <Award size={18} color={THEME.colors.primary} />
          <Text style={styles.cardTitle}>Canais Mais Assistidos</Text>
        </View>

        {report.topChannels.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma visualização registrada ainda esta semana.</Text>
        ) : (
          report.topChannels.map((channel, rank) => {
            const maxChanViews = report.topChannels[0]?.viewsCount || 1;
            const progressPercent = Math.min((channel.viewsCount / maxChanViews) * 100, 100);

            return (
              <View key={channel.channelId} style={styles.rankRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{rank + 1}</Text>
                </View>

                {channel.avatarUrl ? (
                  <Image source={{ uri: channel.avatarUrl }} style={styles.channelAvatar} />
                ) : (
                  <View style={styles.channelAvatarPlaceholder}>
                    <Text style={styles.channelAvatarInitial}>{channel.title.charAt(0)}</Text>
                  </View>
                )}

                <View style={styles.rankMeta}>
                  <View style={styles.rankTitleRow}>
                    <Text style={styles.rankTitle} numberOfLines={1}>
                      {channel.title}
                    </Text>
                    <Text style={styles.rankCount}>{channel.viewsCount} visualizações</Text>
                  </View>
                  {/* Visual Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Top Videos Ranking */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <VideoIcon size={18} color={THEME.colors.secondary} />
          <Text style={styles.cardTitle}>Vídeos Favoritos</Text>
        </View>

        {report.topVideos.length === 0 ? (
          <Text style={styles.emptyText}>Os vídeos mais assistidos aparecerão aqui.</Text>
        ) : (
          report.topVideos.map((video, idx) => (
            <View key={video.videoId + idx} style={styles.videoRankRow}>
              <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumbnail} />
              <View style={styles.videoMeta}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.videoChannelTitle} numberOfLines={1}>
                  {video.channelTitle} • {video.viewsCount}x
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  limitBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 95,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    elevation: 1,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.parental,
  },
  channelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  channelAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelAvatarInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  rankMeta: {
    flex: 1,
  },
  rankTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  rankCount: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.parental,
    borderRadius: 3,
  },
  videoRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  videoThumbnail: {
    width: 64,
    aspectRatio: 16 / 9,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  videoMeta: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 17,
  },
  videoChannelTitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
