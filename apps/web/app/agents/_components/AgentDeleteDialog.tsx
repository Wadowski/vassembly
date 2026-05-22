'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import styles from './AgentDeleteDialog.module.scss';

export interface AgentDeleteDialogProps {
  agentName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirmBusy?: boolean;
}

export function AgentDeleteDialog({
  agentName,
  open,
  onClose,
  onConfirm,
  isConfirmBusy = false,
}: AgentDeleteDialogProps): JSX.Element {
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
    <Modal isOpen={open} onClose={onClose} title="Delete agent">
      <div className={styles.modalStack}>
        <Text>Are you sure you want to delete {agentName}?</Text>
        <div className={styles.toolbarRow}>
          <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isConfirmBusy} />
          <Button
            color="danger"
            variant="contained"
            text="Delete"
            isDisabled={isConfirmBusy}
            isLoading={isConfirmBusy}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
}
