# @vassembly/ui-popover

Non-modal floating popover for the Vassembly design system: anchored to a trigger, glassmorphic panel, four placements, controlled or uncontrolled open state, outside click and Escape to dismiss.

## Usage

Uncontrolled (internal toggle on trigger click):

```tsx
import { Popover } from '@vassembly/ui-popover';

<Popover
  trigger={<button type="button">Open</button>}
  placement="bottom"
>
  <p>Popover content</p>
</Popover>
```

Controlled:

```tsx
const [open, setOpen] = useState(false);

<Popover
  trigger={<button type="button">Toggle</button>}
  isOpen={open}
  onOpenChange={setOpen}
>
  Content
</Popover>
```

For full accessibility (`aria-expanded`, keyboard toggle on the trigger), pass a **single React element** as `trigger` (for example a `<button type="button">`). Other `ReactNode` values render without those attributes.

Optional `className` applies to the popover panel; `triggerClassName` applies to the root wrapper around the trigger and panel.

## Dependencies

- `@vassembly/ui-utils`, `@vassembly/theme`, `react`, `react-dom`
