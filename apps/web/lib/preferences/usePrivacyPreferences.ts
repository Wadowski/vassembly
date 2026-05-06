'use client';

import { useCallback, useMemo } from 'react';

import type { UserSettingsV1 } from './types';
import { useScopedUserPreferenceStorage } from './userSettingsPreferenceContext';

type PrivacyFieldId = keyof UserSettingsV1['privacy'];

export const usePrivacyPreferences = (userId: string) => {
  const { settings, updateSetting, isLoading, error } = useScopedUserPreferenceStorage({
    expectedUserId: userId,
  });

  const setPrivacyField = useCallback(
    (fieldId: PrivacyFieldId, value: boolean) => {
      updateSetting({
        produceNext: (current) => ({
          ...current,
          privacy: { ...current.privacy, [fieldId]: value },
        }),
      });
    },
    [updateSetting],
  );

  const update = useMemo(
    () => ({
      setAnalyticsEnabled: (value: boolean) => setPrivacyField('analyticsEnabled', value),
      setCrashReportingEnabled: (value: boolean) =>
        setPrivacyField('crashReportingEnabled', value),
      setMarketingOptIn: (value: boolean) => setPrivacyField('marketingOptIn', value),
    }),
    [setPrivacyField],
  );

  return {
    analyticsEnabled: settings.privacy.analyticsEnabled,
    crashReportingEnabled: settings.privacy.crashReportingEnabled,
    marketingOptIn: settings.privacy.marketingOptIn,
    update,
    isLoading,
    error,
  };
};
