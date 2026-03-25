import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RadioButtonGroup } from './RadioButtonGroup';
import groupStyles from './RadioButtonGroup.module.scss';
import radioStyles from './RadioButton.module.scss';

const defaultOptions = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('RadioButtonGroup', () => {
  describe('Rendering', () => {
    it('renders role="radiogroup"', () => {
      render(
        <RadioButtonGroup value="a" onChange={vi.fn()} options={defaultOptions} />,
      );
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('renders all options as radios', () => {
      render(
        <RadioButtonGroup value="a" onChange={vi.fn()} options={defaultOptions} />,
      );
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
      expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Beta' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Gamma' })).toBeInTheDocument();
    });

    it('renders group label when label prop is provided', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          label="Choose one"
        />,
      );
      expect(screen.getByText('Choose one')).toBeInTheDocument();
    });
  });

  describe('Supporting text accessibility', () => {
    it('wires group description to aria-describedby on radiogroup', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          description="Helper below group"
        />,
      );
      expect(screen.getByText('Helper below group')).toBeInTheDocument();
      const describedBy = screen.getByRole('radiogroup').getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const ids = describedBy?.split(' ').filter(Boolean) ?? [];
      expect(ids.every((id) => document.getElementById(id) !== null)).toBe(true);
    });

    it('shows errorMessage instead of description when both are provided', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          description="Helper"
          errorMessage="Invalid"
        />,
      );
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('does not set aria-describedby when no description or errorMessage', () => {
      render(
        <RadioButtonGroup value="a" onChange={vi.fn()} options={defaultOptions} />,
      );
      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Selection behavior', () => {
    it('marks only the selected option as aria-checked true', () => {
      render(
        <RadioButtonGroup value="b" onChange={vi.fn()} options={defaultOptions} />,
      );
      expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
      expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByRole('radio', { name: 'Gamma' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('calls onChange with correct value when an unselected option is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup value="a" onChange={onChange} options={defaultOptions} />,
      );
      await user.click(screen.getByRole('radio', { name: 'Beta' }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('b');
    });

    it('does not call onChange when the already-selected option is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup value="a" onChange={onChange} options={defaultOptions} />,
      );
      await user.click(screen.getByRole('radio', { name: 'Alpha' }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard navigation', () => {
    it('ArrowDown focuses and selects the next option in vertical layout', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="a"
          onChange={onChange}
          options={defaultOptions}
          direction="vertical"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      await user.keyboard('{ArrowDown}');
      expect(onChange).toHaveBeenCalledWith('b');
      expect(radios[1]).toHaveFocus();
    });

    it('ArrowRight focuses and selects the next option in horizontal layout', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="a"
          onChange={onChange}
          options={defaultOptions}
          direction="horizontal"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('b');
      expect(radios[1]).toHaveFocus();
    });

    it('ArrowUp focuses and selects the previous option in vertical layout', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="b"
          onChange={onChange}
          options={defaultOptions}
          direction="vertical"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[1].focus();
      await user.keyboard('{ArrowUp}');
      expect(onChange).toHaveBeenCalledWith('a');
      expect(radios[0]).toHaveFocus();
    });

    it('ArrowLeft focuses and selects the previous option in horizontal layout', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="b"
          onChange={onChange}
          options={defaultOptions}
          direction="horizontal"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[1].focus();
      await user.keyboard('{ArrowLeft}');
      expect(onChange).toHaveBeenCalledWith('a');
      expect(radios[0]).toHaveFocus();
    });

    it('wraps forward from last to first', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="c"
          onChange={onChange}
          options={defaultOptions}
          direction="vertical"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[2].focus();
      await user.keyboard('{ArrowDown}');
      expect(onChange).toHaveBeenCalledWith('a');
      expect(radios[0]).toHaveFocus();
    });

    it('wraps backward from first to last', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="a"
          onChange={onChange}
          options={defaultOptions}
          direction="vertical"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      await user.keyboard('{ArrowUp}');
      expect(onChange).toHaveBeenCalledWith('c');
      expect(radios[2]).toHaveFocus();
    });

    it('skips disabled options when moving focus', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', isDisabled: true },
        { value: 'c', label: 'C' },
      ];
      render(
        <RadioButtonGroup value="a" onChange={onChange} options={options} direction="vertical" />,
      );
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      await user.keyboard('{ArrowDown}');
      expect(onChange).toHaveBeenCalledWith('c');
      expect(radios[2]).toHaveFocus();
    });
  });

  describe('isDisabled and isReadOnly', () => {
    it('disables all radios when isDisabled is true', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          isDisabled
        />,
      );
      screen.getAllByRole('radio').forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });

    it('disables a specific option when option.isDisabled is true', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', isDisabled: true },
      ];
      render(<RadioButtonGroup value="a" onChange={vi.fn()} options={options} />);
      expect(screen.getByRole('radio', { name: 'A' })).not.toBeDisabled();
      expect(screen.getByRole('radio', { name: 'B' })).toBeDisabled();
    });

    it('does not call onChange on click when isReadOnly is true', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="a"
          onChange={onChange}
          options={defaultOptions}
          isReadOnly
        />,
      );
      await user.click(screen.getByRole('radio', { name: 'Beta' }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps radios focusable when isReadOnly is true', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          isReadOnly
        />,
      );
      const radio = screen.getByRole('radio', { name: 'Beta' });
      expect(radio).not.toBeDisabled();
    });

    it('does not call onChange on arrow keys when isReadOnly is true', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <RadioButtonGroup
          value="a"
          onChange={onChange}
          options={defaultOptions}
          isReadOnly
          direction="vertical"
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      await user.keyboard('{ArrowDown}');
      expect(onChange).not.toHaveBeenCalled();
      expect(radios[1]).toHaveFocus();
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-labelledby on radiogroup when label is provided', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          label="Pick"
        />,
      );
      const labelledBy = screen.getByRole('radiogroup').getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      const el = document.getElementById(labelledBy as string);
      expect(el).toHaveTextContent('Pick');
    });

    it('does not set aria-labelledby when label is omitted', () => {
      render(
        <RadioButtonGroup value="a" onChange={vi.fn()} options={defaultOptions} />,
      );
      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-labelledby');
    });

    it('sets aria-required on radiogroup when isRequired is true', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          isRequired
        />,
      );
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    });

    it('sets aria-required only on the first radio when isRequired is true', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          isRequired
        />,
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('aria-required', 'true');
      expect(radios[1]).not.toHaveAttribute('aria-required');
      expect(radios[2]).not.toHaveAttribute('aria-required');
    });
  });

  describe('Direction layout', () => {
    it('applies horizontal class when direction is horizontal', () => {
      const { container } = render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          label="L"
          direction="horizontal"
        />,
      );
      const list = container.getElementsByClassName(groupStyles.optionsList)[0];
      expect(list.className).toContain(groupStyles.horizontal);
    });

    it('applies vertical class when direction is vertical', () => {
      const { container } = render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          label="L"
          direction="vertical"
        />,
      );
      const list = container.getElementsByClassName(groupStyles.optionsList)[0];
      expect(list.className).toContain(groupStyles.vertical);
    });
  });

  describe('Error styling', () => {
    it('applies error styling to radios when errorMessage is set', () => {
      render(
        <RadioButtonGroup
          value="a"
          onChange={vi.fn()}
          options={defaultOptions}
          errorMessage="Required"
        />,
      );
      screen.getAllByRole('radio').forEach((radio) => {
        expect(radio.className).toContain(radioStyles.stateError);
      });
    });
  });

  describe('displayName', () => {
    it('RadioButtonGroup.displayName equals "RadioButtonGroup"', () => {
      expect(RadioButtonGroup.displayName).toBe('RadioButtonGroup');
    });
  });
});
