import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { TextField } from './TextField';

describe('TextField', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<TextField />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders an input element by default', () => {
      render(<TextField />);
      expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('input');
    });

    it('renders a textarea when isMultiline is true', () => {
      render(<TextField isMultiline />);
      expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('textarea');
    });
  });

  describe('Label', () => {
    it('renders label when provided', () => {
      render(<TextField label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('does not render label element when not provided', () => {
      render(<TextField />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('associates label with input via htmlFor and id', () => {
      render(<TextField label="Email" id="email-field" />);
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email-field');
    });
  });

  describe('Variants', () => {
    it('applies outlined variant class', () => {
      render(<TextField variant="outlined" />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('variantOutlined');
    });

    it('applies filled variant class', () => {
      render(<TextField variant="filled" />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('variantFilled');
    });

    it('defaults to outlined variant', () => {
      render(<TextField />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('variantOutlined');
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      render(<TextField size="small" />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('sizeSmall');
    });

    it('applies medium size class', () => {
      render(<TextField size="medium" />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('sizeMedium');
    });

    it('applies large size class', () => {
      render(<TextField size="large" />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('sizeLarge');
    });

    it('defaults to medium size', () => {
      render(<TextField />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('sizeMedium');
    });
  });

  describe('Helper and Error Text', () => {
    it('renders helper text when provided', () => {
      render(<TextField helperText="Enter your email" />);
      expect(screen.getByText('Enter your email')).toBeInTheDocument();
    });

    it('renders error message when errorMessage is provided', () => {
      render(<TextField errorMessage="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('shows error message instead of helper text when both are provided', () => {
      render(<TextField helperText="Enter your email" errorMessage="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
    });

    it('automatically activates error state when errorMessage is provided', () => {
      render(<TextField errorMessage="Required" />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('stateError');
    });

    it('applies error state class when isError is true', () => {
      render(<TextField isError />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('stateError');
    });

    it('applies success state class when isSuccess is true', () => {
      render(<TextField isSuccess />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('stateSuccess');
    });

    it('associates supporting text with input via aria-describedby', () => {
      render(<TextField helperText="Enter your email" id="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('sets aria-invalid when in error state', () => {
      render(<TextField isError />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid when errorMessage is provided', () => {
      render(<TextField errorMessage="Bad input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Disabled State', () => {
    it('disables the native element', () => {
      render(<TextField isDisabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled class to input wrapper', () => {
      render(<TextField isDisabled />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('isDisabled');
    });
  });

  describe('ReadOnly State', () => {
    it('sets readOnly on the native element', () => {
      render(<TextField isReadOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('applies readOnly class to input wrapper', () => {
      render(<TextField isReadOnly />);
      const inputWrapper = screen.getByRole('textbox').parentElement;
      expect(inputWrapper?.className).toContain('isReadOnly');
    });
  });

  describe('Prefix and Suffix Slots', () => {
    it('renders prefix text', () => {
      render(<TextField prefixText="$" />);
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('renders suffix text', () => {
      render(<TextField suffixText=".com" />);
      expect(screen.getByText('.com')).toBeInTheDocument();
    });

    it('renders leading icon component', () => {
      const Icon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg data-testid="leading-icon" {...props} />
      );
      render(<TextField leadingIcon={Icon} />);
      expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    });

    it('renders trailing icon component', () => {
      const Icon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg data-testid="trailing-icon" {...props} />
      );
      render(<TextField trailingIcon={Icon} />);
      expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
    });

    it('renders leading icon as React node', () => {
      render(<TextField leadingIcon={<span data-testid="node-icon">i</span>} />);
      expect(screen.getByTestId('node-icon')).toBeInTheDocument();
    });

    it('renders trailing icon as React node', () => {
      render(<TextField trailingIcon={<span data-testid="node-trailing">x</span>} />);
      expect(screen.getByTestId('node-trailing')).toBeInTheDocument();
    });
  });

  describe('Multiline', () => {
    it('renders a textarea element', () => {
      render(<TextField isMultiline />);
      expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('textarea');
    });

    it('applies minRows as rows attribute', () => {
      render(<TextField isMultiline minRows={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    it('defaults minRows to 3', () => {
      render(<TextField isMultiline />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
    });
  });

  describe('Full Width', () => {
    it('applies full width class', () => {
      const { container } = render(<TextField isFullWidth />);
      expect((container.firstChild as HTMLElement).className).toContain('isFullWidth');
    });
  });

  describe('HTML Attributes', () => {
    it('passes through standard HTML input attributes', () => {
      render(
        <TextField id="my-input" data-testid="custom-input" placeholder="Type here" />,
      );
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('id', 'my-input');
      expect(input).toHaveAttribute('placeholder', 'Type here');
    });

    it('calls onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<TextField onChange={handleChange} />);
      await user.type(screen.getByRole('textbox'), 'hello');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Custom ClassName', () => {
    it('merges custom className onto the outer wrapper', () => {
      const { container } = render(<TextField className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<TextField ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('forwards ref to the textarea element when isMultiline', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(
        <TextField
          isMultiline
          ref={ref as unknown as React.Ref<HTMLInputElement>}
        />,
      );
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe('Display Name', () => {
    it('has the correct displayName for debugging', () => {
      expect(TextField.displayName).toBe('TextField');
    });
  });
});
