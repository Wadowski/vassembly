# @vassembly/ui-layout

Composable app layout with header, overlay drawer navigation, main content, and footer. Variants supply default header, drawer, and footer configuration; each region can be partially overridden via props.

## Usage

```tsx
import { Layout } from '@vassembly/ui-layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Layout variant="main">{children}</Layout>
      </body>
    </html>
  );
}
```

Requires **Next.js** (`next/link`, `next/navigation`) as a peer dependency.

## Props

- `variant` — layout preset key (currently only `main`).
- `children` — page content rendered inside `<main id="main-content">`.
- `className` — optional class on the page wrapper (footer follows main).
- `footer`, `header`, `drawer` — optional partial overrides merged onto the variant preset.
