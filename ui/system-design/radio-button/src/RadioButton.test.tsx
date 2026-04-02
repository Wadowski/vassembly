import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RadioButton } from './RadioButton';
import styles from './RadioButton.module.scss';

describe('RadioButton', () => {
  describe('Rendering', () => {
    it('renders role="radio"', () => {
      render(<RadioButton checked={false} />);
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('sets aria-checked="false" when checked is false', () => {
      render(<RadioButton checked={false} />);
      expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false');
    });

    it('sets aria-checked="true" when checked is true', () => {
      render(<RadioButton checked />);
      expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
    });

    it('renders label text when label prop is provided', () => {
      render(<RadioButton checked={false} label="Option A" />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });

    it('wires aria-labelledby and uses it as the accessible name', () => {
      render(<RadioButton checked={false} label="Option A" />);
      const radioEl = screen.getByRole('radio');

      const labelledBy = radioEl.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();

      const labelEl = document.getElementById(labelledBy as string);
      expect(labelEl).toBeInTheDocument();
      expect(labelEl).toHaveTextContent('Option A');

      expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument();
    });
  });

  describe('Supporting text accessibility', () => {
    it('wires description to aria-describedby when description is provided', () => {
      render(<RadioButton checked={false} description="Helpful" />);
      expect(screen.getByText('Helpful')).toBeInTheDocument();

      const describedBy = screen.getByRole('radio').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(
        describedBy?.split(' ').every((id) => Boolean(document.getElementById(id))),
      ).toBe(true);
    });

    it('wires errorMessage to aria-describedby when errorMessage is provided', () => {
      render(<RadioButton checked={false} errorMessage="Bad" />);
      expect(screen.getByText('Bad')).toBeInTheDocument();

      const describedBy = screen.getByRole('radio').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(
        describedBy?.split(' ').every((id) => Boolean(document.getElementById(id))),
      ).toBe(true);
    });

    it('shows errorMessage instead of description when both are provided', () => {
      render(<RadioButton checked={false} description="Helpful" errorMessage="Bad" />);
      expect(screen.getByText('Bad')).toBeInTheDocument();
      expect(screen.queryByText('Helpful')).not.toBeInTheDocument();
    });

    it('does not set aria-describedby when no description or errorMessage is provided', () => {
      render(<RadioButton checked={false} />);
      expect(screen.getByRole('radio')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Checked state', () => {
    it('applies isChecked class when checked is true', () => {
      render(<RadioButton checked />);
      expect(screen.getByRole('radio').className).toContain(styles.isChecked);
    });

    it('does not apply isChecked class when checked is false', () => {
      render(<RadioButton checked={false} />);
      expect(screen.getByRole('radio').className).not.toContain(styles.isChecked);
    });
  });

  describe('Sizes', () => {
    it('applies correct size modifiers when size is small/medium/large', () => {
      const { rerender } = render(<RadioButton checked={false} size="small" />);
      expect(screen.getByRole('radio').className).toContain(styles.sizeSmall);

      rerender(<RadioButton checked={false} />);
      expect(screen.getByRole('radio').className).toContain(styles.sizeMedium);

      rerender(<RadioButton checked={false} size="large" />);
      expect(screen.getByRole('radio').className).toContain(styles.sizeLarge);
    });
  });

  describe('Variant state classes', () => {
    it('applies stateError class when errorMessage is provided', () => {
      render(<RadioButton checked={false} errorMessage="Bad" />);
      expect(screen.getByRole('radio').className).toContain(styles.stateError);
    });

    it('applies stateError class when variant is "error"', () => {
      render(<RadioButton checked={false} variant="error" />);
      expect(screen.getByRole('radio').className).toContain(styles.stateError);
    });

    it('applies stateSuccess class when variant is "success" and there is no error', () => {
      render(<RadioButton checked={true} variant="success" />);
      expect(screen.getByRole('radio').className).toContain(styles.stateSuccess);
    });

    it('prefers errorMessage over success variant (error wins)', () => {
      render(<RadioButton checked={false} variant="success" errorMessage="Bad" />);
      const radioEl = screen.getByRole('radio');
      expect(radioEl.className).toContain(styles.stateError);
      expect(radioEl.className).not.toContain(styles.stateSuccess);
      expect(screen.getByText('Bad')).toBeInTheDocument();
    });
  });

  describe('onCheckedChange', () => {
    it('calls onCheckedChange with true when unchecked is clicked', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<RadioButton checked={false} onCheckedChange={onCheckedChange} />);
      await user.click(screen.getByRole('radio'));

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('calls onCheckedChange with false when checked is clicked', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<RadioButton checked onCheckedChange={onCheckedChange} />);
      await user.click(screen.getByRole('radio'));

      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('does not toggle when isDisabled is true and disables the radio', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<RadioButton checked={false} isDisabled onCheckedChange={onCheckedChange} />);
      const radioEl = screen.getByRole('radio');

      await user.click(radioEl);

      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(radioEl).toBeDisabled();
    });

    it('does not toggle when isReadOnly is true and remains focusable', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(<RadioButton checked={false} isReadOnly onCheckedChange={onCheckedChange} />);
      const radioEl = screen.getByRole('radio');

      await user.click(radioEl);

      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(radioEl).not.toBeDisabled();
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-required="true" when isRequired is true', () => {
      render(<RadioButton checked={false} isRequired />);
      expect(screen.getByRole('radio')).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required when isRequired is false', () => {
      render(<RadioButton checked={false} isRequired={false} />);
      expect(screen.getByRole('radio')).not.toHaveAttribute('aria-required');
    });
  });

  describe('labelPosition', () => {
    it('renders label before the radio for left and after for right', () => {
      const { rerender } = render(
        <RadioButton checked={false} label="Notifications" labelPosition="left" />,
      );

      const radioElLeft = screen.getByRole('radio');
      const labelEl = screen.getByText('Notifications');
      const leftPosition = labelEl.compareDocumentPosition(radioElLeft);
      expect(leftPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      rerender(<RadioButton checked={false} label="Notifications" labelPosition="right" />);

      const radioElRight = screen.getByRole('radio');
      const labelElRight = screen.getByText('Notifications');
      const rightPosition = labelElRight.compareDocumentPosition(radioElRight);
      expect(rightPosition & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });
  });

  describe('displayName', () => {
    it('RadioButton.displayName equals "RadioButton"', () => {
      expect(RadioButton.displayName).toBe('RadioButton');
    });
  });
});

