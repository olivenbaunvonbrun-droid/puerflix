import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { RealWorldMission } from '../types';

interface Props {
  visible: boolean;
  parentPin: string;
  onComplete: () => void;
  onParentBypass: () => void;
}

const MISSIONS: RealWorldMission[] = [
  {
    id: 'mission_water_frog',
    title: 'Missão Hidratação & Movimento',
    emoji: '🐸',
    actionText: 'Beba um copo de água fresca e dê 5 pulinhos de sapinho bem alto no chão!',
    benefitText: 'Água e pulinhos ativam o oxigênio no cérebro e dão superpoderes!',
  },
  {
    id: 'mission_bear_hug',
    title: 'Missão do Abraço de Urso',
    emoji: '🐻',
    actionText: 'Vá correndo dar um abraço bem forte e apertado no papai, na mamãe ou em quem estiver com você!',
    benefitText: 'O abraço libera hormônios de alegria e amor em toda a família!',
  },
  {
    id: 'mission_nature',
    title: 'Observador da Natureza',
    emoji: '🌳',
    actionText: 'Vá até uma janela ou quintal e encontre uma plantinha, uma nuvem no céu ou um pássaro cantando!',
    benefitText: 'Descansar os olhinhos olhando para longe protege sua visão!',
  },
  {
    id: 'mission_lion_breath',
    title: 'Respiração do Leãozen',
    emoji: '🦁',
    actionText: 'Puxe o ar bem fundo pelo nariz e solte bem devagar 3 vezes, relaxando os ombros!',
    benefitText: 'Acalma a mente e ajuda a manter a concentração afiada!',
  },
  {
    id: 'mission_clean_ninja',
    title: 'Guardião Ninja do Quarto',
    emoji: '🥷',
    actionText: 'Com a velocidade de um ninja, guarde 3 brinquedos ou objetos espalhados no lugar correto!',
    benefitText: 'Cuidar do nosso espaço faz a gente se sentir um verdadeiro campeão!',
  },
];

export const RealWorldMissionModal: React.FC<Props> = ({
  visible,
  parentPin,
  onComplete,
  onParentBypass,
}) => {
  const [currentMission, setCurrentMission] = useState<RealWorldMission>(MISSIONS[0]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  React.useEffect(() => {
    if (visible) {
      const random = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
      setCurrentMission(random);
      setIsCompleted(false);
      setShowPinInput(false);
      setEnteredPin('');
      setPinError(false);
    }
  }, [visible]);

  const handleFinishMission = () => {
    setIsCompleted(true);
    setTimeout(() => {
      setIsCompleted(false);
      onComplete();
    }, 1200);
  };

  const handleBypassSubmit = () => {
    if (enteredPin === parentPin) {
      setShowPinInput(false);
      setEnteredPin('');
      setPinError(false);
      onParentBypass();
    } else {
      setPinError(true);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {isCompleted ? (
            <View style={styles.congratsBox}>
              <Text style={styles.congratsEmoji}>🌟</Text>
              <Text style={styles.congratsTitle}>Missão Cumprida!</Text>
              <Text style={styles.congratsSubtitle}>
                Parabéns por cuidar do seu corpo e da sua família! Vídeos liberados!
              </Text>
            </View>
          ) : (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={styles.badgeTop}>
                <Text style={styles.badgeTopText}>Pausa Ativa no Mundo Real</Text>
              </View>

              <Text style={styles.missionEmoji}>{currentMission.emoji}</Text>
              <Text style={styles.missionTitle}>{currentMission.title}</Text>
              
              <View style={styles.actionBox}>
                <Text style={styles.actionText}>{currentMission.actionText}</Text>
              </View>

              <Text style={styles.benefitText}>💡 {currentMission.benefitText}</Text>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleFinishMission}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Missão Cumprida! ⭐</Text>
              </TouchableOpacity>

              {/* Parent bypass */}
              <View style={styles.footer}>
                {showPinInput ? (
                  <View style={styles.pinRow}>
                    <TextInput
                      style={[styles.pinInput, pinError && styles.pinInputError]}
                      value={enteredPin}
                      onChangeText={t => {
                        setEnteredPin(t);
                        setPinError(false);
                      }}
                      placeholder="PIN dos Pais"
                      placeholderTextColor="#777"
                      secureTextEntry
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    <TouchableOpacity style={styles.bypassBtn} onPress={handleBypassSubmit}>
                      <Text style={styles.bypassBtnText}>Liberar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowPinInput(false)}
                    >
                      <Text style={styles.cancelBtnText}>Voltar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowPinInput(true)}
                    style={styles.openPinBtn}
                  >
                    <Text style={styles.openPinText}>🔒 Sou o responsável (Liberar com PIN)</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: 'rgba(5, 5, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#181A26',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A3048',
  },
  badgeTop: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  badgeTopText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  missionEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionBox: {
    backgroundColor: '#20263A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#364264',
    marginBottom: 12,
    width: '100%',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  doneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  congratsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  congratsEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 15,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#252B3E',
    paddingTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  openPinBtn: {
    padding: 4,
  },
  openPinText: {
    color: '#64748B',
    fontSize: 12,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinInput: {
    backgroundColor: '#0F121C',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384260',
    width: 100,
    fontSize: 13,
    textAlign: 'center',
  },
  pinInputError: {
    borderColor: '#EF4444',
  },
  bypassBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bypassBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    padding: 6,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
