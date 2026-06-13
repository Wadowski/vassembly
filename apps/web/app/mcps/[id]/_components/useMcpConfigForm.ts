'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { useRouter } from 'next/navigation';

import { CommonError } from '@vassembly/errors';
import type { McpConfigSchemaField, McpConfiguration, McpDetail } from '@vassembly/ui-api-hooks';
import {
  useDeleteMcpConfiguration,
  useSaveMcpConfiguration,
  useTestMcpConnection,
  useUpdateMcpConfiguration,
} from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { buildInitialFieldValues } from './buildInitialFieldValues';
import { buildSubmitFieldValues } from './buildSubmitFieldValues';
import {
  CONFIGURATION_SAVED_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  SAVE_REDIRECT_DELAY_MS,
} from './constants';
import { validateMcpConfigField, validateMcpConfigFields } from './validateMcpConfigFields';

export interface UseMcpConfigFormParams {
  mcp: McpDetail;
  savedConfiguration?: McpConfiguration | null;
}

const isNetworkFailure = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network');
  }

  return false;
};

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof CommonError && error.error instanceof Error) {
    return error.error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const fieldsEqual = (
  initial: Record<string, string | boolean>,
  current: Record<string, string | boolean>,
): boolean => {
  const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);

  for (const key of keys) {
    if (initial[key] !== current[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Manages MCP configuration form state, validation, and save/test/delete flows.
 */
export const useMcpConfigForm = ({ mcp, savedConfiguration }: UseMcpConfigFormParams) => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const fields = mcp.configSchema?.fields ?? [];
  const initialState = buildInitialFieldValues({ fields, savedConfiguration });

  const [fieldValues, setFieldValues] = useState(initialState.values);
  const [savedSecretKeys] = useState(initialState.savedSecretKeys);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [testErrorMessage, setTestErrorMessage] = useState<string | undefined>(undefined);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [lastBlurredFieldKey, setLastBlurredFieldKey] = useState<string | undefined>(undefined);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const isDirtyRef = useRef(false);

  const [testConnection, testState] = useTestMcpConnection();
  const [saveConfiguration, saveState] = useSaveMcpConfiguration();
  const [updateConfiguration, updateState] = useUpdateMcpConfiguration();
  const [deleteConfiguration, deleteState] = useDeleteMcpConfiguration();

  const isDirty = useMemo(
    () => !fieldsEqual(initialState.values, fieldValues),
    [fieldValues, initialState.values],
  );

  isDirtyRef.current = isDirty;

  const validationErrors = useMemo(
    () => validateMcpConfigFields({ fields, values: fieldValues, savedSecretKeys }),
    [fields, fieldValues, savedSecretKeys],
  );

  const isFormValid = Object.keys(validationErrors).length === 0;

  const liveErrorMessage = useMemo((): string | undefined => {
    if (lastBlurredFieldKey === undefined) {
      return undefined;
    }

    return errors[lastBlurredFieldKey];
  }, [errors, lastBlurredFieldKey]);

  useEffect(() => {
    setIsTestSuccessful(false);
    setTestErrorMessage(undefined);
  }, [fieldValues]);

  useEffect(() => {
    const handlePopState = (): void => {
      if (!isDirtyRef.current) {
        return;
      }

      flushSync(() => {
        setShowDiscardModal(true);
      });
    };

    window.addEventListener('popstate', handlePopState);

    return (): void => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const blurField = useCallback(
    (field: McpConfigSchemaField): void => {
      setLastBlurredFieldKey(field.key);
      setTouched((previous) => ({ ...previous, [field.key]: true }));
      const message = validateMcpConfigField({
        field,
        value: fieldValues[field.key] ?? '',
        savedSecretKeys,
      });

      setErrors((previous) => {
        const next = { ...previous };

        if (message === undefined) {
          delete next[field.key];
        } else {
          next[field.key] = message;
        }

        return next;
      });
    },
    [fieldValues, savedSecretKeys],
  );

  const validateAll = useCallback((): boolean => {
    const nextErrors = validateMcpConfigFields({
      fields,
      values: fieldValues,
      savedSecretKeys,
    });
    setErrors(nextErrors);
    setTouched((previous) => {
      const next = { ...previous };

      for (const field of fields) {
        next[field.key] = true;
      }

      return next;
    });
    const firstErrorField = fields.find((field) => nextErrors[field.key] !== undefined);
    setLastBlurredFieldKey(firstErrorField?.key);

    return Object.keys(nextErrors).length === 0;
  }, [fields, fieldValues, savedSecretKeys]);

  const shouldUseSavedSecrets = useCallback((): boolean => {
    if (savedConfiguration === undefined || savedConfiguration === null) {
      return false;
    }

    return [...savedSecretKeys].every((key) => {
      const value = fieldValues[key];
      return typeof value === 'string' && value === '';
    });
  }, [fieldValues, savedConfiguration, savedSecretKeys]);

  const runTestConnection = useCallback(async (): Promise<void> => {
    setTestErrorMessage(undefined);

    if (!validateAll()) {
      return;
    }

    setIsTestingLocal(true);

    try {
      const result = await testConnection({
        mcpId: mcp.id,
        fieldValues: buildSubmitFieldValues({ fields, values: fieldValues }),
        useSavedSecrets: shouldUseSavedSecrets(),
      });

      if (result === undefined) {
        setTestErrorMessage(NETWORK_ERROR_MESSAGE);
        setIsTestSuccessful(false);
        return;
      }

      if (!result.success) {
        setTestErrorMessage(result.error ?? 'Connection failed');
        setIsTestSuccessful(false);
        return;
      }

      setIsTestSuccessful(true);
      setTestErrorMessage(undefined);
    } catch (error) {
      setTestErrorMessage(isNetworkFailure(error) ? NETWORK_ERROR_MESSAGE : (error as Error).message);
      setIsTestSuccessful(false);
    } finally {
      setIsTestingLocal(false);
    }
  }, [fields, fieldValues, mcp.id, shouldUseSavedSecrets, testConnection, validateAll]);

  const handleSave = useCallback(async (): Promise<void> => {
    setSaveErrorMessage(undefined);

    if (!isTestSuccessful) {
      return;
    }

    const payload = buildSubmitFieldValues({ fields, values: fieldValues });

    try {
      const isUpdate = savedConfiguration !== undefined && savedConfiguration !== null;
      const result = isUpdate
        ? await updateConfiguration({ mcpId: mcp.id, fieldValues: payload })
        : await saveConfiguration({ mcpId: mcp.id, fieldValues: payload });

      if (result === undefined) {
        setSaveErrorMessage(NETWORK_ERROR_MESSAGE);
        return;
      }

      snackbar.show({ message: CONFIGURATION_SAVED_MESSAGE });
      window.setTimeout(() => {
        router.push('/mcps');
      }, SAVE_REDIRECT_DELAY_MS);
    } catch (error) {
      const message = isNetworkFailure(error)
        ? NETWORK_ERROR_MESSAGE
        : resolveErrorMessage(error, NETWORK_ERROR_MESSAGE);
      setSaveErrorMessage(message);
    }
  }, [
    fieldValues,
    fields,
    isTestSuccessful,
    mcp.id,
    router,
    saveConfiguration,
    savedConfiguration,
    snackbar,
    updateConfiguration,
  ]);

  const handleDelete = useCallback(async (): Promise<void> => {
    const result = await deleteConfiguration({ mcpId: mcp.id });

    if (result !== undefined) {
      router.push('/mcps');
    }
  }, [deleteConfiguration, mcp.id, router]);

  const handleCancel = useCallback((): void => {
    if (isDirty) {
      setShowDiscardModal(true);
      return;
    }

    router.push('/mcps');
  }, [isDirty, router]);

  const handleDiscard = useCallback((): void => {
    setShowDiscardModal(false);
    router.push('/mcps');
  }, [router]);

  return {
    fields,
    fieldValues,
    touched,
    errors,
    savedSecretKeys,
    isFormValid,
    isTestSuccessful,
    testErrorMessage,
    saveErrorMessage,
    showDeleteModal,
    showDiscardModal,
    cancelButtonRef,
    isTesting: isTestingLocal || testState.loading,
    isSaving: saveState.loading || updateState.loading,
    isDeleting: deleteState.loading,
    hasSavedConfiguration: savedConfiguration !== undefined && savedConfiguration !== null,
    liveErrorMessage,
    setFieldValue: (key: string, value: string | boolean): void => {
      setFieldValues((previous) => ({ ...previous, [key]: value }));
    },
    blurField,
    runTestConnection,
    handleSave,
    handleDelete,
    handleCancel,
    handleDiscard,
    closeDiscardModal: (): void => setShowDiscardModal(false),
    openDeleteModal: (): void => setShowDeleteModal(true),
    closeDeleteModal: (): void => setShowDeleteModal(false),
  };
};
