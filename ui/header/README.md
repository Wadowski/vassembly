# @vassembly/ui-header

App shell header: brand, optional inline navigation, optional utilities, and a persistent menu trigger. The drawer or sheet that opens from the trigger is implemented separately and composed in the application.

## Install

```bash
pnpm add @vassembly/ui-header
```

## Usage

### Composed `Header`

```tsx
import { Header } from '@vassembly/ui-header';

<Header
  logo={<Link href="/">Logo</Link>}
  onMenuPress={() => setDrawerOpen(true)}
  isMenuOpen={drawerOpen}
  menuSurfaceId="main-navigation-drawer"
  navLinks={[
    { label: 'Home', href: '/', isActive: pathname === '/' },
    { label: 'Docs', href: '/docs' },
  ]}
  utilitiesSlot={<ThemeToggle />}
/>;
```

### Composition

Use `HeaderRoot` with `HeaderBrand`, `HeaderNav`, `HeaderUtilities`, and `MenuTriggerCTA` when you need a custom layout.

## Integration

- **Skip link:** Render “Skip to main content” as the first focusable control in the document, before this header. Point it at `id` on `<main>`.
- **Drawer:** Owns panel, scrim, focus trap, and scroll lock. Pass `menuSurfaceId` matching the drawer root `id`, and keep `isMenuOpen` in sync for `aria-expanded` on the trigger.
- **Landmark:** One primary `<header>` per logical shell; this package renders it from `HeaderRoot` / `Header`.

## Design reference

See `docs/features/header/design.md`.
