'use client';

import { Text } from '@vassembly/ui-system-design/text';

import { ProtectedAuthRoute } from '../../../../lib/auth/ProtectedAuthRoute';
import styles from './AgentEditPage.module.scss';
import { AgentForm } from '../../_components/AgentForm';
import { AgentFormMode } from '../../_components/AgentForm';
import { AgentEditSkeleton } from './_components/AgentEditSkeleton';
import { useAgentEditPage } from './useAgentEditPage';

export default function AgentEditPage(): JSX.Element {
  const { loginRoute, view } = useAgentEditPage();

  const body =
    view.phase === 'error' ? (
      <main className={styles.sectionCard}>
        <Text variant="body1">{view.message}</Text>
      </main>
    ) : view.phase === 'loading' ? (
      <main className={styles.sectionCard}>
        <Text variant="body2">Loading…</Text>
      </main>
    ) : (
      <main className={styles.sectionCard}>
        <Text variant="h1">Edit agent</Text>
        <AgentForm
          mode={AgentFormMode.Edit}
          initialAgent={view.agent}
          removedAt={view.agent.removedAt}
          isSubmitting={view.isSubmitting}
          isRestoring={view.isRestoring}
          onSubmit={view.handleSubmit}
          onRestore={view.handleRestore}
        />
      </main>
    );

  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={loginRoute} loadingFallback={<AgentEditSkeleton />}>
      {body}
    </ProtectedAuthRoute>
  );
}
