import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AnchorList } from './AnchorList';
import styles from './AnchorList.module.scss';

const ITEMS = [
  { label: 'Introduction', href: '#introduction' },
  { label: 'Getting Started', href: '#getting-started' },
  { label: 'Configuration', href: '#configuration' },
];

describe('AnchorList', () => {
  describe('Rendering', () => {
    it('renders a nav element', () => {
      render(<AnchorList items={ITEMS} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders each item as a link with correct href and label', () => {
      render(<AnchorList items={ITEMS} />);
      ITEMS.forEach((item) => {
        const link = screen.getByRole('link', { name: item.label });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', item.href);
      });
    });

    it('renders empty list with no links when items is empty', () => {
      render(<AnchorList items={[]} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });
  });

  describe('Active item', () => {
    it('applies isActive class to the link matching activeHref', () => {
      render(<AnchorList items={ITEMS} activeHref="#getting-started" />);
      const activeLink = screen.getByRole('link', { name: 'Getting Started' });
      expect(activeLink.className).toContain(styles.isActive);
    });

    it('does not apply isActive class to non-matching links', () => {
      render(<AnchorList items={ITEMS} activeHref="#getting-started" />);
      const otherLink = screen.getByRole('link', { name: 'Introduction' });
      expect(otherLink.className).not.toContain(styles.isActive);
    });

    it('does not apply isActive class to any link when activeHref is not provided', () => {
      render(<AnchorList items={ITEMS} />);
      screen.getAllByRole('link').forEach((link) => {
        expect(link.className).not.toContain(styles.isActive);
      });
    });
  });

  describe('Size variants', () => {
    it('applies sizeSmall class to links when size is small', () => {
      render(<AnchorList items={ITEMS} size="small" />);
      screen.getAllByRole('link').forEach((link) => {
        expect(link.className).toContain(styles.sizeSmall);
      });
    });

    it('applies sizeMedium class to links by default', () => {
      render(<AnchorList items={ITEMS} />);
      screen.getAllByRole('link').forEach((link) => {
        expect(link.className).toContain(styles.sizeMedium);
      });
    });

    it('applies sizeLarge class to links when size is large', () => {
      render(<AnchorList items={ITEMS} size="large" />);
      screen.getAllByRole('link').forEach((link) => {
        expect(link.className).toContain(styles.sizeLarge);
      });
    });
  });

  describe('Disabled', () => {
    it('applies isDisabled class to the nav when isDisabled is true', () => {
      render(<AnchorList items={ITEMS} isDisabled />);
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain(styles.isDisabled);
    });

    it('does not apply isDisabled class when isDisabled is false', () => {
      render(<AnchorList items={ITEMS} isDisabled={false} />);
      const nav = screen.getByRole('navigation');
      expect(nav.className).not.toContain(styles.isDisabled);
    });
  });

  describe('ariaLabel', () => {
    it('uses default aria-label "Anchor list" when ariaLabel is not provided', () => {
      render(<AnchorList items={ITEMS} />);
      expect(screen.getByRole('navigation', { name: 'Anchor list' })).toBeInTheDocument();
    });

    it('uses custom aria-label when ariaLabel is provided', () => {
      render(<AnchorList items={ITEMS} ariaLabel="Page sections" />);
      expect(screen.getByRole('navigation', { name: 'Page sections' })).toBeInTheDocument();
    });
  });

  describe('onItemClick', () => {
    it('calls onItemClick with the correct item when a link is clicked', async () => {
      const onItemClick = vi.fn();
      const user = userEvent.setup();

      render(<AnchorList items={ITEMS} onItemClick={onItemClick} />);
      await user.click(screen.getByRole('link', { name: 'Introduction' }));

      expect(onItemClick).toHaveBeenCalledWith(ITEMS[0]);
    });

    it('does not call onItemClick when isDisabled is true', async () => {
      const onItemClick = vi.fn();
      const user = userEvent.setup();

      render(<AnchorList items={ITEMS} isDisabled onItemClick={onItemClick} />);
      await user.click(screen.getByRole('link', { name: 'Introduction' }));

      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('does not throw when onItemClick is not provided and a link is clicked', async () => {
      const user = userEvent.setup();
      render(<AnchorList items={ITEMS} />);
      await expect(user.click(screen.getByRole('link', { name: 'Introduction' }))).resolves.not.toThrow();
    });
  });

  describe('displayName', () => {
    it('AnchorList.displayName equals "AnchorList"', () => {
      expect(AnchorList.displayName).toBe('AnchorList');
    });
  });
});

