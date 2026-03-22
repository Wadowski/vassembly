# Material Design 3 Components - Implementation Checklists & Quick References

## Quick Reference: Component Implementation Order

### Recommended Execution Sequence by Dependency

```
START HERE
    ↓
┌─────────────────────────────────────┐
│  PHASE 1: FOUNDATION (Days 1-6)     │
│  ✅ Button, Card (done)              │
│  ⏳ Text Field                        │
│  ⏳ Icon Button                       │
│  ⏳ Checkbox, Radio, Badge, Divider  │
└─────────────────────────────────────┘
    ↓ (Block: All Phase 1 complete + tested)
┌─────────────────────────────────────┐
│  PHASE 2: INTERMEDIATE (Days 7-14)  │
│  Chips → Switch → Tabs → Snackbar   │
│  → Tooltip → Dialog → App Bar       │
└─────────────────────────────────────┘
    ↓ (Block: All Phase 2 complete + integrated)
┌─────────────────────────────────────┐
│  PHASE 3: ADVANCED (Days 15-20)     │
│  Progress → Slider → Lists          │
│  → Menus → Navigation               │
└─────────────────────────────────────┘
    ↓ (Block: Accessibility audit passed)
┌─────────────────────────────────────┐
│  PHASE 4: SPECIALIZED (Days 21-26)  │
│  Date Picker → Time Picker          │
│  → Carousel → Search → Code         │
└─────────────────────────────────────┘
    ↓
  COMPLETE ✓
```

---

## Checklist: Before Starting Each Phase

### Pre-Phase 1 Checklist (Before Day 1)

- [ ] Verify `@vassembly/theme` has all required tokens:
  - [ ] Color palette (primary, secondary, surface, error, warning, success)
  - [ ] Spacing scale (xs, sm, md, lg, xl)
  - [ ] Typography (font families, sizes, weights, line heights)
  - [ ] Shadow definitions (elevation levels)
  - [ ] Border radius presets (xs, sm, md, lg, xl)
  - [ ] Opacity values (disabled, hover, focus, etc.)
  - [ ] Z-index scale
  - [ ] Breakpoints for responsive design

- [ ] Environment setup:
  - [ ] Node.js 18+ installed
  - [ ] pnpm 8+ installed
  - [ ] Workspace dependencies resolve (`pnpm install`)
  - [ ] TypeScript compiles without errors (`pnpm check-types`)
  - [ ] ESLint passes (`pnpm lint`)

- [ ] Testing setup:
  - [ ] Vitest configured and working
  - [ ] React Testing Library available
  - [ ] Can run test suite (`pnpm test`)

- [ ] Storybook setup:
  - [ ] Storybook starts (`pnpm storybook`)
  - [ ] Can create and view stories

- [ ] Create `/packages/ui/` directory if not exists
  - [ ] Verify `/packages/ui/` is in pnpm-workspace.yaml

### Pre-Phase 2 Checklist (Before Day 7)

- [ ] All Phase 1 components complete and tested
- [ ] Phase 1 components pass ESLint and TypeScript checks
- [ ] Decision made: Positioning library (Popper/Radix/custom)
- [ ] Decision made: Animation library preference
- [ ] Portal rendering approach defined
- [ ] Phase 1 Storybook stories working
- [ ] Phase 1 components in monorepo properly linked

### Pre-Phase 3 Checklist (Before Day 15)

- [ ] All Phase 2 components complete and tested
- [ ] Dialog focus trap working correctly
- [ ] Tooltip/Menu positioning works at viewport edges
- [ ] Snackbar stacking implemented
- [ ] All animations smooth and accessible
- [ ] Keyboard navigation working in Phase 2 components
- [ ] Phase 2 integrated with Phase 1 components

### Pre-Phase 4 Checklist (Before Day 21)

- [ ] All Phase 3 components complete and tested
- [ ] WCAG 2.1 AA compliance verified for Phase 3
- [ ] Accessibility audit completed
- [ ] Keyboard navigation comprehensive
- [ ] Screen reader testing done
- [ ] No a11y issues in Phase 1-3 components
- [ ] Navigation keyboard support verified

---

## Component Creation Checklist Template

Use this for creating each component:

### [ ] {ComponentName} - Creation Checklist

#### Setup (Before coding)
- [ ] Component name finalized and approved
- [ ] Props interface designed
- [ ] Variants documented (all combinations)
- [ ] Use cases identified
- [ ] Accessibility requirements listed
- [ ] Dependencies verified available

#### Implementation (Code)
- [ ] Create directory: `/packages/ui/{component-name}/`
- [ ] Copy template and update placeholders
- [ ] Implement component in `{ComponentName}.tsx`
- [ ] Implement types in `types.ts`
- [ ] Create styles in `{ComponentName}.module.scss`
- [ ] Create index exports
- [ ] Implement all variants
- [ ] Add prop validation where needed
- [ ] Add TypeScript strict types (no `any`)
- [ ] Add ARIA attributes and accessibility

#### Testing (Quality)
- [ ] Write unit tests in `{ComponentName}.test.tsx`
- [ ] Test all variants render correctly
- [ ] Test props work as expected
- [ ] Test user interactions (click, focus, etc.)
- [ ] Test accessibility (keyboard, ARIA, labels)
- [ ] Test error states and edge cases
- [ ] Achieve 80%+ test coverage
- [ ] Run ESLint: `pnpm lint` (0 warnings)
- [ ] Run TypeScript: `pnpm check-types`

#### Documentation (Stories & Guides)
- [ ] Create Storybook story: `{ComponentName}.stories.tsx`
- [ ] Document all variants in stories
- [ ] Add component description
- [ ] Add prop descriptions and examples
- [ ] Create README.md
  - [ ] Usage example
  - [ ] Props table
  - [ ] All variants documented
  - [ ] Accessibility notes
  - [ ] Related components listed

#### Polish (Final)
- [ ] No console errors/warnings
- [ ] No layout shifts or visual glitches
- [ ] Responsive on mobile (320px), tablet (768px), desktop (1920px)
- [ ] Dark mode support tested
- [ ] Performance acceptable (no jank)
- [ ] Remove debug code/comments
- [ ] Final ESLint pass
- [ ] Final TypeScript check

#### Delivery
- [ ] All files committed to git
- [ ] Linked in monorepo (`pnpm install` works)
- [ ] Package.json properly configured
- [ ] Version bumped if needed
- [ ] Ready for PR review

---

## Testing Checklist Template

For each component test file:

```typescript
// {ComponentName}.test.tsx

[ ] Basic rendering tests
  [ ] Component renders without crashing
  [ ] Component renders with default props
  [ ] Component renders with custom props
  [ ] All variants render correctly

[ ] Prop tests
  [ ] Each required prop is tested
  [ ] Optional props work when provided
  [ ] Invalid props are handled
  [ ] Default values apply correctly

[ ] Interaction tests
  [ ] Click events fire
  [ ] Focus events work
  [ ] Keyboard events (Enter, Space, Escape) work
  [ ] onChange callbacks fire with correct values

[ ] Accessibility tests
  [ ] Semantic HTML is used (button, input, etc.)
  [ ] ARIA labels are present where needed
  [ ] aria-disabled works correctly
  [ ] Tab navigation works
  [ ] Screen reader text is present
  [ ] Role attributes correct

[ ] State tests
  [ ] Component can be controlled
  [ ] Component can be uncontrolled
  [ ] State changes reflect in UI
  [ ] Disabled state prevents interaction

[ ] Edge cases
  [ ] Very long text handled
  [ ] Empty state handled
  [ ] Special characters work
  [ ] Numbers/values validated
  [ ] XSS protection (if applicable)

[ ] Integration tests
  [ ] Works with other components
  [ ] Parent-child props flow correctly
  [ ] Styling doesn't conflict
  [ ] No console warnings
```

---

## Accessibility Verification Checklist

For each component:

### Keyboard Navigation
- [ ] Tab key moves focus to component
- [ ] Tab order is logical
- [ ] Tab key moves focus away after last interactive element
- [ ] Shift+Tab goes backward
- [ ] Arrow keys work for multi-item components (select, tabs, slider)
- [ ] Enter/Space activates buttons and toggles
- [ ] Escape closes modals/overlays
- [ ] No keyboard traps (can't get stuck)

### ARIA & Semantics
- [ ] Uses semantic HTML elements (button, input, select, etc.)
- [ ] Form fields have labels
- [ ] Labels associated with inputs (htmlFor attribute)
- [ ] Icon-only buttons have aria-label
- [ ] Role attributes present where needed
- [ ] aria-expanded for toggleable content
- [ ] aria-disabled matches disabled state
- [ ] aria-pressed for toggle buttons
- [ ] aria-live for dynamic content updates
- [ ] aria-describedby for helper text
- [ ] aria-invalid for error states

### Screen Reader
- [ ] VoiceOver (macOS) announces correctly
- [ ] NVDA (Windows) announces correctly
- [ ] Landmarks identified (main, nav, etc.)
- [ ] Headings properly nested (if applicable)
- [ ] Button purpose clear
- [ ] Form field labels read
- [ ] Error messages announced
- [ ] Status updates announced

### Visual
- [ ] Focus indicator visible (outline/ring)
- [ ] Focus indicator high contrast (4.5:1)
- [ ] Color not only indicator of state (also use icons/text)
- [ ] Hover and focus states different
- [ ] Text resizes without breaking layout
- [ ] Touch targets ≥ 48px × 48px
- [ ] Color contrast 4.5:1 for text
- [ ] Icons have text labels or aria-label

---

## Phase Completion Checklist

### Phase 1 Complete When:
- [ ] Text Field, Icon Button, Checkbox, Radio Button, Badge, Divider all created
- [ ] All 6 components have 80%+ test coverage
- [ ] ESLint and TypeScript pass for all components
- [ ] All components have Storybook stories
- [ ] README with examples for each component
- [ ] Basic accessibility verified for all
- [ ] No breaking issues in monorepo

**Gate**: Approve Phase 1 before starting Phase 2

### Phase 2 Complete When:
- [ ] Chips, Switch, Tabs, Snackbar, Tooltip, Dialog, App Bar all created
- [ ] All 7 components have 75%+ test coverage
- [ ] ESLint and TypeScript pass for all components
- [ ] All components have Storybook stories
- [ ] Dialog focus trap verified working
- [ ] Tooltip/Menu positioning correct at edges
- [ ] All animations smooth
- [ ] Integration tests with Phase 1 passed

**Gate**: Approve Phase 2 before starting Phase 3

### Phase 3 Complete When:
- [ ] Lists, Menus, Progress Indicators, Slider, Navigation all created
- [ ] All 5 components have 70%+ test coverage
- [ ] ESLint and TypeScript pass for all components
- [ ] Formal accessibility audit completed
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation comprehensive
- [ ] Screen reader testing completed
- [ ] Integration tests with Phase 1-2 passed

**Gate**: Approve Phase 3 before starting Phase 4

### Phase 4 Complete When:
- [ ] Date Picker, Time Picker, Carousel, Search Field (optionally Code) all created
- [ ] All components have 65%+ test coverage
- [ ] ESLint and TypeScript pass for all components
- [ ] Performance benchmarks acceptable
- [ ] Usage examples provided
- [ ] Full integration testing completed
- [ ] Documentation complete

**Gate**: Ready for release

---

## Dependency Resolution Order

### What each component depends on:

```
PHASE 1 (No dependencies)
- Button ✅
- Card ✅
- Text Field
- Icon Button
- Checkbox
- Radio Button
- Badge
- Divider

PHASE 2 (May depend on Phase 1)
- Chips (Button, Badge)
- Switch (standalone)
- Tabs (Divider)
- Snackbar (standalone)
- Tooltip (standalone)
- Dialog (Button)
- App Bar (Icon Button)

PHASE 3 (May depend on Phase 1-2)
- Lists (Divider)
- Menus (Divider, Icon Button)
- Progress Indicators (standalone)
- Slider (standalone)
- Navigation (Icon Button, Badge)

PHASE 4 (Mostly standalone)
- Date Picker (standalone)
- Time Picker (Date Picker)
- Carousel (standalone)
- Search Field (Text Field, Chip)
- Code (standalone)
```

### If dependencies are missing:

1. Text Field used by Search but Phase 1 complete? ✓ Can proceed
2. Icon Button used by Navigation but Phase 1 complete? ✓ Can proceed
3. Button used by Dialog but Phase 1 complete? ✓ Can proceed

**Rule**: If dependency is from same or earlier phase, safe to proceed.

---

## Common Issues & Solutions

### Build Issues

**Issue**: `pnpm install` fails in new component package

**Solution**:
1. Verify `package.json` has correct name format: `@vassembly/ui-{name}`
2. Check `workspace:*` references in devDependencies
3. Run `pnpm install` from root
4. Check for circular dependencies

**Issue**: TypeScript strict mode errors

**Solution**:
1. Ensure all functions have return type annotations
2. Check for implicit `any` types
3. Use `unknown` if type truly unknown
4. Add `// @ts-expect-error` only if absolutely necessary (and documented)

### Testing Issues

**Issue**: Tests fail with "Component not found" or "Module not found"

**Solution**:
1. Verify imports use correct relative paths
2. Check `index.ts` exports the component
3. Verify `tsconfig.json` has correct `moduleResolution`
4. Run `pnpm install` to ensure dependencies linked

**Issue**: React Testing Library queries fail

**Solution**:
1. Use `screen.debug()` to see rendered output
2. Use `getByRole` instead of `getByTestId` when possible
3. Use `findBy` for async queries
4. Add `data-testid` only when semantic queries impossible

### Style Issues

**Issue**: SCSS variables not found

**Solution**:
1. Verify theme package installed: check `package.json`
2. Use correct import: `@use '@vassembly/theme' as theme`
3. Access values correctly: `theme.$color-primary`
4. Compile SCSS: check sass is in devDependencies

**Issue**: Styles not applied

**Solution**:
1. Verify SCSS module import: `import styles from './Component.module.scss'`
2. Check className applied correctly: `className={styles.classname}`
3. Use camelCase for SCSS class names
4. No CSS specificity wars (keep CSS simple)

### Accessibility Issues

**Issue**: WCAG color contrast fails

**Solution**:
1. Use theme tokens for colors
2. Test contrast ratio: 4.5:1 for text
3. Use dark mode version if needed
4. Consider background + foreground combinations

**Issue**: Keyboard navigation broken

**Solution**:
1. Ensure element is focusable (button, input, a, or tabIndex)
2. Check tab order logical (top-to-bottom, left-to-right)
3. Verify focus visible indicator present
4. Test with Tab, Shift+Tab, Arrow keys

**Issue**: Screen reader announces nothing

**Solution**:
1. Verify semantic HTML: `<button>` not `<div>`
2. Add aria-label if text not visible: `aria-label="Close dialog"`
3. Add aria-live if dynamic: `aria-live="polite"`
4. Test with actual screen reader (VoiceOver, NVDA)

---

## Performance Targets

Each component should meet these benchmarks:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Mount time | < 16ms | React DevTools Profiler |
| Re-render time | < 16ms | React DevTools Profiler |
| Bundle size | < 5KB | `npm pack` and measure |
| Time to Interactive | < 100ms | Lighthouse (if in app) |
| No layout shift | CLS = 0 | Lighthouse or visual inspection |
| Smooth animations | 60 FPS | DevTools Performance tab |

### Performance Optimization Checklist

- [ ] No unnecessary re-renders (use memo if needed)
- [ ] No computations in render
- [ ] No callbacks created in render
- [ ] Styles use CSS modules (pre-compiled)
- [ ] No large objects in props
- [ ] Events debounced if needed (e.g., search)
- [ ] Images optimized (if any)
- [ ] No console.logs in production
- [ ] Tree-shakeable exports (named exports)

---

## Code Quality Targets

### ESLint

- [ ] 0 errors
- [ ] 0 warnings
- [ ] Rules followed: `@vassembly/eslint-config`

### TypeScript

- [ ] 0 type errors
- [ ] No implicit `any`
- [ ] All functions have return types
- [ ] All props typed
- [ ] Strict mode enabled

### Test Coverage

| Phase | Target | Calculation |
|-------|--------|-------------|
| Phase 1 | 80% | Statements, branches, functions, lines |
| Phase 2 | 75% | Same |
| Phase 3 | 70% | Same |
| Phase 4 | 65% | Same |

### Code Smells to Avoid

- [ ] No copy-paste code (DRY principle)
- [ ] No deeply nested logic (max 3-4 levels)
- [ ] No massive components (max ~200 lines)
- [ ] No prop drilling (>3 levels deep)
- [ ] No magic numbers (use named constants)
- [ ] No hardcoded strings (use i18n if needed)

---

## Documentation Template for Each Component

### README Structure

```markdown
# {ComponentName}

Short 1-2 sentence description of what the component is.

## Installation

\`\`\`bash
pnpm add @vassembly/ui-{component-name}
\`\`\`

## Usage

\`\`\`tsx
import { {ComponentName} } from '@vassembly/ui-{component-name}';

export const Example = () => (
  <{ComponentName} prop="value">
    Content
  </{ComponentName}>
);
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'option1' \| 'option2' | 'option1' | Style variant |
| disabled | boolean | false | Disables interaction |
| className | string | undefined | Additional CSS class |

## Variants

### Variant Name
Description of when to use this variant.

\`\`\`tsx
<{ComponentName} variant="variantName" />
\`\`\`

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation supported
- Screen reader friendly
- Semantic HTML used

## Examples

### Basic Usage
\`\`\`tsx
// Example code
\`\`\`

### Advanced Usage
\`\`\`tsx
// Example code
\`\`\`

## Related Components

- [{RelatedComponent}]({path}) - Related component description
- [{OtherComponent}]({path}) - Other component description

## See Also

- [Storybook]({storybook-url})
- [Material Design 3 Specs](https://m3.material.io/)
```

---

## Quick Command Reference

```bash
# Root level commands
pnpm install                    # Install all dependencies
pnpm lint                       # Lint all packages
pnpm check-types               # TypeScript type check
pnpm test                       # Run all tests
pnpm storybook                  # Start Storybook dev server

# Component development (from root)
pnpm --filter @vassembly/ui-{name} test:watch
pnpm --filter @vassembly/ui-{name} lint

# Git operations
git status                      # Check uncommitted changes
git add packages/ui/{name}      # Stage component files
git commit -m "feat: add {ComponentName} component"
git push                        # Push to repository

# Monorepo inspection
pnpm list                       # List all packages
pnpm list --depth=0            # List top-level only
```

---

## Sign-Off Checklist

Before marking a phase as complete:

### Technical Lead
- [ ] Code review completed
- [ ] All tests passing
- [ ] No ESLint or TypeScript errors
- [ ] Performance acceptable
- [ ] Components integrate well

### QA/Testing
- [ ] All test coverage targets met
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] No regressions in existing components

### Accessibility
- [ ] WCAG 2.1 AA audit passed
- [ ] Keyboard navigation verified
- [ ] Screen reader tested
- [ ] Color contrast verified

### Design
- [ ] Components match Material Design 3 spec
- [ ] Variants implemented as designed
- [ ] Responsive on all breakpoints
- [ ] Dark mode support (if applicable)

### Documentation
- [ ] README complete and clear
- [ ] Storybook stories all variants shown
- [ ] Examples provided
- [ ] Accessibility notes documented

---

**Document Version**: 1.0  
**Last Updated**: March 22, 2026  
**Purpose**: Quick reference and checklists for component implementation phases
