'use client';

import { useSnackbar } from '@vassembly/ui-system-design/snackbar';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UpdateUserSettingParams, UserSettingsV1 } from './types';
import { buildUserSettingsStorageKey, DEFAULT_USER_SETTINGS_V1 } from './storageKeys';
import { parseStoredUserSettingsJson } from './userSettingsNormalize';

const cloneDefaultSettings = (): UserSettingsV1 => structuredClone(DEFAULT_USER_SETTINGS_V1);

const isLikelyQuotaError = (error: unknown): boolean => {
  return (
    (error instanceof DOMException && error.name === 'QuotaExceededError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'QuotaExceededError')
  );
};

export const useUserSettingsStorage = (userId: string) => {
  const [settings, setSettings] = useState<UserSettingsV1>(cloneDefaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));
  const [storageErrorMessage, setStorageErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const { show: showSnackbar } = useSnackbar();

  const storageKey = useMemo(() => {
    return userId ? buildUserSettingsStorageKey(userId) : '';
  }, [userId]);

  useEffect(() => {
    setStorageErrorMessage(undefined);
    if (!userId || !storageKey) {
      setSettings(cloneDefaultSettings());
      setIsLoading(false);
      return undefined;
    }
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return undefined;
      }
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setSettings(cloneDefaultSettings());
        setIsLoading(false);
        return undefined;
      }
      const parsed = parseStoredUserSettingsJson({ rawJson: raw });
      if (!parsed) {
        showSnackbar({
          variant: 'warning',
          message: 'Preferences reset to defaults (unsupported saved format).',
        });
        const nextDefaults = cloneDefaultSettings();
        setSettings(nextDefaults);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(nextDefaults));
        } catch (persistError: unknown) {
          console.warn('Recovering preference defaults persist failed', persistError);
        }
        setIsLoading(false);
        return undefined;
      }
      setSettings(parsed);
    } catch (error: unknown) {
      console.warn('Reading user preferences failed', error);
      setStorageErrorMessage('Local preferences are unavailable in this browser mode.');
      setSettings(cloneDefaultSettings());
    } finally {
      setIsLoading(false);
    }

    return undefined;
  }, [showSnackbar, storageKey, userId]);

  const persist = useCallback(
    (next: UserSettingsV1): void => {
      if (!userId || !storageKey || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        setStorageErrorMessage(undefined);
      } catch (error: unknown) {
        console.warn('Saving user preferences failed', error);
        if (isLikelyQuotaError(error)) {
          setStorageErrorMessage('Cannot save preferences: browser storage quota reached.');
          showSnackbar({ variant: 'error', message: 'Could not save preferences (storage quota).' });
          return;
        }
        setStorageErrorMessage(
          'Could not persist preferences locally. Changes apply until you leave.',
        );
        showSnackbar({ variant: 'error', message: 'Could not save preferences locally.' });
      }
    },
    [showSnackbar, storageKey, userId],
  );

  const updateSetting = useCallback(
    ({ produceNext }: UpdateUserSettingParams) => {
      setSettings((current) => {
        const next = produceNext(current);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { settings, updateSetting, isLoading, error: storageErrorMessage };
};
