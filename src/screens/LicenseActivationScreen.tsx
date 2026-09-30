import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { LicenseService } from '../services/licenseService';
import { AppLicense } from '../types';
import { ShieldCheck, KeyRound, Sparkles, CheckCircle2, Lock, ExternalLink, HelpCircle } from 'lucide-react-native';

interface LicenseActivationScreenProps {
  onActivationSuccess: (license: AppLicense) => void;
  initialKey?: string;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({
  onActivationSuccess,
  initialKey = '',
}) => {
  const [keyInput, setKeyInput] = useState(initialKey);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  useEffect(() => {
    LicenseService.getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    if (initialKey) {
      setKeyInput(initialKey);
    }
  }, [initialKey]);

  const handleFormatKey = (text: string) => {
    // Clean and uppercase
    let cleaned = text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setKeyInput(cleaned);
    setErrorMessage('');
  };

  const handleActivate = async () => {
    if (!keyInput.trim()) {
      setErrorMessage('Por favor, digite a Chave de Ativação que você recebeu.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await LicenseService.activateLicense(keyInput, emailInput);
      if (result.valid && result.license) {
        onActivationSuccess(result.license);
      } else {
        setErrorMessage(result.message || 'Chave de ativação inválida.');
      }
    } catch (e: any) {
      setErrorMessage('Ocorreu um erro ao ativar a licença. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLandingPage = () => {
    const url = 'https://puerflix.com';
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        {/* Header with App Logo */}
        <View style={styles.logoHeader}>
          <Image
            source={require('../../assets/header_icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTextPuer}>Puer</Text>
            <Text style={styles.brandTextFlix}>Flix</Text>
            <View style={styles.kidsBadge}>
              <Text style={styles.kidsBadgeText}>KIDS</Text>
            </View>
          </View>
          <Text style={styles.tagline}>
            A plataforma segura de vídeos infantis escolhidos pelos pais
          </Text>
        </View>

        {/* Security Badge Alert */}
        <View style={styles.benefitBox}>
          <View style={styles.benefitHeader}>
            <ShieldCheck size={18} color="#10B981" />
            <Text style={styles.benefitTitle}>Acesso Protegido por Licença</Text>
          </View>
          <Text style={styles.benefitDesc}>
            Para garantir um ambiente infantil 100% livre de anúncios, sem sugestões viciantes e sem
            risco de fuga para o YouTube aberto, o PuerFlix requer uma licença ativa neste aparelho.
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>CHAVE DE ATIVAÇÃO FAMILIAR</Text>
          <View style={styles.inputWrapper}>
            <KeyRound size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Ex: PUER-XXXX-XXXX-XXXX"
              placeholderTextColor="#64748B"
              value={keyInput}
              onChangeText={handleFormatKey}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            E-MAIL DO RESPONSÁVEL (OPCIONAL)
          </Text>
          <TextInput
            style={styles.textInputSecondary}
            placeholder="seu-email@exemplo.com"
            placeholderTextColor="#64748B"
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Activate Button */}
          <TouchableOpacity
            style={[styles.activateBtn, loading && styles.activateBtnDisabled]}
            onPress={handleActivate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Sparkles size={18} color="#FFFFFF" />
                <Text style={styles.activateBtnText}>Ativar Acesso no Dispositivo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Pillars / Reassurances */}
        <View style={styles.pillarsRow}>
          <View style={styles.pillarItem}>
            <CheckCircle2 size={14} color="#10B981" />
            <Text style={styles.pillarText}>Zero Anúncios</Text>
          </View>
          <View style={styles.pillarItem}>
            <CheckCircle2 size={14} color="#10B981" />
            <Text style={styles.pillarText}>Anti-Pirataria</Text>
          </View>
          <View style={styles.pillarItem}>
            <CheckCircle2 size={14} color="#10B981" />
            <Text style={styles.pillarText}>Curadoria dos Pais</Text>
          </View>
        </View>

        {/* Need a key? Call to Action */}
        <View style={styles.noKeySection}>
          <Text style={styles.noKeyQuestion}>Ainda não possui uma chave de ativação?</Text>
          <TouchableOpacity
            style={styles.buyKeyBtn}
            onPress={handleOpenLandingPage}
            activeOpacity={0.8}
          >
            <Text style={styles.buyKeyBtnText}>Adquira sua licença familiar</Text>
            <ExternalLink size={14} color="#38BDF8" />
          </TouchableOpacity>
        </View>

        {/* Device ID for Support */}
        <View style={styles.deviceFooter}>
          <Lock size={12} color="#64748B" />
          <Text style={styles.deviceText}>
            Identificador deste dispositivo: <Text style={styles.deviceIdHighlight}>{deviceId || 'Detectando...'}</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#18181C',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272F',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardTablet: {
    padding: 32,
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTextPuer: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTextFlix: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: -0.5,
  },
  kidsBadge: {
    backgroundColor: THEME.colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  kidsBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  benefitBox: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  formContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F12',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  textInputSecondary: {
    height: 44,
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
    textAlign: 'center',
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    height: 50,
    borderRadius: 12,
    marginTop: 16,
    elevation: 4,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activateBtnDisabled: {
    opacity: 0.6,
  },
  activateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#26262F',
    marginBottom: 16,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  noKeySection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noKeyQuestion: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  buyKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buyKeyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
    textDecorationLine: 'underline',
  },
  deviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  deviceText: {
    fontSize: 11,
    color: '#64748B',
  },
  deviceIdHighlight: {
    color: '#94A3B8',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    fontWeight: '700',
  },
});
