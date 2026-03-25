# @vassembly/ui-accordion

Accordion primitive: sections with a trigger and collapsible panel. Supports `type="multiple"` (default) or `type="single"`, and `default`, `bordered`, or `flush` variants.

## Usage

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from '@vassembly/ui-accordion';

<Accordion type="multiple" defaultValue={['a']}>
  <AccordionItem value="a">
    <AccordionTrigger>Section A</AccordionTrigger>
    <AccordionPanel>Content A</AccordionPanel>
  </AccordionItem>
</Accordion>
```

## Scripts

- `pnpm test` — run Vitest once
- `pnpm test:watch` — watch mode
