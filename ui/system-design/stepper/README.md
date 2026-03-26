# @vassembly/ui-stepper

Vertical stepper for the Vassembly design system. Each step shows an icon, a short title, and a description, with visual states for completed, current, and upcoming steps based on `currentStepIndex`.

## Usage

```tsx
import { Stepper } from '@vassembly/ui-stepper';
import { CheckIcon } from '@vassembly/ui-icons';

const steps = [
  {
    id: 'one',
    icon: <CheckIcon />,
    title: 'Start',
    description: 'Begin the flow.',
  },
  {
    id: 'two',
    icon: <CheckIcon />,
    title: 'Finish',
    description: 'Complete the flow.',
  },
];

<Stepper steps={steps} currentStepIndex={0} />;
```

Steps with an index **less than** `currentStepIndex` are styled as completed; the step at `currentStepIndex` is the active step (`aria-current="step"`); later steps are upcoming.

Optional `ariaLabel` sets the accessible name of the wrapping `nav` (default: `"Progress steps"`). Pass `className` for layout.

## Dependencies

- `@vassembly/theme`, `@vassembly/ui-text`, `@vassembly/ui-utils`, `react`, `react-dom`
