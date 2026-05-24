'use client';

import { Text } from '@vassembly/ui-text';

import { AiIntegrationsList } from '../ai-integrations/_components/AiIntegrationsList';
import styles from './styles.module.scss';

export function AiIntegrationsSection(): JSX.Element {
  return (
    <section id="ai-integrations" className={styles.sectionCard}>
      <Text variant="h2">AI integrations</Text>
      <Text variant="body2">
        Connect Gemini, ChatGPT, or LM Studio credentials and verify connections before assigning them to agents.
      </Text>
      <AiIntegrationsList />
    </section>
  );
}
