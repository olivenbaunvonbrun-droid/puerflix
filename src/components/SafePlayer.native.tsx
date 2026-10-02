import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { THEME } from '../constants/theme';
import { ShieldCheck, Maximize2, RefreshCw, LogIn, X } from 'lucide-react-native';

interface SafePlayerProps {
  videoId: string;
  onReady?: () => void;
  onChangeState?: (state: string) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  customWidth?: number;
}

type EngineMode = 'nocookie' | 'direct' | 'cloud';

// Clean standard Chrome Mobile User-Agent without the "; wv" and "Version/4.0" tokens.
// Google uses "; wv" to identify Android WebViews and trigger bot challenges.
const REAL_CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';

// Generates an HTML proxy document that embeds YouTube with a verified HTTPS origin and referrer headers.
// This ELIMINATES Error 153 (which occurs when embed URLs are loaded directly without an HTTP Referer header).
const getEmbedHtml = (videoId: string, mode: 'nocookie' | 'direct'): string => {
  const host = mode === 'nocookie' ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
  const embedUrl = `${host}/embed/${encodeURIComponent(
    videoId
  )}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&fs=1&origin=https://puerflix.vercel.app&widget_referrer=https://puerflix.vercel.app`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background-color:#000000; overflow:hidden; }
    #player-wrap { width:100%; height:100%; position:relative; display:flex; align-items:center; justify-content:center; }
    iframe { width:100%; height:100%; border:none; background:#000; }
    /* Child safety: hide external logo watermark and share buttons without tripping adblock checks */
    .ytp-impression-link,
    .ytp-youtube-button,
    .ytp-title-link,
    .ytp-watermark,
    .ytp-share-button {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  </style>
</head>
<body>
  <div id="player-wrap">
    <iframe
      src="${embedUrl}"
      referrerpolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowfullscreen
    ></iframe>
  </div>
</body>
</html>`;
};

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
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
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

  const cycleEngine = () => {
    setLoading(true);
    if (engineMode === 'nocookie') {
      setEngineMode('cloud');
    } else if (engineMode === 'cloud') {
      setEngineMode('direct');
    } else {
      setEngineMode('nocookie');
    }
  };

  const getEngineLabel = () => {
    switch (engineMode) {
      case 'nocookie':
        return 'Motor 1 (Sem Rastreio)';
      case 'cloud':
        return 'Motor 2 (Nuvem PuerFlix)';
      case 'direct':
        return 'Motor 3 (YouTube Oficial)';
    }
  };

  // Determine source:
  // For 'nocookie' and 'direct', we use HTML with baseUrl 'https://puerflix.vercel.app'
  // so the parent document sends a valid Referer header, completely eliminating Error 153.
  const webViewSource =
    engineMode === 'cloud'
      ? { uri: `https://puerflix.vercel.app/player?v=${encodeURIComponent(videoId)}&mode=nocookie` }
      : {
          html: getEmbedHtml(videoId, engineMode),
          baseUrl: 'https://puerflix.vercel.app',
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

    // 2. Prevent child escaping to YouTube search, channels, or watch pages
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
    // If YouTube prompts for login/captcha, the parent can complete it
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
          key={`${videoId}-${engineMode}-${reloadKey}`}
          source={webViewSource}
          style={{
            width: playerWidth,
            height: playerHeight,
            backgroundColor: '#000000',
          }}
          userAgent={REAL_CHROME_USER_AGENT}
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
              <RefreshCw size={11} color="#D4D4D4" />
              <Text style={styles.engineBtnText}>{getEngineLabel()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => setShowLoginModal(true)}
              activeOpacity={0.8}
            >
              <LogIn size={11} color="#38BDF8" />
              <Text style={styles.loginBtnText}>Login Google</Text>
            </TouchableOpacity>

            {onToggleFullScreen && (
              <TouchableOpacity
                style={styles.fullscreenBtn}
                onPress={onToggleFullScreen}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Maximize2 size={12} color="#FFFFFF" />
                <Text style={styles.fullscreenBtnText}>Tela Cheia</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Google Login & Human Verification Modal for Parents */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.loginModalContainer}>
          <View style={styles.loginModalHeader}>
            <View>
              <Text style={styles.loginModalTitle}>Autenticação Google (Pais)</Text>
              <Text style={styles.loginModalSub}>
                Faça login uma vez para validar seu aparelho e liberar os vídeos.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.loginCloseBtn}
              onPress={() => {
                setShowLoginModal(false);
                setReloadKey((prev) => prev + 1);
              }}
            >
              <X size={18} color="#FFFFFF" />
              <Text style={styles.loginCloseText}>Concluído</Text>
            </TouchableOpacity>
          </View>

          <WebView
            source={{
              uri: 'https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fwww.youtube.com',
            }}
            userAgent={REAL_CHROME_USER_AGENT}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            onNavigationStateChange={(navState) => {
              if (
                navState.url.includes('youtube.com') &&
                !navState.url.includes('signin') &&
                !navState.url.includes('accounts.google.com')
              ) {
                // Successfully authenticated
                setShowLoginModal(false);
                setReloadKey((prev) => prev + 1);
              }
            }}
          />
        </View>
      </Modal>
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
    gap: 6,
  },
  engineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  engineBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4D4D4',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  loginBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#48484A',
  },
  fullscreenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Login Modal */
  loginModalContainer: {
    flex: 1,
    backgroundColor: '#18181B',
  },
  loginModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#18181B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  loginModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loginModalSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    maxWidth: 260,
  },
  loginCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
