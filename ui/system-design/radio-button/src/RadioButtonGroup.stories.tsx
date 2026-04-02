import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioButtonGroup } from './RadioButtonGroup';

const sampleOptions = [
  { value: 'a', label: 'Email' },
  { value: 'b', label: 'SMS' },
  { value: 'c', label: 'None' },
];

const meta: Meta<typeof RadioButtonGroup> = {
  title: 'System Design/RadioButtonGroup',
  component: RadioButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Notification channel"
        description="Choose how we reach you"
      />
    );
  },
};

export const Horizontal: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Layout"
        direction="horizontal"
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Pick one"
        errorMessage="Selection is required"
      />
    );
  },
};

export const SuccessVariant: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Validated"
        variant="success"
        description="Looks good"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    value: 'b',
    onChange: () => undefined,
    options: sampleOptions,
    label: 'Disabled group',
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    value: 'a',
    onChange: () => undefined,
    options: sampleOptions,
    label: 'Read only',
    isReadOnly: true,
  },
};

export const Required: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Required field"
        isRequired
      />
    );
  },
};

export const WithDisabledOption: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'Standard' },
          { value: 'b', label: 'Premium', isDisabled: true },
          { value: 'c', label: 'Enterprise' },
        ]}
        label="Plan"
      />
    );
  },
};

export const LabelLeft: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Labels left"
        labelPosition="left"
      />
    );
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioButtonGroup
        value={value}
        onChange={setValue}
        options={sampleOptions}
        label="Small size"
        size="small"
      />
    );
  },
};
