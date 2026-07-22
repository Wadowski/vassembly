import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@vassembly/ui-system-design/text';
import { Carousel } from './Carousel';

const meta: Meta<typeof Carousel> = {
  title: 'System Design/Carousel',
  component: Carousel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 'min(100%, 360px)' }}>
      <Carousel aria-label="Featured items">
        <div style={{ padding: '1.5rem', background: '#2e2e34', borderRadius: 8 }}>
          <Text variant="h2" as="p">
            Slide one
          </Text>
        </div>
        <div style={{ padding: '1.5rem', background: '#383840', borderRadius: 8 }}>
          <Text variant="h2" as="p">
            Slide two
          </Text>
        </div>
        <div style={{ padding: '1.5rem', background: '#242428', borderRadius: 8 }}>
          <Text variant="h2" as="p">
            Slide three
          </Text>
        </div>
      </Carousel>
    </div>
  ),
};

export const SingleSlide: Story = {
  render: () => (
    <div style={{ width: 'min(100%, 360px)' }}>
      <Carousel aria-label="Single item">
        <Text variant="body1" as="p">
          Only one slide — arrows and dots are hidden or disabled as appropriate.
        </Text>
      </Carousel>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ width: 'min(100%, 360px)' }}>
      <Carousel aria-label="Empty carousel">{null}</Carousel>
    </div>
  ),
};
