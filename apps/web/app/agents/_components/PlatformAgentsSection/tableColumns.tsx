import { useState } from 'react';
import type { SystemAgentAdminItem } from '@vassembly/ui-api-hooks';
import { SystemAgentStatus } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';
import { Menu, MenuItem } from '@vassembly/ui-system-design/menu';
import { Popover } from '@vassembly/ui-system-design/popover';
import { Tag } from '@vassembly/ui-system-design/tag';
import { Text } from '@vassembly/ui-system-design/text';
import type { ColumnDef } from '@vassembly/ui-system-design/table';

import styles from './styles.module.scss';
import {
  getSystemAgentCategoryLabel,
  getSystemAgentStatusLabel,
  getSystemAgentStatusVariant,
} from './tags';

export interface GetPlatformAgentsTableColumnsArgs {
  onRun: (agent: SystemAgentAdminItem) => void;
  onEdit: (agent: SystemAgentAdminItem) => void;
  onArchive: (agent: SystemAgentAdminItem) => void;
  onRestore: (agent: SystemAgentAdminItem) => void;
  onTestInvoke: (agent: SystemAgentAdminItem) => void;
}

const EMPTY_DESCRIPTION = 'No description provided.';

export const getPlatformAgentsTableColumns = ({
  onRun,
  onEdit,
  onArchive,
  onRestore,
  onTestInvoke,
}: GetPlatformAgentsTableColumnsArgs): ColumnDef<SystemAgentAdminItem>[] => [
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
      <Tag size="small" variant={getSystemAgentStatusVariant(row.status)}>
        {getSystemAgentStatusLabel(row.status)}
      </Tag>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    render: ({ row }) => (
      <Tag size="small" variant="default">
        {getSystemAgentCategoryLabel(row.category)}
      </Tag>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    render: ({ row }) => (
      <Text variant="body1" as="span" className={styles.descriptionCell}>
        {row.description ?? EMPTY_DESCRIPTION}
      </Text>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: ({ row }) => <ActionsCell row={row} {...{ onRun, onEdit, onArchive, onRestore, onTestInvoke }} />,
  },
];

interface ActionsCellProps extends GetPlatformAgentsTableColumnsArgs {
  row: SystemAgentAdminItem;
}

const ActionsCell = ({ row, onRun, onEdit, onArchive, onRestore, onTestInvoke }: ActionsCellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isArchived = row.status === SystemAgentStatus.Archived;
  const isRunDisabled =
    row.status === SystemAgentStatus.Archived ||
    row.status === SystemAgentStatus.Disabled;

  const handleMenuItemClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className={styles.actionsCell}>
      <Button
        size="small"
        variant="text"
        text="Edit"
        onClick={() => onEdit(row)}
      />
      <Popover
        placement="bottom"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={<Button size="small" variant="text" text="More actions" />}
        className={styles.actionsMenu}
      >
        <Menu mode="single" selectedKeys={[]}>
          <MenuItem
            itemKey="run"
            isDisabled={isRunDisabled}
            onClick={() => handleMenuItemClick(() => onRun(row))}
          >
            Run
          </MenuItem>
          <MenuItem
            itemKey="test-invoke"
            onClick={() => handleMenuItemClick(() => onTestInvoke(row))}
          >
            Test invoke
          </MenuItem>
          {isArchived ? (
            <MenuItem
              itemKey="restore"
              onClick={() => handleMenuItemClick(() => onRestore(row))}
            >
              Restore
            </MenuItem>
          ) : (
            <MenuItem
              itemKey="archive"
              onClick={() => handleMenuItemClick(() => onArchive(row))}
            >
              Archive
            </MenuItem>
          )}
        </Menu>
      </Popover>
    </div>
  );
};
