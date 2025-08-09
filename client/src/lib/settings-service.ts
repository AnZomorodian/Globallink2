
export interface UserSettings {
  // Call Settings
  autoAnswer: boolean;
  callWaiting: boolean;
  doNotDisturb: boolean;

  // Privacy Settings
  showOnlineStatus: boolean;
  readReceipts: boolean;
  allowMessagesFromAnyone: boolean;

  // Audio/Video Quality
  highQualityAudio: boolean;
  hdVideoCalls: boolean;
  noiseCancellation: boolean;

  // Notifications
  desktopNotifications: boolean;
  soundNotifications: boolean;
  vibrateOnMobile: boolean;

  // Advanced
  hardwareAcceleration: boolean;
  autoSaveConversation: boolean;
  enableBetaFeatures: boolean;

  // Camera & Video
  autoStartCamera: boolean;
  mirrorFrontCamera: boolean;
  virtualBackgrounds: boolean;
  beautyFilter: boolean;

  // Security & Data
  twoFactorAuth: boolean;
  endToEndEncryption: boolean;
  autoDeleteMessages: boolean;

  // Performance & Network
  lowBandwidthMode: boolean;
  adaptiveBitrate: boolean;
  preloadMedia: boolean;

  // Accessibility
  screenReaderSupport: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  reduceMotion: boolean;

  // Backup & Sync
  autoBackupToCloud: boolean;
  syncAcrossDevices: boolean;
  includeCallRecordings: boolean;

  // Developer Options
  debugMode: boolean;
  showConnectionStats: boolean;
  enableWebRTCLogs: boolean;
}

export class SettingsService {
  private static readonly SETTINGS_KEY = 'globalink_settings';

  private static getDefaultSettings(): UserSettings {
    return {
      autoAnswer: false,
      callWaiting: true,
      doNotDisturb: false,
      showOnlineStatus: true,
      readReceipts: true,
      allowMessagesFromAnyone: true,
      highQualityAudio: true,
      hdVideoCalls: true,
      noiseCancellation: true,
      desktopNotifications: true,
      soundNotifications: true,
      vibrateOnMobile: false,
      hardwareAcceleration: true,
      autoSaveConversation: true,
      enableBetaFeatures: false,
      autoStartCamera: false,
      mirrorFrontCamera: true,
      virtualBackgrounds: false,
      beautyFilter: false,
      twoFactorAuth: false,
      endToEndEncryption: true,
      autoDeleteMessages: false,
      lowBandwidthMode: false,
      adaptiveBitrate: true,
      preloadMedia: true,
      screenReaderSupport: false,
      highContrastMode: false,
      largeText: false,
      reduceMotion: false,
      autoBackupToCloud: true,
      syncAcrossDevices: true,
      includeCallRecordings: false,
      debugMode: false,
      showConnectionStats: false,
      enableWebRTCLogs: false,
    };
  }

  static getSettings(): UserSettings {
    const saved = localStorage.getItem(this.SETTINGS_KEY);
    if (saved) {
      try {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    return this.getDefaultSettings();
  }

  static updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): void {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  static resetToDefaults(): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.getDefaultSettings()));
  }
}
