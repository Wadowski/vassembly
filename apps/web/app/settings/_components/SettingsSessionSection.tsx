'use client';

import { useLogout } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';
import { Modal } from '@vassembly/ui-system-design/modal';
import { Text } from '@vassembly/ui-system-design/text';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { clearStoredUserPreferences } from '../../../lib/preferences';
import { clearTokens } from '../../../lib/auth/sessionStorage';
import styles from '../SettingsSections.module.scss';

export const SettingsSessionSection = (): JSX.Element => {
  const router = useRouter();
  const { user, clearSession } = useUserAuth();
  const { fetch: performRemoteLogout } = useLogout();
  const [modalOpen, setModalOpen] = useState(false);

  const finalizeLogout = async (): Promise<void> => {
    const subjectSnapshot = user?.id;
    try {
      await performRemoteLogout({ body: {} });
    } catch (logoutError: unknown) {
      console.warn('Remote logout encountered an error', logoutError);
    } finally {
      clearTokens();
      if (subjectSnapshot) {
        clearStoredUserPreferences({ userId: subjectSnapshot });
      }
      clearSession();
      router.push('/login');
    }
  };

  return (
    <section id="session" className={styles.sectionCard}>
      <Text variant="h2">Session</Text>
      <Text variant="body2">Fully sign out of Vassembly on this browser.</Text>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        title="Sign out?"
      >
        <div className={styles.modalStack}>
          <Text>You will need to authenticate again.</Text>
          <div className={styles.toolbarRow}>
            <Button
              variant="outlined"
              text="Stay signed in"
              onClick={() => {
                setModalOpen(false);
              }}
            />
            <Button color="danger" variant="contained" text="Sign out" onClick={() => void finalizeLogout()} />
          </div>
        </div>
      </Modal>
      <Button
        variant="outlined"
        color="danger"
        text="Sign out"
        onClick={() => {
          setModalOpen(true);
        }}
      />
    </section>
  );
};
