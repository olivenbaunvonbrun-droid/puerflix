import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { ExternalLink, ShieldCheck, Maximize2 } from 'lucide-react-native';

interface SafePlayerProps {
  videoId: string;
  onReady?: () => void;
  onChangeState?: (state: string) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  customWidth?: number;
}

export const SafePlayer: React.FC<SafePlayerProps> = ({
  videoId,
  isFullScreen = false,
  onToggleFullScreen,
  customWidth,
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const playerWidth = isFullScreen
    ? width
    : (customWidth && customWidth > 0)
    ? customWidth
    : (isTablet ? Math.min(width * 0.58, 800) : width);

  const playerHeight = isFullScreen
    ? height
    : Math.floor((playerWidth * 9) / 16);

  // Standard embed URL with strict safety parameters (no external recommendations, modest branding, fs=1)
  const standardEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&fs=1`;
  
  // Fallback embed URL (alternate privacy-enhanced domain if primary is blocked by network)
  const fallbackEmbedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&fs=1`;

  const activeUrl = useFallback ? fallbackEmbedUrl : standardEmbedUrl;

  const handleOpenSecurePopup = () => {
    if (typeof window !== 'undefined') {
      window.open(
        `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&fs=1`,
        'PuerFlixSafeWatch',
        'width=850,height=520,menubar=no,toolbar=no,location=no,status=no'
      );
    }
  };

  return (
    <View style={[styles.wrapper, isFullScreen && styles.wrapperFullScreen]}>
      <View
        style={[
          styles.container,
          isFullScreen ? styles.containerFullScreen : { width: playerWidth, height: playerHeight },
        ]}
      >
        {/* @ts-ignore */}
        <iframe
          src={activeUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          title="Safe YouTube Player"
        />
      </View>

      {/* Fallback & Assistance Bar */}
      {!isFullScreen && (
        <View style={[styles.assistantBar, { width: playerWidth }]}>
          <View style={styles.safeTag}>
            <ShieldCheck size={13} color="#10B981" />
            <Text style={styles.safeTagText}>Reprodução Protegida</Text>
          </View>

          <View style={styles.actionsRow}>
            {onToggleFullScreen && (
              <TouchableOpacity
                style={styles.fullscreenBtn}
                onPress={onToggleFullScreen}
                activeOpacity={0.8}
              >
                <Maximize2 size={12} color="#FFFFFF" />
                <Text style={styles.fullscreenBtnText}>Tela Cheia</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setUseFallback(!useFallback)}
            >
              <Text style={styles.toggleBtnText}>
                {useFallback ? 'Modo Padrão' : 'Servidor Alternativo'}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={styles.popupBtn}
                onPress={handleOpenSecurePopup}
              >
                <ExternalLink size={12} color="#CBD5E1" />
                <Text style={styles.popupBtnText}>Janela Direta</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  wrapperFullScreen: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  container: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerFullScreen: {
    width: '100%',
    height: '100%',
  },
  assistantBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  safeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  fullscreenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#262626',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4D4D4',
  },
  popupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#262626',
  },
  popupBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
