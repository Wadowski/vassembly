'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';

import { SettingsSecurityInteractiveBody } from './security/SettingsSecurityInteractiveBody';
import styles from '../SettingsSections.module.scss';

export const SettingsSecuritySection = (): JSX.Element | null => {
  const { user } = useUserAuth();
  if (user?.isSsoOnly === true) {
    return null;
  }

  return (
    <section id="security" className={styles.sectionCard}>
      <SettingsSecurityInteractiveBody />
    </section>
  );
};
