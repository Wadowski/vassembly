'use client';

import { Button } from '@vassembly/ui-button';
import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';

import { ProtectedAuthRoute } from '../../../../../lib/auth/ProtectedAuthRoute';
import { AgentEditSkeleton } from '../../../[id]/edit/_components/AgentEditSkeleton';
import { SystemAgentForm, SystemAgentFormMode } from '../../../_components/PlatformAgentsSection/SystemAgentForm';
import styles from './SystemAgentEditPage.module.scss';
import { useSystemAgentEditPage } from './useSystemAgentEditPage';

const ADMIN_FORBIDDEN_MESSAGE = 'System agent management is available to administrators only.';

export default function SystemAgentEditPage(): JSX.Element {
  const { loginRoute, view } = useSystemAgentEditPage();

  const body =
    view.phase === 'error' ? (
      <main className={styles.sectionCard}>
        <Text variant="body1">{view.message}</Text>
        <div className={styles.errorActions}>
          <Button variant="contained" text="Retry" onClick={view.onRetry} />
        </div>
      </main>
    ) : view.phase === 'loading' ? (
      <main className={styles.sectionCard}>
        <Loader ariaLabel="Loading system agent" />
      </main>
    ) : (
      <main className={styles.sectionCard}>
        <Text variant="h1">Edit System Agent</Text>
        <SystemAgentForm
          mode={SystemAgentFormMode.Edit}
          initialAgent={view.agent}
          isSubmitting={view.isSubmitting}
          nameConflictError={view.nameConflictError}
          onSubmit={view.handleSubmit}
          onCancel={view.handleCancel}
        />
      </main>
    );

  return (
    <ProtectedAuthRoute
      requireAuthenticated
      redirectPath={loginRoute}
      roles={['admin']}
      loadingFallback={<AgentEditSkeleton />}
      forbiddenFallback={
        <main className={styles.sectionCard}>
          <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
        </main>
      }
    >
      {body}
    </ProtectedAuthRoute>
  );
}
