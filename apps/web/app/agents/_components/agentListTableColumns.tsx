import type { AgentDto } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';
import type { ColumnDef } from '@vassembly/ui-table';

import styles from './AgentList.module.scss';
import {
  getAgentCategoryLabel,
  getAgentCategoryTagVariant,
  getAgentStatusLabel,
  getAgentStatusTagVariant,
} from './agentListTags';

export interface GetAgentListTableColumnsArgs {
  onEditAgent: (agentId: string) => void;
  onRestoreAgent: (agent: AgentDto) => void;
  onDeleteAgent: (agent: AgentDto) => void;
}

export const getAgentListTableColumns = ({
  onEditAgent,
  onRestoreAgent,
  onDeleteAgent,
}: GetAgentListTableColumnsArgs): ColumnDef<AgentDto>[] => [
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
    key: 'status',
    header: 'Status',
    render: ({ row }) => (
      <Tag size="small" variant={getAgentStatusTagVariant(row.status)}>
        {getAgentStatusLabel(row.status)}
      </Tag>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    render: ({ row }) => (
      <Tag size="small" variant={getAgentCategoryTagVariant(row.category)}>
        {getAgentCategoryLabel(row.category)}
      </Tag>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    render: ({ row }) => (
      <Text variant="body1" as="span" className={styles.descriptionCell}>
        {row.description}
      </Text>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: ({ row }) => (
      <div className={styles.actionsCell}>
        <Button size="small" variant="text" text="Edit" onClick={() => onEditAgent(row.id)} />
        {Boolean(row.removedAt) ? (
          <Button size="small" variant="text" text="Restore" onClick={() => onRestoreAgent(row)} />
        ) : (
          <Button size="small" color="danger" variant="text" text="Delete" onClick={() => onDeleteAgent(row)} />
        )}
      </div>
    ),
  },
];
