import type { ReactNode } from 'react';

import styles from '../SettingsSections.module.scss';

interface SettingsContentContainerProps {
  children: ReactNode;
}

export const SettingsContentContainer = ({
  children,
}: SettingsContentContainerProps): JSX.Element => (
  <div className={styles.sectionStack}>{children}</div>
);
