import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { THEME } from '../constants/theme';
import { ShieldCheck, Maximize2, RefreshCw } from 'lucide-react-native';

interface SafePlayerProps {
  videoId: string;
  onReady?: () => void;
  onChangeState?: (state: string) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  customWidth?: number;
}

type EngineMode = 'nocookie' | 'cloud' | 'standard';

// Safe containment script:
// 1. Removes YouTube watermark, YouTube logo button, and title links
// 2. Disables window.open to prevent popup escapes
// 3. IMPORTANT: DO NOT inject CSS targeting .video-ads or .ytp-ad-module!
//    YouTube's anti-adblock bot detection inspects ad slot dimensions.
//    Hiding ad containers via display:none triggers "Faça login para confirmar que você não é um bot".
const SAFE_CONTAINMENT_SCRIPT = `
(function() {
  function applyContainment() {
    var style = document.getElementById('puerflix-containment-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'puerflix-containment-styles';
      style.innerHTML = \`
        .ytp-impression-link,
        .ytp-youtube-button,
        .ytp-title-link,
        .ytp-title,
        .ytp-watermark,
        .ytp-pause-overlay,
        .ytp-share-button,
        .ytp-show-cards-title,
        .ytp-overflow-button,
        .ytp-contextmenu {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      \`;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  applyContainment();
  document.addEventListener('DOMContentLoaded', applyContainment);
  if (window.MutationObserver) {
    try {
      var observer = new MutationObserver(applyContainment);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }

  // Prevent window.open calls to open external browsers
  window.open = function() { return null; };
})();
true;
`;

export const SafePlayer: React.FC<SafePlayerProps> = ({
  videoId,
  onReady,
  onChangeState,
  isFullScreen = false,
  onToggleFullScreen,
  customWidth,
}) => {
  const [loading, setLoading] = useState(true);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const [engineMode, setEngineMode] = useState<EngineMode>('nocookie');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  const playerWidth = isFullScreen
    ? windowWidth
    : measuredWidth > 0
    ? measuredWidth
    : customWidth && customWidth > 0
    ? customWidth
    : isTablet
    ? Math.min(Math.floor(windowWidth * 0.55), 720)
    : windowWidth;

  const playerHeight = isFullScreen
    ? windowHeight
    : Math.floor((playerWidth * 9) / 16);

  // Build the target embed URL based on active engine
  let activeUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
    videoId
  )}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&fs=1&enablejsapi=1`;

  if (engineMode === 'cloud') {
    activeUrl = `https://puerflix.vercel.app/player?v=${encodeURIComponent(
      videoId
    )}&mode=nocookie`;
  } else if (engineMode === 'standard') {
    activeUrl = `https://www.youtube.com/embed/${encodeURIComponent(
      videoId
    )}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&fs=1&enablejsapi=1`;
  }

  const cycleEngine = () => {
    setLoading(true);
    if (engineMode === 'nocookie') {
      setEngineMode('cloud');
    } else if (engineMode === 'cloud') {
      setEngineMode('standard');
    } else {
      setEngineMode('nocookie');
    }
  };

  const getEngineLabel = () => {
    switch (engineMode) {
      case 'nocookie':
        return 'Servidor 1 (Sem Rastreio)';
      case 'cloud':
        return 'Servidor 2 (Nuvem PuerFlix)';
      case 'standard':
        return 'Servidor 3 (YouTube Direto)';
    }
  };

  const handleShouldStartLoad = (request: any) => {
    const url = request.url || '';

    // 1. Strictly block escaping to external native apps (YouTube, Play Store)
    if (
      url.startsWith('intent://') ||
      url.startsWith('vnd.youtube') ||
      url.startsWith('market://')
    ) {
      return false;
    }

    // 2. Prevent escaping to general YouTube browsing, channels, or watch pages
    if (
      url.includes('youtube.com/watch') ||
      url.includes('youtube.com/channel') ||
      url.includes('youtube.com/c/') ||
      url.includes('youtube.com/@') ||
      url.includes('youtube.com/user') ||
      url.includes('youtube.com/results') ||
      url.includes('youtube.com/feed')
    ) {
      return false;
    }

    // 3. ALLOW human verification and Google accounts inside the player WebView
    // If YouTube prompts "Faça login para confirmar que você não é um bot",
    // the user CAN complete the login/captcha once, saving cookies in Android WebView permanently!
    if (
      url.includes('accounts.google.com') ||
      url.includes('google.com/signin') ||
      url.includes('apis.google.com') ||
      url.includes('gstatic.com') ||
      url.includes('google.com/recaptcha') ||
      url.includes('youtube.com/signin')
    ) {
      return true;
    }

    // 4. Allow player embeds, media streams, and assets
    return true;
  };

  return (
    <View
      style={[
        styles.container,
        isFullScreen ? styles.containerFullScreen : styles.containerNormal,
      ]}
      onLayout={(e) => {
        if (!isFullScreen) {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && Math.abs(w - measuredWidth) > 2) {
            setMeasuredWidth(w);
          }
        }
      }}
    >
      <View
        style={{
          width: playerWidth,
          height: playerHeight,
          position: 'relative',
          backgroundColor: '#000000',
          overflow: 'hidden',
        }}
      >
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
          </View>
        )}

        <WebView
          key={`${videoId}-${engineMode}`}
          source={{ uri: activeUrl }}
          style={{
            width: playerWidth,
            height: playerHeight,
            backgroundColor: '#000000',
          }}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          cacheEnabled={true}
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          originWhitelist={['*']}
          injectedJavaScript={SAFE_CONTAINMENT_SCRIPT}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            if (onReady) onReady();
          }}
          onError={() => {
            setLoading(false);
          }}
        />
      </View>

      {/* Control & Safety bar beneath the player (when not in fullscreen) */}
      {!isFullScreen && (
        <View style={styles.assistantBar}>
          <View style={styles.safeTag}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.safeTagText}>Reprodução Protegida</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.engineBtn}
              onPress={cycleEngine}
              activeOpacity={0.8}
            >
              <RefreshCw size={12} color="#D4D4D4" />
              <Text style={styles.engineBtnText}>{getEngineLabel()}</Text>
            </TouchableOpacity>

            {onToggleFullScreen && (
              <TouchableOpacity
                style={styles.fullscreenBtn}
                onPress={onToggleFullScreen}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Maximize2 size={13} color="#FFFFFF" />
                <Text style={styles.fullscreenBtnText}>Tela Cheia</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  containerNormal: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: 12,
  },
  containerFullScreen: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  assistantBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  engineBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4D4D4',
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#48484A',
  },
  fullscreenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
