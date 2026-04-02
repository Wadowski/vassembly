import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './component';

const meta: Meta<typeof Component> = {
  title: 'Components/Component',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Hello Component',
  },
};

export const Empty: Story = {
  args: {},
};
