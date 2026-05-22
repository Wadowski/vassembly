import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './Table';
import type { ColumnDef } from './types';

type TestRow = { id: number; name: string };

const defaultColumns: ColumnDef<TestRow>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
];

const makeRows = (count: number): TestRow[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `Row ${index}`,
  }));

const getBodyRows = (table: HTMLElement): HTMLElement[] => {
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    return [];
  }
  return within(tbody).getAllByRole('row');
};

describe('Table', () => {
  describe('render and structure', () => {
    it('renders table with column headers scoped as col and header text', () => {
      const data = makeRows(2);
      render(<Table columns={defaultColumns} data={data} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(2);
      expect(columnheaders[0]).toHaveAttribute('scope', 'col');
      expect(columnheaders[1]).toHaveAttribute('scope', 'col');
      expect(columnheaders[0]).toHaveTextContent('ID');
      expect(columnheaders[1]).toHaveTextContent('Name');
    });

    it('renders tbody with one row per first-page row and cells as td', () => {
      const data = makeRows(3);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      const table = screen.getByRole('table');
      const bodyRows = getBodyRows(table);
      expect(bodyRows).toHaveLength(3);

      for (const row of bodyRows) {
        const cells = within(row).getAllByRole('cell');
        expect(cells).toHaveLength(2);
      }
    });

    it('renders caption with correct text when caption prop is set', () => {
      const data = makeRows(1);
      render(
        <Table columns={defaultColumns} data={data} caption="Participants" />,
      );

      const table = screen.getByRole('table');
      expect(table.firstElementChild?.tagName.toLowerCase()).toBe('caption');
      expect(screen.getByText('Participants')).toBeInTheDocument();
    });
  });

  describe('data rendering', () => {
    it('renders at most pageSize rows on the first page', () => {
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      const table = screen.getByRole('table');
      expect(getBodyRows(table)).toHaveLength(10);
    });

    it('uses column render when provided and falls back to string cell value otherwise', () => {
      const data: TestRow[] = [{ id: 1, name: 'Ada' }];
      const columns: ColumnDef<TestRow>[] = [
        {
          key: 'id',
          header: 'ID',
          render: ({ row }) => <span>id:{row.id}</span>,
        },
        { key: 'name', header: 'Name' },
      ];
      render(<Table columns={columns} data={data} />);

      expect(screen.getByText('id:1')).toBeInTheDocument();
      expect(screen.getByText('Ada')).toBeInTheDocument();
    });

    it('shows stringified primitive cell values for default rendering', () => {
      const data: TestRow[] = [{ id: 42, name: 'x' }];
      render(<Table columns={defaultColumns} data={data} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('pagination math and visibility', () => {
    it('shows rows 0–9 on page 1 and rows 10–19 after navigating to page 2', async () => {
      const user = userEvent.setup();
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      expect(screen.getByText('Row 0')).toBeInTheDocument();
      expect(screen.getByText('Row 9')).toBeInTheDocument();
      expect(screen.queryByText('Row 10')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.queryByText('Row 0')).not.toBeInTheDocument();
      expect(screen.getByText('Row 10')).toBeInTheDocument();
      expect(screen.getByText('Row 19')).toBeInTheDocument();
      expect(screen.queryByText('Row 20')).not.toBeInTheDocument();
    });

    it('shows rows 20–24 on page 3', async () => {
      const user = userEvent.setup();
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByText('Row 20')).toBeInTheDocument();
      expect(screen.getByText('Row 24')).toBeInTheDocument();
    });

    it('does not render pagination when all data fits on one page', () => {
      const data = makeRows(5);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      expect(screen.getByText('Row 0')).toBeInTheDocument();
      expect(screen.getByText('Row 4')).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: 'Pagination' }),
      ).not.toBeInTheDocument();
    });

    it('renders pagination when more than one page is required', () => {
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      expect(
        screen.getByRole('navigation', { name: 'Pagination' }),
      ).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders default empty message spanning all columns when data is empty', () => {
      render(<Table columns={defaultColumns} data={[]} />);

      const table = screen.getByRole('table');
      const bodyRows = getBodyRows(table);
      expect(bodyRows).toHaveLength(1);

      const cell = within(bodyRows[0]).getByRole('cell');
      expect(cell).toHaveAttribute('colspan', '2');
      expect(cell).toHaveTextContent('No data');
    });

    it('renders custom emptyState node when data is empty', () => {
      render(
        <Table
          columns={defaultColumns}
          data={[]}
          emptyState={<span>Custom empty</span>}
        />,
      );

      expect(screen.getByText('Custom empty')).toBeInTheDocument();
    });

    it('does not render pagination when data is empty', () => {
      render(<Table columns={defaultColumns} data={[]} />);

      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: 'Pagination' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('pagination navigation', () => {
    it('returns to page 1 when previous is used from page 2', async () => {
      const user = userEvent.setup();
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByText('Row 10')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(screen.getByText('Row 0')).toBeInTheDocument();
    });

    it('disables previous on the first page when multiple pages exist', () => {
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
    });

    it('disables next on last page of multi-page data', async () => {
      const user = userEvent.setup();
      const data = makeRows(25);
      render(<Table columns={defaultColumns} data={data} pageSize={10} />);

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Previous page' })).not.toBeDisabled();
    });
  });

  describe('className and caption', () => {
    it('applies className to the table element', () => {
      const data = makeRows(1);
      render(
        <Table
          columns={defaultColumns}
          data={data}
          className="report-table"
        />,
      );

      expect(screen.getByRole('table')).toHaveClass('report-table');
    });
  });

  describe('accessibility', () => {
    it('exposes table, columnheader, row, and cell roles for populated data', () => {
      const data = makeRows(2);
      render(<Table columns={defaultColumns} data={data} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(within(table).getAllByRole('columnheader')).toHaveLength(2);

      const bodyRows = getBodyRows(table);
      expect(bodyRows).toHaveLength(2);
      expect(within(bodyRows[0]).getAllByRole('cell')).toHaveLength(2);
    });
  });

  describe('controlled pagination', () => {
    it('renders all provided rows without client-side slicing', () => {
      const data = makeRows(3);
      render(
        <Table
          columns={defaultColumns}
          data={data}
          pageSize={10}
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
        />,
      );

      const table = screen.getByRole('table');
      expect(getBodyRows(table)).toHaveLength(3);
      expect(screen.getByText('Row 0')).toBeInTheDocument();
      expect(screen.getByText('Row 2')).toBeInTheDocument();
    });

    it('uses currentPage and totalPages for pagination controls', () => {
      const data = makeRows(2);
      render(
        <Table
          columns={defaultColumns}
          data={data}
          pageSize={10}
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
        />,
      );

      expect(
        screen.getByRole('navigation', { name: 'Pagination' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('invokes onPageChange with 1-based page when a page button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const data = makeRows(2);

      render(
        <Table
          columns={defaultColumns}
          data={data}
          pageSize={10}
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Page 3' }));

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('does not render pagination when totalPages is less than 2', () => {
      const data = makeRows(2);
      render(
        <Table
          columns={defaultColumns}
          data={data}
          pageSize={10}
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
        />,
      );

      expect(
        screen.queryByRole('navigation', { name: 'Pagination' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('shows all rows when pageSize exceeds row count and omits pagination', () => {
      const data = makeRows(5);
      render(<Table columns={defaultColumns} data={data} pageSize={100} />);

      const table = screen.getByRole('table');
      expect(getBodyRows(table)).toHaveLength(5);
      expect(
        screen.queryByRole('navigation', { name: 'Pagination' }),
      ).not.toBeInTheDocument();
    });

    it('supports a single column with many rows', () => {
      const columns: ColumnDef<TestRow>[] = [{ key: 'id', header: 'ID' }];
      const data = makeRows(4);
      render(<Table columns={columns} data={data} pageSize={10} />);

      const table = screen.getByRole('table');
      expect(within(table).getAllByRole('columnheader')).toHaveLength(1);
      expect(getBodyRows(table)).toHaveLength(4);
    });

    it('renders an empty cell when row omits the column key and no render is provided', () => {
      type SparseRow = { id: number; name?: string };
      const columns: ColumnDef<SparseRow>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ];
      const data: SparseRow[] = [{ id: 1 }];
      render(<Table columns={columns} data={data} />);

      const table = screen.getByRole('table');
      const firstBodyRow = getBodyRows(table)[0];
      const cells = within(firstBodyRow).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('1');
      expect(cells[1]).toHaveTextContent('');
    });
  });
});
