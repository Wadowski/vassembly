import { buildUserSettingsStorageKey } from './storageKeys';

interface ClearStoredParams {
  userId: string;
}

export const clearStoredUserPreferences = ({ userId }: ClearStoredParams): void => {
  try {
    if (typeof window === 'undefined' || !userId) return;
    const key = buildUserSettingsStorageKey(userId);
    window.localStorage.removeItem(key);
  } catch (error: unknown) {
    console.warn('Removing user preferences failed', error);
  }
};
