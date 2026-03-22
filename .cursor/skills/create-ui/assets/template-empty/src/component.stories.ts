import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './component';

const meta = {
  title: 'Component',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

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
