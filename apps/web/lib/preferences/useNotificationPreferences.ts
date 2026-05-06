'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useCallback, useMemo } from 'react';

import { getVisibleCategories } from './notificationCategoryRegistry';
import type { UserSettingsV1 } from './types';
import { useScopedUserPreferenceStorage } from './userSettingsPreferenceContext';

type NotificationChannelId = keyof UserSettingsV1['notifications']['channels'];

export const useNotificationPreferences = (userId: string) => {
  const { role } = useUserAuth();
  const resolvedRole = typeof role === 'string' ? role : '';
  const visibleDefinitionList = useMemo(
    () => getVisibleCategories({ userRole: resolvedRole }),
    [resolvedRole],
  );

  const { settings, updateSetting, isLoading, error } = useScopedUserPreferenceStorage({
    expectedUserId: userId,
  });

  const categories = useMemo(() => {
    const nextCategories: Record<string, boolean> = {};
    visibleDefinitionList.forEach((definition) => {
      const resolved = settings.notifications.categories[definition.id];
      nextCategories[definition.id] = resolved === undefined ? true : resolved;
    });
    return nextCategories;
  }, [settings.notifications.categories, visibleDefinitionList]);

  const setMasterEnabled = useCallback(
    (value: boolean) => {
      updateSetting({
        produceNext: (current) => ({
          ...current,
          notifications: { ...current.notifications, masterEnabled: value },
        }),
      });
    },
    [updateSetting],
  );

  const setCategory = useCallback(
    (categoryId: string, value: boolean) => {
      updateSetting({
        produceNext: (current) => ({
          ...current,
          notifications: {
            ...current.notifications,
            categories: { ...current.notifications.categories, [categoryId]: value },
          },
        }),
      });
    },
    [updateSetting],
  );

  const setChannel = useCallback(
    (channelId: NotificationChannelId, value: boolean) => {
      updateSetting({
        produceNext: (current) => ({
          ...current,
          notifications: {
            ...current.notifications,
            channels: { ...current.notifications.channels, [channelId]: value },
          },
        }),
      });
    },
    [updateSetting],
  );

  const update = useMemo(
    () => ({ setMasterEnabled, setCategory, setChannel }),
    [setCategory, setChannel, setMasterEnabled],
  );

  return {
    masterEnabled: settings.notifications.masterEnabled,
    categories,
    channels: settings.notifications.channels,
    update,
    isLoading,
    error,
    visibleCategories: visibleDefinitionList,
  };
};
