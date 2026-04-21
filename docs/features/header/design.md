# Header — UI/UX Design Specification

## 1. Design Rationale

The header is the primary spatial anchor for wayfinding. In **The Synthetic Luminal** system, it should read as a **thin atmospheric band** on the base canvas (`surface`), not a boxed chrome bar. Separation from content uses **tonal stacking** (slightly elevated `surface-container-low` or a hairline luminance at the bottom edge via opacity, not a hard 1px rule).

**Visual hierarchy:** Logo and product identity lead on the left; optional inline navigation remains secondary when present (Inter, restrained weight). The **menu CTA (hamburger trigger)** is a **persistent, first-class affordance** anchored on the **right** at every breakpoint—it never hides on larger screens. Optional utilities may sit **left of** the menu CTA so the trigger stays the **rightmost** primary control (best thumb reach on mobile; consistent mental model on desktop).

**Scope boundary (header vs. drawer):** This header component **only supplies the menu trigger CTA** (press/tap target, visuals, focus, `aria-expanded` coordination as agreed with the app shell). The **drawer panel, scrim, focus trap, scroll lock, and close control inside the overlay** are owned by a **separate package/component**, typically composed at the app level and **most critical on mobile**—but the **same trigger** can open that surface on tablet/desktop when the product wires it so. The header does not embed drawer markup.

**Accent discipline:** Use at most **one** neon accent in the header for active/focus states—default to **`primary`** for links, the menu CTA, and icon hover/focus rings. Reserve **`secondary`** for a single differentiator only if the rest of the screen is primary-led (e.g., active page indicator could be primary; do not mix both on icons and links simultaneously).

**Dark / light:** The system is **dark-first**. Light mode (if offered) keeps the same hierarchy: base becomes a light neutral; containers stack tonally upward; ghost borders and primary-tinted focus rings remain; avoid pure white fills for the bar—use a soft off-white surface with the same spacing and type scale.

---

## 2. Visual Mockup (Structural Description)

### Desktop (≥ 1024px)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo mark + wordmark]     Link   Link   Link   Link     [optional]     [ ☰ CTA ] │
│  (Space Grotesk / lockup)   (Inter, muted → primary)     (utilities)    (always)    │
└────────────────────────────────────────────────────────────────────────────────────┘
     ↑ cluster A (left)              ↑ optional B (nav)          ↑ optional    ↑ menu CTA
                                                                                 (rightmost)
```

- **Cluster A:** Logo lockup, vertically centered; clear click target with comfortable padding.
- **Cluster B (optional):** Inline nav when the product provides links; generous horizontal gaps; baseline-aligned with logo wordmark (optical nudge ±2px).
- **Between B and CTA:** Optional utilities (theme, account)—**to the left of** the menu CTA so the hamburger stays **rightmost**.
- **Menu CTA:** **Always visible**; **44×44px** minimum hit area; styled as **secondary (glass)** or **tertiary (primary text/icon)** button per design system—see §3.5 / §6. Same icon and placement as tablet/mobile.

### Tablet (768px–1023px)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]      Link  Link  Link        [optional]        [ ☰ CTA ] │
└──────────────────────────────────────────────────────────────────┘
```

- Same rules as desktop: **menu CTA always rightmost**; optional nav if space allows without wrapping—if inline nav would wrap, **hide or shorten nav in the bar** per product rules; **do not** remove the menu CTA to recover space.

### Mobile (≤ 767px)

```
┌────────────────────────────────────────┐
│  [Logo]              [optional]  [ ☰ ]  │
└────────────────────────────────────────┘
```

- **Left:** Compact logo (mark-only or shortened wordmark).
- **Right:** **Menu CTA always present**, rightmost; optional single utility **immediately left** of it if required—prefer **one** extra icon maximum to avoid crowding.

---

## 3. Specifications

### 3.1 Dimensions & Spacing

| Token / rule | Value | Usage |
|--------------|-------|--------|
| Header min height | **56px** (mobile), **64px** (desktop) | Touch-friendly; desktop can feel slightly taller for luxury rhythm |
| Horizontal padding | **16px** mobile, **24px** tablet, **32px** desktop | Align with page grid gutters |
| Logo cluster padding | **8px** vertical inset inside bar | Prevents optical clipping of descenders/mark |
| Nav link gap | **24px** desktop (min **20px** if space tight) | No divider lines—rhythm only; nav is optional |
| Cluster gap (logo → nav) | **32px** desktop, **24px** tablet | Clear separation without a border |
| **Menu CTA margin** | **8px** min from neighbor (nav or utilities) | Prevents accidental mis-taps |
| **Menu CTA position** | **Trailing end** of row (LTR: far right) | All breakpoints |
| Icon touch target | **44×44px** minimum | Menu CTA and other header icons |

Use vertical **white space** between header and first content block: **`spacing-6` (1.5rem)** minimum per design system list/card guidance—applies as margin below header or padding on main.

### 3.2 Typography

| Element | Font | Style |
|---------|------|--------|
| Wordmark (if text is part of logo) | Space Grotesk | `title-sm` to `title-md` equivalent; letter-spacing neutral or slightly tight |
| Nav links | Inter | **15–16px**, medium (500) default; **600** on active route |
| Nav link case | Sentence case | Unless product is all-caps brand—avoid shouting |
| Optional meta (e.g., env badge) | Inter | `label-sm`, tracked if used as “technical readout”; color `primary` at reduced opacity |

Numbers in the logo area (if any): **Space Grotesk** per system “voice of the AI / synthetic” rule.

### 3.3 Colors (Dark Mode — Primary)

| Role | Token / intent |
|------|----------------|
| Header background | `surface` or one step up: `surface-container-lowest` for subtle lift from page—pick one and stay consistent app-wide |
| Nav link default | `on-surface` at **~70% opacity** or dedicated `on-surface-variant` if available |
| Nav link hover | Full `on-surface` or slight **primary** tint |
| Active nav | **`primary`** text OR **4px underline / bottom bar** in `primary` at 80% opacity (no full box) |
| Logo | Full contrast `on-surface`; avoid recoloring mark unless brand requires |
| **Menu CTA icon** | `primary_fixed_dim` default; **`primary`** on hover/focus—consistent with other header icons |
| Icon hover | `primary` or brighten one step |
| Focus ring | `primary` at **40% opacity**, 2px offset outline; animate **300–500ms** with `cubic-bezier(0.22, 1, 0.36, 1)` |

**No standard 1px borders** between header and body: use **1px hairline** of `outline-variant` at **~15% opacity** only if separation is ambiguous; prefer extra background tier difference.

### 3.4 Light Mode (If Applicable)

- Bar: soft off-white / warm gray **not** `#fff` full bleed for the entire app chrome.
- Links: dark gray default, **primary** for active/hover.
- Focus: same primary hue ring; ensure contrast ≥ **WCAG AA** for text and icons.
- Overlays (drawer package): glass + scrim remain the concern of the drawer component; header trigger colors unchanged.

### 3.5 Icon Style

- **Stroke icons** (1.5px stroke at 24px canvas) for hamburger and utilities—consistent with “technical” Inter pairing.
- **Hamburger:** three horizontal lines of equal length; rounded caps optional if brand icons use round caps everywhere.
- **Pressed / open (optional):** If the product keeps the **close** control **inside the drawer only**, the header icon may **remain** hamburger while `aria-expanded="true"`. If the trigger **toggles** to close, morph or crossfade over **300ms**; avoid snappy 100ms system default—that interaction can be specified in the drawer package when it owns the close affordance.
- Active state: subtle **primary glow** (ambient luminance, not harsh shadow)—optional 40px blur at 6% opacity tinted primary.

---

## 4. Layout Specifications

### 4.1 Desktop

- **Grid:** Full-width flex row; **`justify-content: space-between`**: left group (`logo` + optional `nav`), right group (`optional utilities` + **`MenuCTA` always last**).
- **Logo:** Flex-shrink **0**; never squash mark.
- **Nav:** Optional horizontal list; no wrapping in-bar—truncate, overflow menu elsewhere, or hide inline nav before the **menu CTA** is moved or shrunk.
- **Menu CTA:** **Always rendered**; same size and alignment as other breakpoints; **do not** collapse into a “more” overflow that removes the hamburger from the chrome.
- **Alignment:** Vertical center all clusters; optical-adjust logo 1px up if mark feels heavy at bottom.

### 4.2 Tablet

- Identical to desktop for **menu CTA** placement (rightmost). Optional nav density follows product; **menu CTA is non-negotiable** in this pattern.

### 4.3 Mobile

- **Grid:** Logo left; **menu CTA** rightmost; optional single utility between them.
- **Nav links:** Not required in the bar; if the product uses the drawer package for navigation, links live **inside the drawer**—outside the header’s implementation scope.
- **Focus order (header only):** Logo (if link) → optional utilities → **menu CTA**. Focus order **inside the drawer** is defined by the drawer component.

### 4.4 Breakpoint Summary

| Range | Inline nav | **Menu CTA (hamburger)** |
|-------|------------|---------------------------|
| < 768px | Optional; often omitted in favor of drawer | **Always visible** (rightmost) |
| 768px–1023px | Optional per product | **Always visible** (rightmost) |
| ≥ 1024px | Optional per product | **Always visible** (rightmost) |

Document any product-specific exception (e.g., kiosk mode) in app-level specs—not the default header pattern.

---

## 5. Component Structure (Information Architecture)

**Minimal header (this component’s contract):** surface + **`HeaderBrand`** + **`MenuTriggerCTA`** (hamburger). Everything else is optional composition at the app shell.

Recommended logical regions (names for engineering handoff, not code):

1. **`HeaderRoot`** — semantic `<header>`, width 100%, optional sticky with reduced motion respect.
2. **`HeaderInner`** — max-width container optional; horizontal padding per breakpoint.
3. **`HeaderBrand`** — link to home; contains mark + optional wordmark.
4. **`HeaderNav`** (optional) — `<nav>` with links when product shows inline nav on larger viewports; **not** a substitute for the persistent menu CTA.
5. **`HeaderUtilities`** (optional) — theme, account, etc.; sits **left of** `MenuTriggerCTA`.
6. **`MenuTriggerCTA`** — **required in this design**: hamburger (or agreed menu icon); exposes `onPress` / callback to the parent; parent connects to the **drawer package**. No drawer DOM here.

**Out of scope for this header component:** **`Drawer` / `Sheet` / overlay**, scrim, panel layout, in-drawer navigation list, close button placement, focus trap implementation—those live in the **separate drawer component** and are composed by the application (often mobile-first, optionally reused on larger breakpoints).

**Props / behavior (conceptual API):**

- `logo: ReactNode` — required for brand slot.
- `onMenuPress: () => void` — parent wires to open/toggle drawer state.
- `isMenuOpen?: boolean` — optional; drives `aria-expanded` and optional visual state on the trigger in sync with the drawer package.
- `navLinks?: { label, href, isActive? }[]` — optional; when empty, hide inline `HeaderNav`.
- `utilitiesSlot?: ReactNode` — optional; renders left of the menu CTA.

The **menu trigger is not gated by breakpoint** in this specification: **no `hideOnDesktop`** flag for the default product pattern.

Spacing between these regions follows section 3.1.

---

## 6. Component Variations & States

| State | Behavior |
|-------|----------|
| Default | Static bar; menu CTA visible; links muted if present |
| Hover (link) | Color shift + optional **2px bottom glow** (primary, soft) |
| Active route | Primary color and/or bottom indicator; `aria-current="page"` on link |
| Hover / focus (menu CTA) | Icon brightens; focus ring per §3.3 |
| Focus visible | Ring on interactive elements; skip hidden items |
| Sticky scroll | Optional: background opacity or blur increases slightly after **8px** scroll to reinforce separation (still no harsh border) |
| Menu open (shell-level) | Header updates **`aria-expanded`** on the trigger to match drawer visibility; icon may stay hamburger or swap per cross-team spec—**drawer owns** panel UX |
| Reduced motion | Disable non-essential motion on trigger feedback; instant or ≤150ms opacity changes only |
| High contrast mode | Strengthen focus ring; ensure active nav does not rely on color alone (keep underline or icon) |

---

## 7. Responsive Behavior (Narrative)

1. **All viewports:** The **menu CTA** is **always** in the header chrome at the **trailing edge**; size and iconography stay consistent (minor padding changes with gutter tokens only).
2. **Desktop / tablet:** Optional inline nav may appear between logo and utilities; **menu CTA remains** the anchor for global/sidebar navigation surfaced by the **drawer package** when opened.
3. **Mobile:** Same trigger; drawer package typically provides the primary navigation surface; header does not change its obligation—it only fires `onMenuPress`.
4. **Orientation change:** Trigger remains fixed to bar layout; drawer package handles open-panel reflow or dismiss-on-rotate if needed.
5. **Keyboard:** `Tab` order within header: brand → optional nav links → utilities → **menu CTA**; **after open**, focus management passes to the **drawer component**.

---

## 8. Accessibility Notes

- Use **`<header>`** landmark once per page (or per logical app shell).
- **`nav`** with **visible label** (`aria-label="Main"`) when inline `HeaderNav` exists; do not duplicate the same landmark inside the header for drawer content—that belongs in the drawer panel.
- **Skip link:** First focusable in document should be “Skip to main content” above or visually hidden until focused—header should not steal this order incorrectly.
- **Touch targets:** 44px minimum for **menu CTA** and logo link.
- **Contrast:** Link, logo, and **menu CTA** icon meet **AA** against the header background.
- **Motion:** Honor `prefers-reduced-motion`.
- **Menu trigger:** `aria-expanded` and `aria-controls` (id of drawer surface) **when the drawer implementation provides a stable id**—coordinated between header trigger and drawer package, not duplicated inside the header alone.

---

## 9. Developer Handoff

1. **Tokens first:** Map backgrounds, text, and focus to design tokens (`surface`, `primary`, `outline-variant` at 15% if needed)—no raw hex in scattered components.
2. **No 1px section borders:** Use tonal difference or ghost hairline only.
3. **Animations:** 300–500ms, `cubic-bezier(0.22, 1, 0.36, 1)` for micro-interactions on the trigger; **panel motion** is owned by the drawer package.
4. **Max two accents in header:** Prefer primary-only for interactive emphasis.
5. **Composition:** Implement **header = brand + optional slots + `MenuTriggerCTA`**; **import and wire drawer separately**; pass shared open state or event bus only as needed—avoid coupling header package to drawer internals.
6. **Test:** Long translations, sticky + modal stacking, keyboard-only flow, 200% zoom without horizontal scroll in bar (logo may shrink to mark-only at smallest widths via design-approved asset); **verify menu CTA never drops below 44×44px** at any breakpoint.

---

## 10. Deliverables Checklist

- [x] Visual description / structural mockup (desktop, tablet, mobile)
- [x] Layout specifications including **persistent menu CTA** placement
- [x] Spacing, typography, color, icon guidance
- [x] Responsive behavior (CTA unchanged across breakpoints)
- [x] Component structure; **header vs. drawer scope** clarified
- [x] Dark-first + light mode considerations
- [x] Accessibility and motion notes

This document is design-only; implementation is out of scope for this artifact.
