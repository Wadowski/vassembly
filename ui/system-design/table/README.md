# @vassembly/ui-table

Data table for the Vassembly design system with column definitions, optional caption, centered empty state (icon + message), and built-in pagination via `@vassembly/ui-pagination`.

## Usage

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

## Dependencies

- `@vassembly/ui-pagination`, `@vassembly/ui-text`, `@vassembly/ui-icons`, `@vassembly/ui-utils`, `@vassembly/theme`
