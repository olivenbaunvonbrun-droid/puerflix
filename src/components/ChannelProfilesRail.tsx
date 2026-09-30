import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Channel } from '../types';
import { THEME } from '../constants/theme';
import { Plus, ListVideo } from 'lucide-react-native';

interface ChannelProfilesRailProps {
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  onAddChannel: () => void;
}

export const ChannelProfilesRail: React.FC<ChannelProfilesRailProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  onAddChannel,
}) => {
  const enabledChannels = channels.filter(c => c.enabled);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Canais & Playlists Autorizados</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Profile */}
        <TouchableOpacity
          style={styles.profileItem}
          onPress={() => onSelectChannel(null)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatarRing, selectedChannelId === null && styles.avatarRingActive]}>
            <View style={styles.allAvatarCircle}>
              <Text style={styles.allAvatarText}>TODOS</Text>
            </View>
          </View>
          <Text
            style={[styles.profileName, selectedChannelId === null && styles.profileNameActive]}
            numberOfLines={1}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {/* Individual Channel Profiles */}
        {enabledChannels.map((channel) => {
          const isSelected = selectedChannelId === channel.id;
          const isPlaylist = channel.type === 'PLAYLIST';

          return (
            <TouchableOpacity
              key={channel.id}
              style={styles.profileItem}
              onPress={() => onSelectChannel(isSelected ? null : channel.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarRing, isSelected && styles.avatarRingActive]}>
                {channel.avatarUrl ? (
                  <Image source={{ uri: channel.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    {isPlaylist ? (
                      <ListVideo size={20} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.avatarInitial}>
                        {channel.title.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <Text
                style={[styles.profileName, isSelected && styles.profileNameActive]}
                numberOfLines={1}
              >
                {channel.title}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add Channel Button for Parents */}
        <TouchableOpacity
          style={styles.profileItem}
          onPress={onAddChannel}
          activeOpacity={0.7}
        >
          <View style={styles.addAvatarCircle}>
            <Plus size={20} color="#E2E8F0" />
          </View>
          <Text style={styles.addProfileName}>+ Adicionar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1F5F9',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 14,
  },
  profileItem: {
    alignItems: 'center',
    width: 68,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingActive: {
    borderColor: THEME.colors.primary,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  allAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  addAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#404040',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 6,
    textAlign: 'center',
  },
  profileNameActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  addProfileName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 6,
    textAlign: 'center',
  },
});
