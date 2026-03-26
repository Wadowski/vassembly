# @vassembly/ui-pagination

Pagination controls for the Vassembly design system: previous and next actions, numbered pages, and collapsed ranges with ellipses for long page counts.

## Usage

Controlled component: pass the current page (1-based), total pages, and `onPageChange`.

```tsx
import { Pagination } from '@vassembly/ui-pagination';

<Pagination
  currentPage={page}
  totalPages={42}
  onPageChange={setPage}
/>
```

Optional `siblingCount` controls how many page numbers appear on each side of the current page when the list is collapsed (default `1`). The component renders nothing when `totalPages` is less than `2`.

## Dependencies

- `@vassembly/ui-text`, `@vassembly/ui-icons`, `@vassembly/ui-utils`, `@vassembly/theme`
