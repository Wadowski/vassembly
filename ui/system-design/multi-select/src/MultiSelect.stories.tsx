import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MultiSelect } from './MultiSelect';

const sampleOptions = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

const manyOptions = [
  { value: '1', label: 'One' },
  { value: '2', label: 'Two' },
  { value: '3', label: 'Three' },
  { value: '4', label: 'Four' },
  { value: '5', label: 'Five' },
  { value: '6', label: 'Six' },
];

const meta: Meta<typeof MultiSelect> = {
  title: 'System Design/MultiSelect',
  component: MultiSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Choose',
    placeholder: 'Select options',
    options: sampleOptions,
  },
};

export const Controlled: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(['a']);
    return (
      <MultiSelect
        label="Controlled"
        options={sampleOptions}
        values={values}
        onValuesChange={setValues}
      />
    );
  },
};

export const WithSelectAll: Story = {
  args: {
    label: 'With select all',
    options: sampleOptions,
    hasSelectAll: true,
    placeholder: 'Select',
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Disabled option',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta', isDisabled: true },
      { value: 'c', label: 'Gamma' },
    ],
    placeholder: 'Select',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full width',
    options: sampleOptions,
    isFullWidth: true,
    placeholder: 'Select',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    options: sampleOptions,
    isDisabled: true,
    defaultValues: ['b'],
  },
};

export const Small: Story = {
  args: {
    label: 'Size',
    options: sampleOptions,
    size: 'small',
    placeholder: 'Small',
  },
};

export const Large: Story = {
  args: {
    label: 'Size',
    options: sampleOptions,
    size: 'large',
    placeholder: 'Large',
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: 'Placeholder',
    options: sampleOptions,
    placeholder: 'Pick one or more',
  },
};

export const ManyOptions: Story = {
  args: {
    label: 'Many options',
    options: manyOptions,
    defaultValues: ['1', '2', '3'],
    placeholder: 'Select',
  },
};
