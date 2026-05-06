'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';

import type { UpdateUserSettingParams, UserSettingsV1 } from './types';
import { useUserSettingsStorage } from './useUserSettingsStorage';

interface UserPreferenceStorageState {
  userId: string;
  settings: UserSettingsV1;
  updateSetting: (params: UpdateUserSettingParams) => void;
  isLoading: boolean;
  error: string | undefined;
}

const UserSettingsPreferenceContext = createContext<UserPreferenceStorageState | null>(null);

interface UserSettingsPreferenceProviderProps {
  userId: string;
  children: ReactNode;
}

export const UserSettingsPreferenceProvider = ({
  userId,
  children,
}: UserSettingsPreferenceProviderProps): ReactElement => {
  const storage = useUserSettingsStorage(userId);
  const value = useMemo((): UserPreferenceStorageState => {
    return {
      userId,
      settings: storage.settings,
      updateSetting: storage.updateSetting,
      isLoading: storage.isLoading,
      error: storage.error,
    };
  }, [storage.error, storage.isLoading, storage.settings, storage.updateSetting, userId]);

  return (
    <UserSettingsPreferenceContext.Provider value={value}>
      {children}
    </UserSettingsPreferenceContext.Provider>
  );
};

export const useScopedUserPreferenceStorage = ({
  expectedUserId,
}: {
  expectedUserId: string;
}): UserPreferenceStorageState => {
  const context = useContext(UserSettingsPreferenceContext);
  if (!context || context.userId !== expectedUserId) {
    throw new Error(
      'useScopedUserPreferenceStorage must run under matching UserSettingsPreferenceProvider.',
    );
  }
  return context;
};
