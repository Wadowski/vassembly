'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { Text } from '@vassembly/ui-text';

import { AgentList } from './_components/AgentList';
import { AiIntegrationsSection } from './_components/AiIntegrationsSection';
import { PlatformAgentsSection } from './_components/PlatformAgentsSection';
import styles from './AgentsPageView.module.scss';

export function AgentsPageView(): JSX.Element {
  const { role } = useUserAuth();
  const isAdmin = role.trim().toLowerCase() === 'admin';

  return (
    <main className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text variant="h1" as="h1">
          Agents
        </Text>
        <Text variant="body2">
          Connect AI integrations and run agents with your credentials.
        </Text>
      </header>
      <PlatformAgentsSection isAdmin={isAdmin} />
      <AgentList />
      <AiIntegrationsSection />
    </main>
  );
}
