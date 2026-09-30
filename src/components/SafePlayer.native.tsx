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

// Injected JavaScript to:
// 1. Remove/hide YouTube watermark, "Assista no YouTube" button, video titles, and ads
// 2. Disable window.open to prevent popup windows/browser escape
// 3. Intercept and block all link clicks to prevent escaping to YouTube app or browser
const INJECTED_BLOCK_REDIRECT_SCRIPT = `
(function() {
  function applyBlocker() {
    var style = document.getElementById('puertube-safety-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'puertube-safety-styles';
      style.innerHTML = \`
        .ytp-impression-link,
        .ytp-youtube-button,
        .ytp-title-link,
        .ytp-title,
        .ytp-watermark,
        .ytp-pause-overlay,
        .ytp-ad-overlay-container,
        .ytp-ad-message-container,
        .ytp-ad-module,
        .video-ads,
        a[href*="youtube.com/watch"],
        a[href*="youtu.be"],
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

  applyBlocker();
  document.addEventListener('DOMContentLoaded', applyBlocker);
  if (window.MutationObserver) {
    try {
      var observer = new MutationObserver(applyBlocker);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }

  // Prevent window.open calls
  window.open = function() { return null; };

  // Intercept all link clicks in capture phase to prevent external navigation
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.tagName === 'A') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      el = el.parentNode;
    }
  }, true);
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
            setSupportMultipleWindows: false,
            javaScriptCanOpenWindowsAutomatically: false,
            originWhitelist: ['*'],
            injectedJavaScript: INJECTED_BLOCK_REDIRECT_SCRIPT,
            onShouldStartLoadWithRequest: (request: any) => {
              const url = request.url || '';
              // Allow embed essentials and block watch/channel/external app redirects
              if (
                url.startsWith('https://lonelycpp.github.io') ||
                url.startsWith('https://www.youtube.com/embed') ||
                url.startsWith('https://www.youtube-nocookie.com/embed') ||
                url.includes('googlevideo.com') ||
                url.includes('google.com/recaptcha') ||
                url === 'about:blank'
              ) {
                if (
                  url.includes('youtube.com/watch') ||
                  url.includes('youtube.com/channel') ||
                  url.includes('youtube.com/user') ||
                  url.startsWith('intent://') ||
                  url.startsWith('vnd.youtube')
                ) {
                  return false;
                }
                return true;
              }
              // Block all other external navigations
              return false;
            },
          }}
        />
      </View>

      {/* Control bar when not in fullscreen - fully contained in 100% width */}
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
