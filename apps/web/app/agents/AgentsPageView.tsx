'use client';

import { AgentList } from './_components/AgentList';
import { AiIntegrationsSection } from './_components/AiIntegrationsSection';
import styles from './AgentsPageView.module.scss';

export function AgentsPageView(): JSX.Element {
  return (
    <main className={styles.pageStack}>
      <AiIntegrationsSection />
      <AgentList />
    </main>
  );
}
