import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldCheck,
  KeyRound,
  Users,
  Tv,
  Clock,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Moon,
  Award,
  Heart,
  AlertCircle,
} from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { Channel, ParentSettings, KidProfile, KidAgeGroup } from '../types';
import { YouTubeService } from '../services/youtubeService';

interface OnboardingWizardModalProps {
  visible: boolean;
  initialChannels: Channel[];
  initialSettings: ParentSettings;
  initialProfiles: KidProfile[];
  onComplete: (data: {
    settings: ParentSettings;
    channels: Channel[];
    profile: KidProfile;
  }) => void;
  onSkip: () => void;
}

type Step = 'PIN' | 'PROFILE' | 'CHANNELS' | 'RULES';

const AVATAR_LIST = ['🦁', '🐼', '🚀', '🦄', '🦖', '🐬', '🦊', '🐯', '🌟', '🌈', '🦉', '🎨'];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  visible,
  initialChannels,
  initialSettings,
  initialProfiles,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('PIN');

  // Step 1: PIN State
  const [pin, setPin] = useState('1234');
  const [confirmPin, setConfirmPin] = useState('1234');
  const [securityQuestion, setSecurityQuestion] = useState(
    initialSettings.securityQuestion || 'Qual o nome do animal de estimação da família?'
  );
  const [securityAnswer, setSecurityAnswer] = useState(
    initialSettings.securityAnswer || 'amigo'
  );

  // Step 2: Kid Profile State
  const defaultKid = initialProfiles[0] || {
    id: 'kid-1',
    name: 'Filho(a)',
    avatarEmoji: '🦁',
    ageGroup: '6-8' as KidAgeGroup,
    dailyTimeLimitMinutes: 0,
    allowedChannelIds: [],
    screenTimeBalanceMinutes: 30,
    bedtimeModeEnabled: true,
    realWorldMissionsEnabled: true,
  };
  const [kidName, setKidName] = useState(defaultKid.name);
  const [kidAvatar, setKidAvatar] = useState(defaultKid.avatarEmoji);
  const [kidAge, setKidAge] = useState<KidAgeGroup>(defaultKid.ageGroup);

  // Step 3: Channels List & Add State
  const [channelList, setChannelList] = useState<Channel[]>(initialChannels);
  const [channelInput, setChannelInput] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelError, setChannelError] = useState('');

  // Step 4: Rules, Time & Conditions State
  const [dailyLimit, setDailyLimit] = useState(initialSettings.dailyTimeLimitMinutes || 0);
  const [challengesEnabled, setChallengesEnabled] = useState(
    initialSettings.challengesEnabled ?? true
  );
  const [learningEconomyEnabled, setLearningEconomyEnabled] = useState(
    initialSettings.learningEconomyEnabled ?? true
  );
  const [realWorldMissionsEnabled, setRealWorldMissionsEnabled] = useState(
    initialSettings.realWorldMissionsEnabled ?? true
  );
  const [bedtimeModeEnabled, setBedtimeModeEnabled] = useState(
    initialSettings.bedtimeModeEnabled ?? true
  );

  // Error validation banner
  const [stepError, setStepError] = useState('');

  if (!visible) return null;

  // Navigation handlers
  const handleNextFromPin = () => {
    if (pin.length !== 4) {
      setStepError('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }
    if (pin !== confirmPin) {
      setStepError('Os PINs digitados não coincidem.');
      return;
    }
    if (!securityAnswer.trim()) {
      setStepError('Digite uma resposta de recuperação para o PIN.');
      return;
    }
    setStepError('');
    setCurrentStep('PROFILE');
  };

  const handleNextFromProfile = () => {
    if (!kidName.trim()) {
      setStepError('Por favor, informe o nome ou apelido da criança.');
      return;
    }
    setStepError('');
    setCurrentStep('CHANNELS');
  };

  const handleNextFromChannels = () => {
    const enabledCount = channelList.filter(c => c.enabled).length;
    if (enabledCount === 0) {
      setStepError('Mantenha ao menos 1 canal ativo para a criança assistir.');
      return;
    }
    setStepError('');
    setCurrentStep('RULES');
  };

  const handleFinishWizard = () => {
    const updatedProfile: KidProfile = {
      ...defaultKid,
      name: kidName.trim(),
      avatarEmoji: kidAvatar,
      ageGroup: kidAge,
      dailyTimeLimitMinutes: dailyLimit,
      bedtimeModeEnabled,
      realWorldMissionsEnabled,
    };

    const updatedSettings: ParentSettings = {
      ...initialSettings,
      pin,
      securityQuestion,
      securityAnswer,
      dailyTimeLimitMinutes: dailyLimit,
      challengesEnabled,
      learningEconomyEnabled,
      realWorldMissionsEnabled,
      bedtimeModeEnabled,
      kidAgeGroup: kidAge,
      isConfigured: true,
      onboardingCompleted: true,
      profiles: [updatedProfile],
      activeProfileId: updatedProfile.id,
    };

    onComplete({
      settings: updatedSettings,
      channels: channelList,
      profile: updatedProfile,
    });
  };

  // Channel manipulation
  const handleToggleChannel = (id: string) => {
    setChannelList(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleDeleteChannel = (id: string) => {
    setChannelList(prev => prev.filter(c => c.id !== id));
  };

  const handleAddChannelInput = async () => {
    const trimmed = channelInput.trim();
    if (!trimmed) return;
    setIsAddingChannel(true);
    setChannelError('');

    try {
      const item = await YouTubeService.resolveChannel(trimmed);
      if (channelList.some(c => c.id === item.id)) {
        setChannelError('Este canal já está na sua lista.');
        return;
      }
      setChannelList(prev => [item, ...prev]);
      setChannelInput('');
    } catch (err: any) {
      setChannelError(err.message || 'Canal não encontrado no YouTube.');
    } finally {
      setIsAddingChannel(false);
    }
  };

  // Progress computation
  const getStepProgress = () => {
    switch (currentStep) {
      case 'PIN': return 25;
      case 'PROFILE': return 50;
      case 'CHANNELS': return 75;
      case 'RULES': return 100;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Header Bar with Logo and "Configurar Depois" */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoMini}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>
                Puer<Text style={{ color: THEME.colors.primary }}>Flix</Text>
              </Text>
              <Text style={styles.brandSubtitle}>Configuração Inicial dos Pais</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Configurar Depois ›</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Progress Bar in Brand Colors */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${getStepProgress()}%` }]} />
        </View>

        {/* Reassuring Global Notice */}
        <View style={styles.noticeBanner}>
          <ShieldCheck size={16} color="#2A97EE" style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={styles.noticeText}>
            <Text style={{ fontWeight: '800', color: '#1E293B' }}>Controle Total dos Pais: </Text>
            Todas as configurações e condições podem ser alteradas ou desativadas a qualquer momento na Área Parental.
          </Text>
        </View>

        {/* Validation Error Banner if any */}
        {stepError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#FA4340" style={{ marginRight: 6 }} />
            <Text style={styles.errorBannerText}>{stepError}</Text>
          </View>
        ) : null}

        {/* Content Area */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* ============================================================ */}
          {/* STEP 1: PIN & SEGURANÇA */}
          {/* ============================================================ */}
          {currentStep === 'PIN' && (
            <View style={styles.card}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#2A97EE' }]}>
                  <KeyRound size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTag}>PASSO 1 DE 4 • SEGURANÇA</Text>
                  <Text style={styles.stepTitle}>Crie o PIN de Proteção dos Pais</Text>
                  <Text style={styles.stepSubtitle}>
                    Esse código de 4 dígitos impede que a criança saia do ambiente seguro ou altere os canais autorizados.
                  </Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>PIN Parental (4 dígitos):</Text>
                <View style={styles.pinRow}>
                  <TextInput
                    style={styles.pinInput}
                    value={pin}
                    onChangeText={t => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    placeholder="1234"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.pinInput}
                    value={confirmPin}
                    onChangeText={t => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    placeholder="Confirmar"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Pergunta de Recuperação:</Text>
                <TextInput
                  style={styles.textInput}
                  value={securityQuestion}
                  onChangeText={setSecurityQuestion}
                  placeholder="Ex: Nome do animal de estimação"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Resposta Secreta:</Text>
                <TextInput
                  style={styles.textInput}
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                  placeholder="Sua resposta de segurança"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.tipBox}>
                <Sparkles size={16} color="#FECB64" style={{ marginRight: 8 }} />
                <Text style={styles.tipText}>
                  Dica: O PIN padrão de fábrica é <Text style={{ fontWeight: '800' }}>1234</Text>. Você pode mantê-lo ou escolher outro de sua preferência agora.
                </Text>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PERFIL DA CRIANÇA */}
          {/* ============================================================ */}
          {currentStep === 'PROFILE' && (
            <View style={styles.card}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#FA4340' }]}>
                  <Users size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTag}>PASSO 2 DE 4 • QUEM VAI ASSISTIR?</Text>
                  <Text style={styles.stepTitle}>Perfil do seu Filho(a)</Text>
                  <Text style={styles.stepSubtitle}>
                    A idade selecionada ajusta os desafios educativos e conteúdos adequados para o desenvolvimento.
                  </Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Nome ou Apelido da Criança:</Text>
                <TextInput
                  style={styles.textInput}
                  value={kidName}
                  onChangeText={setKidName}
                  placeholder="Ex: João, Sofia, Luquinhas..."
                />

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Escolha o Mascote Favorito:</Text>
                <View style={styles.avatarGrid}>
                  {AVATAR_LIST.map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.avatarBtn,
                        kidAvatar === emoji && styles.avatarBtnActive,
                      ]}
                      onPress={() => setKidAvatar(emoji)}
                    >
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Faixa Etária da Criança:</Text>
                <View style={styles.ageGrid}>
                  {[
                    { id: '3-5' as KidAgeGroup, label: '👶 3 a 5 anos', desc: 'Educação Infantil' },
                    { id: '6-8' as KidAgeGroup, label: '🧒 6 a 8 anos', desc: 'Anos Iniciais' },
                    { id: '9-11' as KidAgeGroup, label: '👦 9 a 11 anos', desc: 'Fundamental I' },
                    { id: '12+' as KidAgeGroup, label: '🧑 12+ anos', desc: 'Fundamental II' },
                  ].map(item => {
                    const isSelected = kidAge === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.ageCard, isSelected && styles.ageCardActive]}
                        onPress={() => setKidAge(item.id)}
                      >
                        <Text style={[styles.ageCardTitle, isSelected && styles.ageCardTitleActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.ageCardSub}>{item.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* STEP 3: CANAIS NATIVOS & AUTORIZAÇÃO */}
          {/* ============================================================ */}
          {currentStep === 'CHANNELS' && (
            <View style={styles.card}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#81D6D1' }]}>
                  <Tv size={22} color="#1E293B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTag}>PASSO 3 DE 4 • CURADORIA DE CONTEÚDO</Text>
                  <Text style={styles.stepTitle}>Canais Nativos Pré-Instalados</Text>
                  <Text style={styles.stepSubtitle}>
                    Você pode desativar, excluir ou buscar e autorizar novos canais agora mesmo.
                  </Text>
                </View>
              </View>

              {/* Quick Add Channel Bar */}
              <View style={styles.addChannelBox}>
                <Text style={styles.addChannelLabel}>Buscar e Autorizar Novo Canal do YouTube:</Text>
                <View style={styles.addChannelRow}>
                  <TextInput
                    style={styles.addChannelInput}
                    value={channelInput}
                    onChangeText={setChannelInput}
                    placeholder="Digite @canal ou link do YouTube..."
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.addChannelBtn}
                    onPress={handleAddChannelInput}
                    disabled={isAddingChannel}
                  >
                    {isAddingChannel ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Plus size={16} color="#FFFFFF" />
                        <Text style={styles.addChannelBtnText}>Adicionar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                {channelError ? (
                  <Text style={styles.channelErrorText}>⚠️ {channelError}</Text>
                ) : null}
              </View>

              {/* List of Native Channels */}
              <View style={styles.channelsHeaderRow}>
                <Text style={styles.channelsCountText}>
                  Canais Disponíveis ({channelList.filter(c => c.enabled).length} ativos de {channelList.length})
                </Text>
                <Text style={styles.channelsHint}>Desative no switch ou exclua no 🗑️</Text>
              </View>

              <View style={styles.channelListContainer}>
                {channelList.map(c => (
                  <View key={c.id} style={[styles.channelItem, !c.enabled && styles.channelItemDisabled]}>
                    <Image
                      source={{ uri: c.avatarUrl || 'https://via.placeholder.com/80' }}
                      style={styles.channelAvatar}
                    />
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.channelTitle, !c.enabled && styles.channelTitleDisabled]} numberOfLines={1}>
                        {c.title}
                      </Text>
                      <Text style={styles.channelHandle} numberOfLines={1}>
                        {c.handle || c.description}
                      </Text>
                    </View>

                    {/* Enable / Disable switch */}
                    <Switch
                      value={c.enabled}
                      onValueChange={() => handleToggleChannel(c.id)}
                      trackColor={{ false: '#CBD5E1', true: '#81D6D1' }}
                      thumbColor={c.enabled ? '#2A97EE' : '#94A3B8'}
                    />

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => handleDeleteChannel(c.id)}
                    >
                      <Trash2 size={16} color="#FA4340" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* STEP 4: TEMPO DE TELA & CONDIÇÕES */}
          {/* ============================================================ */}
          {currentStep === 'RULES' && (
            <View style={styles.card}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#FECB64' }]}>
                  <Clock size={22} color="#1E293B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTag}>PASSO 4 DE 4 • TEMPO E CONDIÇÕES</Text>
                  <Text style={styles.stepTitle}>Tempo de Tela & Desafios Educativos</Text>
                  <Text style={styles.stepSubtitle}>
                    Defina o tempo diário e ative ou desative as condições de tela saudável.
                  </Text>
                </View>
              </View>

              {/* Daily Limit Picker */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Limite de Tempo Diário:</Text>
                <View style={styles.timeChipsGrid}>
                  {[
                    { label: 'Sem Limite', value: 0 },
                    { label: '30 min', value: 30 },
                    { label: '45 min', value: 45 },
                    { label: '1 hora', value: 60 },
                    { label: '1h30', value: 90 },
                    { label: '2 horas', value: 120 },
                  ].map(opt => {
                    const isSelected = dailyLimit === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.timeChip, isSelected && styles.timeChipActive]}
                        onPress={() => setDailyLimit(opt.value)}
                      >
                        <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Explicit Guarantee Box */}
                <View style={styles.guaranteeBox}>
                  <Heart size={18} color="#FA4340" style={{ marginTop: 2, marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guaranteeTitle}>Garantia de Autonomia dos Pais</Text>
                    <Text style={styles.guaranteeText}>
                      Tudo o que implica condições para a criança obter mais tempo de tela pode ser desativado por você a qualquer momento. Se quiser que seu filho assista livremente sem pausas para perguntas, basta desligar as opções abaixo.
                    </Text>
                  </View>
                </View>

                {/* Condition Toggles */}
                <View style={styles.togglesList}>
                  {/* 1. Desafios Cognitivos */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.toggleTitle}>Desafios Educativos por Intervalo</Text>
                      <Text style={styles.toggleSub}>
                        Pausa a cada 20 min com perguntas lúdicas de matemática, lógica ou letras
                      </Text>
                    </View>
                    <Switch
                      value={challengesEnabled}
                      onValueChange={setChallengesEnabled}
                      trackColor={{ false: '#CBD5E1', true: '#81D6D1' }}
                      thumbColor={challengesEnabled ? '#2A97EE' : '#94A3B8'}
                    />
                  </View>

                  {/* 2. Ginásio da Mente */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.toggleTitle}>Ginásio da Mente (Economia Educativa)</Text>
                      <Text style={styles.toggleSub}>
                        A criança pode treinar voluntariamente no app para ganhar tempo extra de vídeo
                      </Text>
                    </View>
                    <Switch
                      value={learningEconomyEnabled}
                      onValueChange={setLearningEconomyEnabled}
                      trackColor={{ false: '#CBD5E1', true: '#81D6D1' }}
                      thumbColor={learningEconomyEnabled ? '#2A97EE' : '#94A3B8'}
                    />
                  </View>

                  {/* 3. Missões no Mundo Real */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.toggleTitle}>Missões no Mundo Real (Pausas Saudáveis)</Text>
                      <Text style={styles.toggleSub}>
                        Pausas com tarefas ativas fora da tela (beber água, pular como sapinho, abraço)
                      </Text>
                    </View>
                    <Switch
                      value={realWorldMissionsEnabled}
                      onValueChange={setRealWorldMissionsEnabled}
                      trackColor={{ false: '#CBD5E1', true: '#81D6D1' }}
                      thumbColor={realWorldMissionsEnabled ? '#2A97EE' : '#94A3B8'}
                    />
                  </View>

                  {/* 4. Modo Pré-Sono */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.toggleTitle}>Modo Anti-Hiperestímulo & Pré-Sono</Text>
                      <Text style={styles.toggleSub}>
                        Película âmbar protetora à noite para bloquear a luz azul e acalmar a mente
                      </Text>
                    </View>
                    <Switch
                      value={bedtimeModeEnabled}
                      onValueChange={setBedtimeModeEnabled}
                      trackColor={{ false: '#CBD5E1', true: '#81D6D1' }}
                      thumbColor={bedtimeModeEnabled ? '#2A97EE' : '#94A3B8'}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomBar}>
          {currentStep !== 'PIN' && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (currentStep === 'PROFILE') setCurrentStep('PIN');
                else if (currentStep === 'CHANNELS') setCurrentStep('PROFILE');
                else if (currentStep === 'RULES') setCurrentStep('CHANNELS');
              }}
            >
              <ArrowLeft size={18} color="#475569" />
              <Text style={styles.backBtnText}>Voltar</Text>
            </TouchableOpacity>
          )}

          {currentStep !== 'RULES' ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: currentStep === 'PIN' ? 1 : undefined }]}
              onPress={() => {
                if (currentStep === 'PIN') handleNextFromPin();
                else if (currentStep === 'PROFILE') handleNextFromProfile();
                else if (currentStep === 'CHANNELS') handleNextFromChannels();
              }}
            >
              <Text style={styles.primaryBtnText}>Próximo Passo</Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.finishBtn, { flex: 1 }]}
              onPress={handleFinishWizard}
            >
              <Check size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.finishBtnText}>Concluir e Entrar no PuerFlix 🚀</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMini: {
    width: 38,
    height: 38,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2A97EE',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FA4340',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  errorBannerText: {
    color: '#FA4340',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2A97EE',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  formSection: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  pinRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  pinInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 4,
  },
  textInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    padding: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#854D0E',
    lineHeight: 17,
  },
  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  avatarBtnActive: {
    borderColor: '#FA4340',
    backgroundColor: '#FFF1F1',
    transform: [{ scale: 1.1 }],
  },
  avatarEmoji: {
    fontSize: 24,
  },
  // Age Grid
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  ageCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  ageCardActive: {
    borderColor: '#2A97EE',
    backgroundColor: '#EFF6FF',
  },
  ageCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  ageCardTitleActive: {
    color: '#1D4ED8',
  },
  ageCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  // Channels List & Add
  addChannelBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  addChannelLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  addChannelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addChannelInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  addChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A97EE',
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  addChannelBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  channelErrorText: {
    color: '#FA4340',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  channelsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelsCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  channelsHint: {
    fontSize: 11,
    color: '#64748B',
  },
  channelListContainer: {
    gap: 8,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  channelItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
  },
  channelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#CBD5E1',
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  channelTitleDisabled: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  channelHandle: {
    fontSize: 11,
    color: '#64748B',
  },
  trashBtn: {
    padding: 8,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: '#FFF1F1',
  },
  // Rules & Time
  timeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipActive: {
    backgroundColor: '#FA4340',
    borderColor: '#FA4340',
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 3,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  togglesList: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A97EE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FA4340',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
