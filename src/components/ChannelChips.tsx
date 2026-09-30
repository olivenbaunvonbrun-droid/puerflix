import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, Image, View } from 'react-native';
import { Channel } from '../types';
import { THEME } from '../constants/theme';
import { Plus, ListVideo } from 'lucide-react-native';

interface ChannelChipsProps {
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  onAddChannelPress: () => void;
}

export const ChannelChips: React.FC<ChannelChipsProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  onAddChannelPress,
}) => {
  const enabledChannels = channels.filter(c => c.enabled);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "Todos" Chip */}
        <TouchableOpacity
          style={[
            styles.chip,
            selectedChannelId === null && styles.activeChip,
          ]}
          onPress={() => onSelectChannel(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              selectedChannelId === null && styles.activeChipText,
            ]}
          >
            Todos os Vídeos
          </Text>
        </TouchableOpacity>

        {/* Individual Channel & Playlist Chips */}
        {enabledChannels.map((channel) => {
          const isSelected = selectedChannelId === channel.id;
          const isPlaylist = channel.type === 'PLAYLIST';

          return (
            <TouchableOpacity
              key={channel.id}
              style={[
                styles.chip,
                isSelected && styles.activeChip,
              ]}
              onPress={() => onSelectChannel(isSelected ? null : channel.id)}
              activeOpacity={0.7}
            >
              {isPlaylist ? (
                <ListVideo size={16} color={isSelected ? '#FFFFFF' : THEME.colors.primary} />
              ) : channel.avatarUrl ? (
                <Image
                  source={{ uri: channel.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {channel.title.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.activeChipText,
                ]}
                numberOfLines={1}
              >
                {channel.title}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add Button for Parents */}
        <TouchableOpacity
          style={styles.addChip}
          onPress={onAddChannelPress}
          activeOpacity={0.7}
        >
          <Plus size={16} color={THEME.colors.parental} />
          <Text style={styles.addChipText}>+ Adicionar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingVertical: THEME.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.chipBackground,
  },
  activeChip: {
    backgroundColor: THEME.colors.chipActiveBackground,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  activeChipText: {
    color: THEME.colors.chipActiveText,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.parentalLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.parental,
  },
});
