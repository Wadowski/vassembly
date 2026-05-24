'use client';

import type { FormEvent } from 'react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  useAiIntegrationCreate,
  useTestConnection,
  type TestConnectionResult,
} from '@vassembly/ui-api-hooks';

import { useAiIntegrationForm } from '../_hooks/useAiIntegrationForm';
import { AI_INTEGRATIONS_LIST_ANCHOR } from '../../../../lib/routes/aiIntegrations';
import { Text } from '@vassembly/ui-text';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { Button } from '@vassembly/ui-button';

import styles from './AiIntegrationsList.module.scss';
import { AiIntegrationForm } from './AiIntegrationForm';

const REDIRECT_AFTER_CREATE_MS = 1500;

export function AiIntegrationCreatePageContent(): JSX.Element {
  const router = useRouter();
  const snackbar = useSnackbar();
  const form = useAiIntegrationForm({ mode: 'create' });
  const { mutate: create, isLoading: isCreating } = useAiIntegrationCreate();
  const { mutate: testConnection, isLoading: isTesting } = useTestConnection();
  const [testResult, setTestResult] = useState<TestConnectionResult | undefined>(undefined);

  const handleTest = useCallback(async (): Promise<void> => {
    if (!form.validate()) {
      return;
    }
    setTestResult(undefined);
    const result = await testConnection({
      body: {
        provider: form.values.provider,
        apiKey: form.values.apiKey,
        baseUrl: form.values.baseUrl,
        organizationId: form.values.organizationId,
      },
    });
    if (result === undefined) {
      setTestResult({ success: false, error: 'Connection test failed' });
      return;
    }
    setTestResult(result);
  }, [form, testConnection]);

  const handleSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault();
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
      const result = await create({ body: form.values });
      if (result === undefined) {
        snackbar.show({
          variant: 'error',
          message: 'Failed to create integration',
          duration: 5000,
        });
        return;
      }
      snackbar.show({ variant: 'success', message: 'Integration created', duration: 4000 });
      setTimeout(() => {
        router.push(AI_INTEGRATIONS_LIST_ANCHOR);
      }, REDIRECT_AFTER_CREATE_MS);
    },
    [create, form, router, snackbar, testResult?.success],
  );

  return (
    <main className={styles.sectionCard}>
      <Button
        className={styles.backLink}
        variant="text"
        text="← Back to agents"
        onClick={() => router.push(AI_INTEGRATIONS_LIST_ANCHOR)}
      />
      <Text variant="h1">Add integration</Text>
      <AiIntegrationForm
        values={form.values}
        errors={form.errors}
        touched={form.touched}
        isSubmitting={isCreating || form.isSubmitting}
        isTesting={isTesting}
        testResult={testResult}
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

export function useAiIntegrationCreatePage(): { content: JSX.Element } {
  return { content: <AiIntegrationCreatePageContent /> };
}
