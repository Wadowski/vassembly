import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  describe('Rendering', () => {
    it('returns null when totalPages is less than 2', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders navigation with default aria-label', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    });

    it('uses custom ariaLabel on nav', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
          ariaLabel="Results pagination"
        />,
      );
      expect(screen.getByRole('navigation', { name: 'Results pagination' })).toBeInTheDocument();
    });

    it('marks current page with aria-current', () => {
      render(<Pagination currentPage={3} totalPages={7} onPageChange={() => {}} />);
      expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Navigation actions', () => {
    it('calls onPageChange when a different page is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: 'Page 2' }));

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('does not call onPageChange when the current page is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: 'Page 2' }));

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('disables previous on first page and next on last page', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    });

    it('disables next on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />);
      expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('calls onPageChange from previous and next', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: 'Previous' }));
      expect(onPageChange).toHaveBeenCalledWith(1);

      onPageChange.mockClear();
      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Collapsed pages', () => {
    it('renders ellipsis when many pages', () => {
      render(<Pagination currentPage={5} totalPages={20} onPageChange={() => {}} />);
      expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1);
    });
  });

});
