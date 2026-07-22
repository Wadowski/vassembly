'use client';

import { useDeleteAccount } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Checkbox } from '@vassembly/ui-system-design/checkbox';
import { Modal } from '@vassembly/ui-system-design/modal';
import { useSnackbar } from '@vassembly/ui-system-design/snackbar';
import { Text } from '@vassembly/ui-system-design/text';
import { TextField } from '@vassembly/ui-system-design/text-field';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { validatorFactory } from '@vassembly/validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { clearTokens } from '../../../../lib/auth/sessionStorage';
import { clearStoredUserPreferences } from '../../../../lib/preferences';
import { SETTINGS_ACCOUNT_DELETE_CONFIRMATION_SCHEMA } from '../../formSchemas';
import styles from '../../SettingsSections.module.scss';

interface SettingsAccountDeletionInteractiveBodyProps {
  modalTitle: string;
  isModalOpen: boolean;
  onRequestDismissModal: () => void;
}

const validateConfirmationPhrase = validatorFactory(
  SETTINGS_ACCOUNT_DELETE_CONFIRMATION_SCHEMA,
);

export const SettingsAccountDeletionInteractiveBody = ({
  modalTitle,
  isModalOpen,
  onRequestDismissModal,
}: SettingsAccountDeletionInteractiveBodyProps): JSX.Element => {
  const navigatorRouter = useRouter();
  const { user, clearSession } = useUserAuth();
  const snackbarMessenger = useSnackbar();
  const { mutate: deleteAccountMutation, isLoading } = useDeleteAccount();

  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [typedConfirmationPhrase, setTypedConfirmationPhrase] = useState('');
  const [errorMessageAmbient, setErrorMessageAmbient] = useState<string | undefined>(
    undefined,
  );

  const teardownLocalAuthenticatedSession = (): void => {
    const subjectFingerprint = user?.id;
    clearTokens();
    if (subjectFingerprint) {
      clearStoredUserPreferences({ userId: subjectFingerprint });
    }
    clearSession();
    navigatorRouter.push('/login');
  };

  const handleConfirmedDeletion = async (): Promise<void> => {
    setErrorMessageAmbient(undefined);

    if (riskAcknowledged !== true) {
      setErrorMessageAmbient('Confirm that you understand the consequences.');
      return;
    }

    const trimmedPhrase = typedConfirmationPhrase.trim();
    const phraseOutcome = validateConfirmationPhrase(trimmedPhrase);
    if (!phraseOutcome.success) {
      setErrorMessageAmbient('Type DELETE exactly in uppercase.');
      return;
    }

    const payload = await deleteAccountMutation();
    if (!payload?.deleteAccount?.success) {
      setErrorMessageAmbient('Could not remove your account. Try again or contact support.');
      return;
    }

    snackbarMessenger.show({
      variant: 'success',
      message: 'Your account has been removed.',
    });
    teardownLocalAuthenticatedSession();
  };

  const handleModalClose = (): void => {
    onRequestDismissModal();
    setRiskAcknowledged(false);
    setTypedConfirmationPhrase('');
    setErrorMessageAmbient(undefined);
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleModalClose} title={modalTitle}>
      <div className={styles.modalStack}>
        {errorMessageAmbient ? <Alert variant="error" message={errorMessageAmbient} /> : null}
        <Text variant="body2">
          You will lose access to every workspace. Active sessions end immediately.
        </Text>
        <ul className={styles.consequenceList}>
          <li>
            <Text variant="body2">Personal settings and history are removed.</Text>
          </li>
          <li>
            <Text variant="body2">Shared records may remain per workspace policy.</Text>
          </li>
          <li>
            <Text variant="body2">You must register again to return.</Text>
          </li>
        </ul>
        <Checkbox
          label="I understand this cannot be undone."
          checked={riskAcknowledged}
          onCheckedChange={(nextState) => {
            setRiskAcknowledged(nextState === true);
          }}
        />
        <TextField
          label="Type DELETE to confirm"
          value={typedConfirmationPhrase}
          onChange={(changeEvent) => {
            setTypedConfirmationPhrase(changeEvent.target.value);
          }}
          isDisabled={isLoading}
          isFullWidth
        />
        <div className={styles.toolbarRow}>
          <Button variant="outlined" text="Cancel" onClick={handleModalClose} />
          <Button
            color="danger"
            variant="contained"
            text="Delete account"
            isLoading={isLoading}
            onClick={() => void handleConfirmedDeletion()}
          />
        </div>
      </div>
    </Modal>
  );
};
