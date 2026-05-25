'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

export interface SystemAgentRestoreDialogProps {
  name: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirmBusy?: boolean;
}

export function SystemAgentRestoreDialog({
  name,
  open,
  onClose,
  onConfirm,
  isConfirmBusy = false,
}: SystemAgentRestoreDialogProps): JSX.Element {
  const handleConfirm = (): void => {
    void (async () => {
      try {
        await onConfirm();
        onClose();
      } catch {
        return;
      }
    })();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Restore platform agent?">
      <div className={styles.modalStack}>
        <Text>Restore {name}? It will appear in the platform catalog again.</Text>
        <div className={styles.modalActions}>
          <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isConfirmBusy} />
          <Button
            variant="contained"
            text="Restore"
            isDisabled={isConfirmBusy}
            isLoading={isConfirmBusy}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
}
