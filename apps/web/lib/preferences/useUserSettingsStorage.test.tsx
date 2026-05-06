import { SnackbarProvider } from '@vassembly/ui-snackbar';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_USER_SETTINGS_V1,
  buildUserSettingsStorageKey,
  useUserSettingsStorage,
} from './index';

function PreferenceTestHarness(props: React.PropsWithChildren): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Snackbar consumes a mismatched duplicate @types/react instance in Vitest builds
  const compatibleChildrenTree = props.children as any;

  return <SnackbarProvider position="bottom-left">{compatibleChildrenTree}</SnackbarProvider>;
}

PreferenceTestHarness.displayName = 'PreferenceTestHarness';

const memoryBackedStore = new Map<string, string>();

describe('useUserSettingsStorage', () => {
  beforeEach(() => {
    memoryBackedStore.clear();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((keyName: string) => {
      return memoryBackedStore.get(keyName) ?? null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((keyName: string, value: string) => {
      memoryBackedStore.set(keyName, String(value));
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((keyName: string) => {
      memoryBackedStore.delete(keyName);
    });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      memoryBackedStore.clear();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes default JSON when local storage contains invalid JSON for the user key', async () => {
    const subjectUserIdFixture = 'user-settings-test-invalid';
    const namespacedPreferenceKey = buildUserSettingsStorageKey(subjectUserIdFixture);
    memoryBackedStore.set(namespacedPreferenceKey, 'not-json');

    const renderedHookFixture = renderHook(() => useUserSettingsStorage(subjectUserIdFixture), {
      wrapper: PreferenceTestHarness,
    });

    await waitFor(() => expect(renderedHookFixture.result.current.isLoading).toBe(false));
    await waitFor(() =>
      expect(JSON.parse(memoryBackedStore.get(namespacedPreferenceKey)!)).toEqual(
        DEFAULT_USER_SETTINGS_V1,
      ),
    );
  });

  it('persists notification master toggles whenever updateSetting mutates state', async () => {
    const subjectUserIdFixture = 'user-settings-test-happy';
    const namespacedPreferenceKey = buildUserSettingsStorageKey(subjectUserIdFixture);

    const renderedHookFixture = renderHook(() => useUserSettingsStorage(subjectUserIdFixture), {
      wrapper: PreferenceTestHarness,
    });

    await waitFor(() => expect(renderedHookFixture.result.current.isLoading).toBe(false));

    act(() => {
      renderedHookFixture.result.current.updateSetting({
        produceNext: (currentSettings) => ({
          ...currentSettings,
          notifications: { ...currentSettings.notifications, masterEnabled: false },
        }),
      });
    });

    const diskSnapshot = JSON.parse(memoryBackedStore.get(namespacedPreferenceKey)!);
    expect(diskSnapshot.notifications.masterEnabled).toBe(false);
  });
});
