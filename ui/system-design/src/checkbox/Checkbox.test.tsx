import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import styles from './Checkbox.module.scss';

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('renders role="checkbox" when checked is provided', () => {
      render(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('sets aria-checked="false" when checked is false', () => {
      render(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    });

    it('sets aria-checked="mixed" when checked is indeterminate', () => {
      render(<Checkbox checked="indeterminate" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('renders label text when label prop is provided', () => {
      render(<Checkbox checked={false} label="Notifications" />);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('uses label as the accessible name of the checkbox', () => {
      render(<Checkbox checked={false} label="Notifications" />);
      expect(screen.getByRole('checkbox', { name: 'Notifications' })).toBeInTheDocument();
    });
  });

  describe('Supporting text accessibility', () => {
    it('renders description text and wires aria-describedby when description is provided', () => {
      render(<Checkbox checked={false} description="Helpful" />);
      expect(screen.getByText('Helpful')).toBeInTheDocument();

      const describedBy = screen.getByRole('checkbox').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(
        describedBy?.split(' ').every((id) => Boolean(document.getElementById(id))),
      ).toBe(true);
    });

    it('renders errorMessage text and wires aria-describedby when errorMessage is provided', () => {
      render(<Checkbox checked={false} errorMessage="Bad" />);
      expect(screen.getByText('Bad')).toBeInTheDocument();

      const describedBy = screen.getByRole('checkbox').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(
        describedBy?.split(' ').every((id) => Boolean(document.getElementById(id))),
      ).toBe(true);
    });

    it('shows errorMessage instead of description when both are provided', () => {
      render(<Checkbox checked={false} description="Helpful" errorMessage="Bad" />);
      expect(screen.getByText('Bad')).toBeInTheDocument();
      expect(screen.queryByText('Helpful')).not.toBeInTheDocument();
    });

    it('does not set aria-describedby when no description or errorMessage is provided', () => {
      render(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Checked state', () => {
    it('applies isChecked class when checked is true', () => {
      render(<Checkbox checked />);
      expect(screen.getByRole('checkbox').className).toContain(styles.isChecked);
    });

    it('applies isIndeterminate class when checked is indeterminate', () => {
      render(<Checkbox checked="indeterminate" />);
      expect(screen.getByRole('checkbox').className).toContain(styles.isIndeterminate);
    });
  });

  describe('Sizes', () => {
    it('applies correct size modifiers when size is small/medium/large', () => {
      const { rerender } = render(<Checkbox checked={false} size="small" />);
      expect(screen.getByRole('checkbox').className).toContain(styles.sizeSmall);

      rerender(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox').className).toContain(styles.sizeMedium);

      rerender(<Checkbox checked={false} size="large" />);
      expect(screen.getByRole('checkbox').className).toContain(styles.sizeLarge);
    });
  });

  describe('Variant state classes', () => {
    it('applies stateError class when errorMessage is provided', () => {
      render(<Checkbox checked={false} errorMessage="Bad" />);
      expect(screen.getByRole('checkbox').className).toContain(styles.stateError);
    });

    it('applies stateError class when variant is "error"', () => {
      render(<Checkbox checked={false} variant="error" />);
      expect(screen.getByRole('checkbox').className).toContain(styles.stateError);
    });

    it('applies stateSuccess class when variant is "success" and there is no error', () => {
      render(<Checkbox checked={true} variant="success" />);
      expect(screen.getByRole('checkbox').className).toContain(styles.stateSuccess);
    });

    it('prefers errorMessage over success variant (error wins)', () => {
      render(<Checkbox checked={false} variant="success" errorMessage="Bad" />);
      const checkboxEl = screen.getByRole('checkbox');
      expect(checkboxEl.className).toContain(styles.stateError);
      expect(checkboxEl.className).not.toContain(styles.stateSuccess);
      expect(screen.getByText('Bad')).toBeInTheDocument();
    });
  });

  describe('onCheckedChange', () => {
    it('calls onCheckedChange with true when unchecked is clicked', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />);
      await user.click(screen.getByRole('checkbox'));

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('calls onCheckedChange with false when checked is clicked', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<Checkbox checked onCheckedChange={onCheckedChange} />);
      await user.click(screen.getByRole('checkbox'));

      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('calls onCheckedChange with true when indeterminate is clicked', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<Checkbox checked="indeterminate" onCheckedChange={onCheckedChange} />);
      await user.click(screen.getByRole('checkbox'));

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle when isDisabled is true and disables the checkbox', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Checkbox checked={false} isDisabled onCheckedChange={onCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);

      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(checkbox).toBeDisabled();
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveAttribute('disabled');
    });

    it('does not toggle when isReadOnly is true and remains focusable', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<Checkbox checked={false} isReadOnly onCheckedChange={onCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);

      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-required="true" when isRequired is true', () => {
      render(<Checkbox checked={false} isRequired />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required when isRequired is false', () => {
      render(<Checkbox checked={false} isRequired={false} />);
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-required');
    });

    it('wires aria-labelledby when label prop is provided', () => {
      render(<Checkbox checked={false} label="Notifications" />);
      const checkboxEl = screen.getByRole('checkbox');
      const labelledBy = checkboxEl.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      const labelEl = document.getElementById(labelledBy as string);
      expect(labelEl).toBeInTheDocument();
      expect(labelEl).toHaveTextContent('Notifications');
    });

    it('does not set aria-labelledby when label prop is not provided', () => {
      render(<Checkbox checked={false} />);
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('labelPosition', () => {
    it('renders label before the checkbox for left and after for right', () => {
      const { rerender } = render(
        <Checkbox
          checked={false}
          label="Notifications"
          labelPosition="left"
        />,
      );

      const checkboxEl = screen.getByRole('checkbox');
      const labelEl = screen.getByText('Notifications');
      const leftPosition = labelEl.compareDocumentPosition(checkboxEl);
      expect(leftPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      rerender(
        <Checkbox
          checked={false}
          label="Notifications"
          labelPosition="right"
        />,
      );

      const checkboxElRight = screen.getByRole('checkbox');
      const labelElRight = screen.getByText('Notifications');
      const rightPosition = labelElRight.compareDocumentPosition(checkboxElRight);
      expect(rightPosition & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });
  });

  describe('displayName', () => {
    it('Checkbox.displayName equals "Checkbox"', () => {
      expect(Checkbox.displayName).toBe('Checkbox');
    });
  });
});

