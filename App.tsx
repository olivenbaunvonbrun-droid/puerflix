import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, BackHandler, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Channel,
  Video,
  ParentSettings,
  ActiveTab,
  Category,
  EducationalChallenge,
  KidProfile,
} from './src/types';
import { StorageService } from './src/services/storageService';
import { YouTubeService } from './src/services/youtubeService';
import { AnalyticsService } from './src/services/analyticsService';
import { ChallengeService } from './src/services/challengeService';
import { CloudService } from './src/services/cloudService';
import { THEME } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { WatchScreen } from './src/screens/WatchScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { ParentalSettingsScreen } from './src/screens/ParentalSettingsScreen';
import { PinModal } from './src/components/PinModal';
import { ScreenTimeModal } from './src/components/ScreenTimeModal';
import { KidChallengeModal } from './src/components/KidChallengeModal';
import { SplashIntro } from './src/components/SplashIntro';
import { ProfileSelectorModal } from './src/components/ProfileSelectorModal';
import { MindGymModal } from './src/components/MindGymModal';
import { RealWorldMissionModal } from './src/components/RealWorldMissionModal';
import { BedtimeOverlay } from './src/components/BedtimeOverlay';
import { OnboardingWizardModal } from './src/components/OnboardingWizardModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LicenseService } from './src/services/licenseService';
import { LicenseActivationScreen } from './src/screens/LicenseActivationScreen';
import { AppLicense } from './src/types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('FEED');

  // License & Anti-Piracy Lock State
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);
  const [activeLicense, setActiveLicense] = useState<AppLicense | null>(null);
  const [initialLicenseKey, setInitialLicenseKey] = useState<string>('');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  // Kid Profiles State (Netflix style)
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<KidProfile | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Mind Gym (Learning Economy) State
  const [mindGymVisible, setMindGymVisible] = useState(false);

  // Real-World Missions State (Pediatric Screen Breaks)
  const [realWorldMissionVisible, setRealWorldMissionVisible] = useState(false);
  const [missionTurn, setMissionTurn] = useState(false);

  // Bedtime / Anti-hyperstimulation clock
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Parental Control & Security Settings State
  const [settings, setSettings] = useState<ParentSettings>({
    isConfigured: false,
    pin: '1234',
    securityQuestion: 'Qual o nome do seu animal de estimação?',
    securityAnswer: 'amigo',
    dailyTimeLimitMinutes: 0,
    youtubeApiKey: '',
    challengesEnabled: true,
    kidAgeGroup: '6-8',
    challengeIntervalMinutes: 20,
    initialChallengeCount: 2,
    progressiveIncrement: 1,
    enableMathChallenges: true,
    enableLogicChallenges: true,
    enableLanguageChallenges: true,
    learningEconomyEnabled: true,
    bedtimeModeEnabled: true,
    bedtimeStartHour: 19,
    bedtimeEndHour: 7,
    realWorldMissionsEnabled: true,
  });
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [timeExpiredModalVisible, setTimeExpiredModalVisible] = useState(false);

  // Educational Challenges State
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<EducationalChallenge[]>([]);
  const [sessionWatchMinutes, setSessionWatchMinutes] = useState(0);
  const [challengeCountInSession, setChallengeCountInSession] = useState(2);

  // Initialize data on boot
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [
        savedChannels,
        savedCategories,
        savedSettings,
        usedMinutes,
        savedProfiles,
        activeProfileId,
      ] = await Promise.all([
        StorageService.getChannels(),
        StorageService.getCategories(),
        StorageService.getSettings(),
        StorageService.getUsageToday(),
        StorageService.getProfiles(),
        StorageService.getActiveProfileId(),
      ]);

      let currentChannels = savedChannels;
      let currentCategories = savedCategories;
      let currentSettings = savedSettings;
      let currentProfiles = savedProfiles;

      // Sync with cloud database if user is logged in with Google
      const cloudUser = await CloudService.getCurrentUser();
      if (cloudUser) {
        const cloudData = await CloudService.fetchUserData(cloudUser.id);
        if (cloudData) {
          if (cloudData.channels && cloudData.channels.length > 0) {
            currentChannels = cloudData.channels;
          }
          if (cloudData.categories && cloudData.categories.length > 0) {
            currentCategories = cloudData.categories;
          }
          if (cloudData.settings) {
            currentSettings = { ...savedSettings, ...cloudData.settings, userProfile: cloudUser };
          }
          await StorageService.loadCloudAccountData(cloudData);
        }
      }

      // Check device license & One-Click URL activation
      let currentLicense = await LicenseService.getStoredLicense();
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        const urlKey = params.get('activate') || params.get('key') || params.get('license');
        if (urlKey) {
          setInitialLicenseKey(urlKey);
          const actResult = await LicenseService.activateLicense(urlKey);
          if (actResult.valid && actResult.license) {
            currentLicense = actResult.license;
          }
        }
      }

      if (currentLicense && currentLicense.isLicensed) {
        setIsLicensed(true);
        setActiveLicense(currentLicense);
      } else {
        setIsLicensed(false);
      }

      // Check URL for ?import=PF-XXXXX or ?code=...
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        const importCode = params.get('import') || params.get('code');
        if (importCode) {
          const share = await CloudService.getSharedChannels(importCode);
          if (share && share.channels && share.channels.length > 0) {
            const existingIds = new Set(currentChannels.map(c => c.id));
            const newChannels = share.channels.filter(c => !existingIds.has(c.id));
            if (newChannels.length > 0) {
              const merged = [...newChannels, ...currentChannels];
              await StorageService.saveChannels(merged);
              currentChannels = merged;
              alert(`🎉 ${newChannels.length} canais importados com sucesso da lista compartilhada por ${share.sharedBy}!`);
            }
          }
        }
      }

      // Ensure unconfigured/legacy 45min default profile is set to 0 (unlimited until configured)
      if (!currentSettings.isConfigured) {
        currentProfiles = currentProfiles.map(p => ({
          ...p,
          dailyTimeLimitMinutes: p.dailyTimeLimitMinutes === 45 ? 0 : p.dailyTimeLimitMinutes,
        }));
      }

      // Setup active kid profile
      const activeKid =
        currentProfiles.find(p => p.id === activeProfileId) ||
        currentProfiles[0] ||
        null;

      setProfiles(currentProfiles);
      setActiveProfile(activeKid);
      setChannels(currentChannels);
      setCategories(currentCategories);
      setSettings(currentSettings);
      setChallengeCountInSession(currentSettings.initialChallengeCount || 2);

      // Check daily screen time limit (only if an explicit limit > 0 was configured)
      const dailyLimit =
        activeKid && activeKid.dailyTimeLimitMinutes > 0
          ? activeKid.dailyTimeLimitMinutes
          : currentSettings.dailyTimeLimitMinutes || 0;
      if (dailyLimit > 0 && usedMinutes >= dailyLimit) {
        setTimeExpiredModalVisible(true);
      }

      // Check if onboarding needs to be shown (first install or not completed)
      if (!currentSettings.onboardingCompleted && !currentSettings.isConfigured) {
        setOnboardingVisible(true);
      }

      // Instant Cache Load (Zero-Delay Cold Start)
      const cachedVideos = await StorageService.getCachedVideos();
      const hasCache = cachedVideos && cachedVideos.length > 0;
      if (hasCache) {
        setVideos(cachedVideos);
        setLoading(false);
      }

      // If no cache exists yet, fetch now; if cache exists, defer refresh to background
      if (!hasCache) {
        const feedVideos = await YouTubeService.fetchFeed(currentChannels);
        if (feedVideos && feedVideos.length > 0) {
          setVideos(feedVideos);
          await StorageService.saveCachedVideos(feedVideos);
        }
      } else {
        // Background refresh deferred by 1200ms so the UI and GPU finish mounting with 0 hitching
        setTimeout(async () => {
          try {
            const feedVideos = await YouTubeService.fetchFeed(currentChannels);
            if (feedVideos && feedVideos.length > 0) {
              setVideos(feedVideos);
              await StorageService.saveCachedVideos(feedVideos);
            }
          } catch (err) {
            console.warn('Background feed refresh:', err);
          }
        }, 1200);
      }
    } catch (e) {
      console.error('Error initializing PuerFlix:', e);
    } finally {
      setLoading(false);
    }

  };

  const handleRefreshFeed = useCallback(async () => {
    setLoading(true);
    try {
      const feedVideos = await YouTubeService.fetchFeed(channels);
      if (feedVideos && feedVideos.length > 0) {
        setVideos(feedVideos);
        await StorageService.saveCachedVideos(feedVideos);
      }
    } catch (e) {
      console.error('Error refreshing feed:', e);
    } finally {
      setLoading(false);
    }
  }, [channels]);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'WATCH') {
        setActiveTab('FEED');
        setActiveVideo(null);
        return true;
      }
      if (activeTab === 'SEARCH') {
        setActiveTab('FEED');
        return true;
      }
      if (activeTab === 'PARENTAL') {
        setActiveTab('FEED');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeTab]);

  // Smart TV Remote / D-Pad Keyboard Navigation
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Back navigation with Escape or Backspace outside of inputs
      if (e.key === 'Escape' || (e.key === 'Backspace' && !isInput)) {
        if (activeTab === 'WATCH') {
          setActiveTab('FEED');
          setActiveVideo(null);
          e.preventDefault();
        } else if (activeTab === 'SEARCH' || activeTab === 'PARENTAL') {
          setActiveTab('FEED');
          e.preventDefault();
        }
        return;
      }

      // Spatial navigation for Smart TV Remote D-Pad (Arrow keys)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isInput) {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, [tabindex="0"], a, input, [role="button"]'
          )
        ).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
        });

        if (focusable.length === 0) return;

        const currentActive = document.activeElement as HTMLElement | null;
        const currentIndex = currentActive ? focusable.indexOf(currentActive) : -1;

        if (currentIndex === -1) {
          focusable[0]?.focus();
          e.preventDefault();
          return;
        }

        let nextIndex = currentIndex;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % focusable.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + focusable.length) % focusable.length;
        }

        if (nextIndex !== currentIndex && focusable[nextIndex]) {
          focusable[nextIndex].focus();
          focusable[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Screen time tracking & Educational Challenge interval
  useEffect(() => {
    const timer = setInterval(async () => {
      setCurrentHour(new Date().getHours());

      // 1. Daily usage tracking
      const dailyLimit =
        activeProfile && activeProfile.dailyTimeLimitMinutes > 0
          ? activeProfile.dailyTimeLimitMinutes
          : settings.dailyTimeLimitMinutes || 0;
      if (dailyLimit > 0) {
        const totalUsed = await StorageService.addUsageMinutes(1);
        if (totalUsed >= dailyLimit) {
          setTimeExpiredModalVisible(true);
        }
      }

      // 2. Educational Challenge & Real-World Mission Interval (while child is watching)
      if (
        activeTab === 'WATCH' &&
        settings.challengesEnabled !== false &&
        !challengeModalVisible &&
        !realWorldMissionVisible
      ) {
        setSessionWatchMinutes(prev => {
          const next = prev + 1;
          const interval = settings.challengeIntervalMinutes || 20;
          if (next >= interval) {
            // Alternate with real-world mission if enabled
            if (settings.realWorldMissionsEnabled && missionTurn) {
              setRealWorldMissionVisible(true);
              setMissionTurn(false);
              return 0;
            }

            // Trigger educational challenges for kid's age group
            const ageGroup = activeProfile?.ageGroup || settings.kidAgeGroup || '6-8';
            const subjects: ('MATH' | 'LOGIC' | 'LANGUAGE')[] = [];
            if (settings.enableMathChallenges !== false) subjects.push('MATH');
            if (settings.enableLogicChallenges !== false) subjects.push('LOGIC');
            if (settings.enableLanguageChallenges !== false) subjects.push('LANGUAGE');

            const list = ChallengeService.generateChallenges(
              challengeCountInSession,
              ageGroup,
              subjects
            );
            setActiveChallenges(list);
            setChallengeModalVisible(true);
            setMissionTurn(true);
            return 0;
          }
          return next;
        });
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [
    settings.dailyTimeLimitMinutes,
    settings.challengesEnabled,
    settings.challengeIntervalMinutes,
    settings.kidAgeGroup,
    settings.enableMathChallenges,
    settings.enableLogicChallenges,
    settings.enableLanguageChallenges,
    settings.realWorldMissionsEnabled,
    activeProfile,
    activeTab,
    challengeModalVisible,
    realWorldMissionVisible,
    missionTurn,
    challengeCountInSession,
  ]);

  const handleChallengeComplete = () => {
    setChallengeModalVisible(false);
    setSessionWatchMinutes(0);
    if ((settings.progressiveIncrement ?? 1) > 0) {
      setChallengeCountInSession(prev => prev + 1);
    }
  };

  const handleChallengeParentBypass = () => {
    setChallengeModalVisible(false);
    setSessionWatchMinutes(0);
  };

  // Video selection handler (records watch analytics in background without blocking UI thread)
  const handleSelectVideo = useCallback((video: Video) => {
    setActiveVideo(video);
    setActiveTab('WATCH');
    void AnalyticsService.logWatch(video, 4, activeProfile?.id);
  }, [activeProfile?.id]);

  const handleOpenSearch = useCallback(() => {
    setActiveTab('SEARCH');
  }, []);

  const handleOpenParental = useCallback(() => {
    setPinModalVisible(true);
  }, []);

  const handleOpenProfileSelector = useCallback(() => {
    setProfileModalVisible(true);
  }, []);

  const handleOpenMindGym = useCallback(() => {
    setMindGymVisible(true);
  }, []);

  const handleBackToFeed = useCallback(() => {
    setActiveTab('FEED');
    setActiveVideo(null);
  }, []);

  // Parental PIN success handler
  const handlePinSuccess = useCallback(() => {
    setPinModalVisible(false);
    setTimeExpiredModalVisible(false);
    setActiveTab('PARENTAL');
  }, []);

  // Screen Time extra allowance granted by parent
  const handleGrantExtraTime = async (minutes: number) => {
    await StorageService.grantExtraMinutes(minutes);
    setTimeExpiredModalVisible(false);
  };

  // Screen Time reset for today by parent
  const handleResetUsageToday = async () => {
    await StorageService.resetUsageToday();
    setTimeExpiredModalVisible(false);
  };

  // Save Channels from Settings
  const handleSaveChannels = async (updatedChannels: Channel[]) => {
    setChannels(updatedChannels);
    await StorageService.saveChannels(updatedChannels);
    setLoading(true);
    const feed = await YouTubeService.fetchFeed(updatedChannels);
    setVideos(feed);
    setLoading(false);
  };

  // Save Categories
  const handleSaveCategories = async (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);
  };

  // Save Settings
  const handleSaveSettings = async (updatedSettings: ParentSettings) => {
    setSettings(updatedSettings);
    await StorageService.saveSettings(updatedSettings);
  };

  // Onboarding Wizard completion handler
  const handleCompleteOnboarding = async (data: {
    settings: ParentSettings;
    channels: Channel[];
    profile: KidProfile;
  }) => {
    setOnboardingVisible(false);
    setSettings(data.settings);
    setChannels(data.channels);
    setProfiles([data.profile]);
    setActiveProfile(data.profile);

    await Promise.all([
      StorageService.saveSettings(data.settings),
      StorageService.saveChannels(data.channels),
      StorageService.saveProfiles([data.profile]),
      StorageService.setActiveProfileId(data.profile.id),
    ]);

    setLoading(true);
    const feed = await YouTubeService.fetchFeed(data.channels);
    setVideos(feed);
    setLoading(false);
  };

  // Onboarding Wizard skip handler ("Configurar Depois")
  const handleSkipOnboarding = async () => {
    setOnboardingVisible(false);
    const updated: ParentSettings = {
      ...settings,
      onboardingCompleted: true,
    };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };


  // Kid Profiles Management
  const handleSelectProfile = async (profileId: string) => {
    const selected = profiles.find(p => p.id === profileId);
    if (selected) {
      setActiveProfile(selected);
      await StorageService.setActiveProfileId(profileId);
      setSettings(prev => ({
        ...prev,
        kidAgeGroup: selected.ageGroup,
        activeProfileId: profileId,
      }));
    }
    setProfileModalVisible(false);
  };

  const handleAddProfile = async (newProfile: KidProfile) => {
    const updated = await StorageService.addProfile(newProfile);
    setProfiles(updated);
    setActiveProfile(newProfile);
    await StorageService.setActiveProfileId(newProfile.id);
  };

  // Learning Economy: Earn Video Minutes from Mind Gym
  const handleEarnMinutesFromGym = async (minutesEarned: number) => {
    if (activeProfile) {
      const updatedBalance = (activeProfile.screenTimeBalanceMinutes || 0) + minutesEarned;
      const updatedCoins = (activeProfile.coinsEarned || 0) + Math.floor(minutesEarned / 3);
      const updatedProfile: KidProfile = {
        ...activeProfile,
        screenTimeBalanceMinutes: updatedBalance,
        coinsEarned: updatedCoins,
      };
      await StorageService.updateProfile(updatedProfile);
      setActiveProfile(updatedProfile);
      setProfiles(prev => prev.map(p => (p.id === updatedProfile.id ? updatedProfile : p)));
    }
    // Grant extra minutes by deducting from today's usage
    await StorageService.addUsageMinutes(-minutesEarned);
    setTimeExpiredModalVisible(false);
  };

  // Filter channels based on active kid profile allowed channels and enabled status (Fail-Closed)
  const displayedChannels = useMemo(() => {
    const enabledOnly = channels.filter(c => c.enabled !== false);
    if (
      !activeProfile ||
      !activeProfile.allowedChannelIds ||
      activeProfile.allowedChannelIds.length === 0
    ) {
      return enabledOnly;
    }
    const allowedSet = new Set(activeProfile.allowedChannelIds);
    return enabledOnly.filter(c => allowedSet.has(c.id));
  }, [channels, activeProfile]);

  // Whitelist containment: Only videos belonging to strictly allowed and enabled channels
  const displayedVideos = useMemo(() => {
    const allowedChannelIds = new Set(displayedChannels.map(c => c.id));
    return videos.filter(v => allowedChannelIds.has(v.channelId));
  }, [videos, displayedChannels]);

  // Compute Bedtime / Neuro-Slow Mode
  const isBedtimeActive = useMemo(() => {
    if (settings.bedtimeModeEnabled === false) return false;
    const start = settings.bedtimeStartHour ?? 19;
    const end = settings.bedtimeEndHour ?? 7;
    if (start > end) {
      return currentHour >= start || currentHour < end;
    } else {
      return currentHour >= start && currentHour < end;
    }
  }, [settings.bedtimeModeEnabled, settings.bedtimeStartHour, settings.bedtimeEndHour, currentHour]);

  const isWeb = Platform.OS === 'web';
  const safeEdges: ('top' | 'left' | 'right')[] = isWeb ? [] : ['top', 'left', 'right'];

  // Anti-Piracy / Commercial Hardware Lock Gate
  if (isLicensed === false) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0F0F11' }]} edges={safeEdges}>
          <StatusBar style="light" />
          <LicenseActivationScreen
            initialKey={initialLicenseKey}
            onActivationSuccess={(lic) => {
              setActiveLicense(lic);
              setIsLicensed(true);
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: activeTab === 'PARENTAL' ? THEME.colors.parental : '#141414' },
        ]}
        edges={safeEdges}
      >
        <StatusBar style="light" />

        <View style={styles.container}>
          {activeTab === 'FEED' && (
            <HomeScreen
              channels={displayedChannels}
              categories={categories}
              videos={displayedVideos}
              loading={loading}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onRefresh={handleRefreshFeed}
              onSelectVideo={handleSelectVideo}
              onOpenSearch={handleOpenSearch}
              onOpenParental={handleOpenParental}
              onOpenProfileSelector={handleOpenProfileSelector}
              onOpenMindGym={handleOpenMindGym}
              activeProfile={activeProfile || undefined}
              learningEconomyEnabled={settings.learningEconomyEnabled ?? true}
              channelViewMode={settings.channelViewMode || 'grid'}
            />
          )}

          {activeTab === 'WATCH' && activeVideo && (
            <WatchScreen
              video={activeVideo}
              allVideos={displayedVideos}
              channels={displayedChannels}
              onBack={handleBackToFeed}
              onSelectVideo={handleSelectVideo}
            />
          )}

          {activeTab === 'SEARCH' && (
            <SearchScreen
              allVideos={displayedVideos}
              onBack={handleBackToFeed}
              onSelectVideo={handleSelectVideo}
            />
          )}

          {activeTab === 'PARENTAL' && (
            <ParentalSettingsScreen
              channels={channels}
              categories={categories}
              settings={settings}
              activeLicense={activeLicense}
              onSaveChannels={handleSaveChannels}
              onSaveCategories={handleSaveCategories}
              onSaveSettings={handleSaveSettings}
              onClose={() => setActiveTab('FEED')}
              onDeactivateLicense={() => {
                setActiveLicense(null);
                setIsLicensed(false);
                setActiveTab('FEED');
              }}
            />
          )}

          {/* Netflix-Style Kid Profile Selector Modal */}
          <ProfileSelectorModal
            visible={profileModalVisible}
            profiles={profiles}
            activeProfileId={activeProfile?.id || ''}
            onSelectProfile={handleSelectProfile}
            onAddProfile={handleAddProfile}
            onClose={() => setProfileModalVisible(false)}
            onOpenParental={() => {
              setProfileModalVisible(false);
              setPinModalVisible(true);
            }}
          />

          {/* Ginásio da Mente (Learning Economy) Modal */}
          <MindGymModal
            visible={mindGymVisible}
            ageGroup={activeProfile?.ageGroup || settings.kidAgeGroup || '6-8'}
            currentBalanceMinutes={activeProfile?.screenTimeBalanceMinutes || 30}
            onEarnMinutes={handleEarnMinutesFromGym}
            onClose={() => setMindGymVisible(false)}
          />

          {/* Real-World Missions Modal (Healthy Disconnection) */}
          <RealWorldMissionModal
            visible={realWorldMissionVisible}
            parentPin={settings.pin}
            onComplete={() => {
              setRealWorldMissionVisible(false);
              setSessionWatchMinutes(0);
            }}
            onParentBypass={() => {
              setRealWorldMissionVisible(false);
              setSessionWatchMinutes(0);
            }}
          />

          {/* Parental PIN Gatekeeper Modal */}
          <PinModal
            visible={pinModalVisible}
            settings={settings}
            onSuccess={handlePinSuccess}
            onClose={() => setPinModalVisible(false)}
            onResetPinSuccess={(newPin) => {
              const updated = { ...settings, pin: newPin };
              handleSaveSettings(updated);
            }}
          />

          {/* Daily Screen Time Exceeded Modal */}
          <ScreenTimeModal
            visible={timeExpiredModalVisible}
            parentPin={settings.pin}
            onOpenParental={() => {
              setTimeExpiredModalVisible(false);
              setPinModalVisible(true);
            }}
            onGrantExtraTime={handleGrantExtraTime}
            onResetUsageToday={handleResetUsageToday}
          />

          {/* Educational Challenge Quiz on Usage Intervals */}
          <KidChallengeModal
            visible={challengeModalVisible}
            challenges={activeChallenges}
            parentPin={settings.pin}
            onComplete={handleChallengeComplete}
            onParentBypass={handleChallengeParentBypass}
          />

          {/* Bedtime / Neuro-Slow Blue Light Warm Filter */}
          <BedtimeOverlay active={isBedtimeActive} />

          {/* Initial Setup Wizard on App Install */}
          <OnboardingWizardModal
            visible={onboardingVisible && !showSplash}
            initialChannels={channels}
            initialSettings={settings}
            initialProfiles={profiles}
            onComplete={handleCompleteOnboarding}
            onSkip={handleSkipOnboarding}
          />

          {/* Kid-Friendly Opening Splash Animation */}
          {showSplash && (
            <SplashIntro onFinish={() => setShowSplash(false)} />
          )}

        </View>
      </SafeAreaView>
    </ErrorBoundary>
  </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#141414',
  },
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
});
