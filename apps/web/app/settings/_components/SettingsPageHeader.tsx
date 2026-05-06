import { Text } from '@vassembly/ui-text';

import styles from '../SettingsSections.module.scss';

export const SettingsPageHeader = (): JSX.Element => (
  <header className={styles.settingsHeader}>
    <Text variant="h1">Settings</Text>
    <Text variant="body2">Account and preferences for this device.</Text>
  </header>
);
