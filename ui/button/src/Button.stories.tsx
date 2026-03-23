import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger'],
      description: 'The color of the button',
    },
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
      description: 'The variant style of the button',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'The size of the button',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button is in loading state',
    },
    isFullWidth: {
      control: 'boolean',
      description: 'Whether the button takes full width',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the icon',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Contained Variant Stories
export const ContainedPrimary: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    children: 'Contained Primary',
  },
};

export const ContainedSecondary: Story = {
  args: {
    color: 'secondary',
    variant: 'contained',
    size: 'medium',
    children: 'Contained Secondary',
  },
};

export const ContainedTertiary: Story = {
  args: {
    color: 'tertiary',
    variant: 'contained',
    size: 'medium',
    children: 'Contained Tertiary',
  },
};

export const ContainedDanger: Story = {
  args: {
    color: 'danger',
    variant: 'contained',
    size: 'medium',
    children: 'Contained Danger',
  },
};

// Outlined Variant Stories
export const OutlinedPrimary: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'medium',
    children: 'Outlined Primary',
  },
};

export const OutlinedSecondary: Story = {
  args: {
    color: 'secondary',
    variant: 'outlined',
    size: 'medium',
    children: 'Outlined Secondary',
  },
};

export const OutlinedTertiary: Story = {
  args: {
    color: 'tertiary',
    variant: 'outlined',
    size: 'medium',
    children: 'Outlined Tertiary',
  },
};

export const OutlinedDanger: Story = {
  args: {
    color: 'danger',
    variant: 'outlined',
    size: 'medium',
    children: 'Outlined Danger',
  },
};

// Text Variant Stories
export const TextPrimary: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'medium',
    children: 'Text Primary',
  },
};

export const TextSecondary: Story = {
  args: {
    color: 'secondary',
    variant: 'text',
    size: 'medium',
    children: 'Text Secondary',
  },
};

export const TextTertiary: Story = {
  args: {
    color: 'tertiary',
    variant: 'text',
    size: 'medium',
    children: 'Text Tertiary',
  },
};

export const TextDanger: Story = {
  args: {
    color: 'danger',
    variant: 'text',
    size: 'medium',
    children: 'Text Danger',
  },
};

// Size Stories - Contained
export const SmallContained: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'small',
    children: 'Small',
  },
};

export const MediumContained: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    children: 'Medium',
  },
};

export const LargeContained: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'large',
    children: 'Large',
  },
};

// Size Stories - Outlined
export const SmallOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'small',
    children: 'Small',
  },
};

export const MediumOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'medium',
    children: 'Medium',
  },
};

export const LargeOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'large',
    children: 'Large',
  },
};

// Size Stories - Text
export const SmallText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'small',
    children: 'Small',
  },
};

export const MediumText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'medium',
    children: 'Medium',
  },
};

export const LargeText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'large',
    children: 'Large',
  },
};

// State Stories
export const Disabled: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    isDisabled: true,
    children: 'Disabled Button',
  },
};

export const Loading: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    isLoading: true,
    children: 'Loading Button',
  },
};

export const DisabledOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'medium',
    isDisabled: true,
    children: 'Disabled Outlined',
  },
};

export const LoadingOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'medium',
    isLoading: true,
    children: 'Loading Outlined',
  },
};

export const DisabledText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'medium',
    isDisabled: true,
    children: 'Disabled Text',
  },
};

export const LoadingText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'medium',
    isLoading: true,
    children: 'Loading Text',
  },
};

// Icon Stories
export const WithIconLeft: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    icon: SearchIcon,
    iconPosition: 'left',
    children: 'Search',
  },
};

export const WithIconRight: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    icon: ArrowIcon,
    iconPosition: 'right',
    children: 'Next',
  },
};

export const WithIconOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'medium',
    icon: CheckIcon,
    iconPosition: 'left',
    children: 'Confirm',
  },
};

export const WithIconText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'medium',
    icon: CloseIcon,
    iconPosition: 'left',
    children: 'Close',
  },
};

// Full Width Stories
export const FullWidth: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    isFullWidth: true,
    children: 'Full Width Button',
  },
};

export const FullWidthOutlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
    size: 'medium',
    isFullWidth: true,
    children: 'Full Width Outlined',
  },
};

export const FullWidthText: Story = {
  args: {
    color: 'primary',
    variant: 'text',
    size: 'medium',
    isFullWidth: true,
    children: 'Full Width Text',
  },
};

// Color Matrix Stories
export const AllColorsContained: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button color="primary" variant="contained" size="medium">
        Primary
      </Button>
      <Button color="secondary" variant="contained" size="medium">
        Secondary
      </Button>
      <Button color="tertiary" variant="contained" size="medium">
        Tertiary
      </Button>
      <Button color="danger" variant="contained" size="medium">
        Danger
      </Button>
    </div>
  ),
};

export const AllColorsOutlined: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button color="primary" variant="outlined" size="medium">
        Primary
      </Button>
      <Button color="secondary" variant="outlined" size="medium">
        Secondary
      </Button>
      <Button color="tertiary" variant="outlined" size="medium">
        Tertiary
      </Button>
      <Button color="danger" variant="outlined" size="medium">
        Danger
      </Button>
    </div>
  ),
};

export const AllColorsText: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button color="primary" variant="text" size="medium">
        Primary
      </Button>
      <Button color="secondary" variant="text" size="medium">
        Secondary
      </Button>
      <Button color="tertiary" variant="text" size="medium">
        Tertiary
      </Button>
      <Button color="danger" variant="text" size="medium">
        Danger
      </Button>
    </div>
  ),
};

// All Variants Showcase
export const AllVariantsShowcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3>Contained</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button color="primary" variant="contained" size="medium">
            Primary
          </Button>
          <Button color="secondary" variant="contained" size="medium">
            Secondary
          </Button>
          <Button color="tertiary" variant="contained" size="medium">
            Tertiary
          </Button>
          <Button color="danger" variant="contained" size="medium">
            Danger
          </Button>
        </div>
      </div>
      <div>
        <h3>Outlined</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button color="primary" variant="outlined" size="medium">
            Primary
          </Button>
          <Button color="secondary" variant="outlined" size="medium">
            Secondary
          </Button>
          <Button color="tertiary" variant="outlined" size="medium">
            Tertiary
          </Button>
          <Button color="danger" variant="outlined" size="medium">
            Danger
          </Button>
        </div>
      </div>
      <div>
        <h3>Text</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button color="primary" variant="text" size="medium">
            Primary
          </Button>
          <Button color="secondary" variant="text" size="medium">
            Secondary
          </Button>
          <Button color="tertiary" variant="text" size="medium">
            Tertiary
          </Button>
          <Button color="danger" variant="text" size="medium">
            Danger
          </Button>
        </div>
      </div>
    </div>
  ),
};

// Accessibility Story
export const Accessibility: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Button color="primary" variant="contained" size="medium">
        Press Tab to navigate
      </Button>
      <Button color="primary" variant="outlined" size="medium">
        Press Enter or Space to activate
      </Button>
      <Button color="primary" variant="text" size="medium" isDisabled>
        Disabled - not focusable
      </Button>
    </div>
  ),
};

// Icon Showcase
export const IconShowcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3>Icon Left</h3>
        <Button color="primary" variant="contained" icon={SearchIcon} iconPosition="left">
          Search
        </Button>
      </div>
      <div>
        <h3>Icon Right</h3>
        <Button color="primary" variant="contained" icon={ArrowIcon} iconPosition="right">
          Next
        </Button>
      </div>
      <div>
        <h3>Icon in Different Variants</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button color="primary" variant="contained" icon={CheckIcon} iconPosition="left">
            Confirm
          </Button>
          <Button color="primary" variant="outlined" icon={CheckIcon} iconPosition="left">
            Confirm
          </Button>
          <Button color="primary" variant="text" icon={CheckIcon} iconPosition="left">
            Confirm
          </Button>
        </div>
      </div>
      <div>
        <h3>Icon with Different Colors</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button color="primary" variant="contained" icon={DeleteIcon} iconPosition="left">
            Delete
          </Button>
          <Button color="secondary" variant="outlined" icon={DeleteIcon} iconPosition="left">
            Delete
          </Button>
          <Button color="danger" variant="contained" icon={DeleteIcon} iconPosition="left">
            Delete
          </Button>
        </div>
      </div>
    </div>
  ),
};

// Interactive Playground
export const Playground: Story = {
  args: {
    color: 'primary',
    variant: 'contained',
    size: 'medium',
    isDisabled: false,
    isLoading: false,
    isFullWidth: false,
    iconPosition: 'left',
    children: 'Interactive Button',
  },
};
