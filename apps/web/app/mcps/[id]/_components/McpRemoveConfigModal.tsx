'use client';

import { Button } from '@vassembly/ui-system-design/button';
import { Modal } from '@vassembly/ui-system-design/modal';
import { Text } from '@vassembly/ui-system-design/text';

import modalStyles from './McpModal.module.scss';
import type { McpRemoveConfigModalProps } from './types';

/**
 * Confirms deletion of an existing MCP configuration.
 */
export const McpRemoveConfigModal = ({
  open,
  mcpName,
  agentUsageCount = 0,
  onConfirm,
  onCancel,
  isLoading,
}: McpRemoveConfigModalProps): JSX.Element => {
  const hasAssignedAgents = agentUsageCount > 0;
  const agentLabel = agentUsageCount === 1 ? 'agent' : 'agents';

  return (
    <Modal isOpen={open} onClose={onCancel} title="Delete this configuration?">
      <div className={modalStyles.modalStack}>
        <Text variant="body2">This will remove your {mcpName} configuration.</Text>
        {hasAssignedAgents ? (
          <Text variant="body2">
            {agentUsageCount} {agentLabel} still reference this MCP. They will keep the assignment until you edit or
            remove it, but the MCP will no longer work at runtime.
          </Text>
        ) : null}
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
