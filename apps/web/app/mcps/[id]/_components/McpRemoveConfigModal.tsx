'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import modalStyles from './McpModal.module.scss';
import type { McpRemoveConfigModalProps } from './types';

/**
 * Confirms deletion of an existing MCP configuration.
 */
export const McpRemoveConfigModal = ({
  open,
  mcpName,
  onConfirm,
  onCancel,
  isLoading,
}: McpRemoveConfigModalProps): JSX.Element => {
  return (
    <Modal isOpen={open} onClose={onCancel} title="Delete this configuration?">
      <div className={modalStyles.modalStack}>
        <Text variant="body2">This will remove your {mcpName} configuration.</Text>
        <Text variant="caption" className={modalStyles.warningText}>This action cannot be undone.</Text>
        <div className={modalStyles.toolbarRow}>
          <Button variant="outlined" text="Cancel" onClick={onCancel} isDisabled={isLoading} />
          <Button
            color="danger"
            variant="contained"
            text="Confirm"
            onClick={onConfirm}
            isDisabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};
