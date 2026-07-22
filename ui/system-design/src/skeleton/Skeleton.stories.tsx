import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { Skeleton } from './Skeleton';

const previewSurfaceStyle: CSSProperties = {
  width: '20rem',
  padding: '1rem',
  background: '#1a1a1e',
};

const meta: Meta<typeof Skeleton> = {
  title: 'System Design/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <div style={previewSurfaceStyle}>
      <Skeleton {...args} />
    </div>
  ),
};

export const FixedSize: Story = {
  args: {
    width: '12rem',
    height: '0.75rem',
  },
  render: (args) => (
    <div style={previewSurfaceStyle}>
      <Skeleton {...args} />
    </div>
  ),
};

export const Circle: Story = {
  args: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
  },
  render: (args) => (
    <div style={previewSurfaceStyle}>
      <Skeleton {...args} />
    </div>
  ),
};

export const CardPlaceholder: Story = {
  render: () => (
    <div style={previewSurfaceStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%',
        }}
      >
        <Skeleton width="40%" height="0.875rem" />
        <Skeleton height="6rem" borderRadius="0.5rem" />
        <Skeleton width="70%" height="0.75rem" />
        <Skeleton width="55%" height="0.75rem" />
      </div>
    </div>
  ),
};
