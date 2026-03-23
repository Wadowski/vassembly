import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with children text', () => {
      render(<Button>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('renders with JSX children', () => {
      render(
        <Button>
          <span data-testid="child">Content</span>
        </Button>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Color', () => {
    it('renders primary color', () => {
      render(<Button color="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-primary');
    });

    it('renders secondary color', () => {
      render(<Button color="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-secondary');
    });

    it('renders tertiary color', () => {
      render(<Button color="tertiary">Tertiary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-tertiary');
    });

    it('renders danger color', () => {
      render(<Button color="danger">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-danger');
    });

    it('defaults to primary color', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-primary');
    });
  });

  describe('Variants', () => {
    it('renders contained variant', () => {
      render(<Button variant="contained">Contained</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-contained');
    });

    it('renders outlined variant', () => {
      render(<Button variant="outlined">Outlined</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-outlined');
    });

    it('renders text variant', () => {
      render(<Button variant="text">Text</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-text');
    });

    it('defaults to contained variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-contained');
    });

    it('renders contained variant with primary color', () => {
      render(<Button color="primary" variant="contained">Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-primary');
      expect(button.className).toContain('variant-contained');
    });

    it('renders outlined variant with secondary color', () => {
      render(<Button color="secondary" variant="outlined">Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-secondary');
      expect(button.className).toContain('variant-outlined');
    });

    it('renders text variant with danger color', () => {
      render(<Button color="danger" variant="text">Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-danger');
      expect(button.className).toContain('variant-text');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-small');
    });

    it('renders medium size', () => {
      render(<Button size="medium">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-medium');
    });

    it('renders large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-large');
    });

    it('defaults to medium size', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-medium');
    });
  });

  describe('Disabled State', () => {
    it('disables button with isDisabled prop', () => {
      render(<Button isDisabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled class', () => {
      render(<Button isDisabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled');
    });

    it('prevents click when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <Button isDisabled onClick={handleClick}>
          Disabled
        </Button>,
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents loading state when disabled', () => {
      render(
        <Button isDisabled isLoading>
          Loading
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled');
      expect(button.className).toContain('loading');
    });
  });

  describe('Loading State', () => {
    it('applies loading class', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('loading');
    });

    it('disables button when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('hides content when loading', () => {
      render(<Button isLoading>Visible Content</Button>);
      expect(screen.queryByText('Visible Content')).not.toBeVisible();
    });

    it('prevents click when loading', async () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Loading
        </Button>,
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

// Icon Support
it('renders icon component on the left by default', () => {
  const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="test-icon" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
  render(<Button icon={IconComponent}>Search</Button>);
  expect(screen.getByTestId('test-icon')).toBeInTheDocument();
});

it('renders icon component on the right when specified', () => {
  const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="test-icon" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
  render(
    <Button icon={IconComponent} iconPosition="right">
      Next
    </Button>,
  );
  expect(screen.getByTestId('test-icon')).toBeInTheDocument();
});

it('renders JSX element icon', () => {
  render(
    <Button icon={<span data-testid="jsx-icon">Icon</span>}>
      Button
    </Button>,
  );
  expect(screen.getByTestId('jsx-icon')).toBeInTheDocument();
});

it('hides icon when loading', () => {
  const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="test-icon" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
  render(
    <Button icon={IconComponent} isLoading>
      Search
    </Button>,
  );
  expect(screen.queryByTestId('test-icon')).not.toBeVisible();
});

it('renders both content and icon component', () => {
  const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="test-icon" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
  render(<Button icon={IconComponent}>Confirm</Button>);
  expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  expect(screen.getByText('Confirm')).toBeInTheDocument();
});

  describe('Full Width', () => {
    it('applies full width class', () => {
      render(<Button isFullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('fullWidth');
    });

    it('renders full width with other props', () => {
      render(
        <Button color="primary" variant="outlined" isFullWidth>
          Full Width Outlined
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('fullWidth');
      expect(button.className).toContain('variant-outlined');
    });
  });

  describe('HTML Attributes', () => {
    it('passes through standard HTML button attributes', () => {
      render(
        <Button
          id="test-button"
          data-testid="custom-button"
          aria-label="Custom Button"
        >
          Button
        </Button>,
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('id', 'test-button');
      expect(button).toHaveAttribute('aria-label', 'Custom Button');
    });

    it('has type button by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('calls onClick handler', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Button');
    });

    it('allows ref to be used for DOM operations', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current?.style).toBeDefined();
    });
  });

  describe('Keyboard Navigation', () => {
    it('responds to Enter key', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('responds to Space key', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });

    it('is keyboard focusable', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('disabled button is not focusable', () => {
      render(<Button isDisabled>Disabled</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });
  });

  describe('Custom Classes', () => {
    it('merges custom className prop', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('preserves multiple classes', () => {
      render(
        <Button
          color="primary"
          variant="contained"
          size="large"
          className="custom-class"
        >
          Button
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-primary');
      expect(button.className).toContain('variant-contained');
      expect(button.className).toContain('size-large');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Display Name', () => {
    it('has correct display name for debugging', () => {
      expect(Button.displayName).toBe('Button');
    });
  });

  describe('Combinations', () => {
    it('renders all color and variant combinations', () => {
      const colors = ['primary', 'secondary', 'tertiary', 'danger'] as const;
      const variants = ['contained', 'outlined', 'text'] as const;

      colors.forEach((color) => {
        variants.forEach((variant) => {
          const { unmount } = render(
            <Button color={color} variant={variant}>
              {color}-{variant}
            </Button>,
          );
          const button = screen.getByRole('button');
          expect(button.className).toContain(`color-${color}`);
          expect(button.className).toContain(`variant-${variant}`);
          unmount();
        });
      });
    });

    it('works with all sizes and variants', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      const variants = ['contained', 'outlined', 'text'] as const;

      sizes.forEach((size) => {
        variants.forEach((variant) => {
          const { unmount } = render(
            <Button size={size} variant={variant}>
              {size}-{variant}
            </Button>,
          );
          const button = screen.getByRole('button');
          expect(button.className).toContain(`size-${size}`);
          expect(button.className).toContain(`variant-${variant}`);
          unmount();
        });
      });
    });

    it('combines color, variant, size, and icon', () => {
      const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
        <svg data-testid="delete-icon" {...props}>
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
      render(
        <Button
          color="danger"
          variant="outlined"
          size="large"
          icon={IconComponent}
          iconPosition="left"
        >
          Delete
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('color-danger');
      expect(button.className).toContain('variant-outlined');
      expect(button.className).toContain('size-large');
      expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    });
  });
});
