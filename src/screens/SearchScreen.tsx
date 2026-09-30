import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Video } from '../types';
import { THEME } from '../constants/theme';
import { VideoCard } from '../components/VideoCard';
import { YouTubeService } from '../services/youtubeService';
import { ArrowLeft, Search, X, ShieldAlert } from 'lucide-react-native';

interface SearchScreenProps {
  allVideos: Video[];
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  allVideos,
  onBack,
  onSelectVideo,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    return YouTubeService.searchVideos(query, allVideos);
  }, [query, allVideos]);

  return (
    <View style={styles.container}>
      {/* Top Search Input Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Search size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Buscar nos canais autorizados..."
            placeholderTextColor={THEME.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <X size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Safety Notice Bar */}
      <View style={styles.noticeBar}>
        <Text style={styles.noticeText}>
          🛡️ Busca protegida: os resultados vêm apenas dos canais aprovados pelos pais.
        </Text>
      </View>

      {/* Results List */}
      {query.trim().length > 0 && searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <ShieldAlert size={40} color={THEME.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum vídeo encontrado</Text>
          <Text style={styles.emptyDescription}>
            Não encontramos nenhum vídeo com "{query}" dentro dos canais autorizados pelos seus pais.
          </Text>
        </View>
      ) : (
        <FlatList
          data={query.trim().length > 0 ? searchResults : allVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VideoCard video={item} onPress={onSelectVideo} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#383838',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  noticeBar: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399',
    textAlign: 'center',
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
    gap: 12,
  },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  emptyDescription: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});
