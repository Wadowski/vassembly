import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'System Design/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onPageChange: { action: 'pageChange' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const ManyPages: Story = {
  args: {
    currentPage: 12,
    totalPages: 40,
    onPageChange: () => {},
  },
};

export const WiderSiblingWindow: Story = {
  args: {
    currentPage: 15,
    totalPages: 40,
    siblingCount: 2,
    onPageChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <Pagination currentPage={page} totalPages={20} onPageChange={setPage} />
    );
  },
};
