import React, { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MultiSelect } from './MultiSelect';

const options = [
  { value: 'a', label: 'Label1' },
  { value: 'b', label: 'Label2' },
  { value: 'c', label: 'Label3' },
];

const manyOptions = [
  { value: '1', label: 'One' },
  { value: '2', label: 'Two' },
  { value: '3', label: 'Three' },
  { value: '4', label: 'Four' },
  { value: '5', label: 'Five' },
  { value: '6', label: 'Six' },
];

describe('MultiSelect', () => {
  describe('Rendering', () => {
    it('renders combobox trigger', () => {
      render(<MultiSelect options={options} placeholder="Pick" />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows placeholder when nothing selected', () => {
      render(<MultiSelect options={options} placeholder="Pick items" />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Pick items');
    });

    it('forwards ref to wrapper element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<MultiSelect ref={ref} options={options} placeholder="Pick" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Menu interaction', () => {
    it('opens listbox on click', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} placeholder="Pick" />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows all options in listbox', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} placeholder="Pick" />);
      await user.click(screen.getByRole('combobox'));
      const list = screen.getByRole('listbox');
      expect(within(list).getByRole('option', { name: 'Label1' })).toBeInTheDocument();
      expect(within(list).getByRole('option', { name: 'Label2' })).toBeInTheDocument();
      expect(within(list).getByRole('option', { name: 'Label3' })).toBeInTheDocument();
    });

    it('clicking an option toggles it and keeps listbox open', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<MultiSelect options={options} placeholder="Pick" onValuesChange={handleChange} />);
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Label2' }));
      expect(handleChange).toHaveBeenCalledWith(['b']);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('clicking a selected option deselects it', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <MultiSelect
          options={options}
          placeholder="Pick"
          values={['b']}
          onValuesChange={handleChange}
        />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Label2' }));
      expect(handleChange).toHaveBeenCalledWith([]);
    });

    it('closes listbox on Escape', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes listbox when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button type="button">Outside</button>
          <MultiSelect options={options} placeholder="Pick" />
        </div>,
      );
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Outside' }));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes listbox on Tab', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} placeholder="Pick" />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.keyboard('{Tab}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Trigger label', () => {
    it('shows Label1, Label2 when two items are selected', () => {
      render(<MultiSelect options={options} values={['a', 'b']} placeholder="Pick" />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Label1, Label2');
    });

    it('shows 3 selected when three items are selected with default maxDisplayLabels', () => {
      render(<MultiSelect options={options} values={['a', 'b', 'c']} placeholder="Pick" />);
      expect(screen.getByRole('combobox')).toHaveTextContent('3 selected');
    });

    it('shows N selected for many options when selection exceeds maxDisplayLabels', () => {
      render(
        <MultiSelect
          options={manyOptions}
          values={['1', '2', '3']}
          placeholder="Pick"
        />,
      );
      expect(screen.getByRole('combobox')).toHaveTextContent('3 selected');
    });
  });

  describe('Keyboard', () => {
    it('moves highlight with ArrowDown and ArrowUp', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} placeholder="Pick" />);
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-activedescendant', expect.stringMatching(/option-0$/));
      await user.keyboard('{ArrowDown}');
      expect(combobox).toHaveAttribute('aria-activedescendant', expect.stringMatching(/option-1$/));
      await user.keyboard('{ArrowUp}');
      expect(combobox).toHaveAttribute('aria-activedescendant', expect.stringMatching(/option-0$/));
    });

    it('toggles highlighted option with Enter', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<MultiSelect options={options} placeholder="Pick" onValuesChange={handleChange} />);
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith(['a']);
    });

    it('toggles highlighted option with Space', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<MultiSelect options={options} placeholder="Pick" onValuesChange={handleChange} />);
      await user.click(screen.getByRole('combobox'));
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(['a']);
    });

    it('moves highlight to first option with Home', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<MultiSelect options={options} placeholder="Pick" onValuesChange={handleChange} />);
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('{ArrowDown}{ArrowDown}');
      await user.keyboard('{Home}');
      expect(combobox).toHaveAttribute('aria-activedescendant', expect.stringMatching(/option-0$/));
      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith(['a']);
    });

    it('moves highlight to last option with End', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<MultiSelect options={options} placeholder="Pick" onValuesChange={handleChange} />);
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('{End}');
      expect(combobox).toHaveAttribute('aria-activedescendant', expect.stringMatching(/option-2$/));
      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith(['c']);
    });
  });

  describe('Select all', () => {
    it('renders Select all option when hasSelectAll is true', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} hasSelectAll placeholder="Pick" />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /select all/i })).toBeInTheDocument();
    });

    it('selects all options when Select all is activated', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <MultiSelect
          options={options}
          hasSelectAll
          placeholder="Pick"
          onValuesChange={handleChange}
        />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: /select all/i }));
      expect(handleChange).toHaveBeenCalledWith(['a', 'b', 'c']);
    });

    it('deselects all enabled options when all are selected and Select all is activated', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <MultiSelect
          options={options}
          hasSelectAll
          placeholder="Pick"
          values={['a', 'b', 'c']}
          onValuesChange={handleChange}
        />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: /select all/i }));
      expect(handleChange).toHaveBeenCalledWith([]);
    });

    it('shows indeterminate state on Select all when some options are selected', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelect options={options} hasSelectAll values={['a']} placeholder="Pick" />,
      );
      await user.click(screen.getByRole('combobox'));
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'mixed');
    });
  });

  describe('Disabled', () => {
    it('disables the trigger when isDisabled is true', () => {
      render(<MultiSelect options={options} isDisabled placeholder="Pick" />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('does not select a disabled option when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const withDisabled = [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta', isDisabled: true },
      ];
      render(
        <MultiSelect options={withDisabled} placeholder="Pick" onValuesChange={handleChange} />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Beta' }));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not toggle a disabled option with the keyboard', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const withDisabled = [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta', isDisabled: true },
      ];
      render(
        <MultiSelect options={withDisabled} placeholder="Pick" onValuesChange={handleChange} />,
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}{Enter}');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-multiselectable on listbox', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} placeholder="Pick" />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('sets aria-multiselectable on combobox', () => {
      render(<MultiSelect options={options} placeholder="Pick" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('sets aria-selected on options', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} values={['b']} placeholder="Pick" />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: 'Label1' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByRole('option', { name: 'Label2' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('reflects aria-expanded on combobox', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={options} placeholder="Pick" />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('displayName', () => {
    it('MultiSelect.displayName equals MultiSelect', () => {
      expect(MultiSelect.displayName).toBe('MultiSelect');
    });
  });
});
