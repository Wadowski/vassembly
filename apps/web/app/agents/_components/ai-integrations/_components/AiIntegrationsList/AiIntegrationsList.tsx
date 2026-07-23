'use client';

import { useMemo } from 'react';

import { PAGE_SIZE } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Dropdown } from '@vassembly/ui-system-design/dropdown';
import { Loader } from '@vassembly/ui-system-design/loader';
import { Table } from '@vassembly/ui-system-design/table';
import { TextField } from '@vassembly/ui-system-design/text-field';

import styles from './styles.module.scss';
import { DeleteDialog } from '../dialogs/DeleteDialog';
import { RestoreDialog } from '../dialogs/RestoreDialog';
import {
  AI_INTEGRATION_PROVIDER_FILTER_OPTIONS,
  AI_INTEGRATION_STATUS_FILTER_OPTIONS,
  type AiIntegrationListProviderFilter,
  type AiIntegrationListStatusFilter,
} from './types';
import { getAiIntegrationListTableColumns } from './tableColumns';
import { useAiIntegrationList } from './useAiIntegrationList';

export function AiIntegrationsList(): JSX.Element {
  const catalog = useAiIntegrationList();

  const columns = useMemo(
    () =>
      getAiIntegrationListTableColumns({
        onEdit: catalog.handleNavigateEdit,
        onDelete: catalog.openDeleteFor,
        onRestore: catalog.openRestoreFor,
        onTest: catalog.handleTestConnection,
        testingCredentialId: catalog.testingCredentialId,
      }),
    [
      catalog.handleNavigateEdit,
      catalog.handleTestConnection,
      catalog.openDeleteFor,
      catalog.openRestoreFor,
      catalog.testingCredentialId,
    ],
  );

  return (
    <>
      {catalog.errorMessage !== undefined ? <Alert variant="error" message={catalog.errorMessage} /> : null}

      <div className={styles.toolbarRow}>
        <Button
          className={styles.createButton}
          variant="contained"
          text="Add integration"
          onClick={catalog.handleNavigateCreate}
        />
        <div className={styles.filtersGroup}>
          <TextField
            className={styles.filterField}
            size="small"
            placeholder="Search by name…"
            isDisabled={catalog.isLoading}
            value={catalog.searchInput}
            onChange={(event) => catalog.handleSearchChange(event.target.value)}
          />
          <div className={styles.filterDropdown}>
            <Dropdown
              id="ai-integration-status-filter"
              size="small"
              options={AI_INTEGRATION_STATUS_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              isDisabled={catalog.isLoading}
              isFullWidth
              value={catalog.statusFilter}
              onValueChange={(value) => catalog.handleStatusChange(value as AiIntegrationListStatusFilter)}
            />
          </div>
          <div className={styles.filterDropdown}>
            <Dropdown
              id="ai-integration-provider-filter"
              size="small"
              options={AI_INTEGRATION_PROVIDER_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              isDisabled={catalog.isLoading}
              isFullWidth
              value={catalog.providerFilter}
              onValueChange={(value) => catalog.handleProviderChange(value as AiIntegrationListProviderFilter)}
            />
          </div>
        </div>
      </div>

      {catalog.isLoading ? <Loader ariaLabel="Loading AI integrations" /> : null}

      <Table
        className={styles.integrationTable}
        columns={columns}
        data={catalog.items}
        pageSize={PAGE_SIZE}
        currentPage={catalog.currentPage}
        totalPages={catalog.totalPages}
        onPageChange={catalog.handleTablePageChange}
      />

      {catalog.deleteTarget !== null ? (
        <DeleteDialog
          credentialName={catalog.deleteTarget.name}
          agentCount={catalog.deleteTarget.agentUsageCount ?? 0}
          isOpen={catalog.deleteTarget !== null}
          isLoading={catalog.isDeleting}
          onConfirm={catalog.handleDelete}
          onCancel={catalog.closeDeleteDialog}
        />
      ) : null}

      {catalog.restoreTarget !== null ? (
        <RestoreDialog
          credentialName={catalog.restoreTarget.name}
          isOpen={catalog.restoreTarget !== null}
          isLoading={catalog.isRestoring}
          onConfirm={catalog.handleRestore}
          onCancel={catalog.closeRestoreDialog}
        />
      ) : null}
    </>
  );
}
