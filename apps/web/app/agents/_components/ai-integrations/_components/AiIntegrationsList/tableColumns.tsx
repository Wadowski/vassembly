import type { AiIntegrationCredentialDto } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import type { ColumnDef } from '@vassembly/ui-table';

import styles from './styles.module.scss';
import { AgentUsageBadge } from './AgentUsageBadge';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ProviderIcon } from './ProviderIcon';
import { AiIntegrationStatusBadge } from './aiIntegrationStatusBadge';


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
    key: 'statusAndConnection',
    header: 'Status',
    render: ({ row }) => (
      <div className={styles.statusConnectionCell}>
        <AiIntegrationStatusBadge status={row.status} />
        <ConnectionStatusBadge status={row.connectionStatus} />
      </div>
    ),
  },
  {
    key: 'agentUsageCount',
    header: 'Agents using',
    render: ({ row }) => <AgentUsageBadge count={row.agentUsageCount ?? 0} />,
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
