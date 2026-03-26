import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Popover } from './Popover';

const meta: Meta<typeof Popover> = {
  title: 'System Design/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onOpenChange: { action: 'openChange' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: <button type="button">Open popover</button>,
    children: <p style={{ margin: 0 }}>Short popover copy.</p>,
    placement: 'bottom',
  },
};

export const RichContent: Story = {
  args: {
    trigger: <button type="button">Details</button>,
    placement: 'bottom',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <strong style={{ fontSize: '0.95rem' }}>Synthetic Luminal</strong>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.85 }}>
          Glassmorphic surface with ambient primary-tinted shadow.
        </p>
        <button type="button">Action</button>
      </div>
    ),
  },
};

export const PlacementTop: Story = {
  args: {
    ...Default.args,
    placement: 'top',
  },
};

export const PlacementLeft: Story = {
  args: {
    ...Default.args,
    placement: 'left',
  },
};

export const PlacementRight: Story = {
  args: {
    ...Default.args,
    placement: 'right',
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        trigger={<button type="button">{open ? 'Close' : 'Open'}</button>}
        isOpen={open}
        onOpenChange={setOpen}
      >
        <p style={{ margin: 0 }}>Controlled popover.</p>
      </Popover>
    );
  },
};
