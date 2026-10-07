import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { THEME } from '../constants/theme';
import { ShieldCheck, Maximize2, RefreshCw, Globe, ExternalLink, X } from 'lucide-react-native';
import { StorageService } from '../services/storageService';
import { ParentSettings } from '../types';
import { PinModal } from './PinModal';

interface SafePlayerProps {
  videoId: string;
  onReady?: () => void;
  onChangeState?: (state: string) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  customWidth?: number;
}

// Android package and iOS bundle identifier.
// YouTube's current embedded-player requirements use this as the app identity
// when a mobile WebView supplies an explicit HTTP Referer.
const APP_ORIGIN = 'https://com.puerflix.app';

const buildEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${encodeURIComponent(
    videoId
  )}?autoplay=1&controls=1&playsinline=1&fs=1&rel=0`;

const buildPlayerHtml = (videoId: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    id="yt-player"
    src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=1&playsinline=1&fs=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(APP_ORIGIN)}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    allowfullscreen
  ></iframe>
</body>
</html>
`;

const buildWatchUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

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

  const [parentSettings, setParentSettings] = useState<ParentSettings | null>(null);
  const [showCompatMenu, setShowCompatMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'customTab' | 'youtubeApp'>('customTab');

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  useEffect(() => {
    StorageService.getSettings()
      .then(setParentSettings)
      .catch((err) => console.warn('Erro ao carregar configurações parentais:', err));
  }, []);

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
  const watchUrl = buildWatchUrl(videoId);

  const reloadPlayer = () => {
    setLoading(true);
    setHasError(false);
    setRetryKey((current) => current + 1);
  };

  const handleOpenCompatModal = () => {
    setShowCompatMenu(true);
  };

  const handleSelectCompatOption = (target: 'customTab' | 'youtubeApp') => {
    setSelectedTarget(target);
    setShowCompatMenu(false);
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);

    try {
      if (selectedTarget === 'customTab') {
        // IMPORTANT: use the normal YouTube watch page here, not /embed/.
        // The compatibility path is intended to reuse the trusted browser
        // session/context that already works on networks where anonymous WebView
        // embeds are challenged by YouTube/BotGuard.
        await WebBrowser.openBrowserAsync(watchUrl, {
          toolbarColor: '#000000',
          secondaryToolbarColor: '#1C1C1E',
          showTitle: true,
          enableBarCollapsing: false,
          showInRecents: false,
        });
      } else {
        // HTTPS App Link is more robust than the vnd.youtube: scheme.
        // Android can route this to the official YouTube app when installed and
        // configured; otherwise it opens in the user's browser.
        await Linking.openURL(watchUrl);
      }
    } catch (e) {
      console.warn('Erro ao abrir Modo Compatibilidade:', e);

      // Last-resort fallback to the normal watch page.
      try {
        await WebBrowser.openBrowserAsync(watchUrl);
      } catch (fallbackError) {
        console.warn('Erro no fallback externo do YouTube:', fallbackError);
      }
    }
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

        <WebView
          key={`youtube-${videoId}-${retryKey}`}
          source={{
            html: buildPlayerHtml(videoId),
            baseUrl: APP_ORIGIN,
          }}
          originWhitelist={['*']}
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
        <View style={styles.errorContainer}>
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
          <TouchableOpacity
            style={styles.compatBanner}
            onPress={handleOpenCompatModal}
            activeOpacity={0.85}
          >
            <Globe size={13} color="#93C5FD" />
            <Text style={styles.compatBannerText}>
              Abrir modo de compatibilidade (PIN)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isFullScreen && (
        <View style={styles.assistantBar}>
          <View style={styles.assistantHeader}>
            <View style={styles.safeTag}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.safeTagText}>Reprodução Protegida</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            {onToggleFullScreen && (
              <TouchableOpacity
                style={[styles.actionButton, styles.fullscreenBtn]}
                onPress={onToggleFullScreen}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Tela cheia"
              >
                <Maximize2 size={13} color="#FFFFFF" />
                <Text style={styles.fullscreenBtnText} numberOfLines={1}>
                  Tela cheia
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.compatBtn]}
              onPress={handleOpenCompatModal}
              activeOpacity={0.8}
              accessibilityLabel="Modo Compatibilidade"
            >
              <Globe size={12} color="#60A5FA" />
              <Text style={styles.compatBtnText} numberOfLines={1}>
                Compatibilidade
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.reloadBtn]}
              onPress={reloadPlayer}
              activeOpacity={0.8}
              accessibilityLabel="Recarregar vídeo"
            >
              <RefreshCw size={12} color="#D4D4D4" />
              <Text style={styles.reloadBtnText} numberOfLines={1}>
                Recarregar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showCompatMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompatMenu(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.compatModalBox}>
            <View style={styles.compatModalHeader}>
              <View style={styles.compatHeaderTitleRow}>
                <Globe size={20} color="#3B82F6" />
                <Text style={styles.compatModalTitle}>Modo de Compatibilidade</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCompatMenu(false)}
                style={styles.compatCloseBtn}
              >
                <X size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.compatModalDescription}>
              Se a reprodução integrada for recusada nesta rede, use um dos modos abaixo. Eles abrem a página normal do vídeo, em vez do player incorporado.
            </Text>

            <TouchableOpacity
              style={styles.compatOptionCardPrimary}
              onPress={() => handleSelectCompatOption('customTab')}
              activeOpacity={0.85}
            >
              <View style={styles.compatOptionIconBox}>
                <Globe size={22} color="#FFFFFF" />
              </View>
              <View style={styles.compatOptionTextBox}>
                <View style={styles.compatOptionTitleRow}>
                  <Text style={styles.compatOptionTitlePrimary}>
                    Navegador Seguro
                  </Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Recomendado</Text>
                  </View>
                </View>
                <Text style={styles.compatOptionDescPrimary}>
                  Abre a página normal do vídeo em uma Custom Tab e reutiliza a sessão do navegador do aparelho. Requer PIN.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compatOptionCardSecondary}
              onPress={() => handleSelectCompatOption('youtubeApp')}
              activeOpacity={0.85}
            >
              <View style={styles.compatOptionIconBoxSecondary}>
                <ExternalLink size={20} color="#9CA3AF" />
              </View>
              <View style={styles.compatOptionTextBox}>
                <Text style={styles.compatOptionTitleSecondary}>
                  Abrir no YouTube
                </Text>
                <Text style={styles.compatOptionDescSecondary}>
                  Abre a URL oficial do vídeo. O Android usará o app do YouTube quando disponível e configurado. Requer PIN.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compatCancelBtn}
              onPress={() => setShowCompatMenu(false)}
            >
              <Text style={styles.compatCancelBtnText}>Voltar ao PuerFlix</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showPinModal && parentSettings && (
        <PinModal
          visible={showPinModal}
          settings={parentSettings}
          onSuccess={handlePinSuccess}
          onClose={() => setShowPinModal(false)}
        />
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
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
  },
  compatBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  compatBtnText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  reloadBtn: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3F3F46',
  },
  reloadBtnText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#D4D4D4',
  },
  fullscreenBtn: {
    backgroundColor: '#2C2C2E',
    borderColor: '#48484A',
  },
  fullscreenBtnText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorContainer: {
    width: '100%',
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
  compatBanner: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E40AF',
  },
  compatBannerText: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  compatModalBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  compatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compatHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  compatModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  compatCloseBtn: {
    padding: 4,
  },
  compatModalDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 16,
  },
  compatOptionCardPrimary: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
  },
  compatOptionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compatOptionTextBox: {
    flex: 1,
  },
  compatOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  compatOptionTitlePrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compatOptionDescPrimary: {
    fontSize: 12,
    color: '#93C5FD',
    lineHeight: 16,
  },
  compatOptionCardSecondary: {
    flexDirection: 'row',
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  compatOptionIconBoxSecondary: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#3F3F46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compatOptionTitleSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E4E4E7',
    marginBottom: 2,
  },
  compatOptionDescSecondary: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  compatCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  compatCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
});
