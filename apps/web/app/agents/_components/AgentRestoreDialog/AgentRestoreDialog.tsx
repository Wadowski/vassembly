'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

export interface AgentRestoreDialogProps {
  agentName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirmBusy?: boolean;
}

export function AgentRestoreDialog({
  agentName,
  open,
  onClose,
  onConfirm,
  isConfirmBusy = false,
}: AgentRestoreDialogProps): JSX.Element {
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
    <Modal isOpen={open} onClose={onClose} title="Restore agent">
      <div className={styles.modalStack}>
        <Text>Restore {agentName} to active status?</Text>
        <div className={styles.toolbarRow}>
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
