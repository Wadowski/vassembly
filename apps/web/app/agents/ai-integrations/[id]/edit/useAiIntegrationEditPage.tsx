'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  useAiIntegrationUpdate,
  useHttpClient,
  useTestConnection,
  type AiIntegrationCredentialDto,
  type AiIntegrationFormInput,
  type TestConnectionResult,
} from '@vassembly/ui-api-hooks';

import { useAiIntegrationForm } from '../../../_components/ai-integrations/_components/AiIntegrationForm';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { getRequestErrorMessage } from '../../../getRequestErrorMessage';
import { AI_INTEGRATIONS_LIST_ANCHOR } from '../../../aiIntegrationRoutes';
import styles from '../../../_components/ai-integrations/_components/AiIntegrationsList/styles.module.scss';
import { AiIntegrationForm } from '../../../_components/ai-integrations/_components/AiIntegrationForm';

const REDIRECT_AFTER_UPDATE_MS = 1500;

export type AiIntegrationEditPageView =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | {
      phase: 'ready';
      credential: AiIntegrationCredentialDto;
    };

export function AiIntegrationEditPageContent(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const http = useHttpClient();
  const snackbar = useSnackbar();
  const credentialId = typeof params?.id === 'string' ? params.id : '';

  const [credential, setCredential] = useState<AiIntegrationCredentialDto | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [testResult, setTestResult] = useState<TestConnectionResult | undefined>(undefined);
  const hasLoadedCredential = useRef(false);

  const form = useAiIntegrationForm({
    mode: 'edit',
    initialValues: credential
      ? {
          name: credential.name,
          provider: credential.provider,
          apiKey: '',
          baseUrl: credential.baseUrl,
          organizationId: credential.organizationId,
          model: credential.model ?? '',
        }
      : undefined,
  });

  const { mutate: update, isLoading: isUpdating } = useAiIntegrationUpdate();
  const { mutate: testConnection, isLoading: isTesting } = useTestConnection();

  useEffect(() => {
    if (credential === undefined) {
      return;
    }
    if (!hasLoadedCredential.current) {
      hasLoadedCredential.current = true;
      return;
    }
    setTestResult(undefined);
    form.handleChange('model', '');
  }, [credential, form.values.provider, form.values.apiKey, form.values.baseUrl, form.values.organizationId]);

  useEffect(() => {
    if (credentialId === '') {
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const found = await http.get<AiIntegrationCredentialDto>({
          path: `/ai-integrations/${credentialId}`,
          withAuth: true,
        });
        if (!cancelled) {
          setCredential(found);
          setLoadError(undefined);
          form.setValues({
            name: found.name,
            provider: found.provider,
            apiKey: '',
            baseUrl: found.baseUrl,
            organizationId: found.organizationId,
            model: found.model ?? '',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getRequestErrorMessage(error, 'Unable to load integration'));
        }
      }
    };
    void load();
    return (): void => {
      cancelled = true;
    };
  }, [credentialId, http]);

  const handleTest = useCallback(async (): Promise<void> => {
    if (!form.validate()) {
      return;
    }
    setTestResult(undefined);

    const hasNewApiKey = form.values.apiKey?.trim() !== '';
    const result = await testConnection({
      body: hasNewApiKey
        ? {
            provider: form.values.provider,
            apiKey: form.values.apiKey,
            baseUrl: form.values.baseUrl,
            organizationId: form.values.organizationId,
          }
        : { credentialId },
    });

    if (result === undefined) {
      setTestResult({ success: false, error: 'Connection test failed' });
      return;
    }
    setTestResult(result);
  }, [credentialId, form, testConnection]);

  const handleSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault();
      if (credentialId === '') {
        return;
      }
      if (!form.validate()) {
        return;
      }
      if (testResult?.success !== true) {
        snackbar.show({
          variant: 'warning',
          message: 'Test the connection before saving',
          duration: 4000,
        });
        return;
      }

      const patchBody: AiIntegrationFormInput = form.values;
      const updateBody = {
        name: patchBody.name,
        baseUrl: patchBody.baseUrl,
        organizationId: patchBody.organizationId,
        model: patchBody.model,
        ...(patchBody.apiKey?.trim() !== '' ? { apiKey: patchBody.apiKey } : {}),
      };

      const result = await update({ id: credentialId, body: updateBody });
      if (result === undefined) {
        snackbar.show({
          variant: 'error',
          message: 'Failed to update integration',
          duration: 5000,
        });
        return;
      }
      snackbar.show({ variant: 'success', message: 'Integration updated', duration: 4000 });
      setTimeout(() => {
        router.push(AI_INTEGRATIONS_LIST_ANCHOR);
      }, REDIRECT_AFTER_UPDATE_MS);
    },
    [credentialId, form, router, snackbar, testResult?.success, update],
  );

  const view = useMemo((): AiIntegrationEditPageView => {
    if (credentialId === '') {
      return { phase: 'error', message: 'Unable to resolve integration identifier.' };
    }
    if (loadError !== undefined) {
      return { phase: 'error', message: loadError };
    }
    if (credential === undefined) {
      return { phase: 'loading' };
    }
    return { phase: 'ready', credential };
  }, [credential, credentialId, loadError]);

  if (view.phase === 'error') {
    return (
      <main className={styles.sectionCard}>
        <Alert variant="error" message={view.message} />
      </main>
    );
  }

  if (view.phase === 'loading') {
    return (
      <main className={styles.sectionCard}>
        <Loader ariaLabel="Loading integration" />
      </main>
    );
  }

  return (
    <main className={styles.sectionCard}>
      <Button
        className={styles.backLink}
        variant="text"
        text="← Back to agents"
        onClick={() => router.push(AI_INTEGRATIONS_LIST_ANCHOR)}
      />
      <Text variant="h1">Edit integration</Text>
      {view.credential.apiKeyHint !== null && view.credential.apiKeyHint !== undefined ? (
        <Text variant="body2">Current key hint: {view.credential.apiKeyHint}</Text>
      ) : null}
      <AiIntegrationForm
        values={form.values}
        errors={form.errors}
        touched={form.touched}
        isSubmitting={isUpdating || form.isSubmitting}
        isTesting={isTesting}
        testResult={testResult}
        isEditing
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        onTest={() => {
          void handleTest();
        }}
      />
    </main>
  );
}
