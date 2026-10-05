import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
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

type PlayerEngine = 'official' | 'direct' | 'cloud';

export const SafePlayer: React.FC<SafePlayerProps> = ({
  videoId,
  onReady,
  onChangeState,
  isFullScreen = false,
  onToggleFullScreen,
  customWidth,
}) => {
  const [loading, setLoading] = useState(true);
  const [engine, setEngine] = useState<PlayerEngine>('direct');
  const [hasError, setHasError] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  // Responsive dimension calculations:
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
    setHasError(false);
    if (engine === 'direct') {
      setEngine('official');
    } else if (engine === 'official') {
      setEngine('cloud');
    } else {
      setEngine('direct');
    }
  };

  const getEngineLabel = () => {
    switch (engine) {
      case 'direct':
        return 'Servidor 1 (YouTube Direto)';
      case 'official':
        return 'Servidor 2 (Player Oficial)';
      case 'cloud':
        return 'Servidor 3 (Nuvem PuerFlix)';
    }
  };

  // Safe navigation interceptor:
  // Strictly isolates children inside the player while allowing Google sign-in/verification if challenged
  const handleShouldStartLoad = (request: any) => {
    const url = request.url || '';

    // 1. Block escaping to external native applications (YouTube app, Play Store)
    if (
      url.startsWith('intent://') ||
      url.startsWith('vnd.youtube') ||
      url.startsWith('market://')
    ) {
      return false;
    }

    // 2. Block escaping to YouTube browsing, channel homepages, search results
    if (
      url.includes('youtube.com/channel') ||
      url.includes('youtube.com/c/') ||
      url.includes('youtube.com/@') ||
      url.includes('youtube.com/user') ||
      url.includes('youtube.com/results') ||
      url.includes('youtube.com/feed') ||
      url.includes('youtube.com/trending')
    ) {
      return false;
    }

    // 3. ALLOW Google sign in and human verification so if YouTube prompts verification, it completes cleanly
    if (
      url.includes('accounts.google.com') ||
      url.includes('google.com/signin') ||
      url.includes('google.com/recaptcha') ||
      url.includes('gstatic.com') ||
      url.includes('youtube.com/signin')
    ) {
      return true;
    }

    // 4. Block general youtube.com/watch ONLY if it is not an embed or signin callback
    if (url.includes('youtube.com/watch') && !url.includes('embed')) {
      return false;
    }

    // 5. Allow all video streams, player assets, and embed frames
    return true;
  };

  // Direct HTML for Engine 'direct' (First-Party YouTube Context)
  const directHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; background: #000000; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&fs=1&enablejsapi=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</body>
</html>
  `;

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

        {/* ENGINE 1: YouTube Direto com BaseURL Oficial YouTube (Imune a Error 153 e Bloqueios) */}
        {engine === 'direct' && (
          <WebView
            key={`direct-${videoId}`}
            source={{ html: directHtml, baseUrl: 'https://www.youtube.com' }}
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
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => {
              setLoading(false);
              if (onReady) onReady();
            }}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />
        )}

        {/* ENGINE 2: Player Oficial (react-native-youtube-iframe com UserAgent Nativo e Sem Fake UA) */}
        {engine === 'official' && (
          <YoutubePlayer
            key={`official-${videoId}`}
            height={playerHeight}
            width={playerWidth}
            play={true}
            videoId={videoId}
            useLocalHTML={false}
            forceAndroidAutoplay={false}
            onReady={() => {
              setLoading(false);
              if (onReady) onReady();
            }}
            onChangeState={(state: string) => {
              if (onChangeState) onChangeState(state);
            }}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            onFullScreenChange={(status: boolean) => {
              if (onToggleFullScreen && status !== isFullScreen) {
                onToggleFullScreen();
              }
            }}
            initialPlayerParams={{
              preventFullScreen: false,
              controls: true,
              modestbranding: true,
              rel: false,
              showClosedCaptions: true,
              iv_load_policy: 3,
            }}
            webViewProps={{
              allowsFullscreenVideo: true,
              androidHardwareAccelerationDisabled: false,
              androidLayerType: 'hardware',
              domStorageEnabled: true,
              thirdPartyCookiesEnabled: true,
              sharedCookiesEnabled: true,
              cacheEnabled: true,
              mediaPlaybackRequiresUserAction: false,
              setSupportMultipleWindows: false,
              javaScriptCanOpenWindowsAutomatically: false,
              originWhitelist: ['*'],
              // Native Android User Agent - DO NOT fake User-Agent to avoid Google BotGuard mismatch
              onShouldStartLoadWithRequest: handleShouldStartLoad,
            }}
          />
        )}

        {/* ENGINE 3: Nuvem PuerFlix (Hospedagem Vercel com Strict Referrer) */}
        {engine === 'cloud' && (
          <WebView
            key={`cloud-${videoId}`}
            source={{
              uri: `https://puerflix.vercel.app/player?v=${encodeURIComponent(
                videoId
              )}&mode=standard`,
            }}
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
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => {
              setLoading(false);
              if (onReady) onReady();
            }}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />
        )}
      </View>

      {/* Error Recovery Banner if a specific engine fails */}
      {hasError && !isFullScreen && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={cycleEngine}
          activeOpacity={0.85}
        >
          <Text style={styles.errorBannerText}>
            Problema com a reprodução? Toque para alternar o servidor
          </Text>
        </TouchableOpacity>
      )}

      {/* Control & Assistant bar beneath the player (when not in fullscreen) */}
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
  errorBanner: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBannerText: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '700',
  },
});
