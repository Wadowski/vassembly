'use client';

import { Text } from '@vassembly/ui-system-design/text';

import styles from './SettingsSections.module.scss';

export function SettingsAiConnectionsSection(): JSX.Element {
  return (
    <section className={styles.sectionCard} id="ai-connections">
      <Text variant="h2" as="h2">
        AI Connections
      </Text>
      <Text variant="body2">
        Manage credentials used by your agents and integrations.
      </Text>
    </section>
  );
}
