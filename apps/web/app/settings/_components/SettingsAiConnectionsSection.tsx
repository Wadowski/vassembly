'use client';

import { Text } from '@vassembly/ui-text';

import { SystemAgentConnectionPreference } from './_components/SystemAgentConnectionPreference';
import styles from './SettingsSections.module.scss';

export function SettingsAiConnectionsSection(): JSX.Element {
  return (
    <section className={styles.sectionCard} id="ai-connections">
      <Text variant="h2" as="h2">
        AI Connections
      </Text>
      <Text variant="body2">
        Manage credentials and choose which connection powers platform agents.
      </Text>
      <SystemAgentConnectionPreference />
    </section>
  );
}
