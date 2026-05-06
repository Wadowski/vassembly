import type { UserSettingsV1 } from './types';

export const USER_SETTINGS_STORAGE_KEY = 'vassembly:user-settings:{userId}:v1' as const;

export const DEFAULT_USER_SETTINGS_V1: UserSettingsV1 = {
  schemaVersion: 1,
  notifications: {
    masterEnabled: true,
    categories: {},
    channels: {
      inApp: true,
      email: true,
      push: false,
      sms: false,
    },
  },
  privacy: {
    analyticsEnabled: true,
    crashReportingEnabled: true,
    marketingOptIn: false,
  },
};

export const buildUserSettingsStorageKey = (userId: string): string => {
  return USER_SETTINGS_STORAGE_KEY.replace('{userId}', userId);
};
