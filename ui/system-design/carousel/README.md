# @vassembly/ui-carousel

### 1. Package Description

Carousel UI component for the Vassembly design system. Shows one child slide at a time with previous and next controls, touch swipe, and dot indicators.

### 2. Exports & API

## Exports

### `Carousel(props: CarouselProps): JSX.Element`

```tsx
import { Carousel } from '@vassembly/ui-carousel';

export function Example(): JSX.Element {
  return (
    <Carousel aria-label="Featured products">
      <article>Slide 1</article>
      <article>Slide 2</article>
    </Carousel>
  );
}
```

### `CarouselProps`

Props type for the `Carousel` component.

### `CarouselLabels`

Optional labels for previous, next, and dot controls (i18n).

## Installation

```bash
pnpm add @vassembly/ui-carousel
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Each child is one slide (fragments are flattened via `Children.toArray`) |
| `aria-label` | `string` | — | Accessible name for the carousel region |
| `className` | `string` | — | Optional root class name |
| `defaultActiveIndex` | `number` | `0` | Initial slide index (clamped to valid range) |
| `labels` | `CarouselLabels` | — | Optional `previousSlide`, `nextSlide`, and `goToSlide` overrides |

## Behavior

- One slide visible at a time; inactive slides use `aria-hidden`.
- Arrow buttons are disabled at the first and last slide (no wrapping).
- Touch swipe: horizontal movement must dominate vertical movement; distance must be at least 48px or 15% of the viewport width.
- `ArrowLeft` and `ArrowRight` change slides when focus is inside the carousel and the target is not an editable field.
- With zero children, only the region is rendered (no arrows or dots). With one child, arrows are disabled and dots are omitted.

## Accessibility

- Root uses `role="region"`, `aria-label`, and `aria-roledescription="carousel"`.
- Previous and next buttons expose default or custom `aria-label` values.
- Dot indicators are grouped with `role="group"` and named `"{aria-label} slide indicators"`; each dot uses `aria-pressed` for the active slide.
