import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tabs } from './Tabs';

const items = [
  { label: 'Tab A', value: 'a' },
  { label: 'Tab B', value: 'b', isDisabled: true },
  { label: 'Tab C', value: 'c' },
];

describe('Tabs', () => {
  it('renders role="tablist" and role="tab" buttons', () => {
    render(<Tabs items={items} activeTab="a" onChange={vi.fn()} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab A' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab B' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab C' })).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected="true" and others false', () => {
    render(<Tabs items={items} activeTab="a" onChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Tab C' })).toHaveAttribute('aria-selected', 'false');
  });

  it('applies disabled semantics for disabled tabs', () => {
    render(<Tabs items={items} activeTab="a" onChange={vi.fn()} />);

    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    expect(tabB).toBeDisabled();
    expect(tabB).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onChange when clicking an enabled tab', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={items} activeTab="a" onChange={handleChange} />);

    await user.click(screen.getByRole('tab', { name: 'Tab C' }));
    expect(handleChange).toHaveBeenCalledWith('c');
  });

  it('does not call onChange when clicking a disabled tab', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={items} activeTab="a" onChange={handleChange} />);

    await user.click(screen.getByRole('tab', { name: 'Tab B' }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('skips disabled tabs when moving with ArrowRight', async () => {
    const ControlledTabs = (): JSX.Element => {
      const [activeTab, setActiveTab] = useState<string>('a');
      return <Tabs items={items} activeTab={activeTab} onChange={setActiveTab} />;
    };

    const user = userEvent.setup();
    render(<ControlledTabs />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    const tabC = screen.getByRole('tab', { name: 'Tab C' });

    tabA.focus();
    expect(tabA).toHaveFocus();

    await act(async () => {
      await user.keyboard('{ArrowRight}');
    });

    expect(tabC).toHaveAttribute('aria-selected', 'true');
    expect(tabC).toHaveFocus();
  });

  it('moves selection with Home and End keys', async () => {
    const ControlledTabs = (): JSX.Element => {
      const [activeTab, setActiveTab] = useState<string>('c');
      return <Tabs items={items} activeTab={activeTab} onChange={setActiveTab} />;
    };

    const user = userEvent.setup();
    render(<ControlledTabs />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    const tabC = screen.getByRole('tab', { name: 'Tab C' });

    tabC.focus();
    expect(tabC).toHaveFocus();

    await act(async () => {
      await user.keyboard('{Home}');
    });

    expect(tabA).toHaveAttribute('aria-selected', 'true');
    expect(tabA).toHaveFocus();

    await act(async () => {
      await user.keyboard('{End}');
    });

    expect(tabC).toHaveAttribute('aria-selected', 'true');
    expect(tabC).toHaveFocus();
  });
});

