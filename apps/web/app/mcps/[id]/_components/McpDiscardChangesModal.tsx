'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { Modal } from '@vassembly/ui-system-design/modal';
import { Text } from '@vassembly/ui-system-design/text';

import modalStyles from './McpModal.module.scss';
import type { McpDiscardChangesModalProps } from './types';

/**
 * Confirms discarding unsaved MCP configuration changes.
 */
export const McpDiscardChangesModal = ({
  open,
  onStay,
  onDiscard,
  returnFocusRef,
}: McpDiscardChangesModalProps): JSX.Element => {
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    stayButtonRef.current?.focus();
  }, [open]);

  const handleStay = (): void => {
    onStay();
    returnFocusRef.current?.focus();
  };

  return (
    <Modal isOpen={open} onClose={handleStay} title="Discard changes?">
      <div className={modalStyles.modalStack}>
        <Text variant="body2">Your unsaved changes will be lost.</Text>
        <div className={modalStyles.toolbarRow}>
          <Button ref={stayButtonRef} variant="outlined" text="Stay" onClick={handleStay} />
          <Button color="danger" variant="contained" text="Discard" onClick={onDiscard} />
        </div>
      </div>
    </Modal>
  );
};
