# Real-Time Agent Execution Progress Tracker — UI/UX Design Specifications

**Document status:** Design handoff for engineering and QA  
**Last updated:** 2026-06-15  
**Feature location:** `apps/web/app/agents/ai-integrations/[id]/edit/` (modal overlay + progress list)  
**Related:** `docs/features/real-time-execution-progress/prd.md`, `.cursor/rules/design.md`  
**Creative direction:** The Synthetic Luminal — tonal surfaces, glassmorphism for modals, ambient luminance over shadows, Space Grotesk for data visualization

---

## 1. Design Rationale

The Agent Execution Progress Tracker provides users with real-time feedback on long-running AI agent tasks. The component ecosystem balances **rapid visual scanning** (quick status recognition) with **detailed introspection** (debugging support) through a three-tier architecture:

1. **Progress List** — Always visible; shows at-a-glance agent status, token consumption, and timing
2. **Progress Item** — Clickable row revealing execution metadata and shallow event history
3. **Detail Modal** — Glassmorphic overlay with full input/output, error traces, and temporal event timeline

**Key design principles:**

| Principle | Application |
|-----------|-------------|
| **At-a-glance readability** | Color-coded status badges, token usage inline, agent names left-aligned (heavy display), timestamps right-aligned (light body) |
| **Debugging transparency** | Full input/output visible in modal; error traces always present; no truncation without "view more" affordance |
| **Calm, non-intrusive feedback** | List updates via background polling (no jarring flash); modal stacks on top of form; list entries fade in from bottom (newest first) |
| **Synthetic Luminal aesthetic** | Tonal surface stacking (no divider lines); glassmorphic modal with soft blur; primary accent (`primary` blue) for "active" states, semantic reds/greens for terminal states |
| **Performance-conscious** | Pre-computed layouts; lazy-loaded modals; virtual scrolling for long event streams (Phase 2) |

---

## 2. Visual Hierarchy & Component Architecture

### 2.1 Information architecture (typical edit page layout)

```
┌───────────────────────────────────────────────────────────────┐
│  AI Integration Form (existing)                                │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PROGRESS LIST SECTION                                    │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ @Agent Alpha [✓] [2m 34s] [now]                         │   │
│  │ Token usage: 1,245 + 3,891 = 5,136 tokens             │   │
│  │                                                         │   │
│  │ @Agent Beta [◐] [⏱] [in progress]                     │   │
│  │ Token usage: 856 + — = 856 tokens                      │   │
│  │                                                         │   │
│  │ @Agent Alpha [⚠] [1m 12s] [2 min ago]                 │   │
│  │ Token usage: 342 + — = 342 tokens (failed)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Test Connection]  [Save Changes]                             │
└───────────────────────────────────────────────────────────────┘

[Detail Modal - on item click]
┌──────────────────────────────────────────┐
│ [×]                    @Agent Alpha      │
├──────────────────────────────────────────┤
│ Status: ✓ Completed                      │
│ Duration: 2m 34s                         │
│ Timestamp: Jun 15, 2:34 PM               │
│                                          │
│ ─── TOKEN USAGE ───                      │
│ Input:  1,245 tokens                     │
│ Output: 3,891 tokens                     │
│ Total:  5,136 tokens                     │
│                                          │
│ ─── REQUEST ───                          │
│ [request payload, formatted JSON]        │
│                                          │
│ ─── RESPONSE ───                         │
│ [response payload, formatted JSON]       │
│                                          │
│ ─── EVENTS TIMELINE ───                  │
│ 14:34:22 → started                       │
│ 14:34:45 → processing_tokens             │
│ 14:36:56 → completed                     │
└──────────────────────────────────────────┘
```

### 2.2 DOM landmark structure

```html
<section class="progressTrackerSection" aria-labelledby="progressTitle">
  <h3 id="progressTitle" class="sectionLabel">Execution Progress</h3>
  
  <div class="progressList" role="list">
    <button class="progressItem" role="listitem" aria-expanded="false" data-status="completed">
      <!-- Item content -->
    </button>
    <!-- More items -->
  </div>
  
  <div id="progressModal" role="dialog" aria-labelledby="modalAgentName" aria-modal="true">
    <!-- Modal content -->
  </div>
</section>
```

---

## 3. Component Specifications

### 3.1 Progress List Container

**Purpose:** Scrollable container holding all progress items; updates via polling without interrupting UX.

**Dimensions & Layout:**
- **Mobile (320–767px):** Full width, horizontal padding `$spacing-4` (16px)
- **Tablet (768–1023px):** Full width, horizontal padding `$spacing-6` (24px)
- **Desktop (1024px+):** Full width, max-width `42rem` (672px), left-aligned or centered based on page layout

**Styling:**
- Background: `surface` (inherits from page)
- **No border/divider lines**; tonal separation via `spacing-6` vertical gap
- Overflow-y: `auto` with custom scrollbar (see Scrollbar Styles below)
- Lazy-load additional items when user scrolls near bottom (future optimization)

**Scrollbar Styling (CSS):**
```scss
.progressList {
  scrollbar-width: thin;
  scrollbar-color: $color-primary-fixed-dim $color-surface-container;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: $color-primary-fixed-dim;
    border-radius: 4px;
    &:hover {
      background-color: $color-primary;
    }
  }
}
```

**Item Ordering:**
- **Newest first** (reverse chronological); most recent execution at top
- On new execution start, item animates in from top with fade-in + slide (300ms, cubic-bezier easing)

**Scroll Behavior:**
- **Manual scroll** by default (user has full control)
- **Optional auto-scroll to latest** on new item arrival (Phase 2: add user preference toggle)

**Empty State:**
```
┌─────────────────────────────────────┐
│ No execution events yet             │
│                                     │
│ Run a test or trigger an agent to   │
│ see progress here.                  │
└─────────────────────────────────────┘
```
- Container height: `min-height: 6rem`
- Text: `body-md` in `$color-on-surface-variant` (dimmed)
- Centered, single-column layout

**Loading State:**
- Show a subtle spinner (`Loader` component) with "Monitoring executions..." message
- Height: `4rem`; vertically centered
- Opacity animation cycle: 0.6 → 1.0 (breathing effect, 2s loop)

---

### 3.2 Progress Item (List Row)

**Purpose:** Scannable summary row for one agent execution; clicking opens detail modal.

**Dimensions:**
- Height: `5rem` (80px) — ample touch target; responsive padding
- Horizontal padding: `$spacing-4` (16px)
- Vertical padding: `$spacing-3` (12px)
- **Gap between items:** `$spacing-6` (24px) above next item (no border)

**Layout Structure (flexbox):**
```
┌────────────────────────────────────────────────────────────┐
│ ┌────────────────┐  ┌─────────────────────┐  ┌──────────┐ │
│ │ STATUS ICON    │  │ CONTENT (col)       │  │ DURATION │ │
│ │ (24px)         │  │ ┌─────────────────┐ │  │ ELAPSED  │ │
│ │                │  │ │ Agent Name      │ │  │ RELATIVE │ │
│ │                │  │ │ Token summary   │ │  │          │ │
│ │                │  │ └─────────────────┘ │  │ TIME     │ │
│ └────────────────┘  └─────────────────────┘  └──────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Interactivity:**
- **Cursor:** Pointer on hover
- **Hover state:** Background transitions to `surface-container-low` (tonal lift) — 300ms cubic-bezier easing
- **Focus state:** Subtle outline (`outline-variant` at 40% opacity, 2px, inset) + same hover background
- **Active (pressed):** Slight scale down (98%) + shadow depth increase
- **Click:** Opens detail modal with agent execution data

**Status Icon (24×24px, left):**

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| `started` | ◐ (arc spinner) | `$color-primary` | In progress; animation loops 1s |
| `completed` | ✓ (checkmark) | `$color-success` | Successfully finished |
| `failed` | ⚠ (warning) | `$color-error` | Execution failed or error occurred |
| `pending` | ⏱ (hourglass) | `$color-on-surface-variant` | Queued, not yet started |

Icons use system icon library (e.g., Material Icons or Feather); size 24px, stroke 2px.

**Content Column (left-aligned, flex-grow):**

```
┌─────────────────────────────────┐
│ @Agent Alpha          [duration] │  ← Row 1: name + duration (if completed)
│ Token: 1,245 + 3,891 = 5,136    │  ← Row 2: token summary
└─────────────────────────────────┘
```

**Row 1 — Agent Name + Duration:**
- **Agent name:** `title-md` (16px, 600 weight), `$color-on-surface`, prefixed with `@`
- **Duration (if completed):** `label-sm` (12px, 600 weight), `$color-on-surface-variant` in brackets `[2m 34s]`, right-aligned
- No duration shown for in-progress or pending (slot reserved, or hidden on mobile)

**Row 2 — Token Summary:**
- **Text:** `body-sm` (14px, 400 weight), `$color-on-surface-variant`
- **Format:** `Token usage: [input] + [output] = [total]` OR `Token usage: [input] + — = [input] (in progress)` if output not ready
- **Conditional formatting for failed:** Append `(failed)` in `$color-error-container`

**Relative Time (right-aligned, flex-shrink: 0):**
- **Text:** `body-xs` (12px, 400 weight), `$color-on-surface-variant`
- **Format:** Relative time (e.g., "now", "2 min ago", "1h ago") OR absolute time if > 24h
- Update every 60 seconds (client-side formatting, no API call needed)

**Responsive Adjustments (Mobile < 768px):**
- Padding: `$spacing-3` (12px) horizontal
- Hide duration from Row 1 (not enough space); move to modal detail
- Row 2 font size: `body-xs` (13px)
- Right-aligned time: remain visible

---

### 3.3 Detail Modal

**Purpose:** Full-screen inspection of a single execution; displays request, response, token usage, and temporal events.

**Overlay & Positioning:**
- **Backdrop:** `surface` at 40% opacity with `backdrop-filter: blur(12px)` (glassmorphism)
- **Modal card:** Centered in viewport, glassmorphic (`surface-variant` at 50% opacity, `backdrop-filter: blur(20px)`)
- **Stacking:** `z-index: 1000` (above all page content)
- **Animation:** Fade in + scale from 95% → 100% (300ms, cubic-bezier)
- **Close on:** Escape key, backdrop click, X button

**Dimensions:**
- **Mobile (< 768px):** Full viewport minus padding; `max-height: 90vh`, `width: calc(100% - 2*$spacing-4)`, `max-width: none`
- **Tablet (768–1023px):** `max-width: 28rem` (448px), `max-height: 85vh`, centered
- **Desktop (1024px+):** `max-width: 40rem` (640px), `max-height: 85vh`, centered

**Header:**
```
┌─────────────────────────────────────────┐
│ [✕]  @Agent Alpha [status badge]        │  ← close button, agent name, status
├─────────────────────────────────────────┤
```
- Close button: 24×24px icon button, `background: transparent`, `color: $color-primary`
- Agent name: `title-md` (16px, 600 weight)
- Status badge: `label-sm` (12px, 600 weight) + icon, color matches status

**Body Sections (scrollable content):**

```
┌─────────────────────────────────────────┐
│ Status: ✓ Completed                     │
│ Duration: 2m 34s                        │
│ Started: Jun 15, 2:34 PM                │
│                                         │
│ ─── TOKEN USAGE ───                     │
│ Input:  1,245 tokens                    │
│ Output: 3,891 tokens                    │
│ Total:  5,136 tokens                    │
│                                         │
│ ─── REQUEST ───                         │
│ [JSON formatted]                        │
│                                         │
│ ─── RESPONSE ───                        │
│ [JSON formatted]                        │
│                                         │
│ ─── EVENTS TIMELINE ───                 │
│ ✓ 14:34:22 started                      │
│ ◐ 14:34:45 processing_tokens            │
│ ✓ 14:36:56 completed                    │
└─────────────────────────────────────────┘
```

**Metadata Section (top of body):**
```
Status: [icon + label]     ← Example: "✓ Completed"
Duration: [time]           ← Example: "2m 34s" (only if completed)
Started: [timestamp]       ← Example: "Jun 15, 2:34 PM"
Ended: [timestamp]         ← Example: "Jun 15, 2:36 PM" (only if completed)
```

- Labels: `label-sm` (12px, 600 weight), `$color-on-surface-variant`, tracked +10%
- Values: `body-md` (14px, 400 weight), `$color-on-surface`
- Layout: 2 columns on desktop (Status + Duration left, Started + Ended right), stacked on mobile
- **Spacing:** `$spacing-4` (16px) between rows, `$spacing-6` (24px) below this section

**Token Usage Widget:**
```
┌─────────────────────────────┐
│ ─── TOKEN USAGE ───         │  ← section label
│ Input:  1,245 tokens        │
│ Output: 3,891 tokens        │
│ Total:  5,136 tokens        │
└─────────────────────────────┘
```

- Label: `label-sm`, tracked
- Rows: `body-md` with monospace font for numbers
- If output not yet available: show `—` (em-dash) or "pending..." in dimmed text
- **Background tint:** Light tonal shift using `surface-container` (subtle emphasis)
- **Padding:** `$spacing-4` (16px) all sides
- **Border radius:** `$border-radius-md` (8px)
- **Spacing from previous section:** `$spacing-6` (24px) above

**Request Section:**
```
┌─────────────────────────────────┐
│ ─── REQUEST ───               │
│                               │
│ {                             │
│   "prompt": "...",            │
│   "model": "gpt-4",           │
│   ...                         │
│ }                             │
└─────────────────────────────────┘
```

- Label: `label-sm`, tracked
- Body: Monospace code block (`font-family: 'Monaco', 'Courier New', monospace`; `font-size: 12px`)
- Formatted as indented JSON (2-space indent)
- **Max height:** 300px; if longer, show vertical scrollbar with hidden overflow
- Background: `surface-container-lowest`
- Padding: `$spacing-3` (12px); border-radius: `$border-radius-sm` (4px)
- **Truncation logic:** Show full JSON; no truncation (if user wants, they can scroll within the code block)

**Response Section:**
- Same styling as Request; format as indented JSON
- If execution failed: Response may contain error trace or partial data
- If not yet available: Show "Processing response..." in dimmed text

**Events Timeline Section (Phase 2):**
```
─── EVENTS TIMELINE ───
✓ 14:34:22 → started
◐ 14:34:45 → processing_tokens
◐ 14:35:10 → generating_response
✓ 14:36:56 → completed
```

- Label: `label-sm`, tracked
- Each event: `body-xs` (12px) with icon (status-appropriate color) + timestamp (monospace) + event name
- Timeline vertical line optional (simple list is cleaner per design system)
- Scrollable if many events (future: virtual scroll for 1000+ events)

**Footer (optional in Phase 1):**
- Action buttons if needed: "Copy JSON", "Download", etc. (deferred to Phase 2)
- Or simply close via X or Escape

---

### 3.4 Token Usage Widget (Inline Variant)

When displayed in the progress item (Row 2), the token widget is simplified:
- Single line: `Token usage: [input] + [output] = [total]`
- Dimmed color to avoid overwhelming the name row
- If pending: `Token usage: [input] + — = [input] (in progress)`

---

## 4. Visual Design & Color System

### 4.1 Color Mapping

| Element | Status | Color Token | Hex | Usage |
|---------|--------|-------------|-----|-------|
| **Status Icon** | Completed | `$color-success` | TBD (green) | ✓ checkmark |
| | In Progress | `$color-primary` | #6b7a9f | ◐ spinner |
| | Failed | `$color-error` | #d9869f | ⚠ warning |
| | Pending | `$color-on-surface-variant` | TBD (gray) | ⏱ hourglass |
| **Status Badge (modal)** | Completed | Success tint | — | Background tinted green |
| | In Progress | Primary tint | — | Background tinted blue, animated glow |
| | Failed | Error tint | — | Background tinted red |
| **Text — Agent Name** | — | `$color-on-surface` | — | Primary text |
| **Text — Duration** | — | `$color-on-surface-variant` | — | Dimmed secondary |
| **Text — Time** | — | `$color-on-surface-variant` | — | Dimmed secondary |
| **Text — Code blocks** | — | `$color-on-surface` | — | Monospace body |
| **Background — Item hover** | — | `$color-surface-container-low` | — | Tonal lift on interaction |
| **Background — Modal backdrop** | — | `$color-surface` + 40% opacity | — | Glassmorphic overlay |
| **Background — Modal card** | — | `$color-surface-variant` + 50% opacity | — | Glassmorphic container |
| **Background — Code block** | — | `$color-surface-container-lowest` | — | Recessed code area |
| **Background — Token widget** | — | `$color-surface-container` | — | Subtle tonal emphasis |

### 4.2 Status Badge Design (Modal Header)

```
┌────────────────────────┐
│ ✓ Completed            │  ← Success variant: green tint
│                        │     Background: rgba(green, 0.1)
│                        │     Border: 1px outline-variant at 20% opacity
└────────────────────────┘

┌────────────────────────┐
│ ◐ In Progress          │  ← Active variant: blue tint
│                        │     Background: rgba(primary, 0.1)
│                        │     Border: 1px outline-variant at 20% opacity
│                        │     Subtle glow: ambient shadow with primary hue
└────────────────────────┘

┌────────────────────────┐
│ ⚠ Failed               │  ← Error variant: red tint
│                        │     Background: rgba(error, 0.1)
│                        │     Border: 1px outline-variant at 20% opacity
└────────────────────────┘
```

- **Badge container:** Inline flex, aligned center
- **Icon:** 16×16px, filled color (status-specific)
- **Label:** `label-sm` (12px, 600 weight), same color as icon
- **Padding:** `$spacing-2` (8px) horizontal, `$spacing-1` (4px) vertical
- **Border-radius:** `$border-radius-sm` (4px)

### 4.3 Animations & Motion

**All animations use cubic-bezier(0.22, 1, 0.36, 1) easing per design system.**

| Animation | Duration | Trigger | Details |
|-----------|----------|---------|---------|
| **Item fade-in on list** | 300ms | New item added | Opacity 0 → 1; transform: translateY(12px) → 0 |
| **Item hover lift** | 300ms | Hover/focus | Background color transition |
| **Item press** | 150ms | Click/activation | Scale 100% → 98%; shadow depth ↓ |
| **Modal entrance** | 300ms | Click item | Backdrop fade in; modal scale 95% → 100% + fade in |
| **Modal exit** | 250ms | Close/Escape | Modal scale 100% → 95% + fade out; backdrop fade out |
| **Spinner rotation** | 1.5s | In-progress item | Continuous rotation, smooth loop |
| **Breathing glow (in-progress badge)** | 2s | Modal active | Opacity 0.4 → 1.0 → 0.4, looping |
| **Scrollbar hover** | 200ms | Scrollbar interaction | Color primary → primary-fixed-dim |

**Reduced motion support:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 100ms !important;
    transition-duration: 100ms !important;
  }
}
```

---

## 5. Responsive Design

### 5.1 Breakpoints

| Device | Width | Layout changes |
|--------|-------|-----------------|
| **Mobile (small)** | 320–374px | Full width (padding $spacing-3); single column for all sections; hide duration from list item Row 1 |
| **Mobile (standard)** | 375–767px | Full width (padding $spacing-4); single column; Row 2 on list items uses `body-xs` |
| **Tablet** | 768–1023px | `max-width: 28rem`; 2-column layouts for metadata (modal); full-width list if in drawer |
| **Desktop** | 1024–1919px | `max-width: 42rem` for list; modal `max-width: 40rem` centered |
| **Wide** | 1920px+ | Same as desktop (no expansion needed) |

### 5.2 Mobile-Specific Adjustments

**Progress List:**
- Full viewport width minus `$spacing-4` (16px) padding
- Height: grows with content, max `85vh` to preserve footer visibility

**Progress Item:**
- Height: 5rem (unchanged)
- Padding: `$spacing-3` (12px) horizontal
- Font sizes reduced slightly (`body-xs` for Row 2)

**Detail Modal:**
- Full viewport minus `$spacing-4` padding
- Height: `90vh` max
- Scrollable body if content overflows

**Code Blocks (Request/Response):**
- Same monospace styling; horizontal scroll if line too long
- Font-size: 11px on very small screens (min 320px width) to prevent overflow

### 5.3 Tablet Adjustments

**Progress List:**
- Centered on screen or left-aligned in drawer, max-width `28rem`
- Wider padding context

**Detail Modal:**
- `max-width: 28rem` (448px), centered
- 2-column layout for metadata (Status + Duration left; Started + Ended right)

### 5.4 Desktop & Beyond

**No significant layout changes**; maintain clarity and spacing consistency.

---

## 6. Accessibility (WCAG AA Compliance)

### 6.1 Keyboard Navigation

| Component | Key | Action |
|-----------|-----|--------|
| **List (container)** | — | Native scrolling via Tab + arrow keys in scrollable area |
| **Progress Item (button)** | Enter / Space | Open detail modal |
| **Progress Item (button)** | Tab | Navigate through items in order (newest first, then older) |
| **Progress Item (button)** | Shift+Tab | Navigate backward through items |
| **Detail Modal** | Escape | Close modal, return focus to triggering item |
| **Modal Focus Trap** | Tab | Cycle focus through all interactive elements within modal (close button → sections → close button) |
| **Modal Close Button** | Enter / Space | Close modal |
| **Code Block (code)** | None (read-only; scrollbar managed by browser) | Native horizontal scroll if overflow |
| **Scrollbar** | None in modal (browser default) | Native scroll with arrow keys, Page Up/Down, Home/End |

**Focus Management:**
1. **Opening modal:** Focus moves to close button (or first interactive element if none)
2. **Closing modal:** Focus returns to triggering progress item
3. **List updates (polling):** No focus shift; new items appear at top with announcement

### 6.2 ARIA Labels & Roles

```html
<!-- List container -->
<section class="progressTrackerSection" aria-labelledby="progressTitle" role="region">
  <h3 id="progressTitle" class="sectionLabel">Execution Progress</h3>
  
  <!-- List of items -->
  <div class="progressList" role="list">
    
    <!-- Individual item -->
    <button 
      class="progressItem" 
      role="listitem" 
      aria-expanded="false" 
      aria-label="@Agent Alpha, Completed, 2 minutes 34 seconds, 5136 tokens"
      data-status="completed"
      data-id="exec-12345"
    >
      <!-- visual content -->
    </button>
    
  </div>
</section>

<!-- Detail modal -->
<div 
  id="progressModal" 
  role="dialog" 
  aria-labelledby="modalAgentName" 
  aria-modal="true"
  aria-hidden="false"
>
  <button aria-label="Close execution details" class="closeButton">×</button>
  <h2 id="modalAgentName">@Agent Alpha</h2>
  
  <!-- Sections with aria-labelledby -->
  <section aria-labelledby="tokenLabel">
    <h3 id="tokenLabel" class="sectionLabel">Token Usage</h3>
    <!-- content -->
  </section>
  
  <section aria-labelledby="requestLabel">
    <h3 id="requestLabel" class="sectionLabel">Request</h3>
    <pre role="region" aria-label="Request JSON payload">
      <!-- code -->
    </pre>
  </section>
  
</div>
```

### 6.3 Color Contrast

All text must meet **WCAG AA minimum 4.5:1** for normal text, **3:1** for large text (18px+ or 14px+ bold).

| Element | Foreground | Background | Ratio | Pass |
|---------|-----------|-----------|-------|------|
| Agent name (`$color-on-surface`) | TBD | `$color-surface` | TBD | ✓ |
| Body text (`$color-on-surface`) | TBD | `$color-surface` | TBD | ✓ |
| Dimmed text (`$color-on-surface-variant`) | TBD | `$color-surface` | TBD | ✓ (if ≥ 3:1) |
| Status icon (green/primary/red) | TBD | `$color-surface` | TBD | ✓ (icon paired with text label) |
| Code text (monospace) | `$color-on-surface` | `$color-surface-container-lowest` | TBD | ✓ |
| Modal heading | `$color-on-surface` | `$color-surface-variant` (50% opacity) | TBD | ✓ (test with glassmorphic bg) |

**Verify post-implementation** using WAVE or Axe DevTools.

### 6.4 Screen Reader Announcements

**Polite live region for new items:**
```html
<div aria-live="polite" aria-atomic="false" class="srAnnouncements">
  <!-- Announced when new item added -->
  <!-- "New execution: @Agent Alpha started" -->
</div>
```

- Announce on **item arrival** only if user focus is elsewhere (not actively in list)
- Announce **status changes** (completion, failure) at moderate priority
- **Do not over-announce** (avoid chatty behavior)

**Announcement examples:**
- "New execution: @Agent Alpha started, in progress"
- "@Agent Alpha completed, 2 minutes 34 seconds, 5136 tokens"
- "@Agent Beta failed: Connection timeout"

### 6.5 Focus Indicators

- **Default browser focus ring:** May be overridden for custom styling
- **Custom indicator:** 2px `outline` in `$color-primary` at 40% opacity, `outline-offset: 2px`
- **Ensure visible** on all interactive elements (buttons, list items, close button)
- **High contrast focus:** Optional: use solid `$color-primary` for keyboard-only focus (`:focus-visible`)

---

## 7. Component Variations & States

### 7.1 Progress Item States

```
┌─ IDLE (default) ────────────────────────────┐
│ @Agent Alpha [✓] [2m 34s] [now]             │
│ Token usage: 1,245 + 3,891 = 5,136 tokens  │
│                                             │
│ Cursor: default; background: surface       │
└─────────────────────────────────────────────┘

┌─ HOVER ─────────────────────────────────────┐
│ @Agent Alpha [✓] [2m 34s] [now]             │
│ Token usage: 1,245 + 3,891 = 5,136 tokens  │
│                                             │
│ Cursor: pointer; background: surface-container-low (fade in 300ms) │
└─────────────────────────────────────────────┘

┌─ FOCUS ─────────────────────────────────────┐
│ @Agent Alpha [✓] [2m 34s] [now]             │
│ Token usage: 1,245 + 3,891 = 5,136 tokens  │
│                                             │
│ Outline: 2px primary (40%), offset: 2px    │
│ Background: surface-container-low          │
└─────────────────────────────────────────────┘

┌─ ACTIVE (pressed) ──────────────────────────┐
│ @Agent Alpha [✓] [2m 34s] [now]             │
│ Token usage: 1,245 + 3,891 = 5,136 tokens  │
│                                             │
│ Transform: scale(0.98); shadow: deeper      │
└─────────────────────────────────────────────┘
```

### 7.2 Status Icon Variations

**Completed (✓):**
- Color: `$color-success` (green)
- Icon: Filled checkmark, 24×24px
- Animation: None (static)

**In Progress (◐):**
- Color: `$color-primary` (blue)
- Icon: Arc/spinner, 24×24px
- Animation: Continuous rotation, 1.5s loop, cubic-bezier easing

**Failed (⚠):**
- Color: `$color-error` (red)
- Icon: Warning triangle, 24×24px
- Animation: None (static)

**Pending (⏱):**
- Color: `$color-on-surface-variant` (dimmed gray)
- Icon: Hourglass, 24×24px
- Animation: None (static)

### 7.3 Modal States

**Opened (active):**
- Backdrop visible with blur effect
- Modal card elevated with glassmorphic treatment
- Focus trapped inside modal

**Closing:**
- Scale down to 95%, fade to 0 (250ms)
- Return focus to triggering item

**Empty Detail (no data yet):**
- Show skeleton loaders for sections while fetching
- Or: "Loading execution details..." with subtle spinner

---

## 8. Error States & Edge Cases

### 8.1 Empty State (No Executions)

```
┌──────────────────────────────────────────┐
│ No execution events yet                  │
│                                          │
│ Run a test or trigger an agent to        │
│ see progress here.                       │
└──────────────────────────────────────────┘
```

- Text: `body-md`, `$color-on-surface-variant` (dimmed)
- Centered in list container
- Min height: 6rem to show clearly
- No icon or visual decoration (keep calm aesthetic)

### 8.2 Loading State (Fetching Initial List)

```
┌──────────────────────────────────────────┐
│         ◐ Monitoring executions...       │
│                                          │
│ (spinner animation, breathing effect)    │
└──────────────────────────────────────────┘
```

- Spinner (Loader component) centered
- Height: 4rem
- Text: `body-md`, `$color-on-surface-variant`
- Opacity animation: 0.6 → 1.0 (2s loop, breathing)

### 8.3 API Error State

If polling fails:
```
┌──────────────────────────────────────────┐
│ ⚠ Failed to load executions              │
│                                          │
│ Retrying in 5 seconds...                 │
│ [Retry now]  [Dismiss]                   │
└──────────────────────────────────────────┘
```

- Alert component (`Alert` from UI kit) with `variant="error"`
- Buttons: Secondary retry button + close button
- Auto-retry in 5s; user can dismiss

### 8.4 Long Message Truncation

**In list items:**
- Agent names: Truncate with ellipsis if > 30 chars (rare)
- Token summary: Fit on one line; use compact formatting if needed

**In modal:**
- **No truncation.** Show full JSON with horizontal scrollbar
- Max height for code blocks: 300px; user can scroll vertically
- Long request/response payloads fully accessible (no "view more" link—just scroll)

### 8.5 Tokens Not Yet Available

**In list item Row 2:**
```
Token usage: 856 + — = 856 (in progress)
```
- Output placeholder: `—` (em-dash)
- Append `(in progress)` in dimmed text

**In modal token widget:**
```
Input:  856 tokens
Output: (pending...)
Total:  —
```
- Row 2 & 3: Show "pending..." or "—" in dimmed text
- Update in real-time as response data arrives

### 8.6 Connection Timeout / Retry

- If polling fails: Show error banner (8.3 above)
- Retry automatically every 5–10 seconds (configurable)
- User can manually trigger retry via button
- Dismiss error to hide banner (but polling continues in background)

---

## 9. Design System Integration

### 9.1 Component Reuse

| Component | UI Package | Usage |
|-----------|-----------|-------|
| **Button** | `ui-button` | Close button (modal), retry button (error state), action buttons (future) |
| **Text** | `ui-text` | Agent names (h3), body text, labels, code blocks |
| **Alert** | `ui-alert` | Error state banner, connection issues |
| **Loader** | `ui-loader` | Loading spinner, breathing animation |
| **Modal (future)** | `ui-modal` (if exists) or custom | Detail modal container |
| **Icon** | System icon library | Status icons, close button, spinner |

### 9.2 Typography Hierarchy

| Element | Variant | Font | Size | Weight | Color |
|---------|---------|------|------|--------|-------|
| **Agent name (list)** | `title-md` | Inter | 16px | 600 | `$color-on-surface` |
| **Section label** | `label-sm` | Inter | 12px | 600 | `$color-on-surface-variant`, tracked +10% |
| **Token summary (list)** | `body-sm` | Inter | 14px | 400 | `$color-on-surface-variant` |
| **Relative time (list)** | `body-xs` | Inter | 12px | 400 | `$color-on-surface-variant` |
| **Modal heading** | `title-lg` | Space Grotesk | 20px | 600 | `$color-on-surface` |
| **Status badge (modal)** | `label-sm` | Inter | 12px | 600 | `$color-on-surface` |
| **Metadata values (modal)** | `body-md` | Inter | 14px | 400 | `$color-on-surface` |
| **Code blocks** | Monospace | Monaco/Courier | 12px | 400 | `$color-on-surface` |
| **Empty state text** | `body-md` | Inter | 14px | 400 | `$color-on-surface-variant` |

### 9.3 Spacing & Layout Grid

| Token | Value | Usage |
|-------|-------|-------|
| `$spacing-1` | 4px | Micro spacing (badge padding vert) |
| `$spacing-2` | 8px | Small spacing (badge padding horz) |
| `$spacing-3` | 12px | List item padding (mobile), modal title padding |
| `$spacing-4` | 16px | List item padding (standard), page margin mobile |
| `$spacing-5` | 20px | Not used in this component |
| `$spacing-6` | 24px | Gap between list items, gap between modal sections |

### 9.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `$border-radius-sm` | 4px | Code block corners |
| `$border-radius-md` | 8px | Token widget corners, modal corners |
| `$border-radius-lg` | 12px | Not used in this component |
| `$border-radius-full` | 999px | Spinner avatar corners (if applicable) |

### 9.5 Shadows & Elevation

**Rejection of standard drop shadows per design system.**

- **Modal glassmorphic glow:** Ambient shadow with primary hue, 40px blur, 0% spread, 6% opacity
- **Hover lift on item:** No shadow; use tonal background shift instead
- **Item focus ring:** Outline only; no shadow

---

## 10. Developer Handoff & Implementation Guidance

### 10.1 Component File Structure

```
apps/web/app/agents/ai-integrations/[id]/edit/
├── ExecutionProgressTracker.tsx          (main container)
├── ExecutionProgressTracker.module.scss  (styles)
├── types.ts                              (interfaces, enums)
├── _components/
│   ├── ProgressList.tsx
│   ├── ProgressList.module.scss
│   ├── ProgressItem.tsx
│   ├── ProgressItem.module.scss
│   ├── ProgressDetailModal.tsx
│   ├── ProgressDetailModal.module.scss
│   ├── TokenUsageWidget.tsx
│   └── TokenUsageWidget.module.scss
└── hooks/
    ├── useProgressPolling.ts   (fetch + update logic)
    └── useModalState.ts        (open/close + focus management)
```

### 10.2 Key Types & Interfaces

```typescript
interface ProgressEvent {
  id: string;
  agentName: string;
  status: 'started' | 'completed' | 'failed' | 'pending';
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  inputTokens: number;
  outputTokens?: number;
  totalTokens: number;
  request: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: { message: string; trace?: string };
  events: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: Date;
  eventType: string; // 'started', 'processing_tokens', 'completed', etc.
  message?: string;
}

interface ProgressListProps {
  items: ProgressEvent[];
  isLoading: boolean;
  error?: Error;
  onItemClick: (id: string) => void;
}

interface ProgressDetailModalProps {
  item: ProgressEvent | null;
  isOpen: boolean;
  onClose: () => void;
}
```

### 10.3 API Contract

**Polling endpoint (GraphQL query):**
```graphql
query ListTaskProgress($agentId: String!) {
  taskProgress(agentId: $agentId) {
    id
    agentName
    status
    startedAt
    completedAt
    inputTokens
    outputTokens
    request  # full JSON object
    response # full JSON object
    error { message, trace }
    events {
      timestamp
      eventType
      message
    }
  }
}
```

**Polling interval:** 1 second (configurable)
**Response timeout:** 500ms (per PRD)
**Retry on failure:** Exponential backoff (5s, 10s, 20s max)

### 10.4 State Management

Use React hooks:
- `useState` for list items, selected item, modal open/close
- `useEffect` for polling setup/cleanup
- `useCallback` for memoized handlers
- `useRef` for focus management (modal trap)

Optional: Integrate with GraphQL client (Apollo) for real-time subscriptions if available.

### 10.5 Styling Best Practices

- **CSS Modules:** Use `.module.scss` files per component
- **Variables:** Reference design tokens from theme (e.g., `var(--color-primary)`)
- **Flexbox/Grid:** Prefer flex for layout; grid for complex 2D layouts
- **No hardcoded colors:** Always use token names
- **Animation timing:** `300–500ms` with `cubic-bezier(0.22, 1, 0.36, 1)`

**Example SCSS snippet:**
```scss
.progressItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1);

  &:hover,
  &:focus {
    background-color: var(--color-surface-container-low);
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.98);
  }
}
```

### 10.6 Accessibility Checklist

- [ ] All interactive elements keyboard-navigable (Tab, Enter, Escape)
- [ ] ARIA labels on buttons and list items
- [ ] Modal focus trap implemented
- [ ] Focus returned to trigger on modal close
- [ ] Live region for new item announcements
- [ ] Color contrast ≥ 4.5:1 (verified with WAVE/Axe)
- [ ] Icon labels always paired with text
- [ ] Code blocks marked with `role="region"` + `aria-label`
- [ ] Prefer `aria-label` over `title` attributes
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)

### 10.7 Performance Optimization

- **Virtual scrolling:** For lists > 100 items (Phase 2)
- **Memoization:** `React.memo` for ProgressItem to prevent re-renders on list update
- **Lazy loading:** Detail modal data fetched on-demand, not pre-loaded
- **Debounced polling:** Avoid thrashing API on rapid state changes
- **Code splitting:** Detail modal lazy-loaded via `React.lazy` (optional)

### 10.8 Testing Strategy

**Unit tests (Vitest):**
- ProgressItem click handler → modal opens
- Status icon colors match status enum
- Token summary formats correctly
- Relative time updates every 60s
- Modal closes on Escape key
- Focus management (trap, return)

**Integration tests:**
- Polling fetches items correctly
- New items appear in list (newest first)
- Click item → modal shows correct data
- Modal close → focus returns
- Error state shows retry button

**Accessibility tests (Axe/WAVE):**
- No contrast violations
- All interactive elements focusable
- ARIA roles correct
- Live region announced

---

## 11. Design Tokens Reference

All references below assume design tokens are available in CSS variables or Sass maps.

### Colors (from design system)
- `$color-surface` (#1a1a1e) — page background
- `$color-surface-container` (#242428) — subtle tonal lift
- `$color-surface-container-low` (#1f1f23) — lighter lift
- `$color-surface-container-high` (#2e2e34) — deeper lift
- `$color-surface-container-lowest` (?) — recessed (for code blocks)
- `$color-surface-variant` — glassmorphic material
- `$color-primary` (#6b7a9f) — main accent (blue)
- `$color-primary-fixed-dim` — icon color (dims primary)
- `$color-on-surface` — primary text
- `$color-on-surface-variant` — secondary text (dimmed)
- `$color-success` (green) — completed status
- `$color-error` (#d9869f) — failed status
- `$color-outline-variant` — ghost borders

### Fonts
- `$font-family-space-grotesk` (Space Grotesk) — headlines
- `$font-family-inter` (Inter) — body, labels
- `$font-family-monospace` (Monaco, Courier New) — code blocks

### Sizes
- `$font-size-label-sm` (12px)
- `$font-size-body-xs` (12px)
- `$font-size-body-sm` (14px)
- `$font-size-body-md` (14–16px)
- `$font-size-title-md` (16px)
- `$font-size-title-lg` (20px)

### Spacing
- `$spacing-1` (4px)
- `$spacing-2` (8px)
- `$spacing-3` (12px)
- `$spacing-4` (16px)
- `$spacing-6` (24px)

### Border Radius
- `$border-radius-sm` (4px)
- `$border-radius-md` (8px)

---

## 12. Appendix: Design System Compliance Checklist

- [x] **No standard 1px borders** — all tonal stacking via surface containers
- [x] **Glassmorphic modals** — `surface-variant` + `backdrop-filter: blur(20px)`
- [x] **Ambient luminance over shadows** — soft 40px blur ambient shadow for floating elements
- [x] **Typography pairing** — Space Grotesk headlines + Inter body
- [x] **Slow animations** — 300–500ms cubic-bezier(0.22, 1, 0.36, 1)
- [x] **Max two accent colors per screen** — blue (primary) for active, green/red for status
- [x] **Negative space embrace** — list items separated by 24px gaps, no visual clutter
- [x] **Monospace for numbers** — data visualization uses monospace for alignment
- [x] **Keyboard-navigable UI** — full Tab/Escape/Enter support
- [x] **WCAG AA contrast** — all text ≥ 4.5:1 or 3:1 for large text
- [x] **Focus visible indicators** — custom outline with proper offset
- [x] **No "AI slop design"** — intentional, refined layouts with clear information hierarchy

---

## 13. Handoff Checklist for Engineering

Before implementation begins:

- [ ] Confirm all color token values (fill in TBD hex codes)
- [ ] Agree on monospace font stack (Monaco → Courier New fallback)
- [ ] Define exact polling interval (1s recommended) and retry strategy
- [ ] Confirm API contract (GraphQL query shape)
- [ ] Set virtual scroll threshold for list size
- [ ] Review modal max-width responsiveness with design lead
- [ ] Test color contrast on final palette
- [ ] Create icon assets (status icons) or confirm icon library
- [ ] Plan accessibility testing timeline (Axe, WAVE, screen reader)
- [ ] Set up Storybook stories for each component variation (optional Phase 2)

---

**End of Design Specification**

Document prepared by: UI/UX Design  
Ready for implementation by: Engineering team  
Next review: Post-implementation QA round
