import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('returns null when there is no content', () => {
    render(<Footer />);
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('renders footer landmark with sitemap links', () => {
    render(
      <Footer
        sitemap={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
        ]}
        copyright="© 2026 Test"
      />,
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Site map' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    expect(screen.getByText('© 2026 Test')).toBeInTheDocument();
  });

  it('renders company, legal, contact, and social sections', () => {
    render(
      <Footer
        company={[{ label: 'About us', href: '/about' }]}
        legal={[
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
        contact={{
          email: { label: 'Email', value: 'hi@example.com', href: 'mailto:hi@example.com' },
        }}
        social={[
          {
            href: 'https://example.com/x',
            ariaLabel: 'Example on X',
            icon: <span data-testid="icon-x">X</span>,
          },
        ]}
        copyright="© 2026 Co"
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About us' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'hi@example.com' })).toHaveAttribute(
      'href',
      'mailto:hi@example.com',
    );
    expect(screen.getByRole('link', { name: 'Example on X' })).toHaveAttribute(
      'href',
      'https://example.com/x',
    );
    expect(screen.getByTestId('icon-x')).toBeInTheDocument();
  });

  it('omits optional sections when not provided', () => {
    render(<Footer copyright="© Only" />);

    expect(screen.queryByRole('navigation', { name: 'Site map' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Company' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Social media' })).toBeNull();
    expect(screen.getByText('© Only')).toBeInTheDocument();
  });
});
