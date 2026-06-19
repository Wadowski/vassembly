'use client';

import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { ExecutionProgressTracker } from '@vassembly/ui-execution-progress-tracker';
import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';

import { AI_INTEGRATIONS_LIST_ANCHOR } from '../../../aiIntegrationRoutes';
import { AiIntegrationForm } from '../../../_components/ai-integrations/_components/AiIntegrationForm';
import styles from '../../../_components/ai-integrations/_components/AiIntegrationsList/styles.module.scss';
import { useAiIntegrationEditPage } from './useAiIntegrationEditPage';

export function AiIntegrationEditPage(): JSX.Element {
  const {
    view,
    form,
    credential,
    router,
    isUpdating,
    isTesting,
    testResult,
    handleSubmit,
    handleTest,
    taskId,
    shouldShowProgress,
    setShouldShowProgress,
    userId,
  } = useAiIntegrationEditPage();

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
      {credential?.apiKeyHint !== null && credential?.apiKeyHint !== undefined ? (
        <Text variant="body2">Current key hint: {credential.apiKeyHint}</Text>
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
      {shouldShowProgress && taskId && userId && (
        <ExecutionProgressTracker
          taskId={taskId}
          userId={userId}
          onTaskCompleted={() => setShouldShowProgress(false)}
        />
      )}
    </main>
  );
}
