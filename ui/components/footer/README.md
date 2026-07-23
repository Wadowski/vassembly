# @vassembly/ui-footer

## Description

Footer UI component for the Vassembly design system: site map, company, legal, contact, social links, optional brand, and copyright.

## Installation

```bash
pnpm add @vassembly/ui-footer
```

## Usage

```tsx
import { Footer } from '@vassembly/ui-footer';
import { SocialTwitterMonoIcon } from '@vassembly/ui-system-design/icons';

export function Example(): JSX.Element {
  return (
    <Footer
      sitemap={[
        { label: 'Home', href: '/' },
        { label: 'Docs', href: '/docs' },
      ]}
      company={[{ label: 'About us', href: '/about' }]}
      legal={[
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms & conditions', href: '/terms' },
      ]}
      contact={{
        email: {
          label: 'Email',
          value: 'hello@example.com',
          href: 'mailto:hello@example.com',
        },
      }}
      social={[
        {
          href: 'https://twitter.com/org',
          ariaLabel: 'Organization on X',
          icon: <SocialTwitterMonoIcon />,
        },
      ]}
      copyright="© 2026 Example Inc. All rights reserved."
    />
  );
}
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` | Optional root class |
| `id` | `string` | Optional root `id` |
| `brand` | `FooterBrandContent` | Optional `logo` and/or `tagline` (`ReactNode`) |
| `sitemap` | `readonly FooterNavLink[]` | Site map links (`label`, `href`) |
| `company` | `readonly FooterNavLink[]` | Company links (e.g. About us) |
| `legal` | `readonly FooterNavLink[]` | Legal links (Privacy, Terms, …) |
| `contact` | `FooterContactContent` | Optional `email`, `phone`, `address` |
| `social` | `readonly FooterSocialItem[]` | `href`, `ariaLabel`, `icon` (`ReactNode`) |
| `copyright` | `ReactNode` | Copyright line |

`FooterNavLink`: `{ label: string; href: string }`. Links are plain `<a>` (no router coupling).

## Design system

- SCSS tokens from `@vassembly/ui-system-design/theme` (`colors`, `spacing`, `typography`, `breakpoints`, `shadows`).
- Typography via `@vassembly/ui-system-design/text` (`Text`).
- Layout: stacked column on small viewports; multi-column grid from the desktop breakpoint (`$media-desktop`).

## Accessibility

- Root uses `<footer>` (contentinfo landmark).
- Site map, company, legal, and social blocks use `<nav>` with `aria-label`.
- Contact block uses `<address>`.
- Social targets use `aria-label` on each anchor; external links use `rel="noopener noreferrer"` and `target="_blank"`.

## Examples

### Copyright only

```tsx
<Footer copyright="© 2026 Example Inc." />
```

### Full sections

See Storybook story `System Design/Footer` → **Default**.
