'use client';

import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import {
  SYSTEM_AGENT_LIST_ALL_STATUSES,
  SystemAgentStatus,
} from '@vassembly/ui-api-hooks';

import { SystemAgentInvokeModal } from '../SystemAgentInvokeModal';
import { PlatformAgentCard } from './PlatformAgentCard';
import { SystemAgentArchiveDialog } from './SystemAgentArchiveDialog';
import { SystemAgentCreateModal } from './SystemAgentCreateModal';
import { SystemAgentEditModal } from './SystemAgentEditModal';
import { SystemAgentRestoreDialog } from './SystemAgentRestoreDialog';
import { SYSTEM_AGENT_CATEGORY_OPTIONS } from './constants';
import styles from './styles.module.scss';
import type { PlatformAgentCategoryFilter, PlatformAgentStatusFilter } from './usePlatformAgentListFilters';
import { usePlatformAgentsSection } from './usePlatformAgentsSection';

const STATUS_FILTER_OPTIONS: Array<{ value: PlatformAgentStatusFilter; label: string }> = [
  { value: SystemAgentStatus.Active, label: 'Active' },
  { value: SystemAgentStatus.Archived, label: 'Archived' },
  { value: SystemAgentStatus.Disabled, label: 'Disabled' },
  { value: SYSTEM_AGENT_LIST_ALL_STATUSES, label: 'All statuses' },
];

const CATEGORY_FILTER_OPTIONS: Array<{ value: PlatformAgentCategoryFilter; label: string }> = [
  { value: SYSTEM_AGENT_LIST_ALL_STATUSES, label: 'All categories' },
  ...SYSTEM_AGENT_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

export function PlatformAgentsSection(): JSX.Element {
  const section = usePlatformAgentsSection();

  return (
    <section id="platform-agents" className={styles.sectionCard}>
      <Text variant="label" className={styles.overline}>
        Platform Agents
      </Text>
      <div className={styles.headerRow}>
        <Text variant="h2" as="h2">
          Platform Agents
        </Text>
        <Text variant="body2">
          Governed agents provided by your organization. They run using your AI connection.
        </Text>
      </div>
      <div className={styles.toolbarRow}>
        <Button
          className={styles.createButton}
          variant="contained"
          text="Create System Agent"
          onClick={section.openCreate}
        />
        <div className={styles.filtersGroup}>
          <TextField
            className={styles.filterField}
            size="small"
            placeholder="Search platform agents…"
            isDisabled={section.isLoading}
            value={section.filters.searchInput}
            onChange={(event) => section.filters.handleSearchChange(event.target.value)}
          />
          <div className={styles.filterDropdown}>
            <Dropdown
              id="platform-agent-status-filter"
              size="small"
              options={STATUS_FILTER_OPTIONS}
              isDisabled={section.isLoading}
              isFullWidth
              value={section.filters.statusFilter}
              onValueChange={(value) =>
                section.filters.handleStatusChange(value as PlatformAgentStatusFilter)
              }
            />
          </div>
          <div className={styles.filterDropdown}>
            <Dropdown
              id="platform-agent-category-filter"
              size="small"
              options={CATEGORY_FILTER_OPTIONS}
              isDisabled={section.isLoading}
              isFullWidth
              value={section.filters.categoryFilter}
              onValueChange={(value) =>
                section.filters.handleCategoryChange(value as PlatformAgentCategoryFilter)
              }
            />
          </div>
        </div>
      </div>
      {section.isLoading ? <Loader ariaLabel="Loading platform agents" /> : null}
      {section.isEmpty ? (
        <div className={styles.emptyState}>
          <Text variant="body2">No system agents yet.</Text>
          <Button variant="contained" text="Create System Agent" onClick={section.openCreate} />
        </div>
      ) : null}
      {section.isFilteredEmpty ? (
        <div className={styles.emptyState}>
          <Text variant="body2">No matches for your search.</Text>
          <Button variant="text" text="Clear search" onClick={section.filters.clearSearch} />
        </div>
      ) : null}
      {!section.isLoading && section.agents.length > 0 ? (
        <div className={styles.cardGrid}>
          {section.agents.map((agent) => (
            <PlatformAgentCard
              key={agent.id}
              agent={agent}
              onRun={section.openInvokeFor}
              onEdit={section.openEditFor}
              onArchive={section.openArchiveFor}
              onRestore={section.openRestoreFor}
              onTestInvoke={section.openInvokeFor}
            />
          ))}
        </div>
      ) : null}
      <SystemAgentCreateModal
        open={section.createOpen}
        onClose={section.closeCreate}
        onSubmit={section.handleCreate}
        isSubmitting={section.isCreateSubmitting}
        nameConflictError={section.nameConflictError}
      />
      <SystemAgentEditModal
        open={section.editOpen}
        agent={section.focusAgent ?? undefined}
        onClose={section.closeEdit}
        onSubmit={section.handleUpdate}
        isSubmitting={section.isUpdateSubmitting}
        nameConflictError={section.nameConflictError}
      />
      <SystemAgentArchiveDialog
        name={section.focusAgentName}
        open={section.archiveOpen}
        onClose={section.closeArchive}
        onConfirm={section.confirmArchive}
        isConfirmBusy={section.isArchiveBusy}
      />
      <SystemAgentRestoreDialog
        name={section.focusAgentName}
        open={section.restoreOpen}
        onClose={section.closeRestore}
        onConfirm={section.confirmRestore}
        isConfirmBusy={section.isRestoreBusy}
      />
      <SystemAgentInvokeModal
        open={section.invokeOpen}
        agent={section.focusAgent ?? undefined}
        onClose={section.closeInvoke}
      />
    </section>
  );
}
