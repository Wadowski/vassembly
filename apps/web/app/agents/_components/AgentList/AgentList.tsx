'use client';

import { useMemo } from 'react';

import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Loader } from '@vassembly/ui-loader';
import { Table } from '@vassembly/ui-table';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';

import styles from './styles.module.scss';
import { AGENT_LIST_STATUS_OPTIONS } from './types';
import type { AgentListStatusFilter } from './types';
import { AGENT_LIST_PAGE_SIZE } from './listQuery';
import { AgentDeleteDialog } from '../AgentDeleteDialog';
import { AgentRestoreDialog } from '../AgentRestoreDialog';
import { getAgentListTableColumns } from './tableColumns';
import { useAgentList } from './useAgentList';

const STATUS_FILTER_OPTIONS = AGENT_LIST_STATUS_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function AgentList(): JSX.Element {
  const catalog = useAgentList();

  const columns = useMemo(
    () =>
      getAgentListTableColumns({
        onEditAgent: (agentId) => catalog.router.push(`/agents/${agentId}/edit`),
        onRestoreAgent: catalog.openRestoreFor,
        onDeleteAgent: catalog.openDeleteFor,
      }),
    [catalog.openDeleteFor, catalog.openRestoreFor, catalog.router],
  );

  const handleCreateAgentClick = (): void => {
    catalog.handleNavigateCreate();
  };

  const handleStatusFilterChange = (value: string): void => {
    catalog.handleStatusChange(value as AgentListStatusFilter);
  };

  return (
    <section className={styles.sectionCard}>
      <Text variant="h1">Agents</Text>
      <div className={styles.toolbarRow}>
        <Button
          className={styles.createAgentButton}
          variant="contained"
          text="Create Agent"
          onClick={handleCreateAgentClick}
        />
        <div className={styles.filtersGroup}>
          <TextField
            size="small"
            placeholder="Search by name or description…"
            isDisabled={catalog.isLoading}
            value={catalog.searchInput}
            onChange={(event) => catalog.handleSearchChange(event.target.value)}
          />
          <div className={styles.statusFilter}>
            <Dropdown
              id="agent-status-filter"
              size="small"
              options={STATUS_FILTER_OPTIONS}
              isDisabled={catalog.isLoading}
              isFullWidth
              value={catalog.statusFilter}
              onValueChange={handleStatusFilterChange}
            />
          </div>
        </div>
      </div>
      {catalog.isLoading ? <Loader ariaLabel="Loading agents" /> : null}
      <Table
        className={styles.agentTable}
        columns={columns}
        data={catalog.dataAgents}
        pageSize={AGENT_LIST_PAGE_SIZE}
        currentPage={catalog.currentPage}
        totalPages={catalog.totalPages}
        onPageChange={catalog.handleTablePageChange}
      />
      <AgentDeleteDialog
        agentName={catalog.focusAgentName}
        open={catalog.deleteOpen}
        onClose={catalog.closeDeleteDialog}
        isConfirmBusy={catalog.deleteBusy}
        onConfirm={catalog.confirmDelete}
      />
      <AgentRestoreDialog
        agentName={catalog.focusAgentName}
        open={catalog.restoreOpen}
        onClose={catalog.closeRestoreDialog}
        isConfirmBusy={catalog.restoreBusy}
        onConfirm={catalog.confirmRestore}
      />
    </section>
  );
}
