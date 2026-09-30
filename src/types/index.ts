export type CuratedType = 'CHANNEL' | 'PLAYLIST';

export interface Category {
  id: string;              // Unique ID (e.g. 'ciencia', 'desenhos')
  name: string;            // Display name
  icon: string;            // Emoji or icon name (e.g. '🔬', '🎨')
  color: string;           // Hex color
}

export interface Channel {
  id: string;              // YouTube Channel ID (UC...) or Playlist ID (PL...)
  type?: CuratedType;      // 'CHANNEL' | 'PLAYLIST'
  title: string;           // Channel or Playlist title
  handle?: string;         // e.g. @manualdomundo or Playlist
  avatarUrl?: string;      // Profile picture or playlist thumbnail
  description?: string;
  customUrl?: string;
  categoryId?: string;     // Folder / Category ID
  addedAt: number;         // Timestamp
  enabled: boolean;        // Parent can toggle on/off without deleting
}

export interface Video {
  id: string;              // YouTube Video ID (e.g. dQw4w9WgXcQ)
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelAvatarUrl?: string;
  publishedAt: string;     // ISO String or formatted date
  categoryId?: string;
  isFromPlaylist?: boolean;
}

export interface WatchEvent {
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelTitle: string;
  channelAvatarUrl?: string;
  thumbnailUrl: string;
  timestamp: number;
  durationMinutes: number;
  profileId?: string;
}

export interface DayUsage {
  date: string;            // YYYY-MM-DD
  dayLabel: string;        // Seg, Ter, Qua...
  minutes: number;
}

export interface ChannelStat {
  channelId: string;
  title: string;
  avatarUrl?: string;
  minutes: number;
  viewsCount: number;
}

export interface VideoStat {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  viewsCount: number;
}

export interface AnalyticsReport {
  dailyUsage: DayUsage[];
  topChannels: ChannelStat[];
  topVideos: VideoStat[];
  totalMinutesThisWeek: number;
  dailyAverageMinutes: number;
  totalViewsThisWeek: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
  lastSyncedAt?: number;
}

export type KidAgeGroup = '3-5' | '6-8' | '9-11' | '12+';
export type ChallengeSubject = 'MATH' | 'LOGIC' | 'LANGUAGE';

export interface EducationalChallenge {
  id: string;
  subject: ChallengeSubject;
  ageGroup: KidAgeGroup;
  question: string;
  illustration?: string;
  options: string[];
  correctAnswer?: string;
  correctIndex: number;
  explanation?: string;
  visualEmoji?: string;
}

export interface KidProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  ageGroup: KidAgeGroup;
  dailyTimeLimitMinutes: number;
  allowedChannelIds: string[]; // empty means all channels allowed
  screenTimeBalanceMinutes: number; // for the Learning Economy
  coinsEarned?: number;
  bedtimeModeEnabled?: boolean;
  realWorldMissionsEnabled?: boolean;
}


export interface RealWorldMission {
  id: string;
  title: string;
  emoji: string;
  actionText: string;
  benefitText: string;
}

export interface ParentSettings {
  isConfigured: boolean;   // Has parent set their initial PIN?
  onboardingCompleted?: boolean; // Has parent completed or skipped onboarding wizard?
  pin: string;             // 4-digit PIN

  securityQuestion: string;
  securityAnswer: string;
  dailyTimeLimitMinutes: number; // 0 = unlimited, e.g. 60 = 1 hour
  youtubeApiKey?: string;  // Optional Google Cloud API Key
  preferredCountry?: string; // Country / nationality for channel searches ('BR', 'PT', 'US', etc., or 'ALL')
  
  // Google Account / Cloud Sync
  userProfile?: UserProfile;

  // Profiles System
  profiles?: KidProfile[];
  activeProfileId?: string;

  // Educational Screen Time Economy ("Ginásio da Mente")
  learningEconomyEnabled?: boolean;

  // Anti-Hyperstimulation & Bedtime Mode
  bedtimeModeEnabled?: boolean;
  bedtimeStartHour?: number; // e.g. 19 (19:00)
  bedtimeEndHour?: number;   // e.g. 7 (07:00)

  // Real World Missions
  realWorldMissionsEnabled?: boolean;

  // Educational Challenges & Age settings
  challengesEnabled?: boolean;
  kidAgeGroup?: KidAgeGroup;
  challengeIntervalMinutes?: number; // Minutes between challenges (e.g. 15, 20, 30)
  initialChallengeCount?: number;    // Number of challenges in first interval (e.g. 1, 2)
  progressiveIncrement?: number;     // Increment for each subsequent interval (e.g. 1)
  enableMathChallenges?: boolean;
  enableLogicChallenges?: boolean;
  enableLanguageChallenges?: boolean;

  // Channel Library Presentation Mode ('grid' for vertical mosaic, 'horizontal' for carousel)
  channelViewMode?: 'grid' | 'horizontal';
}

export interface NationalityOption {
  code: string;
  name: string;
  flag: string;
  language: string;
  hl: string;
  gl?: string;
}

export interface SearchTopicItem {
  label: string;
  query: string;
  icon?: string;
}

export interface SearchTopicCategory {
  categoryName: string;
  icon: string;
  topics: SearchTopicItem[];
}

export interface UsageStats {
  date: string;            // YYYY-MM-DD
  minutesUsed: number;
}

export type ActiveTab = 'FEED' | 'WATCH' | 'SEARCH' | 'PARENTAL';

export interface AppLicense {
  isLicensed: boolean;
  licenseKey: string;
  deviceId: string;
  activatedAt: number;
  customerEmail?: string;
  planName?: string;
  expiresAt?: number | null; // null = vitalício
  maxDevices?: number;
}

export interface LicenseValidationResult {
  valid: boolean;
  license?: AppLicense;
  message?: string;
  alreadyInUse?: boolean;
}
