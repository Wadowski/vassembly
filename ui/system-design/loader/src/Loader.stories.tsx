import type { Meta, StoryObj } from '@storybook/react';
import { Loader } from './Loader';

const meta: Meta<typeof Loader> = {
  title: 'System Design/Loader',
  component: Loader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: {
      control: 'text',
      description: 'Accessible label when no children are provided',
    },
    className: {
      control: 'text',
      description: 'Additional class names merged onto the root',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomAriaLabel: Story = {
  args: {
    ariaLabel: 'Submitting form',
  },
};

export const WithVisuallyHiddenText: Story = {
  render: () => <Loader>Loading your workspace</Loader>,
};

export const WithClassName: Story = {
  args: {
    className: 'story-loader-custom',
  },
};

export const InlineWithText: Story = {
  render: () => (
    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
      <span>Please wait</span>
      <Loader ariaLabel="Loading" />
    </p>
  ),
};
