import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { CheckIcon, SearchIcon } from '@vassembly/ui-system-design/icons';
import { Stepper } from './Stepper';
import type { StepperStep } from './types';

const previewSurfaceStyle: CSSProperties = {
  maxWidth: '24rem',
  padding: '1.5rem',
  background: '#1a1a1e',
};

const STEPS: readonly StepperStep[] = [
  {
    id: 'account',
    icon: <CheckIcon />,
    title: 'Account',
    description: 'Create or sign in to your account.',
  },
  {
    id: 'details',
    icon: <SearchIcon />,
    title: 'Details',
    description: 'Add profile and preferences.',
  },
  {
    id: 'review',
    icon: <CheckIcon />,
    title: 'Review',
    description: 'Confirm and finish setup.',
  },
];

const meta: Meta<typeof Stepper> = {
  title: 'System Design/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
  args: {
    steps: STEPS,
    currentStepIndex: 0,
  },
  render: (args) => (
    <div style={previewSurfaceStyle}>
      <Stepper {...args} />
    </div>
  ),
};

export const MiddleStep: Story = {
  args: {
    steps: STEPS,
    currentStepIndex: 1,
  },
  render: (args) => (
    <div style={previewSurfaceStyle}>
      <Stepper {...args} />
    </div>
  ),
};

export const LastStep: Story = {
  args: {
    steps: STEPS,
    currentStepIndex: 2,
  },
  render: (args) => (
    <div style={previewSurfaceStyle}>
      <Stepper {...args} />
    </div>
  ),
};
