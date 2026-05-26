'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import type { SystemAgentArchiveDialogProps } from './types';
import styles from './styles.module.scss';

export function SystemAgentArchiveDialog({
  name,
  open,
  onClose,
  onConfirm,
  isConfirmBusy = false,
}: SystemAgentArchiveDialogProps): JSX.Element {
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
    <Modal isOpen={open} onClose={onClose} title="Archive platform agent?">
      <div className={styles.modalStack}>
        <Text>
          Archive {name}? Users will no longer see or invoke it. You can restore it later.
        </Text>
        <div className={styles.modalActions}>
          <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isConfirmBusy} />
          <Button
            color="danger"
            variant="contained"
            text="Archive"
            isDisabled={isConfirmBusy}
            isLoading={isConfirmBusy}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
}
