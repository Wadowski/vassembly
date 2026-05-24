import type { AiIntegrationCredentialDto } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import type { ColumnDef } from '@vassembly/ui-table';

import styles from './AiIntegrationsList.module.scss';
import { AgentUsageBadge } from './AgentUsageBadge';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ProviderIcon } from './ProviderIcon';
import { AiIntegrationStatusBadge } from './aiIntegrationStatusBadge';

const formatCreatedDate = (value: string): string => {
  if (value === '') {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export interface GetAiIntegrationListTableColumnsArgs {
  onEdit: (credentialId: string) => void;
  onDelete: (credential: AiIntegrationCredentialDto) => void;
  onRestore: (credential: AiIntegrationCredentialDto) => void;
  onTest: (credential: AiIntegrationCredentialDto) => void;
  testingCredentialId?: string | null;
}

export const getAiIntegrationListTableColumns = ({
  onEdit,
  onDelete,
  onRestore,
  onTest,
  testingCredentialId,
}: GetAiIntegrationListTableColumnsArgs): ColumnDef<AiIntegrationCredentialDto>[] => [
  {
    key: 'name',
    header: 'Name',
    render: ({ row }) => (
      <Text variant="body1" as="span">
        {row.name}
      </Text>
    ),
  },
  {
    key: 'provider',
    header: 'Provider',
    render: ({ row }) => <ProviderIcon provider={row.provider} />,
  },
  {
    key: 'status',
    header: 'Status',
    render: ({ row }) => <AiIntegrationStatusBadge status={row.status} />,
  },
  {
    key: 'connectionStatus',
    header: 'Connection',
    render: ({ row }) => <ConnectionStatusBadge status={row.connectionStatus} />,
  },
  {
    key: 'agentUsageCount',
    header: 'Agents using',
    render: ({ row }) => <AgentUsageBadge count={row.agentUsageCount ?? 0} />,
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: ({ row }) => (
      <Text variant="body2" as="span" className={styles.createdCell}>
        {formatCreatedDate(row.createdAt)}
      </Text>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: ({ row }) => (
      <div className={styles.actionsCell}>
        <Button size="small" variant="text" text="Edit" onClick={() => onEdit(row.id)} />
        <Button
          size="small"
          variant="text"
          text="Test"
          isLoading={testingCredentialId === row.id}
          isDisabled={testingCredentialId !== null && testingCredentialId !== row.id}
          onClick={() => onTest(row)}
        />
        {row.status === 'archived' ? (
          <Button size="small" variant="text" text="Restore" onClick={() => onRestore(row)} />
        ) : (
          <Button size="small" color="danger" variant="text" text="Delete" onClick={() => onDelete(row)} />
        )}
      </div>
    ),
  },
];
