import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  describe('Rendering', () => {
    it('renders with default props (renders a button with role="switch")', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders with aria-checked="false" by default', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it('renders label when label prop is provided', () => {
      render(<Switch label="Notifications" />);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('uses label as the accessible name of the switch', () => {
      render(<Switch label="Notifications" />);
      expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument();
    });
  });

  describe('Checked state', () => {
    it('sets aria-checked="true" when isChecked is true', () => {
      render(<Switch isChecked />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('sets aria-checked="false" when isChecked is false', () => {
      render(<Switch isChecked={false} />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it('applies isChecked CSS class to track when isChecked is true', () => {
      render(<Switch isChecked />);
      expect(screen.getByRole('switch').className).toContain('isChecked');
    });

    it('does not apply isChecked CSS class when isChecked is false', () => {
      render(<Switch isChecked={false} />);
      expect(screen.getByRole('switch').className).not.toContain('isChecked');
    });
  });

  describe('onChange', () => {
    it('calls onChange with true when unchecked switch is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch isChecked={false} onChange={onChange} />);
      await user.click(screen.getByRole('switch'));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when checked switch is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch isChecked onChange={onChange} />);
      await user.click(screen.getByRole('switch'));
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('does not call onChange when isDisabled is true', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch isDisabled onChange={onChange} />);
      await user.click(screen.getByRole('switch'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when isReadOnly is true', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch isReadOnly onChange={onChange} />);
      await user.click(screen.getByRole('switch'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when isLoading is true', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Switch isLoading onChange={onChange} />);
      await user.click(screen.getByRole('switch'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Sizes', () => {
    it('applies sizeSmall class when size is small', () => {
      render(<Switch size="small" />);
      expect(screen.getByRole('switch').className).toContain('sizeSmall');
    });

    it('applies sizeMedium class when size is medium', () => {
      render(<Switch size="medium" />);
      expect(screen.getByRole('switch').className).toContain('sizeMedium');
    });

    it('applies sizeLarge class when size is large', () => {
      render(<Switch size="large" />);
      expect(screen.getByRole('switch').className).toContain('sizeLarge');
    });

    it('defaults to sizeMedium when no size is provided', () => {
      render(<Switch />);
      expect(screen.getByRole('switch').className).toContain('sizeMedium');
    });
  });

  describe('Disabled', () => {
    it('button element has disabled attribute when isDisabled is true', () => {
      render(<Switch isDisabled />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('applies isDisabled class to wrapper when isDisabled is true', () => {
      const { container } = render(<Switch isDisabled />);
      expect((container.firstChild as HTMLElement).className).toContain('isDisabled');
    });
  });

  describe('Loading', () => {
    it('button element has disabled attribute when isLoading is true', () => {
      render(<Switch isLoading />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('applies isLoading class when isLoading is true', () => {
      render(<Switch isLoading />);
      expect(screen.getByRole('switch').className).toContain('isLoading');
    });
  });

  describe('Read-only', () => {
    it('applies isReadOnly class to wrapper when isReadOnly is true', () => {
      const { container } = render(<Switch isReadOnly />);
      expect((container.firstChild as HTMLElement).className).toContain('isReadOnly');
    });

    it('button does NOT have disabled attribute when isReadOnly is true (must remain focusable)', () => {
      render(<Switch isReadOnly />);
      expect(screen.getByRole('switch')).not.toBeDisabled();
    });
  });

  describe('Error state', () => {
    it('applies stateError class to track when isError is true', () => {
      render(<Switch isError />);
      expect(screen.getByRole('switch').className).toContain('stateError');
    });

    it('applies stateError class to track when errorMessage is provided', () => {
      render(<Switch errorMessage="Something went wrong" />);
      expect(screen.getByRole('switch').className).toContain('stateError');
    });

    it('renders errorMessage text when provided', () => {
      render(<Switch errorMessage="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders helperText when provided', () => {
      render(<Switch helperText="Helpful" />);
      expect(screen.getByText('Helpful')).toBeInTheDocument();
    });

    it('prefers errorMessage over helperText when both are provided', () => {
      render(<Switch helperText="Helpful" errorMessage="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('Helpful')).not.toBeInTheDocument();
    });
  });

  describe('Supporting text accessibility', () => {
    it('sets aria-describedby on button when helperText is provided', () => {
      render(<Switch helperText="Helpful" />);
      const describedBy = screen.getByRole('switch').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy?.split(' ').every((id) => Boolean(document.getElementById(id)))).toBe(
        true,
      );
    });

    it('sets aria-describedby on button when errorMessage is provided', () => {
      render(<Switch errorMessage="Something went wrong" />);
      const describedBy = screen.getByRole('switch').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy?.split(' ').every((id) => Boolean(document.getElementById(id)))).toBe(
        true,
      );
    });
  });

  describe('displayName', () => {
    it('Switch.displayName equals "Switch"', () => {
      expect(Switch.displayName).toBe('Switch');
    });
  });
});
