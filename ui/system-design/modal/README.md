# @vassembly/ui-modal

Modal dialog for the Vassembly design system: glassmorphic panel, backdrop dismiss, Escape to close, and optional title with sizes `sm`, `md`, and `lg`.

## Usage

Controlled component: pass `isOpen`, `onClose`, and optional `title`, `size`, and `className`. Content is portaled to `document.body`.

```tsx
import { Modal } from '@vassembly/ui-modal';

<Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm" size="md">
  <p>Modal body</p>
</Modal>
```

## Dependencies

- `@vassembly/ui-utils`, `@vassembly/theme`
