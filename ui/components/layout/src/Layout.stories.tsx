import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from './Layout';

const meta: Meta<typeof Layout> = {
  title: 'Components/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Main: Story = {
  args: {
    variant: 'main',
  },
  render: (args) => (
    <Layout {...args}>
      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ marginTop: 0 }}>Page title</h1>
        <p>Main content area for the default layout preset.</p>
      </div>
    </Layout>
  ),
};

export const MainWithFooterOverride: Story = {
  args: {
    variant: 'main',
    footer: { copyright: '© 2026 Storybook preview. All rights reserved.' },
  },
  render: (args) => (
    <Layout {...args}>
      <p style={{ padding: '0 1.5rem' }}>Content with merged footer override.</p>
    </Layout>
  ),
};
