# Drawer / Sidebar Navigation — UI Design

## 1. Design Rationale

### Goals
- Give users a **single, predictable home** for wayfinding: primary routes visible, secondary routes organized in collapsible groups without visual noise.
- **Separate “navigation” from “account”** through tonal stacking (no hard dividers), so the footer auth block reads as a distinct “dock” without breaking the no-line rule.
- Stay within **The Synthetic Luminal**: atmospheric charcoal surfaces, glassy footer actions, **one accent** for active/hover (default: `primary` blue family; optional `secondary` sage only if primary is unused elsewhere on the same viewport).
- **Motion** should feel liquid: collapsible groups use **400ms** height/opacity transitions with `cubic-bezier(0.22, 1, 0.36, 1)`; chevron rotates **180°** over the same duration.

### Layout model
- **Fixed-width drawer** on large viewports (recommended **280px** content width + **16px** outer padding each side → **312px** total rail). On narrow viewports, the same content becomes an **overlay drawer** with scrim; spacing tokens stay identical.
- **Vertical rhythm**: category label → `spacing-4` → first item; between standalone links `spacing-2`; between **groups** `spacing-6` (per design system list separation).

---

## 2. Visual Specification

### 2.1 Surfaces (dark — default)

| Region | Token | Hex (from system) | Notes |
|--------|--------|-------------------|--------|
| Drawer panel | `surface-container` | #242428 | Sits above app `surface` #1a1a1e |
| Scrollable nav area | same as panel | — | Optional: very subtle vertical gradient top→bottom not required |
| Group header row (collapsed target) | transparent; hover → `surface-container-high` | #2e2e34 @ full or 85% blend | No 1px border |
| Active nav row | `surface-container-high` | #2e2e34 | Optional **ambient**: outer glow 40px blur, 6% opacity, tinted `primary` |
| Footer “auth dock” | `surface-container-low` *or* glass | If glass: `surface-variant` ~40% + `blur(20px)` | Tonal lift from nav; **no border** |

### 2.2 Surfaces (light — optional variant)

Invert hierarchy conceptually: base drawer **off-white** (~#f4f4f6), mid **#eaeaee**, hover/active **#e0e0e6**. Ghost outline for focus only: `outline-variant` @ **15%** opacity. Accents remain `primary` / `secondary` but **reduce saturation** slightly on hover washes if contrast fails WCAG.

### 2.3 Typography

| Element | Font | Style | Color |
|---------|------|-------|--------|
| App / product mark (if shown) | Space Grotesk | `title-md`–`title-lg`, weight 500–600 | `on-surface` high emphasis |
| Section labels (e.g. “Workspace”, “Account”) | Inter | `label-sm`, **ALL CAPS**, letter-spacing **+10%**, weight 600 | `primary` (technical readout) |
| Nav link — default | Inter | `body-md`, weight 400 | `on-surface` ~87% opacity |
| Nav link — hover | Inter | `body-md`, weight 500 | `on-surface` 100% |
| Nav link — active | Inter | `body-md`, weight 600 | `on-surface` + **4px** left “luminous bar” using `primary` gradient (vertical fade) |
| Group child link | Inter | `body-sm` or same as parent with **2px** smaller optical size | Slightly lower contrast until hover |
| Footer meta (email) | Inter | `label-sm`, regular | `on-surface-variant` |

**Numbers** in nav labels (badges): Space Grotesk, tabular lining if available.

### 2.4 Icons
- **Line icons** 20×20px (touch target still **44px** minimum height for row).
- Default icon color: **`primary_fixed_dim`** (per system: icons pop on charcoal).
- Active: same icon + **subtle primary glow** (optional, very low spread).

### 2.5 Spacing (4px grid)

- Horizontal padding inside drawer: **16px** (`spacing-4`).
- Row height: **44px** minimum (accessibility).
- Section label `margin-top`: **24px** first block; **16px** between subsequent blocks.
- Footer dock: **16px** padding all sides; **12px** gap between stacked controls.

---

## 3. Wireframes & Layout

### 3.1 Structure (unauthenticated)

```
┌──────────────────────────────────────┐ 312px total (280 + padding×2 implied in inner width)
│ [16px pad]                     [16px]│
│  LOGO  ProductName                    │  ← Space Grotesk, 20–22px
│           (optional tagline sm)       │
│                                        │
│  WORKSPACE                    label-sm │  ← primary color, caps
│  ▸ Dashboard                    row    │
│  ▸ Inbox                        row    │
│                                        │
│  LIBRARY                      label-sm │
│  ⌄  Projects                    group  │  ← chevron down = expanded
│       Overview                  indent │  ← +12px left inset (icon column aligned)
│       Files                     indent │
│       ⌃ Shared with me         group  │  ← nested optional; same pattern
│  ▸ Reports                      row    │
│                                        │
│         · · ·  flex spacer  · · ·      │
│                                        │
│ ╔════════════════════════════════════╗ │  ← tonal “dock” (surface step or glass)
│ ║  [  Log in  ]  primary gradient    ║ │  ← full width minus pad, h 44
│ ║  Register          tertiary link   ║ │  ← centered or left per brand
│ ╚════════════════════════════════════╝ │
└──────────────────────────────────────┘
```

### 3.2 Structure (authenticated)

```
┌──────────────────────────────────────┐
│  … same header + nav …               │
│                                        │
│ ╔════════════════════════════════════╗ │
│ ║  ┌────┐  Jane Doe                  ║ │
│ ║  │ AV │  jane@acme.com             ║ │  ← avatar 40px rounded-xl
│ ║  └────┘  [optional role badge]     ║ │
│ ║  ─────────────────────────────     ║ │  ← tonal only: 12px vertical gap, no line
│ ║  ⚙ Settings              →        ║ │  ← row 44px, icon + label
│ ║  ⎋ Log out                        ║ │  ← tertiary or subtle destructive text
│ ╚════════════════════════════════════╝ │
└──────────────────────────────────────┘
```

**Avatar:** circle or `rounded-xl` **40px**; fallback initials **Space Grotesk** `title-sm`, on `surface-container-high`.

---

## 4. Interaction States

### 4.1 Nav row (standalone link)
| State | Background | Text | Other |
|-------|------------|------|--------|
| Default | transparent | `on-surface` 87% | — |
| Hover | `surface-container-high` | 100% | **400ms** background |
| Focus (keyboard) | same as hover | 100% | **Ghost** focus ring: `primary` 40% opacity, 2px offset 2px |
| Active (current route) | `surface-container-high` | 100% weight 600 | **4px** left gradient bar (`primary` → transparent); optional soft outer glow |

### 4.2 Collapsible group header
| State | Chevron | Children |
|-------|---------|----------|
| Collapsed | `›` rotated **-90°** (points right) or chevron-down at **-90°** | hidden; **height 0**, `opacity 0`, `margin 0`; **overflow hidden** |
| Expanded | chevron **0°** (down) | visible; stagger **optional**: 50ms delay per item max 3 items |
| Hover (header) | same as nav row hover | — |

**Animation:** `max-height` animate (e.g. 0 → 500px) **or** CSS grid `0fr` → `1fr` pattern preferred for smoother reflow; duration **400ms**, easing per system.

**Group child** rows: **+12px** left padding; hover identical to parent rows.

### 4.3 Footer — unauthenticated
- **Log in:** Primary button spec (gradient `primary` → `primary-dim`, `rounded-xl`, h **44**).
- **Register:** Tertiary — text `primary`, underline on hover only (not default) to reduce noise.

### 4.4 Footer — authenticated
- **Settings row:** same as nav row; navigates to settings.
- **Logout:** **Tertiary** style; on hover use **`error`** (#d9869f) **text only** (no heavy red fill) to signal destructive without alarmism.

---

## 5. Responsive Behavior

- **≥1024px:** Persistent sidebar; content grid shifts by drawer width.
- **768–1023px:** Collapsible rail: icon-only **72px** variant *optional future*; not required for this spec — can stay full width overlay.
- **<768px:** **Overlay drawer**; **scrim** `surface_container_lowest` at **60%** opacity + `blur(0)`; tap scrim closes; **slide-in** from left **320ms–400ms** same easing.

---

## 6. Accessibility

- **Landmarks:** `<nav aria-label="Main">` for primary links; nested groups `aria-expanded` on group button, `aria-controls` pointing to child list id.
- **Keyboard:** `Tab` through links; **Enter/Space** toggles group; **Escape** closes mobile drawer and returns focus to opener.
- **Focus order:** Header → nav → footer dock top-to-bottom.
- **Contrast:** All text on `surface-container` meets **WCAG AA**; `label-sm` in `primary` must be checked on light mode (darken token if needed).
- **Touch:** **44×44px** minimum; chevron hit area included in row, not a separate tiny target.
- **Motion:** `prefers-reduced-motion: reduce` → collapse to **instant** or **≤100ms** opacity only (no large max-height animation).

---

## 7. Components & Icons (inventory)

| UI element | Icon suggestion | Notes |
|------------|-----------------|--------|
| Collapsible group | Chevron down | Rotates **180°** when open |
| External link (if any) | Small arrow-up-right | Optional |
| Settings | Gear | 20px |
| Logout | Door / arrow-from-bracket | 20px; hover `error` color |
| Login (decorative none) | — | Gradient button |

**Max two accent colors** on drawer: use **`primary`** for labels, active bar, buttons; reserve **`secondary`** only if marketing insists and nothing else on drawer uses primary emphasis.

---

## 8. Developer Handoff (no implementation in this doc)

1. **Tokens first:** Map all backgrounds to `surface-*`, text to `on-surface*`, CTA to button tokens.
2. **Split components:** `DrawerShell` (layout + scrim), `NavSectionLabel`, `NavLinkRow`, `NavCollapsibleGroup`, `DrawerFooterAuth`, `DrawerFooterUser`.
3. **State:** Pass `isAuthenticated`, `user`, `onLogout`, `items` tree (depth 2 supported in spec).
4. **Routing:** Active state from pathname match; support **prefix** match for nested routes with visual consistency.
5. **Tests (visual/Storybook):** Document six stories — collapsed group, expanded group, nested group, hover, active, both footers.

---

## 9. Reference Mockup (ASCII — authenticated, expanded)

```
┌──────────────────────────────────────┐
│  ◆ Vassembly                           │
│                                        │
│  WORKSPACE                             │
│  │ Dashboard                    ●      │  ● = active luminous bar
│  │ Inbox                               │
│                                        │
│  LIBRARY                               │
│  ⌄ Projects                            │
│      │ Overview                        │
│      │ Files                           │
│      │ Shared with me                  │
│  │ Reports                             │
│                                        │
│              ···                        │
│  ┌────────────────────────────────────┐│
│  │ [JD]  Jane Doe                     ││
│  │       jane@acme.com                ││
│  │                                    ││
│  │  ⚙  Settings                       ││
│  │  ⎋  Log out                        ││
│  └────────────────────────────────────┘│
└──────────────────────────────────────┘
```

This document is the **design-only** source of truth for layout, hierarchy, motion, tokens, and accessibility; implementation should follow project code standards separately.
