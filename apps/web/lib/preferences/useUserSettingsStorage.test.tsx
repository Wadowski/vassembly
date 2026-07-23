import { SnackbarProvider } from '@vassembly/ui-system-design/snackbar';
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
    const localStorageMock = {
      getItem: vi.fn((keyName: string) => memoryBackedStore.get(keyName) ?? null),
      setItem: vi.fn((keyName: string, value: string) => {
        memoryBackedStore.set(keyName, String(value));
      }),
      removeItem: vi.fn((keyName: string) => {
        memoryBackedStore.delete(keyName);
      }),
      clear: vi.fn(() => {
        memoryBackedStore.clear();
      }),
      key: vi.fn(),
      length: 0,
    };

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
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
