'use client';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';
import type { McpUnassignAgentModalProps } from './types';

export const McpUnassignAgentModal = ({
  open,
  mcpName,
  agentName,
  isLoading,
  onConfirm,
  onCancel,
}: McpUnassignAgentModalProps): JSX.Element => {
  return (
    <Modal isOpen={open} onClose={onCancel} title="Remove MCP from agent?">
      <div className={styles.modalStack}>
        <Text variant="body2">
          {`Remove ${mcpName} from ${agentName}?`}
        </Text>
        <div className={styles.toolbarRow}>
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
