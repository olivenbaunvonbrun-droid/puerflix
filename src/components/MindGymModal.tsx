import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { KidAgeGroup, EducationalChallenge } from '../types';
import { ChallengeService } from '../services/challengeService';
import { X, Sparkles, Award, Coins } from 'lucide-react-native';

interface Props {
  visible: boolean;
  ageGroup: KidAgeGroup;
  currentBalanceMinutes: number;
  onEarnMinutes: (minutesEarned: number) => void;
  onClose: () => void;
}

export const MindGymModal: React.FC<Props> = ({
  visible,
  ageGroup,
  currentBalanceMinutes,
  onEarnMinutes,
  onClose,
}) => {
  const [sessionChallenges, setSessionChallenges] = useState<EducationalChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [completedRound, setCompletedRound] = useState(false);
  const [rewardAmount] = useState(15); // +15 min per round of 3 challenges

  // Start new gym session
  const startNewWorkout = () => {
    const list = ChallengeService.generateChallenges(3, ageGroup, ['MATH', 'LOGIC', 'LANGUAGE']);
    setSessionChallenges(list);
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback('IDLE');
    setCompletedRound(false);
  };

  React.useEffect(() => {
    if (visible) {
      startNewWorkout();
    }
  }, [visible, ageGroup]);

  const currentChallenge = sessionChallenges[currentIndex] || null;

  const handleSelectOption = (index: number) => {
    if (feedback === 'CORRECT') return;
    setSelectedOption(index);

    if (currentChallenge && index === currentChallenge.correctIndex) {
      setFeedback('CORRECT');
      setTimeout(() => {
        if (currentIndex + 1 < sessionChallenges.length) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setFeedback('IDLE');
        } else {
          setCompletedRound(true);
          onEarnMinutes(rewardAmount);
        }
      }, 1100);
    } else {
      setFeedback('WRONG');
      setTimeout(() => {
        setSelectedOption(null);
        setFeedback('IDLE');
      }, 1100);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.gymBadge}>
                <Award size={18} color="#FFD700" />
                <Text style={styles.gymBadgeText}>Ginásio da Mente</Text>
              </View>
              <View style={styles.coinsBadge}>
                <Coins size={14} color="#F59E0B" />
                <Text style={styles.coinsText}>{currentBalanceMinutes} min</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A0A0B0" />
            </TouchableOpacity>
          </View>

          {completedRound ? (
            /* Round Completed Victory */
            <View style={styles.victoryBox}>
              <Text style={styles.bigMedal}>🏅</Text>
              <Text style={styles.victoryTitle}>Incrível! Meta Concluída!</Text>
              <Text style={styles.victorySubtitle}>
                Você treinou seu cérebro com sucesso e conquistou tempo extra para se divertir no PuerFlix!
              </Text>

              <View style={styles.rewardBanner}>
                <Sparkles size={22} color="#FFD700" />
                <Text style={styles.rewardText}>+{rewardAmount} MINUTOS GANHOS!</Text>
                <Sparkles size={22} color="#FFD700" />
              </View>

              <View style={styles.victoryActions}>
                <TouchableOpacity
                  style={styles.moreGymBtn}
                  onPress={startNewWorkout}
                >
                  <Text style={styles.moreGymText}>Treinar Mais (+15 min)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.watchNowBtn}
                  onPress={onClose}
                >
                  <Text style={styles.watchNowText}>Voltar aos Vídeos 🎬</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentChallenge ? (
            /* Active Question */
            <View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  Exercício {currentIndex + 1} de {sessionChallenges.length}
                </Text>
                <Text style={styles.subjectPill}>
                  {ChallengeService.getSubjectLabel(currentChallenge.subject)}
                </Text>
              </View>

              <View style={styles.questionCard}>
                {currentChallenge.visualEmoji && (
                  <Text style={styles.questionEmoji}>{currentChallenge.visualEmoji}</Text>
                )}
                <Text style={styles.questionTitle}>{currentChallenge.question}</Text>
              </View>

              {/* Feedback Alert */}
              {feedback === 'CORRECT' && (
                <View style={styles.feedbackCorrect}>
                  <Text style={styles.feedbackCorrectText}>
                    🎉 {currentChallenge.explanation || 'Sensacional! Ponto para a mente!'}
                  </Text>
                </View>
              )}
              {feedback === 'WRONG' && (
                <View style={styles.feedbackWrong}>
                  <Text style={styles.feedbackWrongText}>
                    🤔 Tente outra opção! Você é muito capaz!
                  </Text>
                </View>
              )}

              {/* Options */}
              <View style={styles.optionsGrid}>
                {currentChallenge.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isRight = isSelected && feedback === 'CORRECT';
                  const isWrong = isSelected && feedback === 'WRONG';

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.optionButton,
                        isRight && styles.optionRight,
                        isWrong && styles.optionWrong,
                      ]}
                      onPress={() => handleSelectOption(idx)}
                      disabled={feedback === 'CORRECT'}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#181824',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#303046',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#26263A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gymBadgeText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2D281E',
    borderWidth: 1,
    borderColor: '#785516',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  coinsText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  subjectPill: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#281E3E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  questionCard: {
    backgroundColor: '#222234',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34344E',
    marginBottom: 14,
  },
  questionEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  feedbackCorrectText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  feedbackWrongText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#262638',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#36364E',
    alignItems: 'center',
  },
  optionRight: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  optionWrong: {
    backgroundColor: '#FA4340',
    borderColor: '#F63C3C',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Victory Box
  victoryBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  bigMedal: {
    fontSize: 60,
    marginBottom: 10,
  },
  victoryTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FECB64',
    textAlign: 'center',
    marginBottom: 6,
  },
  victorySubtitle: {
    fontSize: 14,
    color: '#D0D0E0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2E2208',
    borderWidth: 1.5,
    borderColor: '#FECB64',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  rewardText: {
    color: '#FECB64',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  victoryActions: {
    width: '100%',
    gap: 10,
  },
  moreGymBtn: {
    backgroundColor: '#2A97EE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  moreGymText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  watchNowBtn: {
    backgroundColor: '#FA4340',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  watchNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

