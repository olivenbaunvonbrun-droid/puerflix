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
import { THEME } from '../constants/theme';
import { ShieldCheck, Maximize2 } from 'lucide-react-native';

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
  onReady,
  onChangeState,
  isFullScreen = false,
  onToggleFullScreen,
  customWidth,
}) => {
  const [loading, setLoading] = useState(true);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  // Responsive dimension calculations:
  // - In fullscreen: fill the entire device viewport (windowWidth x windowHeight)
  // - In normal mode: adapt EXACTLY to container layout width measured by onLayout,
  //   preventing any overflow, clipping, or touch-event displacement
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

        <YoutubePlayer
          height={playerHeight}
          width={playerWidth}
          play={true}
          videoId={videoId}
          useLocalHTML={false}
          baseUrlOverride="https://puerflix.vercel.app/iframe_v2"
          forceAndroidAutoplay={false}
          onReady={() => {
            setLoading(false);
            if (onReady) onReady();
          }}
          onChangeState={(state: string) => {
            if (onChangeState) onChangeState(state);
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
            rel: false, // Prevents external recommendations
            showClosedCaptions: true,
            iv_load_policy: 3, // Suppresses video annotations
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
            userAgent:
              'Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            onShouldStartLoadWithRequest: (request: any) => {
              const url = request.url || '';

              // 1. Block escaping to external native apps (YouTube app, Play Store)
              if (
                url.startsWith('intent://') ||
                url.startsWith('vnd.youtube') ||
                url.startsWith('market://')
              ) {
                return false;
              }

              // 2. Block escaping to general YouTube browsing, channels, or watch pages
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

              // 3. ALLOW all player assets, video streams, Google APIs, recaptcha, auth
              return true;
            },
          }}
        />
      </View>

      {/* Control bar when not in fullscreen */}
      {!isFullScreen && (
        <View style={styles.assistantBar}>
          <View style={styles.safeTag}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.safeTagText}>Reprodução Protegida</Text>
          </View>

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
