'use client';

import { Text } from '@vassembly/ui-system-design/text';

import { ProtectedAuthRoute } from '../../../lib/auth/ProtectedAuthRoute';
import styles from './AgentCreatePage.module.scss';
import { AgentForm } from '../_components/AgentForm';
import { AgentFormMode } from '../_components/AgentForm';
import { AgentCreateSkeleton } from './_components/AgentCreateSkeleton';
import { useAgentCreatePage } from './useAgentCreatePage';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent('/agents/create')}`;

export default function AgentCreatePage(): JSX.Element {
  const { isSubmitting, handleCreate } = useAgentCreatePage();

  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={LOGIN_ROUTE} loadingFallback={<AgentCreateSkeleton />}>
      <main className={styles.sectionCard}>
        <Text variant="h1">Create agent</Text>
        <AgentForm mode={AgentFormMode.Create} removedAt={null} isSubmitting={isSubmitting} onSubmit={handleCreate} />
      </main>
    </ProtectedAuthRoute>
  );
}
