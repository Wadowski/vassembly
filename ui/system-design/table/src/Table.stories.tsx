import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@vassembly/ui-text';
import { Table } from './Table';
import type { ColumnDef } from './types';

type StoryRow = { id: number; name: string };

const baseColumns: ColumnDef<StoryRow>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
];

const meta: Meta<typeof Table> = {
  title: 'System Design/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const smallData: StoryRow[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];

const manyRows: StoryRow[] = Array.from({ length: 35 }, (_, index) => ({
  id: index + 1,
  name: `Row ${index + 1}`,
}));

export const Default: Story = {
  args: {
    columns: baseColumns,
    data: smallData,
    pageSize: 10,
  },
};

export const ManyRowsPaginated: Story = {
  args: {
    columns: baseColumns,
    data: manyRows,
    pageSize: 10,
  },
};

export const EmptyDefaultMessage: Story = {
  args: {
    columns: baseColumns,
    data: [],
    pageSize: 10,
  },
};

export const EmptyCustomState: Story = {
  args: {
    columns: baseColumns,
    data: [],
    pageSize: 10,
    emptyState: 'Nothing to show',
  },
};

export const WithCaption: Story = {
  args: {
    columns: baseColumns,
    data: smallData,
    pageSize: 10,
    caption: 'Team members',
  },
};

export const CustomRenderColumn: Story = {
  args: {
    columns: [
      {
        key: 'id',
        header: 'ID',
        render: ({ row }) => (
          <Text as="span" variant="label">
            {row.id}
          </Text>
        ),
      },
      { key: 'name', header: 'Name' },
    ],
    data: smallData,
    pageSize: 10,
  },
};
