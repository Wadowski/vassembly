'use client';

import { Button } from '@vassembly/ui-system-design/button';
import { Modal } from '@vassembly/ui-system-design/modal';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './styles.module.scss';

export interface RestoreDialogProps {
  credentialName: string;
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function RestoreDialog({
  credentialName,
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
}: RestoreDialogProps): JSX.Element {
  const handleConfirm = (): void => {
    void (async () => {
      await onConfirm();
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Restore integration">
      <div className={styles.modalStack}>
        <Text variant="body1">
          Restore {credentialName}? It will become active again and available for agents.
        </Text>
        <div className={styles.toolbarRow}>
          <Button variant="outlined" text="Cancel" onClick={onCancel} isDisabled={isLoading} />
          <Button
            variant="contained"
            text="Restore"
            isDisabled={isLoading}
            isLoading={isLoading}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
}
