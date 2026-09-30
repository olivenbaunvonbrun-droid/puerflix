import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { EducationalChallenge } from '../types';
import { ChallengeService } from '../services/challengeService';

interface Props {
  visible: boolean;
  challenges: EducationalChallenge[];
  parentPin: string;
  onComplete: () => void;
  onParentBypass: () => void;
}

export const KidChallengeModal: React.FC<Props> = ({
  visible,
  challenges,
  parentPin,
  onComplete,
  onParentBypass,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // If challenges array is empty or reset
  const currentChallenge = challenges[currentIndex] || null;

  const handleSelectOption = (index: number) => {
    if (feedback === 'CORRECT') return; // already answering next

    setSelectedOption(index);
    if (currentChallenge && index === currentChallenge.correctIndex) {
      setFeedback('CORRECT');
      setTimeout(() => {
        if (currentIndex + 1 < challenges.length) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setFeedback('IDLE');
        } else {
          setIsCompleted(true);
        }
      }, 1200);
    } else {
      setFeedback('WRONG');
      setTimeout(() => {
        setSelectedOption(null);
        setFeedback('IDLE');
      }, 1200);
    }
  };

  const handleResetAndComplete = () => {
    setIsCompleted(false);
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback('IDLE');
    setShowPinInput(false);
    setEnteredPin('');
    onComplete();
  };

  const handleBypassSubmit = () => {
    if (enteredPin === parentPin) {
      setShowPinInput(false);
      setEnteredPin('');
      setPinError(false);
      setCurrentIndex(0);
      setSelectedOption(null);
      setFeedback('IDLE');
      setIsCompleted(false);
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
            /* Victory celebration screen */
            <View style={styles.contentCenter}>
              <Text style={styles.bigTrophy}>🏆</Text>
              <Text style={styles.congratsTitle}>Sensacional!</Text>
              <Text style={styles.congratsSubtitle}>
                Você resolveu todos os desafios como um verdadeiro campeão da mente!
              </Text>

              <View style={styles.starsRow}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.star}>🌟</Text>
                <Text style={styles.star}>⭐</Text>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.8}
                onPress={handleResetAndComplete}
              >
                <Text style={styles.continueButtonText}>Continuar Assistindo 🎬</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Active Challenge View */
            currentChallenge && (
              <View style={{ width: '100%' }}>
                {/* Header with progress */}
                <View style={styles.header}>
                  <View style={styles.badgeContainer}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: ChallengeService.getSubjectBadgeColor(currentChallenge.subject) },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {ChallengeService.getSubjectLabel(currentChallenge.subject)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.progressText}>
                    Desafio {currentIndex + 1} de {challenges.length}
                  </Text>
                </View>

                {/* Question Box */}
                <View style={styles.questionBox}>
                  {currentChallenge.visualEmoji && (
                    <Text style={styles.questionEmoji}>{currentChallenge.visualEmoji}</Text>
                  )}
                  <Text style={styles.questionText}>{currentChallenge.question}</Text>
                </View>

                {/* Feedback Message */}
                {feedback === 'CORRECT' && (
                  <View style={styles.feedbackCorrect}>
                    <Text style={styles.feedbackCorrectText}>
                      🎉 {currentChallenge.explanation || 'Excelente! Você acertou!'}
                    </Text>
                  </View>
                )}
                {feedback === 'WRONG' && (
                  <View style={styles.feedbackWrong}>
                    <Text style={styles.feedbackWrongText}>
                      🤔 Quase lá! Tente de novo, você consegue!
                    </Text>
                  </View>
                )}

                {/* Options List */}
                <View style={styles.optionsGrid}>
                  {currentChallenge.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isRight = isSelected && feedback === 'CORRECT';
                    const isWrong = isSelected && feedback === 'WRONG';

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionBtn,
                          isRight && styles.optionRight,
                          isWrong && styles.optionWrong,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectOption(idx)}
                        disabled={feedback === 'CORRECT'}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            (isRight || isWrong) && styles.optionTextHighlight,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Parent Bypass Footer */}
                <View style={styles.footer}>
                  {showPinInput ? (
                    <View style={styles.pinBypassRow}>
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
                        style={styles.cancelBypassBtn}
                        onPress={() => setShowPinInput(false)}
                      >
                        <Text style={styles.cancelBypassText}>Voltar</Text>
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
            )
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#181820',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#333344',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  contentCenter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bigTrophy: {
    fontSize: 64,
    marginBottom: 10,
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  star: {
    fontSize: 32,
  },
  continueButton: {
    backgroundColor: '#E50914',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  questionBox: {
    backgroundColor: '#22222E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303042',
    marginBottom: 16,
  },
  questionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  feedbackCorrectText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  feedbackWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  feedbackWrongText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  optionBtn: {
    backgroundColor: '#2A2A38',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3A3A4C',
    alignItems: 'center',
  },
  optionRight: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  optionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#F87171',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextHighlight: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#282836',
    paddingTop: 14,
  },
  openPinBtn: {
    padding: 6,
  },
  openPinText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  pinBypassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinInput: {
    backgroundColor: '#111118',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444455',
    width: 120,
    fontSize: 14,
    textAlign: 'center',
  },
  pinInputError: {
    borderColor: '#EF4444',
  },
  bypassBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bypassBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelBypassBtn: {
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  cancelBypassText: {
    color: '#A0A0B0',
    fontSize: 13,
  },
});
