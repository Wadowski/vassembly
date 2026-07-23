# @vassembly/ui-drawer-navigation

Drawer and persistent sidebar navigation for the Vassembly design system. Routing and authentication are **host-owned**; this package renders from props and callbacks only.

## Installation

Add the workspace dependency and ensure your app injects theme CSS variables from `@vassembly/ui-system-design/theme` if other design-system components require it.

## Usage

- **`layout="persistent"`** — fixed rail for desktop shells; place beside main content in your grid.
- **`layout="overlay"`** — portal overlay with scrim; supply **`isOpen`**, **`onOpenChange`**, and optionally **`openerRef`** for focus return after close.

Pass **`sections`** (labels and nested links/groups), **`currentPath`** for active state, **`onNavigate`** when a row is activated, and either guest callbacks (**`onLogin`**, **`onRegister`**) or **`user`** plus **`onLogout`** / **`onOpenSettings`** when authenticated.

For Next.js or other routers, pass **`LinkComponent`** to use your `Link` component; this component receives `href`, `onClick`, `className`, and children as props to enable routing integration.

## Public API

See `src/index.ts` for exports. Primary entry: **`DrawerNavigation`**.
