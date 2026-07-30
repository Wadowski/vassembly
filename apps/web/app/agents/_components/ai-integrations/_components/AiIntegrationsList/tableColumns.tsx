import type { AiIntegrationCredentialDto } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';
import type { ColumnDef } from '@vassembly/ui-system-design/table';

import styles from './styles.module.scss';
import { AgentUsageBadge } from './AgentUsageBadge';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ProviderIcon } from './ProviderIcon';
import { AiIntegrationStatusBadge } from './aiIntegrationStatusBadge';
import {
  SystemAgentPreferenceAction,
  SystemAgentPreferenceBadge,
} from '../shared';
import sharedStyles from '../shared/styles.module.scss';

export interface GetAiIntegrationListTableColumnsArgs {
  onEdit: (credentialId: string) => void;
  onDelete: (credential: AiIntegrationCredentialDto) => void;
  onRestore: (credential: AiIntegrationCredentialDto) => void;
  onTest: (credential: AiIntegrationCredentialDto) => void;
  onSetSystemAgentPreference: (credentialId: string) => Promise<void>;
  testingCredentialId?: string | null;
  currentPreferenceCredentialId?: string;
  settingPreferenceCredentialId?: string | null;
  isPreferenceLoading?: boolean;
  isSettingPreference?: boolean;
}

export const getAiIntegrationListTableColumns = ({
  onEdit,
  onDelete,
  onRestore,
  onTest,
  onSetSystemAgentPreference,
  testingCredentialId,
  currentPreferenceCredentialId,
  settingPreferenceCredentialId,
  isPreferenceLoading = false,
  isSettingPreference = false,
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
        <div className={sharedStyles.preferenceRow}>
          <SystemAgentPreferenceBadge
            credentialId={row.id}
            currentCredentialId={currentPreferenceCredentialId}
          />
          <SystemAgentPreferenceAction
            credential={row}
            currentCredentialId={currentPreferenceCredentialId}
            isPreferenceLoading={isPreferenceLoading}
            savingCredentialId={settingPreferenceCredentialId ?? null}
            isSaving={isSettingPreference}
            onSetPreference={onSetSystemAgentPreference}
          />
        </div>
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
