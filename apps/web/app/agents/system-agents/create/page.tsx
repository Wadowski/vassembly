'use client';

import { Text } from '@vassembly/ui-system-design/text';

import { ProtectedAuthRoute } from '../../../../lib/auth/ProtectedAuthRoute';
import { AgentCreateSkeleton } from '../../create/_components/AgentCreateSkeleton';
import { SystemAgentForm, SystemAgentFormMode } from '../../_components/PlatformAgentsSection/SystemAgentForm';
import { SYSTEM_AGENTS_CREATE_PATH } from '../../systemAgentRoutes';
import styles from './SystemAgentCreatePage.module.scss';
import { useSystemAgentCreatePage } from './useSystemAgentCreatePage';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent(SYSTEM_AGENTS_CREATE_PATH)}`;

const ADMIN_FORBIDDEN_MESSAGE = 'System agent management is available to administrators only.';

export default function SystemAgentCreatePage(): JSX.Element {
  const { isSubmitting, nameConflictError, handleCreate, handleCancel } = useSystemAgentCreatePage();

  return (
    <ProtectedAuthRoute
      requireAuthenticated
      redirectPath={LOGIN_ROUTE}
      roles={['admin']}
      loadingFallback={<AgentCreateSkeleton />}
      forbiddenFallback={
        <main className={styles.sectionCard}>
          <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
        </main>
      }
    >
      <main className={styles.sectionCard}>
        <Text variant="h1">Create System Agent</Text>
        <SystemAgentForm
          mode={SystemAgentFormMode.Create}
          isSubmitting={isSubmitting}
          nameConflictError={nameConflictError}
          onSubmit={handleCreate}
          onCancel={handleCancel}
        />
      </main>
    </ProtectedAuthRoute>
  );
}
