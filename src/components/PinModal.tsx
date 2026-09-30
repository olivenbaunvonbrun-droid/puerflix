import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Lock, Delete, X, ShieldAlert } from 'lucide-react-native';
import { ParentSettings } from '../types';

interface PinModalProps {
  visible: boolean;
  settings: ParentSettings;
  onSuccess: () => void;
  onClose: () => void;
  onResetPinSuccess?: (newPin: string) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  visible,
  settings,
  onSuccess,
  onClose,
  onResetPinSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleKeyPress = (num: string) => {
    if (cooldownSeconds > 0) return;

    if (pin.length < 4) {
      const updated = pin + num;
      setPin(updated);
      setErrorMessage('');

      if (updated.length === 4) {
        // Evaluate PIN
        if (updated === settings.pin) {
          setFailedAttempts(0);
          setTimeout(() => {
            setPin('');
            onSuccess();
          }, 150);
        } else {
          const nextFailures = failedAttempts + 1;
          setFailedAttempts(nextFailures);
          setTimeout(() => {
            if (nextFailures >= 5) {
              setCooldownSeconds(30);
              setErrorMessage('Bloqueado por 30 segundos.');
            } else {
              setErrorMessage(`PIN incorreto (${nextFailures}/5 tentativas)`);
            }
            setPin('');
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleClose = () => {
    setPin('');
    setErrorMessage('');
    setIsRecovering(false);
    setRecoveryAnswer('');
    setNewPin('');
    onClose();
  };

  const handleRecover = () => {
    if (
      recoveryAnswer.trim().toLowerCase() ===
      settings.securityAnswer.trim().toLowerCase()
    ) {
      if (newPin.length !== 4) {
        Alert.alert('Novo PIN', 'Por favor, digite um novo PIN com 4 números.');
        return;
      }
      if (onResetPinSuccess) {
        onResetPinSuccess(newPin);
      }
      Alert.alert('Sucesso', 'Seu PIN foi redefinido com sucesso!');
      setIsRecovering(false);
      setRecoveryAnswer('');
      setNewPin('');
      onSuccess();
    } else {
      Alert.alert('Erro', 'Resposta de segurança incorreta.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <X size={22} color={THEME.colors.textSecondary} />
          </TouchableOpacity>

          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Lock size={28} color="#FFFFFF" />
          </View>

          {!isRecovering ? (
            <>
              <Text style={styles.title}>Área dos Pais</Text>
              <Text style={styles.subtitle}>
                Digite seu PIN de 4 dígitos para gerenciar canais e configurações
              </Text>

              {/* 4-digit PIN Dots */}
              <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      pin.length > index && styles.dotFilled,
                    ]}
                  />
                ))}
              </View>

              {cooldownSeconds > 0 ? (
                <View style={styles.lockoutBadge}>
                  <ShieldAlert size={16} color="#EF4444" />
                  <Text style={styles.lockoutText}>
                    Aguarde {cooldownSeconds}s para tentar novamente
                  </Text>
                </View>
              ) : errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : (
                <View style={styles.errorPlaceholder} />
              )}

              {/* Keypad */}
              <View style={[styles.keypad, cooldownSeconds > 0 && { opacity: 0.35, pointerEvents: 'none' }]}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.key}
                    disabled={cooldownSeconds > 0}
                    onPress={() => handleKeyPress(digit)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keyText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.keyEmpty}
                  onPress={() => setIsRecovering(true)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.forgotText}>Esqueci</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.key}
                  onPress={() => handleKeyPress('0')}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keyAction}
                  onPress={handleDelete}
                  activeOpacity={0.6}
                >
                  <Delete size={24} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Recovery View */
            <View style={styles.recoveryContainer}>
              <View style={styles.recoveryBadge}>
                <ShieldAlert size={18} color={THEME.colors.parental} />
                <Text style={styles.recoveryBadgeText}>Recuperação de Senha</Text>
              </View>
              <Text style={styles.recoveryQuestionText}>
                {settings.securityQuestion}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Sua resposta secreta"
                placeholderTextColor={THEME.colors.textMuted}
                value={recoveryAnswer}
                onChangeText={setRecoveryAnswer}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Novo PIN de 4 números"
                placeholderTextColor={THEME.colors.textMuted}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />

              <View style={styles.recoveryActions}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setIsRecovering(false)}
                >
                  <Text style={styles.btnSecondaryText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleRecover}
                >
                  <Text style={styles.btnPrimaryText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.xl,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.xxl,
    alignItems: 'center',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: THEME.colors.parental,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    elevation: 4,
    shadowColor: THEME.colors.parental,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: THEME.spacing.sm,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    backgroundColor: '#F1F5F9',
  },
  dotFilled: {
    backgroundColor: THEME.colors.parental,
    borderColor: THEME.colors.parental,
    transform: [{ scale: 1.1 }],
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: THEME.spacing.md,
  },
  errorPlaceholder: {
    height: 20,
    marginBottom: THEME.spacing.md,
  },
  lockoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: THEME.spacing.md,
  },
  lockoutText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 12,
  },
  key: {
    width: '30%',
    aspectRatio: 1.3,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  keyEmpty: {
    width: '30%',
    aspectRatio: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyAction: {
    width: '30%',
    aspectRatio: 1.3,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.parental,
    textDecorationLine: 'underline',
  },
  recoveryContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.parentalLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  recoveryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.parental,
  },
  recoveryQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  recoveryActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.parental,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
