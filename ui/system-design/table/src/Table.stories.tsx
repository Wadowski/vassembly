import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@vassembly/ui-text';
import { Table } from './Table';
import type { ColumnDef, TableProps } from './types';

type StoryRow = { id: number; name: string };

const baseColumns: ColumnDef<StoryRow>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
];

const meta: Meta<TableProps<StoryRow>> = {
  title: 'System Design/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<TableProps<StoryRow>>;

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

export const ServerPagination: Story = {
  args: {
    columns: baseColumns,
    data: manyRows.slice(0, 10),
    pageSize: 10,
    currentPage: 1,
    totalPages: Math.ceil(manyRows.length / 10),
    onPageChange: (page: number): void => {
      void page;
    },
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
