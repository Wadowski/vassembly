import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Dropdown } from './Dropdown';

const options = [
  { value: 'x', label: 'First' },
  { value: 'y', label: 'Second' },
  { value: 'z', label: 'Third' },
];

describe('Dropdown', () => {
  it('renders combobox trigger', () => {
    render(<Dropdown options={options} placeholder="Pick one" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Dropdown options={options} label="Category" />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('opens listbox on click and shows options', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={options} placeholder="Pick" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Second' })).toBeInTheDocument();
  });

  it('calls onValueChange when an option is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Dropdown options={options} placeholder="Pick" onValueChange={handleChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Second' }));
    expect(handleChange).toHaveBeenCalledWith('y');
  });

  it('shows selected option label when value is set', () => {
    render(<Dropdown options={options} value="z" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Third');
  });

  it('closes listbox on Escape', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects highlighted option with Enter when open', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Dropdown options={options} onValueChange={handleChange} />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(handleChange).toHaveBeenCalledWith('y');
  });

  it('has the correct displayName for debugging', () => {
    expect(Dropdown.displayName).toBe('Dropdown');
  });
});
