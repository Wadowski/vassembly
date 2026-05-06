'use client';

import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import { useState } from 'react';

import { SettingsAccountDeletionInteractiveBody } from './accountDeletion/SettingsAccountDeletionInteractiveBody';
import styles from '../SettingsSections.module.scss';

export const SettingsAccountDeletionSection = (): JSX.Element => {
  const [deletionWizardOpenFlag, setDeletionWizardOpenFlag] = useState(false);

  return (
    <section id="account-deletion" className={styles.dangerPanel}>
      <Text variant="h2">Danger zone</Text>
      <Alert variant="error" message="Deleting your account is permanent." />
      <ul className={styles.consequenceList}>
        <li>
          <Text variant="body2">Removes billing contact for your personal seat.</Text>
        </li>
        <li>
          <Text variant="body2">Workspace admins may still access historical artefacts.</Text>
        </li>
      </ul>
      <SettingsAccountDeletionInteractiveBody
        modalTitle="Delete your account?"
        isModalOpen={deletionWizardOpenFlag}
        onRequestDismissModal={() => {
          setDeletionWizardOpenFlag(false);
        }}
      />
      <Button
        color="danger"
        variant="outlined"
        text="Delete account…"
        onClick={() => {
          setDeletionWizardOpenFlag(true);
        }}
      />
    </section>
  );
};
