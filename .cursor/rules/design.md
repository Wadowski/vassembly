# Design System Strategy: The Synthetic Luminal

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Synthetic Luminal."**

We are moving away from the "SaaS-standard" dashboard look. This system treats the interface not as a flat screen, but as a deep, atmospheric void where information emerges through light and refraction. By leveraging high-contrast neon accents against a multi-layered charcoal abyss, we create a sense of advanced intelligence that feels both boundless and precise.

To break the "template" feel, we employ **intentional asymmetry**: heavy left-aligned display type balanced by floating, glassmorphic utility modules on the right. We use overlapping elements—where a chat bubble might subtly bleed over a container boundary—to suggest a fluid, non-rigid AI experience.

## 2. Colors & Surface Philosophy
The palette is rooted in the `surface` (#0e0e0e), a near-black that provides the infinite canvas for our neon "light" tokens.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To define boundaries, designers must use tonal shifts. A `surface-container-low` section sitting on a `surface` background creates a sophisticated, soft-edge transition that feels integrated rather than partitioned.

### Surface Hierarchy & Nesting
Depth is built through "Tonal Stacking." Instead of a flat grid, treat the UI as layered sheets of smoked glass:
* **Base Level:** `surface` (#0e0e0e) for the main application background.
* **Mid-Level (Content Groups):** `surface-container` (#1a1a1a) for secondary navigation or grouping.
* **Top Level (Interactive Cards):** `surface-container-high` (#20201f) to draw the user’s eye to primary tasks.

### The "Glass & Gradient" Rule
Floating elements (Modals, Hover Tooltips, AI Response Bubbles) must utilize **Glassmorphism**. Use a semi-transparent `surface-variant` with a `backdrop-filter: blur(20px)`.
* **Signature Textures:** Apply a subtle linear gradient to primary CTAs transitioning from `primary` (#491ec0) to `primary-container` (#6c9fff) at a 135-degree angle. This injects "digital soul" into the interface, mimicking the glow of a high-end display.

## 3. Typography
Our typography pairing balances technical precision with editorial authority.

* **Display & Headlines (Space Grotesk):** This is our "Voice of the AI." Its geometric quirks feel futuristic and bespoke. Use `display-lg` for welcome states to create a high-impact, editorial entrance.
* **Body & Labels (Inter):** Inter handles the "Data." Its high x-height ensures maximum legibility against dark backgrounds.
* **Hierarchy Tip:** Use `label-sm` in `primary` color (all caps, tracked out +10%) for category headers to create a "technical readout" aesthetic that feels organized and premium.

## 4. Elevation & Depth
We reject traditional drop shadows in favor of **Ambient Luminance.**

* **The Layering Principle:** Achieve lift by placing a `surface-container-lowest` card on a `surface-container-low` section. The slight darkening creates a "recessed" look, while higher tiers create a "protruding" look.
* **Ambient Shadows:** When a float is required, use a shadow with a 40px blur, 0% spread, and 6% opacity, tinted with the `primary` hue. It should look like the element is casting a faint glow on the surface below, not a heavy shadow.
* **The "Ghost Border" Fallback:** If a container requires a hard edge for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components

### Buttons
* **Primary:** A gradient-fill of `primary` to `primary-dim`. No border. `xl` roundedness (1.5rem) for a friendly, modern feel.
* **Secondary:** Glassmorphic. `surface-variant` at 40% opacity with a `backdrop-blur`.
* **Tertiary:** Pure text using `primary` color with a `title-sm` weight.

### Input Fields
* **Styling:** Use `surface-container-highest`. No visible border in the rest state. Upon focus, animate a 1px "Ghost Border" using `primary` at 40% opacity and add a subtle outer glow.
* **Error State:** Use `error` (#ff6e84) for text and a faint `error_container` wash for the background.

### Cards & Lists
* **Rule:** Forbid divider lines. Use `spacing-6` (1.5rem) of vertical white space to separate items.
* **AI Chat Bubbles:** Use `secondary-container` for AI responses to distinguish them from user inputs (`surface-variant`). Apply a slight gradient to the AI bubble to make the response feel "active."

### Specialized Component: The "Neural Pulse"
For the AI assistant's active state, use a floating sphere using a radial gradient of `secondary` (#369394) to `primary` (#491ec0) with a `blur-xl` filter, creating a soft, breathing light effect.

## 6. Do's and Don'ts

### Do
* **Do** use `spaceGrotesk` for all numbers and data visualizations to maintain the "Synthetic" brand voice.
* **Do** embrace negative space. If a screen feels "empty," increase the typography size of the headline rather than adding more boxes.
* **Do** use `primary_fixed_dim` for icons to ensure they pop against the dark charcoal surfaces.

### Don't
* **Don't** use pure black (#000000) except for the absolute `surface_container_lowest`. It kills the depth of the charcoal theme.
* **Don't** use "default" system transitions. All animations should be slightly slower (300ms-500ms) with a `cubic-bezier(0.22, 1, 0.36, 1)` easing to feel "liquid."
* **Don't** use more than two neon accent colors on a single screen. Choose either the Blue (`primary`) or Violet (`secondary`) as the "active" highlight to maintain premium restraint.