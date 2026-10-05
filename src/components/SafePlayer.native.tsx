import React, { useEffect, useState } from 'react';
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

// YouTube requires embedded mobile clients to identify the application origin.
// The Android package and iOS bundle identifier are both com.puerflix.app.
const APP_ORIGIN = 'https://com.puerflix.app';

const buildEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${encodeURIComponent(
    videoId
  )}?autoplay=1&controls=1&playsinline=1&fs=1&rel=0`;

export const SafePlayer: React.FC<SafePlayerProps> = ({
  videoId,
  onReady,
  isFullScreen = false,
  onToggleFullScreen,
  customWidth,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  useEffect(() => {
    setLoading(true);
    setHasError(false);
  }, [videoId]);

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

  const embedUrl = buildEmbedUrl(videoId);

  const reloadPlayer = () => {
    setLoading(true);
    setHasError(false);
    setRetryKey((current) => current + 1);
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
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={THEME.colors.primary} />
          </View>
        )}

        {/*
          Single native player path.

          Important: load the YouTube embed directly in the system WebView and
          identify PuerFlix through the HTTP Referer header. Avoid local HTML,
          iframe-inside-WebView wrappers, Vercel proxy pages and spoofed user agents.
        */}
        <WebView
          key={`youtube-${videoId}-${retryKey}`}
          source={{
            uri: embedUrl,
            headers: {
              Referer: APP_ORIGIN,
            },
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
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          mixedContentMode="never"
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url || '';
            if (
              url.startsWith('intent://') ||
              url.startsWith('vnd.youtube') ||
              url.startsWith('market://')
            ) {
              return false;
            }
            return true;
          }}
          onLoadStart={() => {
            setLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => {
            setLoading(false);
            if (onReady) onReady();
          }}
          onError={(event) => {
            console.warn('PuerFlix YouTube WebView error:', event.nativeEvent);
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={(event) => {
            console.warn(
              'PuerFlix YouTube HTTP error:',
              event.nativeEvent.statusCode,
              event.nativeEvent.description
            );
            setLoading(false);
            setHasError(true);
          }}
        />
      </View>

      {hasError && !isFullScreen && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={reloadPlayer}
          activeOpacity={0.85}
        >
          <RefreshCw size={13} color="#FEE2E2" />
          <Text style={styles.errorBannerText}>
            Falha na reprodução. Toque para tentar novamente.
          </Text>
        </TouchableOpacity>
      )}

      {!isFullScreen && (
        <View style={styles.assistantBar}>
          <View style={styles.safeTag}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.safeTagText}>Reprodução Protegida</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={reloadPlayer}
              activeOpacity={0.8}
              accessibilityLabel="Recarregar vídeo"
            >
              <RefreshCw size={12} color="#D4D4D4" />
              <Text style={styles.reloadBtnText}>Recarregar</Text>
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
  reloadBtn: {
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
  reloadBtnText: {
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
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#7F1D1D',
    paddingVertical: 7,
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
