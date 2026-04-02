# @vassembly/ui-snackbar

### 1. Package Description
Snackbar UI component with a portal-based `SnackbarProvider` for imperatively rendering notifications from anywhere in the app.

### 2. Exports & API
## Exports
- `Snackbar`: Visual snackbar component
- `SnackbarProvider`: Context provider + portal renderer
- `useSnackbar`: Hook to call `show()` and `dismiss()` imperatively

### Installation
```bash
pnpm add @vassembly/ui-snackbar
```

### Usage
```tsx
import { SnackbarProvider, useSnackbar, type SnackbarVariant } from '@vassembly/ui-snackbar';
import { useCallback } from 'react';

function Demo(): JSX.Element {
  const { show } = useSnackbar();
  const notify = useCallback((): void => {
    show({ message: 'Saved', variant: 'success', duration: 4000, isDismissible: true });
  }, [show]);

  return <button type="button" onClick={notify}>Notify</button>;
}

export function App(): JSX.Element {
  return (
    <SnackbarProvider>
      <Demo />
    </SnackbarProvider>
  );
}
```

### `SnackbarProvider` Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `React.ReactNode` | — | Provider subtree |
| `position` | `SnackbarPosition` | `'bottom-center'` | Where snackbars are anchored |
| `maxVisible` | `number` | `5` | Maximum concurrent snackbars |

### `useSnackbar` API
| Method | Signature | Description |
|---|---|---|
| `show` | `(item: Omit<SnackbarItem, 'id'>) => void` | Imperatively show a snackbar |
| `dismiss` | `(id: string) => void` | Dismiss a specific snackbar by id |

