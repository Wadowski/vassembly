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
import { AgentInvokeModal } from '../AgentInvokeModal';
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
        onRunAgent: catalog.openInvokeFor,
        onRestoreAgent: catalog.openRestoreFor,
        onDeleteAgent: catalog.openDeleteFor,
      }),
    [catalog.openDeleteFor, catalog.openInvokeFor, catalog.openRestoreFor, catalog.router],
  );

  return (
    <section className={styles.sectionCard}>
      <Text variant="h2" as="h2">My Agents</Text>
      <Text variant="body2">Create, configure, and manage agents before connecting them to AI integrations.</Text>
      <div className={styles.toolbarRow}>
        <Button
          className={styles.createAgentButton}
          variant="contained"
          text="Create Agent"
          onClick={catalog.handleNavigateCreate}
        />
        <div className={styles.filtersGroup}>
          <TextField
            className={styles.filterField}
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
              onValueChange={(value) => catalog.handleStatusChange(value as AgentListStatusFilter)}
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
      <AgentInvokeModal
        open={catalog.invokeOpen}
        agent={catalog.focusAgent ?? undefined}
        onClose={catalog.closeInvokeDialog}
      />
    </section>
  );
}
