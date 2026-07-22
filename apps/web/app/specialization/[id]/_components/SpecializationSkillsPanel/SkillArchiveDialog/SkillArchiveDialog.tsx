'use client';

import { Button } from '@vassembly/ui-system-design/button';
import { Modal } from '@vassembly/ui-system-design/modal';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './SkillArchiveDialog.module.scss';

export interface SkillArchiveDialogProps {
  name: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirmBusy?: boolean;
}

export const SkillArchiveDialog = ({
  name,
  open,
  onClose,
  onConfirm,
  isConfirmBusy = false,
}: SkillArchiveDialogProps): JSX.Element => {
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
    <Modal isOpen={open} onClose={onClose} title="Archive skill?">
      <div className={styles.modalStack}>
        <Text>
          Archive {name}? It will be removed from active use. You can recreate it later if needed.
        </Text>
        <div className={styles.modalActions}>
          <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isConfirmBusy} />
          <Button
            color="danger"
            variant="contained"
            text="Archive skill"
            isDisabled={isConfirmBusy}
            isLoading={isConfirmBusy}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
};
