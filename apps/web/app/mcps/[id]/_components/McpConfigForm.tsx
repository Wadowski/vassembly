'use client';

import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';

import { CONNECTION_VERIFIED_MESSAGE, NETWORK_ERROR_MESSAGE } from './constants';
import { McpConfigField } from './McpConfigField';
import { McpDiscardChangesModal } from './McpDiscardChangesModal';
import { McpRemoveConfigModal } from './McpRemoveConfigModal';
import styles from './McpConfigForm.module.scss';
import type { McpConfigFormProps } from './types';
import { useMcpConfigForm } from './useMcpConfigForm';
import { useIsMobileLayout } from './useIsMobileLayout';

/**
 * Orchestrates MCP configuration fields, validation, test, save, and delete flows.
 */
export const McpConfigForm = ({ mcp, savedConfiguration }: McpConfigFormProps): JSX.Element => {
  const isMobile = useIsMobileLayout();
  const form = useMcpConfigForm({ mcp, savedConfiguration });
  const touchClass = isMobile ? `${styles.touchTarget} touchTarget` : undefined;

  return (
    <>
      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <div className={styles.fieldGrid}>
          {form.fields.map((field) => (
            <McpConfigField
              key={field.key}
              field={field}
              value={form.fieldValues[field.key] ?? ''}
              error={form.errors[field.key]}
              touched={form.touched[field.key] ?? false}
              isMobile={isMobile}
              hasSavedSecret={form.savedSecretKeys.has(field.key)}
              onChange={(value) => form.setFieldValue(field.key, value)}
              onBlur={() => form.blurField(field)}
            />
          ))}
        </div>

        {form.liveErrorMessage !== undefined ? (
          <div role="status" aria-live="polite" className={styles.liveRegion}>
            {form.liveErrorMessage}
          </div>
        ) : null}

        {form.testErrorMessage !== undefined ? (
          <Alert variant="error" message={form.testErrorMessage} />
        ) : null}

        {form.isTestSuccessful ? (
          <Text
            data-testid="connection-success-indicator"
            className={`${styles.successIndicator} successIndicator`}
            variant="body2"
          >
            {CONNECTION_VERIFIED_MESSAGE} ✓
          </Text>
        ) : null}

        {form.saveErrorMessage !== undefined ? (
          <Alert variant="error" message={form.saveErrorMessage} />
        ) : null}

        <div className={styles.actions}>
          <Button
            variant="outlined"
            text={form.isTesting ? 'Testing connection' : 'Test Connection'}
            aria-busy={form.isTesting ? true : undefined}
            isDisabled={!form.isFormValid || form.isTesting}
            isLoading={form.isTesting}
            className={resolveClassName(touchClass)}
            onClick={() => void form.runTestConnection()}
          />
          {form.testErrorMessage === NETWORK_ERROR_MESSAGE ? (
            <Button variant="text" text="Retry" onClick={() => void form.runTestConnection()} />
          ) : null}
          <Button
            variant="contained"
            text={form.isSaving ? 'Saving...' : 'Save Configuration'}
            isDisabled={!form.isTestSuccessful || form.isSaving}
            isLoading={form.isSaving}
            className={resolveClassName(touchClass)}
            onClick={() => void form.handleSave()}
          />
          <Button
            ref={form.cancelButtonRef}
            variant="outlined"
            text="Cancel"
            className={resolveClassName(touchClass)}
            onClick={form.handleCancel}
          />
        </div>

        {form.hasSavedConfiguration ? (
          <Button
            variant="text"
            color="danger"
            text="Remove Configuration"
            className={styles.deleteButton}
            onClick={form.openDeleteModal}
          />
        ) : null}
      </form>

      <McpRemoveConfigModal
        open={form.showDeleteModal}
        mcpName={mcp.name}
        isLoading={form.isDeleting}
        onCancel={form.closeDeleteModal}
        onConfirm={() => void form.handleDelete()}
      />

      <McpDiscardChangesModal
        open={form.showDiscardModal}
        returnFocusRef={form.cancelButtonRef as any}
        onStay={form.closeDiscardModal}
        onDiscard={form.handleDiscard}
      />
    </>
  );
};
