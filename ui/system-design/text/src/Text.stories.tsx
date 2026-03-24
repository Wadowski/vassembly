import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'body1', 'body2', 'label', 'caption'],
      description: 'Typography variant — controls font, size, weight, line-height, and default color',
    },
    as: {
      control: 'text',
      description: 'Override the rendered HTML element without changing visual style',
    },
    children: {
      control: 'text',
      description: 'Text content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const H1: Story = {
  args: {
    variant: 'h1',
    children: 'The Synthetic Luminal',
  },
};

export const H2: Story = {
  args: {
    variant: 'h2',
    children: 'Section Heading',
  },
};

export const H3: Story = {
  args: {
    variant: 'h3',
    children: 'Card Title',
  },
};

export const Body1: Story = {
  args: {
    variant: 'body1',
    children:
      'Primary body text. Inter at 1rem with relaxed line-height for comfortable reading of longer passages.',
  },
};

export const Body2: Story = {
  args: {
    variant: 'body2',
    children:
      'Secondary body text. Slightly smaller than body1, used for supporting content and compact descriptions.',
  },
};

export const Label: Story = {
  args: {
    variant: 'label',
    children: 'Category Header',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'Last updated 2 minutes ago',
  },
};

export const AsOverride: Story = {
  name: '`as` override — h1 variant on <span>',
  args: {
    variant: 'h1',
    as: 'span',
    children: 'Visually h1, semantically span',
  },
};

export const LabelAsFormLabel: Story = {
  name: 'Label variant as <label>',
  args: {
    variant: 'label',
    as: 'label',
    children: 'Email address',
  },
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <Text variant="h1">h1 — The Synthetic Luminal</Text>
      <Text variant="h2">h2 — Section Heading</Text>
      <Text variant="h3">h3 — Card Title</Text>
      <Text variant="body1">
        body1 — Primary body text. Inter at 1rem with relaxed line-height.
      </Text>
      <Text variant="body2">
        body2 — Secondary body text. Slightly smaller for supporting content.
      </Text>
      <Text variant="label">label — Category Header</Text>
      <Text variant="caption">caption — Last updated 2 minutes ago</Text>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    variant: 'body1',
    children: 'Interactive text component',
  },
};
