import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Moon, Lock, Clock, PlusCircle, Sparkles, Settings, ArrowLeft, Delete } from 'lucide-react-native';

interface ScreenTimeModalProps {
  visible: boolean;
  parentPin: string;
  onOpenParental: () => void;
  onGrantExtraTime: (minutes: number) => void;
  onResetUsageToday: () => void;
}

type ModalStep = 'LOCKED' | 'ENTER_PIN' | 'PARENT_ACTIONS';

export const ScreenTimeModal: React.FC<ScreenTimeModalProps> = ({
  visible,
  parentPin,
  onOpenParental,
  onGrantExtraTime,
  onResetUsageToday,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [step, setStep] = useState<ModalStep>('LOCKED');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state whenever modal is presented
  useEffect(() => {
    if (visible) {
      setStep('LOCKED');
      setPin('');
      setErrorMessage('');
    }
  }, [visible]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const updated = pin + digit;
      setPin(updated);
      setErrorMessage('');

      if (updated.length === 4) {
        if (updated === parentPin) {
          setTimeout(() => {
            setPin('');
            setStep('PARENT_ACTIONS');
          }, 150);
        } else {
          setTimeout(() => {
            setErrorMessage('PIN incorreto. Tente novamente.');
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          {/* STEP 1: REST TIME NOTICE */}
          {step === 'LOCKED' && (
            <View style={styles.contentColumn}>
              <View style={styles.iconCircle}>
                <Moon size={44} color="#F59E0B" />
              </View>

              <Text style={styles.title}>Hora de descansar os olhinhos! ✨</Text>
              <Text style={styles.subtitle}>
                Você atingiu o tempo de vídeos permitido pelos seus pais por hoje.
              </Text>
              <Text style={styles.description}>
                Que tal brincar ao ar livre, desenhar, ler uma historinha ou passar tempo com a família?
              </Text>

              <TouchableOpacity
                style={styles.parentalButton}
                onPress={() => setStep('ENTER_PIN')}
                activeOpacity={0.8}
              >
                <Lock size={18} color="#FFFFFF" />
                <Text style={styles.parentalButtonText}>Acesso dos Pais para Liberar Mais Tempo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: PARENT PIN AUTHENTICATION */}
          {step === 'ENTER_PIN' && (
            <View style={styles.contentColumn}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setPin('');
                  setErrorMessage('');
                  setStep('LOCKED');
                }}
              >
                <ArrowLeft size={18} color="#FFFFFF" />
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>

              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Lock size={36} color="#2A97EE" />
              </View>

              <Text style={styles.title}>Área dos Pais</Text>
              <Text style={styles.subtitle}>
                Digite seu PIN de 4 dígitos para gerenciar o tempo
              </Text>

              {/* PIN Dots */}
              <View style={styles.pinIndicatorContainer}>
                {[0, 1, 2, 3].map(idx => (
                  <View
                    key={idx}
                    style={[
                      styles.pinDot,
                      pin.length > idx && styles.pinDotFilled,
                    ]}
                  />
                ))}
              </View>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {/* Keypad */}
              <View style={styles.keypad}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['C', '0', 'DEL'],
                ].map((row, rIdx) => (
                  <View key={rIdx} style={styles.keypadRow}>
                    {row.map(key => {
                      if (key === 'C') {
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[styles.key, styles.specialKey]}
                            onPress={() => {
                              setPin('');
                              setErrorMessage('');
                            }}
                          >
                            <Text style={styles.specialKeyText}>C</Text>
                          </TouchableOpacity>
                        );
                      }
                      if (key === 'DEL') {
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[styles.key, styles.specialKey]}
                            onPress={handleDelete}
                          >
                            <Delete size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity
                          key={key}
                          style={styles.key}
                          onPress={() => handleKeyPress(key)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.keyText}>{key}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3: PARENT QUICK ACTIONS */}
          {step === 'PARENT_ACTIONS' && (
            <View style={styles.contentColumn}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Clock size={40} color="#16A34A" />
              </View>

              <Text style={styles.title}>Liberar Tempo de Tela</Text>
              <Text style={styles.subtitle}>
                Escolha quanto tempo extra você deseja liberar agora:
              </Text>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionOptionBtn, styles.actionOptionHighlight]}
                  onPress={() => onGrantExtraTime(30)}
                  activeOpacity={0.8}
                >
                  <PlusCircle size={22} color="#FFFFFF" />
                  <View style={styles.actionOptionContent}>
                    <Text style={styles.actionOptionTitleLight}>+30 Minutos Extras</Text>
                    <Text style={styles.actionOptionSubLight}>Libera 30 min imediatamente</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionOptionBtn}
                  onPress={() => onGrantExtraTime(60)}
                  activeOpacity={0.8}
                >
                  <Clock size={22} color="#2A97EE" />
                  <View style={styles.actionOptionContent}>
                    <Text style={styles.actionOptionTitle}>+1 Hora Extra</Text>
                    <Text style={styles.actionOptionSub}>Libera 60 min de reprodução</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionOptionBtn}
                  onPress={onResetUsageToday}
                  activeOpacity={0.8}
                >
                  <Sparkles size={22} color="#F59E0B" />
                  <View style={styles.actionOptionContent}>
                    <Text style={styles.actionOptionTitle}>Sem Limite por Hoje</Text>
                    <Text style={styles.actionOptionSub}>Zera o contador de hoje e libera o uso</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionOptionBtn, { borderColor: THEME.colors.parental }]}
                  onPress={onOpenParental}
                  activeOpacity={0.8}
                >
                  <Settings size={22} color={THEME.colors.parental} />
                  <View style={styles.actionOptionContent}>
                    <Text style={[styles.actionOptionTitle, { color: THEME.colors.parental }]}>
                      Painel Parental Completo
                    </Text>
                    <Text style={styles.actionOptionSub}>
                      Alterar canais, limites fixos e regras
                    </Text>
                  </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  cardTablet: {
    maxWidth: 480,
    padding: THEME.spacing.xxl,
  },
  contentColumn: {
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCD34D',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: THEME.spacing.xl,
  },
  parentalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.parental,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.md,
    width: '100%',
    justifyContent: 'center',
    elevation: 3,
  },
  parentalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pinIndicatorContainer: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  pinDotFilled: {
    backgroundColor: '#2A97EE',
    borderColor: '#38BDF8',
    transform: [{ scale: 1.15 }],
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 10,
    marginTop: 6,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3F3F46',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  specialKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  specialKeyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#242428',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#3F3F46',
  },
  actionOptionHighlight: {
    backgroundColor: '#2A97EE',
    borderColor: '#38BDF8',
  },
  actionOptionContent: {
    flex: 1,
  },
  actionOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionOptionTitleLight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionOptionSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },
  actionOptionSubLight: {
    fontSize: 12,
    color: '#EFF6FF',
    marginTop: 2,
  },
});
