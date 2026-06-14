'use client';

import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

import type { McpAgentListItemProps } from './types';

export const McpAgentListItem = ({
  agentId,
  agentName,
  category,
  editHref,
  isRemoving,
  onRemove,
  onEdit,
}: McpAgentListItemProps): JSX.Element => {
  const handleEdit = (): void => {
    onEdit(editHref);
  };

  const handleRemove = (): void => {
    onRemove(agentId);
  };

  return (
    <div className={styles.agentRow}>
      <div className={styles.agentMeta}>
        <Text variant="body1">{agentName}</Text>
        <Text variant="caption" className={styles.categoryText}>
          {category}
        </Text>
      </div>
      <div className={styles.agentActions}>
        <Button size="small" variant="outlined" text="Edit agent" onClick={handleEdit} />
        <Button
          size="small"
          color="danger"
          variant="outlined"
          text="Remove from agent"
          onClick={handleRemove}
          isDisabled={isRemoving}
          isLoading={isRemoving}
        />
      </div>
    </div>
  );
};
