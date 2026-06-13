import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';

vi.mock('next/navigation', () => ({
  usePathname: (): string => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }): JSX.Element => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Layout', () => {
  it('renders page content inside main with id main-content', () => {
    render(
      <Layout variant="main">
        <p>Page body</p>
      </Layout>,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(within(main).getByText('Page body')).toBeInTheDocument();
  });

  it('renders footer from main preset', () => {
    render(
      <Layout variant="main">
        <span>Content</span>
      </Layout>,
    );

    expect(screen.getByText('© 2026 Vassembly. All rights reserved.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hello@vassembly.dev' })).toHaveAttribute(
      'href',
      'mailto:hello@vassembly.dev',
    );
  });

  it('marks header Home link active for current path', () => {
    render(
      <Layout variant="main">
        <span>Content</span>
      </Layout>,
    );

    const mainNav = screen.getByRole('navigation', { name: 'Main' });
    const home = within(mainNav).getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('merges footer override', () => {
    render(
      <Layout variant="main" footer={{ copyright: '© Custom' }}>
        <span>Content</span>
      </Layout>,
    );

    expect(screen.getByText('© Custom')).toBeInTheDocument();
    expect(screen.queryByText('© 2026 Vassembly. All rights reserved.')).not.toBeInTheDocument();
  });

  it('toggles drawer open state when menu is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Layout variant="main">
        <span>Content</span>
      </Layout>,
    );

    const menu = screen.getByRole('button', { name: /open menu/i });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});
