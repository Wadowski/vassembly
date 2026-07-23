import type { Meta, StoryObj } from '@storybook/react';
import type { FC } from 'react';
import * as IconExports from './index';
import type { IconProps } from './types';

type IconComponent = FC<IconProps>;

const iconEntries = (Object.entries(IconExports) as [string, IconComponent][])
  .filter(
    ([name, Icon]) =>
      typeof Icon === 'function' && name !== 'default' && name.endsWith('Icon'),
  )
  .sort(([a], [b]) => a.localeCompare(b));

function AllIconsGallery(): JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
        gap: '1.5rem',
        padding: '1.5rem',
      }}
    >
      {iconEntries.map(([name, Icon]) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
            }}
          >
            <Icon style={{ width: 32, height: 32 }} />
          </div>
          <span
            style={{
              fontSize: 11,
              lineHeight: 1.35,
              wordBreak: 'break-word',
              fontFamily: 'system-ui, sans-serif',
              color: '#ffffff',
            }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'System Design/Icons',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => <AllIconsGallery />,
};
