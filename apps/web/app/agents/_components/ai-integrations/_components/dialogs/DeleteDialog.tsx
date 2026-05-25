'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

export interface DeleteDialogProps {
  credentialName: string;
  agentCount: number;
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteDialog({
  credentialName,
  agentCount,
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteDialogProps): JSX.Element {
  const handleConfirm = (): void => {
    void (async () => {
      await onConfirm();
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete integration">
      <div className={styles.modalStack}>
        <Text variant="body1">
          Are you sure you want to delete {credentialName}?
        </Text>
        {agentCount > 0 ? (
          <Text variant="body2" className={styles.warningText}>
            {agentCount === 1
              ? '1 agent is currently using this integration. It will keep the reference but may fail until you assign a new integration.'
              : `${agentCount} agents are currently using this integration. They will keep the reference but may fail until you assign new integrations.`}
          </Text>
        ) : null}
        <div className={styles.toolbarRow}>
          <Button variant="outlined" text="Cancel" onClick={onCancel} isDisabled={isLoading} />
          <Button
            color="danger"
            variant="contained"
            text="Delete"
            isDisabled={isLoading}
            isLoading={isLoading}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
}
