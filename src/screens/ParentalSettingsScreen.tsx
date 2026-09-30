import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Channel, ParentSettings, Category, AnalyticsReport, AppLicense } from '../types';
import { THEME } from '../constants/theme';
import { YouTubeService } from '../services/youtubeService';
import { StorageService } from '../services/storageService';
import { AnalyticsService } from '../services/analyticsService';
import { LicenseService } from '../services/licenseService';

import { AnalyticsChart } from '../components/AnalyticsChart';
import {
  PRESET_CHANNELS,
  SIMILAR_SUGGESTIONS,
  getSmartChannelSuggestions,
  SimilarChannelSuggestion,
} from '../constants/presets';
import {
  CURATED_SEARCH_TOPICS,
  NATIONALITY_OPTIONS,
  getNationalityByCode,
} from '../constants/searchTopics';
import { SearchTopicItem, NationalityOption, KidAgeGroup, UserProfile, KidProfile } from '../types';
import { CloudService } from '../services/cloudService';
import { AiGuardianService, ConversationPrompt } from '../services/aiGuardianService';
import {
  ShieldCheck,
  Plus,
  Trash2,
  KeyRound,
  Clock,
  Check,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  ListVideo,
  BarChart3,
  Folder,
  Download,
  Search,
  Sliders,
  Tv,
  Globe,
  Tag,
  X,
  Compass,
  Share2,
  Cloud,
  LogIn,
  LogOut,
  Copy,
  RefreshCw,
  Award,
  Users,
  Moon,
  Activity,
  Heart,
  LayoutGrid,
} from 'lucide-react-native';

interface ParentalSettingsScreenProps {
  channels: Channel[];
  categories: Category[];
  settings: ParentSettings;
  activeLicense?: AppLicense | null;
  onSaveChannels: (channels: Channel[]) => void;
  onSaveCategories: (categories: Category[]) => void;
  onSaveSettings: (settings: ParentSettings) => void;
  onClose: () => void;
  onDeactivateLicense?: () => void;
}

type ParentTab = 'ITEMS' | 'PROFILES' | 'CHALLENGES' | 'CLOUD_SHARE' | 'SUGGESTIONS' | 'FOLDERS' | 'REPORTS' | 'IMPORT' | 'SECURITY';

export const ParentalSettingsScreen: React.FC<ParentalSettingsScreenProps> = ({
  channels,
  categories,
  settings,
  activeLicense,
  onSaveChannels,
  onSaveCategories,
  onSaveSettings,
  onClose,
  onDeactivateLicense,
}) => {
  const [activeTab, setActiveTab] = useState<ParentTab>('ITEMS');
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  useEffect(() => {
    LicenseService.getDeviceId().then(setCurrentDeviceId);
  }, []);

  // Suggestions state
  const [suggestionFilterCat, setSuggestionFilterCat] = useState<string>('ALL');

  // Channel & Playlist Add State
  const [channelInput, setChannelInput] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'CHANNEL' | 'PLAYLIST'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // New Folder Creation State
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');

  // Search & Nationality State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>(settings.preferredCountry || 'BR');
  const [selectedTopicCatIndex, setSelectedTopicCatIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Reports State
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  // Security / PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(settings.securityQuestion);
  const [securityAnswer, setSecurityAnswer] = useState(settings.securityAnswer);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(settings.dailyTimeLimitMinutes);
  const [apiKey, setApiKey] = useState(settings.youtubeApiKey || '');

  // Google Account & Cloud Sync State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(settings.userProfile || null);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Channel Sharing State
  const [shareCode, setShareCode] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedCopySuccess, setSharedCopySuccess] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [isImportingShare, setIsImportingShare] = useState(false);

  // Educational Challenges State
  const [challengesEnabled, setChallengesEnabled] = useState(settings.challengesEnabled ?? true);
  const [kidAgeGroup, setKidAgeGroup] = useState<KidAgeGroup>(settings.kidAgeGroup || '6-8');
  const [challengeInterval, setChallengeInterval] = useState<number>(settings.challengeIntervalMinutes || 20);
  const [initialCount, setInitialCount] = useState<number>(settings.initialChallengeCount || 2);
  const [progressiveInc, setProgressiveInc] = useState<boolean>((settings.progressiveIncrement ?? 1) > 0);
  const [enableMath, setEnableMath] = useState(settings.enableMathChallenges ?? true);
  const [enableLogic, setEnableLogic] = useState(settings.enableLogicChallenges ?? true);
  const [enableLanguage, setEnableLanguage] = useState(settings.enableLanguageChallenges ?? true);

  // Revolutionary Features State
  const [profiles, setProfiles] = useState<KidProfile[]>(settings.profiles || []);
  const [learningEconomyEnabled, setLearningEconomyEnabled] = useState(settings.learningEconomyEnabled ?? true);
  const [bedtimeModeEnabled, setBedtimeModeEnabled] = useState(settings.bedtimeModeEnabled ?? true);
  const [bedtimeStartHour, setBedtimeStartHour] = useState(settings.bedtimeStartHour ?? 19);
  const [bedtimeEndHour, setBedtimeEndHour] = useState(settings.bedtimeEndHour ?? 7);
  const [realWorldMissionsEnabled, setRealWorldMissionsEnabled] = useState(settings.realWorldMissionsEnabled ?? true);
  const [channelViewMode, setChannelViewMode] = useState<'grid' | 'horizontal'>(settings.channelViewMode || 'grid');

  // AI Guardian Prompts State
  const [aiPrompts, setAiPrompts] = useState<ConversationPrompt[]>([]);

  // New Profile Form State
  const [newKidName, setNewKidName] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState('🦁');
  const [newKidAge, setNewKidAge] = useState<KidAgeGroup>('6-8');
  const [newKidTime, setNewKidTime] = useState<number>(45);

  // Inline feedback message banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAnalytics();
    checkCurrentUser();
    loadProfiles();
  }, [activeTab]);

  const loadProfiles = async () => {
    const list = await StorageService.getProfiles();
    setProfiles(list);
  };

  const checkCurrentUser = async () => {
    const user = await CloudService.getCurrentUser();
    if (user) {
      setUserProfile(user);
    }
  };

  const loadAnalytics = async () => {
    const data = await AnalyticsService.getAnalyticsReport();
    setReport(data);
    const history = await AnalyticsService.getEvents();
    const prompts = AiGuardianService.generatePrompts(history, channels);
    setAiPrompts(prompts);
  };


  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  /**
   * Save Profiles Changes
   */
  const handleSaveProfilesList = async (updated: KidProfile[]) => {
    setProfiles(updated);
    await StorageService.saveProfiles(updated);
    onSaveSettings({ ...settings, profiles: updated });
    showFeedback('success', 'Perfis atualizados com sucesso!');
  };

  const handleDeleteProfile = async (id: string) => {
    if (profiles.length <= 1) {
      showFeedback('error', 'O app precisa ter pelo menos um perfil cadastrado.');
      return;
    }
    const updated = await StorageService.deleteProfile(id);
    setProfiles(updated);
    onSaveSettings({ ...settings, profiles: updated });
    showFeedback('success', 'Perfil removido.');
  };

  /**
   * Save Bedtime and Real World Mission Settings
   */
  const handleSaveRevolutionarySettings = () => {
    const updated: ParentSettings = {
      ...settings,
      learningEconomyEnabled,
      bedtimeModeEnabled,
      bedtimeStartHour,
      bedtimeEndHour,
      realWorldMissionsEnabled,
    };
    onSaveSettings(updated);
    showFeedback('success', 'Configurações de Neuroproteção e Economia salvas!');
  };

  /**
   * Google Sign In / Cloud Account Setup
   */
  const handleGoogleSignIn = async () => {
    const email = googleEmail.trim() || 'familia@gmail.com';
    const name = googleName.trim() || email.split('@')[0];
    setIsSigningInGoogle(true);
    setFeedback(null);

    try {
      const { user, data } = await CloudService.loginWithGoogle({
        email,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(email)}`,
      });

      setUserProfile(user);
      const updatedSettings: ParentSettings = {
        ...settings,
        userProfile: user,
      };
      onSaveSettings(updatedSettings);

      // If user had existing channels stored in cloud, prompt / merge them
      if (data && data.channels && data.channels.length > 0) {
        onSaveChannels(data.channels);
        if (data.categories && data.categories.length > 0) {
          onSaveCategories(data.categories);
        }
        showFeedback('success', `Bem-vindo de volta, ${user.name}! ${data.channels.length} canais restaurados da nuvem.`);
      } else {
        // First time cloud sync: backup current local channels to cloud
        await CloudService.syncToCloud({
          userId: user.id,
          channels,
          categories,
          settings: updatedSettings,
        });
        showFeedback('success', `Conta Google conectada com sucesso! Todos os dados estão agora salvos na nuvem.`);
      }
    } catch (e: any) {
      showFeedback('error', `Falha ao conectar com Google: ${e.message}`);
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  /**
   * Sair da Conta Google
   */
  const handleGoogleSignOut = async () => {
    await CloudService.logout();
    setUserProfile(null);
    const updatedSettings = { ...settings, userProfile: undefined };
    onSaveSettings(updatedSettings);
    showFeedback('success', 'Você saiu da conta Google.');
  };

  /**
   * Sincronizar Tudo Manualmente com a Nuvem
   */
  const handleManualCloudSync = async () => {
    if (!userProfile?.id) {
      showFeedback('error', 'Faça login com sua conta Google para sincronizar.');
      return;
    }
    setIsSyncingCloud(true);
    try {
      const timestamp = await CloudService.syncToCloud({
        userId: userProfile.id,
        channels,
        categories,
        settings,
      });
      const updatedUser: UserProfile = {
        ...userProfile,
        lastSyncedAt: timestamp || Date.now(),
      };
      setUserProfile(updatedUser);
      onSaveSettings({ ...settings, userProfile: updatedUser });
      showFeedback('success', 'Tudo sincronizado na nuvem com sucesso!');
    } catch (e: any) {
      showFeedback('error', 'Erro ao sincronizar com a nuvem.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  /**
   * Gerar Código e Link de Compartilhamento
   */
  const handleGenerateShare = async () => {
    if (channels.length === 0) {
      showFeedback('error', 'Você não tem nenhum canal adicionado para compartilhar.');
      return;
    }
    setIsSharing(true);
    try {
      const { code, shareUrl } = await CloudService.createShareCode(channels, userProfile?.name || 'Pais PuerFlix');
      setShareCode(code);
      setShareUrl(shareUrl);
      showFeedback('success', `Código de compartilhamento ${code} gerado!`);
    } catch (e: any) {
      showFeedback('error', 'Erro ao gerar link de compartilhamento.');
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Compartilhar no WhatsApp
   */
  const handleShareWhatsApp = () => {
    if (!shareUrl) return;
    const msg = `👋 Olá! Estou compartilhando a lista de canais do YouTube confiáveis e seguros que liberei para os pequenos no app PuerFlix (${channels.length} canais autorizados).\n\nPara importar direto no seu PuerFlix, use este link:\n${shareUrl}\n\nOu digite o código no app: *${shareCode}*`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
  };

  /**
   * Copiar link para área de transferência
   */
  const handleCopyLink = () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setSharedCopySuccess(true);
      setTimeout(() => setSharedCopySuccess(false), 3000);
      showFeedback('success', 'Link copiado para a área de transferência!');
    } else {
      showFeedback('success', `Link: ${shareUrl}`);
    }
  };

  /**
   * Importar canais de amigo por código
   */
  const handleImportByCode = async () => {
    const code = importCode.trim().toUpperCase();
    if (!code) {
      showFeedback('error', 'Digite o código recebido (ex: PF-AB12CD).');
      return;
    }
    setIsImportingShare(true);
    try {
      const result = await CloudService.getSharedChannels(code);
      if (!result || !result.channels || result.channels.length === 0) {
        showFeedback('error', 'Nenhum canal encontrado para este código.');
        return;
      }

      // Merge channels
      const existingIds = new Set(channels.map(c => c.id));
      const newItems = result.channels.filter(c => !existingIds.has(c.id));
      const merged = [...newItems, ...channels];
      onSaveChannels(merged);
      setImportCode('');
      showFeedback('success', `${newItems.length} novos canais importados da lista compartilhada por ${result.sharedBy}!`);
    } catch (e: any) {
      showFeedback('error', 'Falha ao buscar lista compartilhada.');
    } finally {
      setIsImportingShare(false);
    }
  };

  /**
   * Salvar Configurações de Desafios Educativos
   */
  const handleSaveChallengesSettings = () => {
    const updated: ParentSettings = {
      ...settings,
      challengesEnabled,
      kidAgeGroup,
      challengeIntervalMinutes: challengeInterval,
      initialChallengeCount: initialCount,
      progressiveIncrement: progressiveInc ? 1 : 0,
      enableMathChallenges: enableMath,
      enableLogicChallenges: enableLogic,
      enableLanguageChallenges: enableLanguage,
    };
    onSaveSettings(updated);
    showFeedback('success', 'Configurações dos Desafios Educativos salvas com sucesso!');
  };

  /**
   * Add Channel or Playlist
   */
  const handleAddChannel = async () => {
    const input = channelInput.trim();
    if (!input) {
      showFeedback('error', 'Digite o link do canal ou da playlist do YouTube.');
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    try {
      const item = await YouTubeService.resolveChannel(input, apiKey);
      
      if (channels.some(c => c.id === item.id)) {
        showFeedback('error', `"${item.title}" já está na lista de autorizados.`);
        setIsVerifying(false);
        return;
      }

      if (selectedFolderId) {
        item.categoryId = selectedFolderId;
      }

      const updated = [item, ...channels];
      onSaveChannels(updated);
      setChannelInput('');
      const typeLabel = item.type === 'PLAYLIST' ? 'Playlist' : 'Canal';
      showFeedback('success', `${typeLabel} "${item.title}" aprovado e adicionado com sucesso!`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Não foi possível encontrar o canal ou playlist.');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Add preset channel
   */
  const handleAddPreset = (preset: Channel) => {
    if (channels.some(c => c.id === preset.id)) {
      showFeedback('error', `O canal "${preset.title}" já faz parte da lista.`);
      return;
    }
    const updated = [preset, ...channels];
    onSaveChannels(updated);
    showFeedback('success', `Canal "${preset.title}" liberado!`);
  };

  /**
   * Add suggested similar channel
   */
  const handleAddSuggestedChannel = (sug: SimilarChannelSuggestion) => {
    if (channels.some(c => c.id === sug.id)) {
      showFeedback('error', `O canal "${sug.title}" já está na lista.`);
      return;
    }
    const newChannel: Channel = {
      id: sug.id,
      type: 'CHANNEL',
      title: sug.title,
      handle: sug.handle,
      avatarUrl: sug.avatarUrl,
      description: sug.description,
      categoryId: sug.categoryId,
      addedAt: Date.now(),
      enabled: true,
    };
    const updated = [newChannel, ...channels];
    onSaveChannels(updated);
    showFeedback('success', `Canal "${sug.title}" adicionado aos autorizados!`);
  };

  /**
   * Toggle enable / disable item
   */
  const handleToggleChannel = (channelId: string) => {
    const updated = channels.map(c =>
      c.id === channelId ? { ...c, enabled: !c.enabled } : c
    );
    onSaveChannels(updated);
  };

  /**
   * Delete channel or playlist
   */
  const handleDeleteChannel = (channel: Channel) => {
    const itemLabel = channel.type === 'PLAYLIST' ? 'a playlist' : 'o canal';
    const confirmMessage = `Deseja remover ${itemLabel} "${channel.title}" dos autorizados?`;

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(confirmMessage) : true;
      if (confirmed) {
        const updated = channels.filter(c => c.id !== channel.id);
        onSaveChannels(updated);
        showFeedback('success', `Removido com sucesso.`);
      }
      return;
    }

    Alert.alert('Remover', confirmMessage, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const updated = channels.filter(c => c.id !== channel.id);
          onSaveChannels(updated);
          showFeedback('success', `Removido com sucesso.`);
        },
      },
    ]);
  };

  /**
   * Change item category/folder
   */
  const handleChangeChannelCategory = (channelId: string, categoryId?: string) => {
    const updated = channels.map(c =>
      c.id === channelId ? { ...c, categoryId: categoryId === 'NONE' ? undefined : categoryId } : c
    );
    onSaveChannels(updated);
    showFeedback('success', 'Pasta do canal atualizada.');
  };

  /**
   * Create New Folder
   */
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      showFeedback('error', 'Digite um nome para a pasta.');
      return;
    }
    const newCat: Category = {
      id: newFolderName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `cat-${Date.now()}`,
      name: newFolderName.trim(),
      icon: newFolderIcon || '📁',
      color: newFolderColor || '#3B82F6',
    };
    const updated = [...categories, newCat];
    onSaveCategories(updated);
    setNewFolderName('');
    showFeedback('success', `Pasta "${newCat.name}" criada com sucesso!`);
  };

  /**
   * Delete Folder
   */
  const handleDeleteFolder = (cat: Category) => {
    const confirmed = Platform.OS === 'web'
      ? typeof window !== 'undefined' && window.confirm(`Deseja excluir a pasta "${cat.name}"? Os canais não serão apagados.`)
      : true;

    if (confirmed) {
      const updatedCats = categories.filter(c => c.id !== cat.id);
      onSaveCategories(updatedCats);
      const updatedChannels = channels.map(c => (c.categoryId === cat.id ? { ...c, categoryId: undefined } : c));
      onSaveChannels(updatedChannels);
      showFeedback('success', `Pasta "${cat.name}" excluída.`);
    }
  };

  /**
   * Direct YouTube Channel Search with nationality filter
   */
  const handleSearchYouTube = async (targetQuery?: string, targetCountry?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : searchQuery).trim();
    const c = targetCountry !== undefined ? targetCountry : selectedCountry;
    if (!q) {
      showFeedback('error', 'Digite ou selecione um tema ou palavra-chave para buscar.');
      return;
    }
    setIsSearching(true);
    setFeedback(null);
    try {
      const results = await YouTubeService.searchChannels(q, c);
      setSearchResults(results);
      if (results.length === 0) {
        const nat = getNationalityByCode(c);
        showFeedback('error', `Nenhum canal encontrado para "${q}" (${nat.flag} ${nat.name}). Tente outro termo ou país.`);
      }
    } catch (e: any) {
      showFeedback('error', 'Erro ao pesquisar canais no YouTube.');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Select a topic from the curated list
   */
  const handleSelectTopic = (topic: SearchTopicItem) => {
    setSearchQuery(topic.label);
    handleSearchYouTube(topic.query, selectedCountry);
  };

  /**
   * Change nationality filter
   */
  const handleSelectCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const updated = { ...settings, preferredCountry: countryCode };
    onSaveSettings(updated);
    const nat = getNationalityByCode(countryCode);
    showFeedback('success', `Nacionalidade definida para ${nat.flag} ${nat.name}`);
    if (searchQuery.trim()) {
      handleSearchYouTube(searchQuery.trim(), countryCode);
    }
  };

  /**
   * Bulk Import
   */
  const handleBulkImport = async () => {
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      showFeedback('error', 'Cole ao menos um link ou handle por linha.');
      return;
    }

    setIsBulkImporting(true);
    setFeedback(null);

    const { success, failed } = await YouTubeService.bulkResolve(lines);
    
    if (success.length > 0) {
      // Merge unique
      const existingIds = new Set(channels.map(c => c.id));
      const newItems = success.filter(s => !existingIds.has(s.id));
      const updated = [...newItems, ...channels];
      onSaveChannels(updated);
      setBulkInput('');
      showFeedback('success', `${newItems.length} canais/playlists importados com sucesso!${failed.length > 0 ? ` (${failed.length} falharam)` : ''}`);
    } else {
      showFeedback('error', 'Não foi possível importar os links informados.');
    }

    setIsBulkImporting(false);
  };

  /**
   * Save Screen Time Limit
   */
  const handleSelectTimeLimit = (minutes: number) => {
    setSelectedTimeLimit(minutes);
    const updated = { ...settings, dailyTimeLimitMinutes: minutes };
    onSaveSettings(updated);
    showFeedback('success', 'Limite de tempo diário salvo.');
  };

  /**
   * Toggle Channel View Mode (Grid vs Horizontal)
   */
  const handleToggleChannelViewMode = (mode: 'grid' | 'horizontal') => {
    setChannelViewMode(mode);
    const updated = { ...settings, channelViewMode: mode };
    onSaveSettings(updated);
    showFeedback('success', mode === 'grid' ? 'Visualização em Grade Vertical (Mosaico) ativada!' : 'Visualização em Carrossel Horizontal ativada!');
  };

  /**
   * Save PIN Changes
   */
  const handleUpdatePin = () => {
    if (newPin.length !== 4) {
      showFeedback('error', 'O novo PIN deve ter exatamente 4 dígitos numéricos.');
      return;
    }
    if (newPin !== confirmPin) {
      showFeedback('error', 'Os PINs digitados não coincidem.');
      return;
    }

    const updated: ParentSettings = {
      ...settings,
      pin: newPin,
      securityQuestion,
      securityAnswer,
      isConfigured: true,
    };
    onSaveSettings(updated);
    setNewPin('');
    setConfirmPin('');
    showFeedback('success', 'Seu PIN parental foi atualizado com sucesso!');
  };

  /**
   * Save API Key
   */
  const handleSaveApiKey = () => {
    const updated: ParentSettings = {
      ...settings,
      youtubeApiKey: apiKey.trim(),
    };
    onSaveSettings(updated);
    showFeedback('success', 'Chave de API salva com sucesso.');
  };

  /**
   * Deactivate license on this device
   */
  const handleDeactivateDeviceLicense = () => {
    Alert.alert(
      'Desvincular Licença deste Aparelho?',
      'Se confirmar, o app será desconectado e retornará à tela de ativação. Esta ação libera a licença para ser ativada em outro dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular Agora',
          style: 'destructive',
          onPress: async () => {
            await LicenseService.deactivateLicense();
            Alert.alert('Sucesso', 'Aparelho desvinculado com sucesso.');
            if (onDeactivateLicense) {
              onDeactivateLicense();
            }
          },
        },
      ]
    );
  };

  /**
   * Toggle Bedtime / Anti-Hyperstimulation Mode
   */
  const handleToggleBedtime = (enabled: boolean) => {
    setBedtimeModeEnabled(enabled);
    const updated: ParentSettings = {
      ...settings,
      bedtimeModeEnabled: enabled,
      bedtimeStartHour,
      bedtimeEndHour,
    };
    onSaveSettings(updated);
    showFeedback('success', enabled ? 'Modo Anti-Hiperestímulo ativado!' : 'Modo Anti-Hiperestímulo desativado.');
  };

  /**
   * Update Bedtime Hours
   */
  const handleUpdateBedtimeHours = (start: number, end: number) => {
    setBedtimeStartHour(start);
    setBedtimeEndHour(end);
    const updated: ParentSettings = {
      ...settings,
      bedtimeModeEnabled,
      bedtimeStartHour: start,
      bedtimeEndHour: end,
    };
    onSaveSettings(updated);
    showFeedback('success', 'Horários do Modo Pré-Sono atualizados.');
  };


  // Filtered items
  const displayedItems = channels.filter(c => {
    if (filterType === 'CHANNEL' && c.type === 'PLAYLIST') return false;
    if (filterType === 'PLAYLIST' && c.type !== 'PLAYLIST') return false;
    if (filterCategory !== 'ALL' && c.categoryId !== filterCategory) return false;
    return true;
  });

  // Smart similar channel suggestions
  const smartSuggestions = getSmartChannelSuggestions(channels);
  const unaddedCount = smartSuggestions.filter(s => !s.isAdded).length;
  const displayedSuggestions = smartSuggestions.filter(s => {
    if (suggestionFilterCat === 'ALL') return true;
    return s.categoryId === suggestionFilterCat;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <ArrowLeft size={22} color="#FFFFFF" />
          <Text style={styles.backText}>Voltar ao PuerFlix</Text>
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <ShieldCheck size={16} color="#FFFFFF" />
          <Text style={styles.headerBadgeText}>Área dos Pais</Text>
        </View>
      </View>

      {/* Parental Sub-Navigation Tabs */}
      <View style={styles.tabNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabNavContent}>
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'ITEMS' && styles.navTabActive]}
            onPress={() => setActiveTab('ITEMS')}
          >
            <Tv size={16} color={activeTab === 'ITEMS' ? '#FFFFFF' : THEME.colors.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'ITEMS' && styles.navTabTextActive]}>
              Canais & Playlists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'PROFILES' && styles.navTabActive]}
            onPress={() => setActiveTab('PROFILES')}
          >
            <Users size={16} color={activeTab === 'PROFILES' ? '#FFFFFF' : '#EC4899'} />
            <Text style={[styles.navTabText, activeTab === 'PROFILES' && styles.navTabTextActive]}>
              Perfis dos Filhos
            </Text>
            {profiles.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#EC4899' }]}>
                <Text style={styles.tabBadgeText}>{profiles.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'CHALLENGES' && styles.navTabActive]}
            onPress={() => setActiveTab('CHALLENGES')}
          >
            <Award size={16} color={activeTab === 'CHALLENGES' ? '#FFFFFF' : '#8B5CF6'} />
            <Text style={[styles.navTabText, activeTab === 'CHALLENGES' && styles.navTabTextActive]}>
              Desafios Educativos
            </Text>
            {challengesEnabled && (
              <View style={[styles.tabBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.tabBadgeText}>ON</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'CLOUD_SHARE' && styles.navTabActive]}
            onPress={() => setActiveTab('CLOUD_SHARE')}
          >
            <Cloud size={16} color={activeTab === 'CLOUD_SHARE' ? '#FFFFFF' : '#3B82F6'} />
            <Text style={[styles.navTabText, activeTab === 'CLOUD_SHARE' && styles.navTabTextActive]}>
              Nuvem & Compartilhar
            </Text>
            {userProfile?.isLoggedIn && (
              <View style={[styles.tabBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.tabBadgeText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'SUGGESTIONS' && styles.navTabActive]}
            onPress={() => setActiveTab('SUGGESTIONS')}
          >
            <Sparkles size={16} color={activeTab === 'SUGGESTIONS' ? '#F59E0B' : THEME.colors.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'SUGGESTIONS' && styles.navTabTextActive]}>
              Sugestões Semelhantes
            </Text>
            {unaddedCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{unaddedCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'FOLDERS' && styles.navTabActive]}
            onPress={() => setActiveTab('FOLDERS')}
          >
            <Folder size={16} color={activeTab === 'FOLDERS' ? '#FFFFFF' : THEME.colors.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'FOLDERS' && styles.navTabTextActive]}>
              Pastas & Categorias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'REPORTS' && styles.navTabActive]}
            onPress={() => setActiveTab('REPORTS')}
          >
            <BarChart3 size={16} color={activeTab === 'REPORTS' ? '#FFFFFF' : THEME.colors.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'REPORTS' && styles.navTabTextActive]}>
              Relatórios & Gráficos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'IMPORT' && styles.navTabActive]}
            onPress={() => setActiveTab('IMPORT')}
          >
            <Compass size={16} color={activeTab === 'IMPORT' ? '#FFFFFF' : THEME.colors.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'IMPORT' && styles.navTabTextActive]}>
              Buscar & Descobrir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'SECURITY' && styles.navTabActive]}
            onPress={() => setActiveTab('SECURITY')}
          >
            <Sliders size={16} color={activeTab === 'SECURITY' ? '#FFFFFF' : THEME.colors.textSecondary} />
            <Text style={[styles.navTabText, activeTab === 'SECURITY' && styles.navTabTextActive]}>
              Tempo & PIN
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Feedback Banner */}
        {feedback && (
          <View style={[styles.feedbackBanner, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
            {feedback.type === 'error' ? (
              <AlertTriangle size={18} color="#DC2626" />
            ) : (
              <Check size={18} color="#059669" />
            )}
            <Text style={[styles.feedbackText, feedback.type === 'error' ? styles.feedbackTextError : styles.feedbackTextSuccess]}>
              {feedback.message}
            </Text>
          </View>
        )}

        {/* TAB 1: ITEMS (CHANNELS & PLAYLISTS) */}
        {activeTab === 'ITEMS' && (
          <>
            {/* Add Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Plus size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Adicionar Canal ou Playlist</Text>
                  <Text style={styles.sectionSubtitle}>
                    Cole o link do canal ou da playlist que deseja liberar
                  </Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.channelInput}
                  placeholder="https://youtube.com/@Canal ou playlist?list=PL..."
                  placeholderTextColor={THEME.colors.textMuted}
                  value={channelInput}
                  onChangeText={setChannelInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.addBtn, isVerifying && styles.addBtnDisabled]}
                  onPress={handleAddChannel}
                  disabled={isVerifying}
                  activeOpacity={0.8}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addBtnText}>Autorizar</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Folder Selector for the item */}
              <View style={styles.folderSelectRow}>
                <Text style={styles.folderSelectLabel}>Salvar na Pasta:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderChipsRow}>
                  <TouchableOpacity
                    style={[styles.folderChip, selectedFolderId === '' && styles.folderChipActive]}
                    onPress={() => setSelectedFolderId('')}
                  >
                    <Text style={[styles.folderChipText, selectedFolderId === '' && styles.folderChipTextActive]}>
                      Sem Pasta
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.folderChip, selectedFolderId === cat.id && styles.folderChipActive]}
                      onPress={() => setSelectedFolderId(cat.id)}
                    >
                      <Text style={[styles.folderChipText, selectedFolderId === cat.id && styles.folderChipTextActive]}>
                        {cat.icon} {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* List Card */}
            <View style={styles.sectionCard}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Conteúdos Autorizados ({channels.length})
                </Text>
                <Text style={styles.listCountSub}>
                  {channels.filter(c => c.enabled).length} ativos
                </Text>
              </View>

              {/* Quick Actions Bar */}
              <View style={styles.quickActionsBar}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab('CLOUD_SHARE')}
                >
                  <Share2 size={14} color="#10B981" />
                  <Text style={styles.quickActionText}>Compartilhar Lista ({channels.length})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab('CLOUD_SHARE')}
                >
                  <Cloud size={14} color={userProfile?.isLoggedIn ? '#3B82F6' : '#F59E0B'} />
                  <Text style={styles.quickActionText}>
                    {userProfile?.isLoggedIn ? `Nuvem: ${userProfile.name}` : 'Login Nuvem'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Type and Category Filters */}
              <View style={styles.filtersGroup}>
                <View style={styles.filterTabsRow}>
                  <TouchableOpacity
                    style={[styles.filterTab, filterType === 'ALL' && styles.filterTabActive]}
                    onPress={() => setFilterType('ALL')}
                  >
                    <Text style={[styles.filterTabText, filterType === 'ALL' && styles.filterTabTextActive]}>
                      Todos ({channels.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTab, filterType === 'CHANNEL' && styles.filterTabActive]}
                    onPress={() => setFilterType('CHANNEL')}
                  >
                    <Text style={[styles.filterTabText, filterType === 'CHANNEL' && styles.filterTabTextActive]}>
                      Canais ({channels.filter(c => c.type !== 'PLAYLIST').length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTab, filterType === 'PLAYLIST' && styles.filterTabActive]}
                    onPress={() => setFilterType('PLAYLIST')}
                  >
                    <Text style={[styles.filterTabText, filterType === 'PLAYLIST' && styles.filterTabTextActive]}>
                      Playlists ({channels.filter(c => c.type === 'PLAYLIST').length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Filter by folder */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterFoldersRow}>
                  <TouchableOpacity
                    style={[styles.catFilterChip, filterCategory === 'ALL' && styles.catFilterChipActive]}
                    onPress={() => setFilterCategory('ALL')}
                  >
                    <Text style={[styles.catFilterText, filterCategory === 'ALL' && styles.catFilterTextActive]}>
                      Todas as Pastas
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catFilterChip, filterCategory === cat.id && styles.catFilterChipActive]}
                      onPress={() => setFilterCategory(cat.id)}
                    >
                      <Text style={[styles.catFilterText, filterCategory === cat.id && styles.catFilterTextActive]}>
                        {cat.icon} {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {displayedItems.length === 0 ? (
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    Nenhum item encontrado com os filtros selecionados.
                  </Text>
                </View>
              ) : (
                displayedItems.map((item) => {
                  const itemCat = categories.find(c => c.id === item.categoryId);

                  return (
                    <View key={item.id} style={styles.channelItem}>
                      {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.channelAvatar} />
                      ) : (
                        <View style={styles.channelAvatarPlaceholder}>
                          {item.type === 'PLAYLIST' ? (
                            <ListVideo size={18} color={THEME.colors.primary} />
                          ) : (
                            <Text style={styles.channelAvatarInitial}>
                              {item.title.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                      )}

                      <View style={styles.channelInfo}>
                        <View style={styles.itemTitleRow}>
                          <Text style={styles.channelItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={[styles.typeBadge, item.type === 'PLAYLIST' ? styles.typeBadgePlaylist : styles.typeBadgeChannel]}>
                            <Text style={[styles.typeBadgeText, item.type === 'PLAYLIST' ? styles.typeBadgeTextPlaylist : styles.typeBadgeTextChannel]}>
                              {item.type === 'PLAYLIST' ? 'PLAYLIST' : 'CANAL'}
                            </Text>
                          </View>
                        </View>

                        {/* Folder Assign Tag */}
                        <View style={styles.folderRow}>
                          <Text style={styles.folderBadge}>
                            {itemCat ? `${itemCat.icon} ${itemCat.name}` : '📁 Sem Pasta'}
                          </Text>
                        </View>
                      </View>

                      {/* Switch */}
                      <Switch
                        value={item.enabled}
                        onValueChange={() => handleToggleChannel(item.id)}
                        trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                        thumbColor={item.enabled ? THEME.colors.parental : '#F8FAFC'}
                      />

                      {/* Delete */}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteChannel(item)}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            {/* Similar Channels Recommendation Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#F59E0B' }]}>
                  <Sparkles size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Sugestões Semelhantes aos Seus Canais</Text>
                  <Text style={styles.sectionSubtitle}>
                    Baseado nos {channels.length} canais que você autorizou
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewAllSugBtn}
                  onPress={() => setActiveTab('SUGGESTIONS')}
                >
                  <Text style={styles.viewAllSugText}>Ver Todas ({unaddedCount})</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.presetsList}>
                {smartSuggestions.slice(0, 4).map((sug) => {
                  const cat = categories.find(c => c.id === sug.categoryId);
                  return (
                    <View key={sug.id} style={styles.suggestionCardCompact}>
                      {sug.avatarUrl ? (
                        <Image source={{ uri: sug.avatarUrl }} style={styles.suggestionAvatarCompact} />
                      ) : (
                        <View style={[styles.suggestionAvatarCompact, styles.suggestionAvatarPlaceholder]}>
                          <Tv size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.presetMeta}>
                        <View style={styles.compactTitleRow}>
                          <Text style={styles.presetTitle} numberOfLines={1}>{sug.title}</Text>
                          {cat && (
                            <Text style={[styles.compactCatPill, { color: cat.color }]}>
                              {cat.icon} {cat.name}
                            </Text>
                          )}
                        </View>
                        <View style={styles.reasonBadgeCompact}>
                          <Sparkles size={11} color="#F59E0B" />
                          <Text style={styles.reasonTextCompact} numberOfLines={1}>{sug.reasonText}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.presetBtn, sug.isAdded && styles.presetBtnAdded]}
                        onPress={() => !sug.isAdded && handleAddSuggestedChannel(sug)}
                        disabled={sug.isAdded}
                      >
                        {sug.isAdded ? (
                          <View style={styles.addedRowSmall}>
                            <Check size={14} color="#10B981" />
                            <Text style={styles.addedTextSmall}>Liberado</Text>
                          </View>
                        ) : (
                          <Text style={styles.presetBtnText}>+ Adicionar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* TAB: KID PROFILES (Netflix style) */}
        {activeTab === 'PROFILES' && (
          <>
            {/* Create Profile Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#EC4899' }]}>
                  <Users size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Adicionar Novo Perfil Infantil</Text>
                  <Text style={styles.sectionSubtitle}>
                    Crie um espaço independente para cada filho com idade e limites personalizados
                  </Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Nome do Filho(a):</Text>
              <TextInput
                style={styles.textInputFull}
                placeholder="Ex: Theo, Alice..."
                placeholderTextColor={THEME.colors.textMuted}
                value={newKidName}
                onChangeText={setNewKidName}
              />

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Escolha o Mascote:</Text>
              <View style={styles.avatarGrid}>
                {['🦁', '🐼', '🚀', '🦄', '🦖', '🐬', '🦊', '🐯', '🦉', '🎨', '🌟', '🌈'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarPickBtn,
                      newKidAvatar === emoji && styles.avatarPickBtnActive,
                    ]}
                    onPress={() => setNewKidAvatar(emoji)}
                  >
                    <Text style={styles.avatarEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Faixa Etária:</Text>
              <View style={styles.ageRow}>
                {[
                  { id: '3-5' as KidAgeGroup, label: '👶 3-5 anos' },
                  { id: '6-8' as KidAgeGroup, label: '🧒 6-8 anos' },
                  { id: '9-11' as KidAgeGroup, label: '👦 9-11 anos' },
                  { id: '12+' as KidAgeGroup, label: '🧑 12+ anos' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.ageBtn,
                      newKidAge === item.id && styles.ageBtnActive,
                    ]}
                    onPress={() => setNewKidAge(item.id)}
                  >
                    <Text
                      style={[
                        styles.ageBtnText,
                        newKidAge === item.id && styles.ageBtnTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.savePinBtn, { marginTop: 16, backgroundColor: '#EC4899' }]}
                onPress={async () => {
                  if (!newKidName.trim()) {
                    showFeedback('error', 'Digite o nome da criança.');
                    return;
                  }
                  const newProfile: KidProfile = {
                    id: `kid_${Date.now()}`,
                    name: newKidName.trim(),
                    avatarEmoji: newKidAvatar,
                    ageGroup: newKidAge,
                    dailyTimeLimitMinutes: 0,
                    allowedChannelIds: [],
                    screenTimeBalanceMinutes: 30,
                    bedtimeModeEnabled: true,
                    realWorldMissionsEnabled: true,
                  };
                  const updated = [...profiles, newProfile];
                  await handleSaveProfilesList(updated);
                  setNewKidName('');
                  showFeedback('success', `Perfil de ${newProfile.name} criado com sucesso!`);
                }}
              >
                <Text style={styles.savePinBtnText}>+ Cadastrar Filho(a)</Text>
              </TouchableOpacity>
            </View>

            {/* List of Profiles */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Perfis Ativos da Família ({profiles.length})</Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 14 }]}>
                Cada perfil tem sua própria idade, moedas de tempo e configurações
              </Text>

              <View style={{ gap: 12 }}>
                {profiles.map((p) => (
                  <View key={p.id} style={styles.profileManageCard}>
                    <View style={styles.profileManageHeader}>
                      <View style={styles.profileManageAvatar}>
                        <Text style={{ fontSize: 32 }}>{p.avatarEmoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileManageName}>{p.name}</Text>
                        <Text style={styles.profileManageSub}>
                          Faixa etária: {p.ageGroup} anos • Saldo: 🪙 {p.screenTimeBalanceMinutes ?? 30} min
                        </Text>
                      </View>
                      {profiles.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteProfileBtn}
                          onPress={() => handleDeleteProfile(p.id)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.profileRulesRow}>
                      <View style={styles.ruleBadge}>
                        <Clock size={12} color="#3B82F6" />
                        <Text style={styles.ruleBadgeText}>Limite: {p.dailyTimeLimitMinutes} min/dia</Text>
                      </View>
                      <View style={styles.ruleBadge}>
                        <Moon size={12} color="#8B5CF6" />
                        <Text style={styles.ruleBadgeText}>Pré-Sono Ativo</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* TAB: EDUCATIONAL CHALLENGES */}
        {activeTab === 'CHALLENGES' && (
          <>
            {/* Explicit Notice: Conditions Can Be Disabled At Any Time */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderWidth: 1.5,
              borderColor: '#93C5FD',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <ShieldCheck size={22} color="#2A97EE" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E3A8A', marginBottom: 2 }}>
                  Autonomia Total dos Pais
                </Text>
                <Text style={{ fontSize: 12, color: '#1E40AF', lineHeight: 18 }}>
                  Tudo o que implica condições ou desafios para a criança obter mais tempo de uso pode ser desativado por você a qualquer momento nesta tela. Se preferir tempo livre sem desafios, basta desligar as opções abaixo.
                </Text>
              </View>
            </View>

            {/* Activation Switch Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>

                <View style={[styles.sectionIconCircle, { backgroundColor: '#8B5CF6' }]}>
                  <Award size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Desafios Educativos nos Intervalos</Text>
                  <Text style={styles.sectionSubtitle}>
                    A criança precisa resolver problemas lógicos, matemáticos ou de linguagem para continuar assistindo
                  </Text>
                </View>
                <Switch
                  value={challengesEnabled}
                  onValueChange={setChallengesEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#C4B5FD' }}
                  thumbColor={challengesEnabled ? '#8B5CF6' : '#94A3B8'}
                />
              </View>

              <View style={styles.infoBoxPurple}>
                <Text style={styles.infoBoxPurpleTitle}>💡 Como Funciona:</Text>
                <Text style={styles.infoBoxPurpleText}>
                  A cada {challengeInterval} minutos de reprodução de vídeo, a tela pausa com um quiz alegre e educativo. 
                  Apenas após acertar a quantidade de problemas estipulada, o próximo ciclo de vídeos é liberado. 
                  Você também pode liberar a qualquer momento usando seu PIN parental.
                </Text>
              </View>
            </View>

            {/* Revolutionary: Learning Economy (Ginásio da Mente) Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#F59E0B' }]}>
                  <Award size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Economia Educativa (Ginásio da Mente)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Permite à criança treinar o cérebro voluntariamente para conquistar minutos extras de vídeo
                  </Text>
                </View>
                <Switch
                  value={learningEconomyEnabled}
                  onValueChange={(v) => {
                    setLearningEconomyEnabled(v);
                    onSaveSettings({ ...settings, learningEconomyEnabled: v });
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
                  thumbColor={learningEconomyEnabled ? '#F59E0B' : '#94A3B8'}
                />
              </View>
              <Text style={{ fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 17 }}>
                🪙 No topo da tela inicial, um botão dourado "Ginásio" fica disponível. A criança resolve 3 exercícios e conquista +15 minutos de vídeo com mérito próprio.
              </Text>
            </View>

            {/* Revolutionary: Real World Missions Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#10B981' }]}>
                  <Activity size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Pausas com Missões no Mundo Real</Text>
                  <Text style={styles.sectionSubtitle}>
                    Mescla desafios mentais com missões físicas e afetivas fora da tela
                  </Text>
                </View>
                <Switch
                  value={realWorldMissionsEnabled}
                  onValueChange={(v) => {
                    setRealWorldMissionsEnabled(v);
                    onSaveSettings({ ...settings, realWorldMissionsEnabled: v });
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                  thumbColor={realWorldMissionsEnabled ? '#10B981' : '#94A3B8'}
                />
              </View>
              <Text style={{ fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 17 }}>
                🌳 Durante as pausas, propõe ações como beber água fresca, dar 5 pulinhos de sapo ou dar um abraço nos pais antes de voltar ao próximo vídeo.
              </Text>
            </View>

            {/* Age Group Selector Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Faixa Etária da Criança</Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>
                Os desafios são adaptados ao nível cognitivo e escolar de cada idade
              </Text>

              <View style={styles.ageCardsGrid}>
                {[
                  {
                    id: '3-5' as KidAgeGroup,
                    title: '3 a 5 anos',
                    subtitle: 'Educação Infantil',
                    emoji: '👶',
                    desc: 'Contagem com figuras, animais, cores e primeiras letras.',
                    color: '#EC4899',
                  },
                  {
                    id: '6-8' as KidAgeGroup,
                    title: '6 a 8 anos',
                    subtitle: 'Anos Iniciais',
                    emoji: '🧒',
                    desc: 'Somas e subtrações até 20, rimas, sílabas e sequências.',
                    color: '#3B82F6',
                  },
                  {
                    id: '9-11' as KidAgeGroup,
                    title: '9 a 11 anos',
                    subtitle: 'Fundamental I',
                    emoji: '👦',
                    desc: 'Tabuada, divisão, raciocínio lógico, antônimos e geometria.',
                    color: '#10B981',
                  },
                  {
                    id: '12+' as KidAgeGroup,
                    title: '12+ anos',
                    subtitle: 'Fundamental II',
                    emoji: '🧑',
                    desc: 'Porcentagem, equações, silogismos e figuras de linguagem.',
                    color: '#F59E0B',
                  },
                ].map((item) => {
                  const isSelected = kidAgeGroup === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.ageCard,
                        isSelected && { borderColor: item.color, backgroundColor: '#F8FAFC' },
                      ]}
                      onPress={() => setKidAgeGroup(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.ageCardHeader}>
                        <Text style={styles.ageEmoji}>{item.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.ageTitle, isSelected && { color: item.color }]}>
                            {item.title}
                          </Text>
                          <Text style={styles.ageSubtitle}>{item.subtitle}</Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.ageCheckCircle, { backgroundColor: item.color }]}>
                            <Check size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.ageDesc}>{item.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Intervals and Counts Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Intervalos de Tempo de Uso</Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>
                A cada quantos minutos de tela o desafio deve ser apresentado?
              </Text>

              <View style={styles.timeChipsContainer}>
                {[10, 15, 20, 30, 45, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.timeChip,
                      challengeInterval === mins && styles.timeChipActive,
                    ]}
                    onPress={() => setChallengeInterval(mins)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        challengeInterval === mins && styles.timeChipTextActive,
                      ]}
                    >
                      {mins} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
                Quantidade Inicial de Problemas
              </Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>
                Quantos desafios a criança resolve no primeiro intervalo:
              </Text>

              <View style={styles.timeChipsContainer}>
                {[1, 2, 3, 5].map((cnt) => (
                  <TouchableOpacity
                    key={cnt}
                    style={[
                      styles.timeChip,
                      initialCount === cnt && styles.timeChipActive,
                    ]}
                    onPress={() => setInitialCount(cnt)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        initialCount === cnt && styles.timeChipTextActive,
                      ]}
                    >
                      {cnt} {cnt === 1 ? 'problema' : 'problemas'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.progressiveRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.progressiveTitle}>Aumento Progressivo (+1 desafio por intervalo)</Text>
                  <Text style={styles.progressiveDesc}>
                    A cada ciclo assistido, adiciona +1 problema (ex: 2 no 1º intervalo, 3 no 2º, 4 no 3º), incentivando a criança a fazer pausas mais longas.
                  </Text>
                </View>
                <Switch
                  value={progressiveInc}
                  onValueChange={setProgressiveInc}
                  trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                  thumbColor={progressiveInc ? '#10B981' : '#94A3B8'}
                />
              </View>
            </View>

            {/* Subjects Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Disciplinas e Áreas de Desafio</Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>
                Selecione as matérias que aparecerão nos sorteios de perguntas:
              </Text>

              <View style={styles.subjectsList}>
                <TouchableOpacity
                  style={styles.subjectItem}
                  onPress={() => setEnableMath(!enableMath)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subjectIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={{ fontSize: 20 }}>➕</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>Matemática Divertida</Text>
                    <Text style={styles.subjectMeta}>Contagem, somas, subtrações, tabuadas e porcentagens</Text>
                  </View>
                  <Switch
                    value={enableMath}
                    onValueChange={setEnableMath}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={enableMath ? '#3B82F6' : '#94A3B8'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.subjectItem}
                  onPress={() => setEnableLogic(!enableLogic)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subjectIconBox, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={{ fontSize: 20 }}>💡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>Desafios de Lógica</Text>
                    <Text style={styles.subjectMeta}>Sequências lógicas, deduções, padrões visuais e charadas</Text>
                  </View>
                  <Switch
                    value={enableLogic}
                    onValueChange={setEnableLogic}
                    trackColor={{ false: '#CBD5E1', true: '#C4B5FD' }}
                    thumbColor={enableLogic ? '#8B5CF6' : '#94A3B8'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.subjectItem}
                  onPress={() => setEnableLanguage(!enableLanguage)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subjectIconBox, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={{ fontSize: 20 }}>📖</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>Língua & Alfabetização</Text>
                    <Text style={styles.subjectMeta}>Primeiras letras, rimas, sílabas, antônimos e gramática</Text>
                  </View>
                  <Switch
                    value={enableLanguage}
                    onValueChange={setEnableLanguage}
                    trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                    thumbColor={enableLanguage ? '#10B981' : '#94A3B8'}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.savePinBtn, { marginTop: 16, backgroundColor: '#8B5CF6' }]}
                onPress={handleSaveChallengesSettings}
              >
                <Text style={styles.savePinBtnText}>Salvar Configurações de Desafios</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* TAB: CLOUD & SHARE */}
        {activeTab === 'CLOUD_SHARE' && (
          <>
            {/* Google Account & Cloud Database */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#4285F4' }]}>
                  <Cloud size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Login com Google & Nuvem</Text>
                  <Text style={styles.sectionSubtitle}>
                    Sincronização 100% em banco de dados na nuvem para acessar em qualquer dispositivo
                  </Text>
                </View>
              </View>

              {userProfile && userProfile.isLoggedIn ? (
                /* Profile Connected View */
                <View style={styles.cloudProfileCard}>
                  <View style={styles.cloudProfileHeader}>
                    <Image
                      source={{ uri: userProfile.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c' }}
                      style={styles.cloudProfileAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cloudProfileName}>{userProfile.name}</Text>
                      <Text style={styles.cloudProfileEmail}>{userProfile.email}</Text>
                      <View style={styles.cloudLiveBadge}>
                        <View style={styles.greenDot} />
                        <Text style={styles.cloudLiveText}>Sincronizado na Nuvem PuerFlix</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cloudNoticeBox}>
                    <Text style={styles.cloudNoticeText}>
                      ☁️ Seus {channels.length} canais, pastas e configurações estão salvos com segurança em banco de dados na nuvem. Você pode instalar o PuerFlix em qualquer celular, tablet ou TV e logar com esta conta.
                    </Text>
                  </View>

                  <View style={styles.cloudActionsRow}>
                    <TouchableOpacity
                      style={styles.syncNowBtn}
                      onPress={handleManualCloudSync}
                      disabled={isSyncingCloud}
                    >
                      {isSyncingCloud ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <RefreshCw size={15} color="#FFFFFF" />
                          <Text style={styles.syncNowBtnText}>Sincronizar Tudo Agora</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.signOutBtn}
                      onPress={handleGoogleSignOut}
                    >
                      <LogOut size={15} color="#EF4444" />
                      <Text style={styles.signOutBtnText}>Sair</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Not Logged In View */
                <View style={styles.cloudSignInCard}>
                  <Text style={styles.cloudSignInDesc}>
                    Conecte sua conta Google para salvar tudo em banco de dados na nuvem. Seus canais adicionados e configurações poderão ser acessados de qualquer aparelho onde você instalar o PuerFlix!
                  </Text>

                  <View style={styles.googleInputGroup}>
                    <Text style={styles.fieldLabel}>E-mail da Conta Google:</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="ex: pais@gmail.com"
                      value={googleEmail}
                      onChangeText={setGoogleEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={styles.fieldLabel}>Nome do Responsável:</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="ex: Bruno"
                      value={googleName}
                      onChangeText={setGoogleName}
                    />

                    <TouchableOpacity
                      style={styles.googleSignInBtn}
                      onPress={handleGoogleSignIn}
                      disabled={isSigningInGoogle}
                    >
                      {isSigningInGoogle ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <LogIn size={18} color="#FFFFFF" />
                          <Text style={styles.googleSignInBtnText}>Entrar com Conta Google</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Share Channels Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#10B981' }]}>
                  <Share2 size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Compartilhar Lista de Canais</Text>
                  <Text style={styles.sectionSubtitle}>
                    Envie sua lista de canais autorizados para amigos ou familiares com 1 clique
                  </Text>
                </View>
              </View>

              <Text style={styles.shareChannelsInfo}>
                Gere um código seguro com sua curadoria de {channels.length} canais para que outros pais possam importar diretamente no PuerFlix deles pelo WhatsApp.
              </Text>

              <TouchableOpacity
                style={styles.generateShareBtn}
                onPress={handleGenerateShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.generateShareBtnText}>
                      {shareCode ? 'Gerar Novo Código' : 'Gerar Link & Código de Compartilhamento'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {shareCode ? (
                <View style={styles.shareResultCard}>
                  <Text style={styles.shareCodeLabel}>CÓDIGO DE COMPARTILHAMENTO:</Text>
                  <Text style={styles.shareCodeValue}>{shareCode}</Text>

                  <View style={styles.shareButtonsRow}>
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={handleShareWhatsApp}
                    >
                      <Text style={styles.whatsappBtnText}>💬 Enviar no WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.copyBtn, sharedCopySuccess && styles.copyBtnSuccess]}
                      onPress={handleCopyLink}
                    >
                      <Copy size={16} color="#FFFFFF" />
                      <Text style={styles.copyBtnText}>
                        {sharedCopySuccess ? 'Copiado! ✓' : 'Copiar Link'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Import Shared Channels by Code */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#6366F1' }]}>
                  <Download size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Importar Lista de um Amigo</Text>
                  <Text style={styles.sectionSubtitle}>
                    Insira o código compartilhado por outro responsável para adicionar os canais dele
                  </Text>
                </View>
              </View>

              <View style={styles.importCodeRow}>
                <TextInput
                  style={styles.importCodeInput}
                  placeholder="Ex: PF-ABC123"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={importCode}
                  onChangeText={setImportCode}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.importCodeBtn}
                  onPress={handleImportByCode}
                  disabled={isImportingShare}
                >
                  {isImportingShare ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.importCodeBtnText}>Importar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* TAB 2: SIMILAR SUGGESTIONS */}
        {activeTab === 'SUGGESTIONS' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#F59E0B' }]}>
                <Sparkles size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Sugestões de Canais Semelhantes</Text>
                <Text style={styles.sectionSubtitle}>
                  Recomendações inteligentes e 100% seguras baseadas no perfil dos canais que você já adicionou
                </Text>
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionFilterScroll}>
              <TouchableOpacity
                style={[styles.filterPill, suggestionFilterCat === 'ALL' && styles.filterPillActive]}
                onPress={() => setSuggestionFilterCat('ALL')}
              >
                <Text style={[styles.filterPillText, suggestionFilterCat === 'ALL' && styles.filterPillTextActive]}>
                  Todas ({smartSuggestions.length})
                </Text>
              </TouchableOpacity>

              {categories.map((cat) => {
                const count = smartSuggestions.filter(s => s.categoryId === cat.id).length;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterPill, suggestionFilterCat === cat.id && styles.filterPillActive]}
                    onPress={() => setSuggestionFilterCat(cat.id)}
                  >
                    <Text style={[styles.filterPillText, suggestionFilterCat === cat.id && styles.filterPillTextActive]}>
                      {cat.icon} {cat.name} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Suggestions list */}
            <View style={styles.suggestionsList}>
              {displayedSuggestions.map((sug) => {
                const cat = categories.find(c => c.id === sug.categoryId);
                return (
                  <View key={sug.id} style={styles.suggestionCard}>
                    {sug.avatarUrl ? (
                      <Image source={{ uri: sug.avatarUrl }} style={styles.suggestionAvatar} />
                    ) : (
                      <View style={[styles.suggestionAvatar, styles.suggestionAvatarPlaceholder]}>
                        <Tv size={24} color="#94A3B8" />
                      </View>
                    )}

                    <View style={styles.suggestionInfo}>
                      <View style={styles.suggestionTitleRow}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                          {sug.title}
                        </Text>
                        {cat && (
                          <View style={[styles.suggestionCatBadge, { backgroundColor: cat.color + '22', borderColor: cat.color }]}>
                            <Text style={[styles.suggestionCatText, { color: cat.color }]}>
                              {cat.icon} {cat.name}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.suggestionHandle}>{sug.handle}</Text>

                      {/* Reason badge */}
                      <View style={styles.reasonBadge}>
                        <Sparkles size={12} color="#F59E0B" />
                        <Text style={styles.reasonText}>{sug.reasonText}</Text>
                      </View>

                      {sug.description ? (
                        <Text style={styles.suggestionDesc} numberOfLines={2}>
                          {sug.description}
                        </Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={[styles.addSugBtn, sug.isAdded && styles.addSugBtnAdded]}
                      onPress={() => !sug.isAdded && handleAddSuggestedChannel(sug)}
                      disabled={sug.isAdded}
                    >
                      {sug.isAdded ? (
                        <View style={styles.addedRow}>
                          <Check size={16} color="#10B981" />
                          <Text style={styles.addedText}>Autorizado</Text>
                        </View>
                      ) : (
                        <View style={styles.addSugRow}>
                          <Plus size={16} color="#FFFFFF" />
                          <Text style={styles.addSugText}>Adicionar</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 2: FOLDERS & CATEGORIES */}
        {activeTab === 'FOLDERS' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Folder size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Criar Nova Pasta</Text>
                <Text style={styles.sectionSubtitle}>
                  Organize os vídeos por assunto (ex: Ciência, Desenhos, Músicas)
                </Text>
              </View>
            </View>

            <View style={styles.createFolderRow}>
              <TextInput
                style={[styles.channelInput, { flex: 2 }]}
                placeholder="Nome da Pasta (ex: Histórias)"
                placeholderTextColor={THEME.colors.textMuted}
                value={newFolderName}
                onChangeText={setNewFolderName}
              />
              <TextInput
                style={[styles.channelInput, { flex: 1, textAlign: 'center' }]}
                placeholder="Emoji (ex: 📖)"
                placeholderTextColor={THEME.colors.textMuted}
                value={newFolderIcon}
                onChangeText={setNewFolderIcon}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleCreateFolder}
              >
                <Text style={styles.addBtnText}>Criar Pasta</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.foldersListContainer}>
              <Text style={styles.listSectionTitle}>Suas Pastas ({categories.length}):</Text>
              {categories.map((cat) => {
                const count = channels.filter(c => c.categoryId === cat.id).length;
                return (
                  <View key={cat.id} style={styles.folderItem}>
                    <Text style={styles.folderEmoji}>{cat.icon}</Text>
                    <View style={styles.folderInfo}>
                      <Text style={styles.folderItemTitle}>{cat.name}</Text>
                      <Text style={styles.folderCount}>{count} canais/playlists nesta pasta</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteFolderBtn}
                      onPress={() => handleDeleteFolder(cat)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 3: REPORTS & ANALYTICS */}
        {activeTab === 'REPORTS' && report && (
          <>
            <AnalyticsChart
              report={report}
              dailyLimitMinutes={settings.dailyTimeLimitMinutes}
            />

            {/* AI Guardian: Family Connection Topics */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#8B5CF6' }]}>
                  <Sparkles size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Guardião IA: Tópicos de Conexão Familiar</Text>
                  <Text style={styles.sectionSubtitle}>
                    Perguntas e conversas afetivas geradas pela IA a partir do que seu filho assistiu
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                {AiGuardianService.generatePrompts(report.topChannels.map(tc => ({ channelTitle: tc.title })), channels).map((prompt) => {
                  const badge = AiGuardianService.getMomentBadge(prompt.suggestedMoment);

                  return (
                    <View key={prompt.id} style={styles.aiPromptCard}>
                      <View style={styles.aiPromptHeader}>
                        <View style={styles.aiPromptBadge}>
                          <Text style={styles.aiPromptEmoji}>{prompt.emoji}</Text>
                          <Text style={styles.aiPromptTopic}>{prompt.topic}</Text>
                        </View>
                        <View style={[styles.momentPill, { backgroundColor: badge.color + '22' }]}>
                          <Text style={[styles.momentPillText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>

                      <Text style={styles.aiPromptQuestion}>"{prompt.questionForKid}"</Text>

                      <View style={styles.aiInsightBox}>
                        <Heart size={14} color="#EC4899" style={{ marginTop: 2, marginRight: 6 }} />
                        <Text style={styles.aiInsightText}>
                          <Text style={{ fontWeight: '700', color: '#CBD5E1' }}>Visão dos Pais: </Text>
                          {prompt.parentInsight}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}


        {/* TAB 4: SEARCH & DISCOVER CHANNELS */}
        {activeTab === 'IMPORT' && (
          <>
            {/* Direct Search & Discover Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#3B82F6' }]}>
                  <Compass size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Buscar Canais por Conteúdo ou Termo</Text>
                  <Text style={styles.sectionSubtitle}>
                    Selecione temas infantis da lista, digite palavras-chave ou filtre por país
                  </Text>
                </View>
              </View>

              {/* 1. Nationality Filter Selector Bar */}
              <View style={styles.filterSectionBox}>
                <View style={styles.filterSectionHeader}>
                  <Globe size={15} color="#38BDF8" />
                  <Text style={styles.filterSectionTitle}>Nacionalidade dos Canais:</Text>
                  <Text style={styles.filterSectionCurrent}>
                    {getNationalityByCode(selectedCountry).flag} {getNationalityByCode(selectedCountry).name}
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScrollRow}>
                  {NATIONALITY_OPTIONS.map((option) => {
                    const isSelected = selectedCountry === option.code;
                    return (
                      <TouchableOpacity
                        key={option.code}
                        style={[styles.countryPill, isSelected && styles.countryPillActive]}
                        onPress={() => handleSelectCountry(option.code)}
                      >
                        <Text style={styles.countryFlag}>{option.flag}</Text>
                        <Text style={[styles.countryPillText, isSelected && styles.countryPillTextActive]}>
                          {option.name}
                        </Text>
                        {isSelected && <Check size={13} color="#FFFFFF" style={{ marginLeft: 3 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 2. Curated Keywords / Topics List */}
              <View style={styles.filterSectionBox}>
                <View style={styles.filterSectionHeader}>
                  <Tag size={15} color="#F59E0B" />
                  <Text style={styles.filterSectionTitle}>Temas e Palavras-chave Selecionáveis:</Text>
                </View>

                {/* Topic Category Selector Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicCatRow}>
                  {CURATED_SEARCH_TOPICS.map((cat, idx) => {
                    const isCatSelected = selectedTopicCatIndex === idx;
                    return (
                      <TouchableOpacity
                        key={cat.categoryName}
                        style={[styles.topicCatTab, isCatSelected && styles.topicCatTabActive]}
                        onPress={() => setSelectedTopicCatIndex(idx)}
                      >
                        <Text style={styles.topicCatIcon}>{cat.icon}</Text>
                        <Text style={[styles.topicCatText, isCatSelected && styles.topicCatTextActive]}>
                          {cat.categoryName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Topic Chips of selected category */}
                <View style={styles.topicChipsContainer}>
                  {CURATED_SEARCH_TOPICS[selectedTopicCatIndex]?.topics.map((topic) => (
                    <TouchableOpacity
                      key={topic.label}
                      style={styles.topicChip}
                      onPress={() => handleSelectTopic(topic)}
                      activeOpacity={0.7}
                    >
                      {topic.icon ? <Text style={styles.topicChipIcon}>{topic.icon}</Text> : null}
                      <Text style={styles.topicChipText}>{topic.label}</Text>
                      <Plus size={13} color="#38BDF8" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Manual Search Input */}
              <Text style={styles.manualInputLabel}>Ou digite termos e palavras-chave manualmente:</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <Search size={16} color={THEME.colors.textMuted} style={styles.inputSearchIcon} />
                  <TextInput
                    style={styles.channelInputWithIcon}
                    placeholder="Ex: ciência infantil, história para dormir..."
                    placeholderTextColor={THEME.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearchYouTube()}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearSearchBtn}
                      onPress={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <X size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, isSearching && styles.addBtnDisabled]}
                  onPress={() => handleSearchYouTube()}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addBtnText}>Pesquisar</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 4. Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <View style={styles.searchResultsHeaderRow}>
                    <Text style={styles.searchResultsTitle}>
                      {searchResults.length} canais encontrados ({getNationalityByCode(selectedCountry).flag} {getNationalityByCode(selectedCountry).name}):
                    </Text>
                  </View>
                  {searchResults.map((chan) => {
                    const isAdded = channels.some(c => c.id === chan.id);
                    return (
                      <View key={chan.id} style={styles.searchResultItem}>
                        {chan.avatarUrl ? (
                          <Image source={{ uri: chan.avatarUrl }} style={styles.channelAvatar} />
                        ) : (
                          <View style={[styles.channelAvatar, styles.suggestionAvatarPlaceholder]}>
                            <Tv size={20} color="#94A3B8" />
                          </View>
                        )}
                        <View style={styles.searchResultMeta}>
                          <View style={styles.searchItemTitleRow}>
                            <Text style={styles.searchResultTitle} numberOfLines={1}>
                              {chan.title}
                            </Text>
                            <View style={styles.searchResultCountryBadge}>
                              <Text style={styles.searchResultCountryText}>
                                {getNationalityByCode(selectedCountry).flag}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.searchResultSub}>{chan.handle}</Text>
                          {chan.description ? (
                            <Text style={styles.searchResultSnippet} numberOfLines={2}>
                              {chan.description}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={[styles.presetBtn, isAdded && styles.presetBtnAdded]}
                          onPress={() => !isAdded && handleAddPreset(chan)}
                          disabled={isAdded}
                        >
                          {isAdded ? (
                            <View style={styles.addedRowSmall}>
                              <Check size={14} color="#10B981" />
                              <Text style={styles.addedTextSmall}>Liberado</Text>
                            </View>
                          ) : (
                            <Text style={styles.presetBtnText}>+ Aprovar</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Bulk Import */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#8B5CF6' }]}>
                  <Download size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Importar em Lote (Vários Links)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Cole vários links de canais ou playlists (um por linha)
                  </Text>
                </View>
              </View>

              <TextInput
                style={styles.bulkTextArea}
                placeholder={`https://youtube.com/@Canal1\nhttps://youtube.com/@Canal2\nhttps://youtube.com/playlist?list=PL...`}
                placeholderTextColor={THEME.colors.textMuted}
                value={bulkInput}
                onChangeText={setBulkInput}
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={[styles.savePinBtn, isBulkImporting && styles.addBtnDisabled]}
                onPress={handleBulkImport}
                disabled={isBulkImporting}
              >
                {isBulkImporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.savePinBtnText}>Importar Todos em Lote</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* TAB 5: SECURITY & TIME */}
        {activeTab === 'SECURITY' && (
          <>
            {/* License & Device Protection Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#10B981' }]}>
                  <ShieldCheck size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.sectionTitle}>Licença & Aparelho Vinculado</Text>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                      <Text style={{ color: '#15803D', fontSize: 11, fontWeight: '700' }}>✓ Ativa</Text>
                    </View>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Proteção de hardware: o app só funciona neste dispositivo cadastrado
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Plano Contratado:</Text>
                  <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700' }}>
                    {activeLicense?.planName || 'Plano Familiar Seguro'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Chave Registrada:</Text>
                  <Text style={{ fontSize: 13, color: '#2563EB', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {activeLicense?.licenseKey || 'PUER-VIP-2026-PAIS'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>ID do Aparelho (Hardware):</Text>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {activeLicense?.deviceId || currentDeviceId || 'DVC-GERANDO...'}
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#FDE68A' }}>
                <Text style={{ fontSize: 11, color: '#92400E', lineHeight: 16 }}>
                  🔒 <Text style={{ fontWeight: '700' }}>Trava Anti-Pirataria:</Text> Mesmo que este aplicativo (.apk) seja copiado ou enviado para terceiros, ele exigirá uma chave de compra válida para abrir no aparelho de destino.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  alignItems: 'center',
                  backgroundColor: '#FEF2F2',
                }}
                onPress={handleDeactivateDeviceLicense}
              >
                <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700' }}>
                  Desvincular Licença deste Dispositivo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Screen Time Limit */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#F59E0B' }]}>
                  <Clock size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Limite de Tempo de Tela Diário</Text>
                  <Text style={styles.sectionSubtitle}>
                    Bloqueia o app amigavelmente após o tempo selecionado
                  </Text>
                </View>
              </View>

              <View style={styles.timeChipsContainer}>
                {[
                  { label: 'Sem Limite', value: 0 },
                  { label: '30 min', value: 30 },
                  { label: '45 min', value: 45 },
                  { label: '1 hora', value: 60 },
                  { label: '1h30', value: 90 },
                  { label: '2 horas', value: 120 },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeChip,
                      selectedTimeLimit === option.value && styles.timeChipActive,
                    ]}
                    onPress={() => handleSelectTimeLimit(option.value)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        selectedTimeLimit === option.value && styles.timeChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Channel Library Display Mode (Grid vs Horizontal) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#2A97EE' }]}>
                  <LayoutGrid size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Modo da Biblioteca do Canal</Text>
                  <Text style={styles.sectionSubtitle}>
                    Como os vídeos serão mostrados quando a criança clicar em um canal específico:
                  </Text>
                </View>
              </View>

              <View style={styles.viewModeGrid}>
                <TouchableOpacity
                  style={[
                    styles.viewModeCard,
                    channelViewMode === 'grid' && styles.viewModeCardActive,
                  ]}
                  onPress={() => handleToggleChannelViewMode('grid')}
                  activeOpacity={0.8}
                >
                  <View style={styles.viewModeHeader}>
                    <Text style={{ fontSize: 24 }}>📱</Text>
                    <Text style={[styles.viewModeCardTitle, channelViewMode === 'grid' && styles.viewModeCardTitleActive]}>
                      Grade Vertical (Mosaico)
                    </Text>
                  </View>
                  <Text style={styles.viewModeCardDesc}>
                    Rolagem contínua para baixo exibindo todos os episódios do canal em blocos visuais.
                  </Text>
                  {channelViewMode === 'grid' && (
                    <View style={styles.viewModeActiveBadge}>
                      <Check size={12} color="#FFFFFF" />
                      <Text style={styles.viewModeActiveText}>Ativo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.viewModeCard,
                    channelViewMode === 'horizontal' && styles.viewModeCardActive,
                  ]}
                  onPress={() => handleToggleChannelViewMode('horizontal')}
                  activeOpacity={0.8}
                >
                  <View style={styles.viewModeHeader}>
                    <Text style={{ fontSize: 24 }}>↔️</Text>
                    <Text style={[styles.viewModeCardTitle, channelViewMode === 'horizontal' && styles.viewModeCardTitleActive]}>
                      Carrossel Horizontal
                    </Text>
                  </View>
                  <Text style={styles.viewModeCardDesc}>
                    Linha ampla e fluida com rolagem lateral contínua de todos os episódios.
                  </Text>
                  {channelViewMode === 'horizontal' && (
                    <View style={styles.viewModeActiveBadge}>
                      <Check size={12} color="#FFFFFF" />
                      <Text style={styles.viewModeActiveText}>Ativo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Neuro-Slow / Bedtime Mode */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#4338CA' }]}>
                  <Moon size={18} color="#FBBF24" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Modo Anti-Hiperestímulo & Pré-Sono (Neuro-Slow)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Luz âmbar suave que neutraliza a luz azul estimulante e prepara a melatonina infantil à noite
                  </Text>
                </View>
                <Switch
                  value={bedtimeModeEnabled}
                  onValueChange={handleToggleBedtime}
                  trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                  thumbColor={bedtimeModeEnabled ? '#4F46E5' : '#94A3B8'}
                />
              </View>

              {bedtimeModeEnabled && (
                <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                  <Text style={styles.fieldLabel}>Horário de Início do Modo Noturno:</Text>
                  <View style={styles.bedtimeHoursRow}>
                    {[18, 19, 20, 21].map((hour) => (
                      <TouchableOpacity
                        key={`start-${hour}`}
                        style={[
                          styles.bedtimeHourBtn,
                          bedtimeStartHour === hour && styles.bedtimeHourBtnActive,
                        ]}
                        onPress={() => handleUpdateBedtimeHours(hour, bedtimeEndHour)}
                      >
                        <Text
                          style={[
                            styles.bedtimeHourBtnText,
                            bedtimeStartHour === hour && styles.bedtimeHourBtnTextActive,
                          ]}
                        >
                          {hour}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Horário de Despertar (Fim do Modo Noturno):</Text>
                  <View style={styles.bedtimeHoursRow}>
                    {[6, 7, 8, 9].map((hour) => (
                      <TouchableOpacity
                        key={`end-${hour}`}
                        style={[
                          styles.bedtimeHourBtn,
                          bedtimeEndHour === hour && styles.bedtimeHourBtnActive,
                        ]}
                        onPress={() => handleUpdateBedtimeHours(bedtimeStartHour, hour)}
                      >
                        <Text
                          style={[
                            styles.bedtimeHourBtnText,
                            bedtimeEndHour === hour && styles.bedtimeHourBtnTextActive,
                          ]}
                        >
                          {hour}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.bedtimeInfoBanner}>
                    <Sparkles size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                    <Text style={styles.bedtimeInfoText}>
                      O PuerFlix aplicará automaticamente uma película âmbar relaxante durante o período noturno ({bedtimeStartHour}h às {bedtimeEndHour}h), desacelerando o cérebro sem interromper bruscamente a rotina.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Change PIN */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: THEME.colors.parental }]}>
                  <KeyRound size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Alterar PIN Parental</Text>
                  <Text style={styles.sectionSubtitle}>
                    Defina um código de 4 dígitos seguro
                  </Text>
                </View>
              </View>

              <View style={styles.pinFormRow}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="Novo PIN (4 dígitos)"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
                <TextInput
                  style={styles.pinInput}
                  placeholder="Confirmar PIN"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <Text style={styles.fieldLabel}>Pergunta de Recuperação:</Text>
              <TextInput
                style={styles.textInputFull}
                value={securityQuestion}
                onChangeText={setSecurityQuestion}
                placeholder="Ex: Nome do animal de estimação"
              />

              <Text style={styles.fieldLabel}>Resposta Secreta:</Text>
              <TextInput
                style={styles.textInputFull}
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
                placeholder="Sua resposta de recuperação"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.savePinBtn}
                onPress={handleUpdatePin}
              >
                <Text style={styles.savePinBtnText}>Salvar Novo PIN e Segurança</Text>
              </TouchableOpacity>
            </View>

            {/* Preferred Country for Searches */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#0284C7' }]}>
                  <Globe size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Nacionalidade Padrão das Buscas</Text>
                  <Text style={styles.sectionSubtitle}>
                    Escolha de qual país e idioma os canais devem vir por padrão
                  </Text>
                </View>
              </View>

              <View style={styles.countryGrid}>
                {NATIONALITY_OPTIONS.map((option) => {
                  const isSelected = selectedCountry === option.code;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      style={[styles.countryGridItem, isSelected && styles.countryGridItemActive]}
                      onPress={() => handleSelectCountry(option.code)}
                    >
                      <Text style={styles.countryGridFlag}>{option.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.countryGridName, isSelected && styles.countryGridNameActive]}>
                          {option.name}
                        </Text>
                        <Text style={styles.countryGridLang}>{option.language}</Text>
                      </View>
                      {isSelected ? (
                        <Check size={16} color="#0284C7" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* YouTube API Key */}
            <View style={[styles.sectionCard, { marginBottom: 50 }]}>
              <Text style={styles.sectionTitle}>Chave API do YouTube (Opcional)</Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>
                O PuerFlix funciona grátis sem chave. Adicione caso possua cota própria Google.
              </Text>

              <TextInput
                style={styles.textInputFull}
                placeholder="AIzaSy... (opcional)"
                placeholderTextColor={THEME.colors.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveApiKeyBtn} onPress={handleSaveApiKey}>
                <Text style={styles.saveApiKeyBtnText}>Salvar Chave</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.parental,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    elevation: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabNav: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabNavContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navTabActive: {
    backgroundColor: THEME.colors.parental,
    borderColor: THEME.colors.parental,
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  navTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  feedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feedbackError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  feedbackTextSuccess: {
    color: '#065F46',
  },
  feedbackTextError: {
    color: '#991B1B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: THEME.spacing.md,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.parental,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#475569',
    maxWidth: 280,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  channelInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: THEME.colors.parental,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  addBtnDisabled: {
    opacity: 0.7,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  folderSelectRow: {
    marginTop: 6,
  },
  folderSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  folderChipsRow: {
    gap: 6,
  },
  folderChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  folderChipActive: {
    backgroundColor: THEME.colors.parentalLight,
    borderColor: THEME.colors.parental,
  },
  folderChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  folderChipTextActive: {
    color: THEME.colors.parental,
    fontWeight: '800',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  listCountSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  filtersGroup: {
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterTabActive: {
    backgroundColor: THEME.colors.parental,
    borderColor: THEME.colors.parental,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterFoldersRow: {
    gap: 6,
  },
  catFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catFilterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: THEME.colors.parental,
  },
  catFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  catFilterTextActive: {
    color: THEME.colors.parental,
    fontWeight: '800',
  },
  emptyList: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  channelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  channelAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  channelInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeChannel: {
    backgroundColor: '#E0E7FF',
  },
  typeBadgePlaylist: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  typeBadgeTextChannel: {
    color: '#4338CA',
  },
  typeBadgeTextPlaylist: {
    color: '#B45309',
  },
  folderRow: {
    marginTop: 2,
  },
  folderBadge: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  presetsList: {
    gap: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  presetMeta: {
    flex: 1,
    paddingRight: 8,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  presetDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  presetBtnAdded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.parental,
  },
  createFolderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  foldersListContainer: {
    gap: 8,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  folderEmoji: {
    fontSize: 22,
  },
  folderInfo: {
    flex: 1,
  },
  folderItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  folderCount: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  deleteFolderBtn: {
    padding: 6,
  },
  searchResultsContainer: {
    marginTop: 14,
    gap: 8,
  },
  searchResultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchResultMeta: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  searchResultSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  bulkTextArea: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  timeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  timeChipActive: {
    backgroundColor: THEME.colors.parental,
    borderColor: THEME.colors.parental,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  pinFormRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pinInput: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  textInputFull: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  savePinBtn: {
    backgroundColor: THEME.colors.parental,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  savePinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  saveApiKeyBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  saveApiKeyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  viewAllSugBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  viewAllSugText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    gap: 10,
  },
  suggestionAvatarCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#334155',
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactCatPill: {
    fontSize: 10,
    fontWeight: '600',
  },
  reasonBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  reasonTextCompact: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
  },
  addedRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addedTextSmall: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionFilterScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterPillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    gap: 14,
  },
  suggestionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
  },
  suggestionAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionInfo: {
    flex: 1,
    gap: 3,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  suggestionCatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionCatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  suggestionHandle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reasonText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  suggestionDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  addSugBtn: {
    backgroundColor: THEME.colors.parental,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSugBtnAdded: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  addSugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSectionBox: {
    backgroundColor: '#0F172A',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  filterSectionCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginLeft: 'auto',
  },
  countryScrollRow: {
    flexDirection: 'row',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countryPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  countryFlag: {
    fontSize: 14,
    marginRight: 6,
  },
  countryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  countryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topicCatRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  topicCatTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topicCatTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#F59E0B',
  },
  topicCatIcon: {
    fontSize: 13,
  },
  topicCatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  topicCatTextActive: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  topicChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topicChipIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  manualInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  inputSearchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  channelInputWithIcon: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.md,
    paddingLeft: 38,
    paddingRight: 36,
    height: 44,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 10,
    padding: 4,
    zIndex: 2,
  },
  searchResultsHeaderRow: {
    marginBottom: 10,
  },
  searchItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultCountryBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  searchResultCountryText: {
    fontSize: 11,
  },
  searchResultSnippet: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  countryGrid: {
    gap: 8,
  },
  countryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
  },
  countryGridItemActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  countryGridFlag: {
    fontSize: 22,
  },
  countryGridName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  countryGridNameActive: {
    color: '#0284C7',
  },
  countryGridLang: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  // Info Box Purple
  infoBoxPurple: {
    backgroundColor: '#F5F3FF',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
    marginTop: 10,
  },
  infoBoxPurpleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
    marginBottom: 4,
  },
  infoBoxPurpleText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  // Age Cards
  ageCardsGrid: {
    gap: 10,
  },
  ageCard: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
  },
  ageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  ageEmoji: {
    fontSize: 26,
  },
  ageTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  ageSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  ageCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginLeft: 36,
  },
  // Progressive Row
  progressiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
    gap: 12,
  },
  progressiveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  progressiveDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 15,
  },
  // Subjects
  subjectsList: {
    gap: 10,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
  },
  subjectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  subjectMeta: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  // Cloud & Profile
  cloudProfileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cloudProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cloudProfileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  cloudProfileName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  cloudProfileEmail: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  cloudLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  cloudLiveText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  cloudNoticeBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  cloudNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  cloudActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  syncNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  syncNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  // Cloud Sign In
  cloudSignInCard: {
    paddingVertical: 6,
  },
  cloudSignInDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  googleInputGroup: {
    gap: 8,
  },
  googleSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    marginTop: 8,
  },
  googleSignInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Sharing Section
  shareChannelsInfo: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  generateShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
  },
  generateShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shareResultCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginTop: 14,
    alignItems: 'center',
  },
  shareCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  shareCodeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 2,
    marginVertical: 6,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Import Code
  importCodeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  importCodeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#0F172A',
  },
  importCodeBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  importCodeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  aiPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  aiPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  aiPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiPromptEmoji: {
    fontSize: 18,
  },
  aiPromptTopic: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  momentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  momentPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiPromptQuestion: {
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  aiInsightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  bedtimeHoursRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  bedtimeHourBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bedtimeHourBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#3730A3',
  },
  bedtimeHourBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  bedtimeHourBtnTextActive: {
    color: '#FFFFFF',
  },
  bedtimeInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  bedtimeInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  avatarPickBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  avatarPickBtnActive: {
    borderColor: '#EC4899',
    backgroundColor: '#FDF2F8',
    transform: [{ scale: 1.1 }],
  },
  avatarEmoji: {
    fontSize: 22,
  },
  ageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ageBtnActive: {
    backgroundColor: '#EC4899',
    borderColor: '#DB2777',
  },
  ageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  ageBtnTextActive: {
    color: '#FFFFFF',
  },
  profileManageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  profileManageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileManageAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  profileManageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  profileManageSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteProfileBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  profileRulesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ruleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  viewModeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  viewModeCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  viewModeCardActive: {
    borderColor: '#2A97EE',
    backgroundColor: '#EFF6FF',
  },
  viewModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  viewModeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  viewModeCardTitleActive: {
    color: '#1D4ED8',
  },
  viewModeCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  viewModeActiveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2A97EE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  viewModeActiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
