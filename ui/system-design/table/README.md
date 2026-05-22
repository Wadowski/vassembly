# @vassembly/ui-table

Data table for the Vassembly design system with column definitions, optional caption, centered empty state (icon + message), and built-in pagination via `@vassembly/ui-pagination`.

## Usage

### Client-side pagination (default)

```tsx
import { Table } from '@vassembly/ui-table';

<Table
  columns={[
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
  ]}
  data={rows}
  pageSize={10}
  caption="Results"
/>
```

### Server-driven pagination (controlled)

When data is fetched per page from an API, pass the current page slice and control pagination from the parent. `Table` does not slice `data` in this mode.

```tsx
<Table
  columns={columns}
  data={currentPageRows}
  pageSize={10}
  currentPage={pageIndex + 1}
  totalPages={Math.ceil(totalCount / 10)}
  onPageChange={(page) => setPageIndex(page - 1)}
/>
```

- `currentPage` and `totalPages` are **1-based** (aligned with `@vassembly/ui-pagination`).
- Convert to your API’s page index at the boundary (e.g. subtract 1 for 0-based APIs).

## Dependencies

- `@vassembly/ui-pagination`, `@vassembly/ui-text`, `@vassembly/ui-icons`, `@vassembly/ui-utils`, `@vassembly/theme`
