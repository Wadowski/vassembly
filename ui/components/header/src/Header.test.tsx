import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Header } from './Header';

describe('Header', () => {
  it('renders banner with logo and menu control', () => {
    render(
      <Header logo={<span>Brand</span>} onMenuPress={vi.fn()} menuAriaLabel="Site menu" />,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Site menu' })).toBeInTheDocument();
  });

  it('invokes onMenuPress when menu control is activated', async () => {
    const user = userEvent.setup();
    const onMenuPress = vi.fn();

    render(<Header logo={<span>L</span>} onMenuPress={onMenuPress} />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    expect(onMenuPress).toHaveBeenCalledTimes(1);
  });

  it('reflects aria-expanded from isMenuOpen', () => {
    const { rerender } = render(
      <Header logo={<span>L</span>} onMenuPress={vi.fn()} isMenuOpen={false} />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');

    rerender(<Header logo={<span>L</span>} onMenuPress={vi.fn()} isMenuOpen />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-controls when menuSurfaceId is provided', () => {
    render(
      <Header
        logo={<span>L</span>}
        onMenuPress={vi.fn()}
        menuSurfaceId="drawer-root"
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'drawer-root');
  });

  it('renders navigation with active link state', () => {
    render(
      <Header
        logo={<span>L</span>}
        onMenuPress={vi.fn()}
        navLinks={[
          { label: 'Home', href: '/', isActive: true },
          { label: 'Docs', href: '/docs' },
        ]}
      />,
    );

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('omits navigation when navLinks is empty', () => {
    render(<Header logo={<span>L</span>} onMenuPress={vi.fn()} navLinks={[]} />);

    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
  });

  it('renders utilities before menu control in tab order', () => {
    render(
      <Header
        logo={<a href="/">Home</a>}
        onMenuPress={vi.fn()}
        utilitiesSlot={<button type="button">Theme</button>}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const themeButton = screen.getByRole('button', { name: 'Theme' });
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(buttons.indexOf(themeButton)).toBeLessThan(buttons.indexOf(menuButton));
  });
});
