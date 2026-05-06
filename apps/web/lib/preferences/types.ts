export interface UserSettingsV1 {
  schemaVersion: 1;
  notifications: {
    masterEnabled: boolean;
    categories: Record<string, boolean>;
    channels: {
      inApp: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
    marketingOptIn: boolean;
  };
}

export interface UpdateUserSettingParams {
  produceNext: (current: UserSettingsV1) => UserSettingsV1;
}
