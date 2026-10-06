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
import { ShieldCheck, Maximize2, RefreshCw, Globe, ExternalLink, X, ShieldAlert } from 'lucide-react-native';
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

  // Compatibility & Parental PIN state
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
      if (selectedTarget === 'youtubeApp') {
        const ytAppUrl = `vnd.youtube:${encodeURIComponent(videoId)}`;
        const ytWebUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
        const canOpen = await Linking.canOpenURL(ytAppUrl).catch(() => false);
        if (canOpen) {
          await Linking.openURL(ytAppUrl);
        } else {
          await Linking.openURL(ytWebUrl);
        }
      } else {
        // Chrome Custom Tab pointing to secure embed
        const customTabUrl = `https://www.youtube.com/embed/${encodeURIComponent(
          videoId
        )}?autoplay=1&playsinline=1&rel=0`;
        await WebBrowser.openBrowserAsync(customTabUrl, {
          toolbarColor: '#000000',
          secondaryToolbarColor: '#1C1C1E',
          showTitle: true,
          enableBarCollapsing: false,
          showInRecents: false,
        });
      }
    } catch (e) {
      console.warn('Erro ao abrir Modo Compatibilidade:', e);
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

        {/*
          Level 1: Native In-App YouTube Embed with Application Referer.
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
              Ou toque para ativar o Modo Compatibilidade (PIN)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isFullScreen && (
        <View style={styles.assistantBar}>
          <View style={styles.safeTag}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.safeTagText}>Reprodução Protegida</Text>
          </View>

          <View style={styles.actionsRow}>
            {/* Level 2 Compatibility Mode Button */}
            <TouchableOpacity
              style={styles.compatBtn}
              onPress={handleOpenCompatModal}
              activeOpacity={0.8}
              accessibilityLabel="Modo Compatibilidade"
            >
              <Globe size={12} color="#60A5FA" />
              <Text style={styles.compatBtnText}>Compatibilidade</Text>
            </TouchableOpacity>

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

      {/* Compatibility Mode Selection Modal */}
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
              Se esta rede Wi-Fi apresentar restrições do YouTube (como aviso de robô ou vídeo indisponível), selecione o modo seguro desejado:
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
                    Navegador Seguro (Custom Tab)
                  </Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Recomendado</Text>
                  </View>
                </View>
                <Text style={styles.compatOptionDescPrimary}>
                  Abre o vídeo em camada segura usando a sessão do Chrome, sem sair do PuerFlix. Requer PIN.
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
                  Abrir no YouTube Oficial
                </Text>
                <Text style={styles.compatOptionDescSecondary}>
                  Abre este vídeo diretamente no aplicativo do YouTube. Requer PIN.
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

      {/* Parental PIN Modal */}
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
  compatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  compatBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
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
  },
  compatModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
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
