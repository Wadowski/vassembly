'use client';

import { Button } from '@vassembly/ui-system-design/button';
import { Modal } from '@vassembly/ui-system-design/modal';
import { Text } from '@vassembly/ui-system-design/text';

import type { SystemAgentRestoreDialogProps } from './types';
import styles from './styles.module.scss';

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
