import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  describe('Rendering', () => {
    it('renders multiple items', () => {
      const items = [
        { label: 'Home', href: '/home' },
        { label: 'Section', href: '/section' },
        { label: 'Page', href: '/page' },
      ];

      render(<Breadcrumbs items={items} />);

      const nav = screen.getByLabelText('breadcrumb');
      expect(nav).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Section')).toBeInTheDocument();
      expect(screen.getByText('Page')).toBeInTheDocument();
    });

    it('renders links for non-last items with href', () => {
      const items = [
        { label: 'Home', href: '/home' },
        { label: 'Section', href: '/section' },
        { label: 'Page', href: '/page' },
      ];

      render(<Breadcrumbs items={items} />);

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Section' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Page' })).not.toBeInTheDocument();
    });

    it('last item is plain text even when href is provided', () => {
      const items = [
        { label: 'Home', href: '/home' },
        { label: 'Page', href: '/page' },
      ];

      render(<Breadcrumbs items={items} />);

      expect(screen.queryByRole('link', { name: 'Page' })).not.toBeInTheDocument();

      const lastText = screen.getByText('Page');
      expect(lastText.closest('a')).toBeNull();
    });

    it('returns null when items is empty', () => {
      render(<Breadcrumbs items={[]} />);
      expect(screen.queryByRole('navigation')).toBeNull();
    });
  });

  describe('Separators', () => {
    it('renders separators with default separator', () => {
      const items = [
        { label: 'Home', href: '/home' },
        { label: 'Section', href: '/section' },
        { label: 'Page', href: '/page' },
      ];

      render(<Breadcrumbs items={items} />);

      expect(screen.getAllByText('/')).toHaveLength(items.length - 1);
    });

    it('renders separators with custom separator', () => {
      const items = [
        { label: 'Home', href: '/home' },
        { label: 'Section', href: '/section' },
        { label: 'Page', href: '/page' },
      ];

      render(<Breadcrumbs items={items} separator=">" />);

      expect(screen.getAllByText('>')).toHaveLength(items.length - 1);
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-current on the last item', () => {
      const items = [
        { label: 'Home', href: '/home' },
        { label: 'Page', href: '/page' },
      ];

      render(<Breadcrumbs items={items} />);

      expect(screen.getByText('Page')).toHaveAttribute('aria-current', 'page');
    });
  });
});

