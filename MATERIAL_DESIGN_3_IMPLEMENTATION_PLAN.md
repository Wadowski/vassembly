# Material Design 3 UI Components - Comprehensive Implementation Plan

## Overview

This document outlines a complete, phased approach to implementing 24 Material Design 3 UI components for the Vassembly monorepo. The plan is organized into 4 implementation phases, with detailed specifications, dependency analysis, and execution sequences designed to minimize blockers and maximize code reuse.

**Total Components**: 24  
**Phases**: 4 sequential phases  
**Estimated Timeline**: 8-12 weeks (developer dependent)  
**Architecture**: Component packages in `/packages/ui/[component-name]/`  
**Design Standard**: Material Design 3 (MD3)  
**Foundation**: `@vassembly/theme` design tokens  

---

## Section 1: Component Directory & Specifications

### Phase 1: Essential Foundation Components (High Priority - 8 components)
These components form the foundation for all other components. They have minimal dependencies and are used by most other components.

#### 1.1 **Button** ✅ (Already Created)
**Status**: Complete  
**Location**: `/packages/ui/button`

**Props Interface**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  isLoading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}
```

**Features**:
- 5 MD3 button variants (filled, outlined, text, elevated, tonal)
- 3 sizes (small, medium, large)
- Icon support with flexible positioning
- Loading state with spinner
- Full-width option
- Accessibility support (ARIA labels, keyboard navigation)

**Dependencies**: None (core component)  
**Variants**: 15 (5 variants × 3 sizes)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, borderRadius  

---

#### 1.2 **Card** ✅ (Already Created)
**Status**: Complete  
**Location**: `/packages/ui/card`

**Props Interface**:
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  children?: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}
```

**Features**:
- 3 MD3 card variants (elevated, outlined, filled)
- Clickable card support
- Shadow and border handling based on variant
- Content container with proper padding

**Dependencies**: None (core component)  
**Variants**: 3 (elevated, outlined, filled)  
**Uses Theme Tokens**: colors, spacing, shadows, borderRadius  

---

#### 1.3 **Text Fields** ⏳ (Priority: HIGH)
**Location**: `/packages/ui/text-field`

**Props Interface**:
```typescript
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  multiline?: boolean;
  rows?: number;
  counter?: boolean;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
}
```

**Features**:
- 2 MD3 text field variants (outlined, filled)
- Label floating animation
- Error state with message display
- Helper text support
- Input counter for max length
- Icon support
- Multiline (textarea) support
- Full accessibility (labels, ARIA)

**Dependencies**: None  
**Variants**: 8 (2 variants × 2 sizes × 2 states: normal/error)  
**Uses Theme Tokens**: colors, typography, spacing, shadows, borderRadius  

---

#### 1.4 **Icon Button** ⏳ (Priority: HIGH)
**Location**: `/packages/ui/icon-button`

**Props Interface**:
```typescript
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  icon: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
}
```

**Features**:
- 4 MD3 icon button variants
- 3 sizes
- Optional badge (for notifications)
- Selected state
- Consistent sizing (square buttons)

**Dependencies**: None  
**Variants**: 12 (4 variants × 3 sizes)  
**Uses Theme Tokens**: colors, spacing, shadows, borderRadius  

---

#### 1.5 **Checkbox** ⏳ (Priority: HIGH)
**Location**: `/packages/ui/checkbox`

**Props Interface**:
```typescript
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  indeterminate?: boolean;
  error?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}
```

**Features**:
- Checkbox with label
- Indeterminate state
- Error state
- 2 sizes
- Keyboard accessibility
- Ripple effect

**Dependencies**: None  
**Variants**: 4 (2 sizes × 2 states: checked/unchecked + indeterminate)  
**Uses Theme Tokens**: colors, spacing, borderRadius, opacity  

---

#### 1.6 **Radio Button** ⏳ (Priority: HIGH)
**Location**: `/packages/ui/radio-button`

**Props Interface**:
```typescript
interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  value: string;
  error?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  checked?: boolean;
  onChange?: (value: string) => void;
}
```

**Features**:
- Radio button with label
- Radio group support
- Error state
- 2 sizes
- Keyboard navigation support
- Single selection in group

**Dependencies**: None  
**Variants**: 4 (2 sizes × 2 states: selected/unselected)  
**Uses Theme Tokens**: colors, spacing, borderRadius  

---

#### 1.7 **Badge** ⏳ (Priority: HIGH)
**Location**: `/packages/ui/badge`

**Props Interface**:
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
  label: string | number;
  max?: number;
  children?: React.ReactNode;
  overlap?: 'circular' | 'rectangular';
}
```

**Features**:
- Badge with number display
- Max value capping (99+, 9+, etc.)
- 5 color options
- Dot variant (no label)
- Positioned over content (overlap)
- Variants: filled, outlined

**Dependencies**: None  
**Variants**: 10 (5 colors × 2 variants)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, borderRadius  

---

#### 1.8 **Divider** ⏳ (Priority: HIGH)
**Location**: `/packages/ui/divider`

**Props Interface**:
```typescript
interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'full-width' | 'inset' | 'middle';
  thickness?: 'thin' | 'medium' | 'thick';
}
```

**Features**:
- Horizontal and vertical dividers
- 3 variants (full-width, inset, middle)
- 3 thickness options
- MD3 color and spacing

**Dependencies**: None  
**Variants**: 9 (3 variants × 3 thicknesses)  
**Uses Theme Tokens**: colors, spacing  

---

### Phase 2: Medium Priority Components (7 components)
These components depend on Phase 1 components and extend the foundational UI capabilities.

#### 2.1 **Chips** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/chip`

**Props Interface**:
```typescript
interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  label: string;
  onDelete?: () => void;
  selected?: boolean;
  disabled?: boolean;
  actionable?: boolean;
}
```

**Features**:
- 2 variants (filled, outlined)
- Icon and avatar support
- Deletable chips
- Selected state
- Disabled state
- Action chips (clickable)

**Dependencies**: None  
**Variants**: 8 (2 variants × 2 sizes × 2 states)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, borderRadius  

---

#### 2.2 **Switch** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/switch`

**Props Interface**:
```typescript
interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: boolean;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'small' | 'medium';
}
```

**Features**:
- Toggle switch
- Label support
- Icon indicators (on/off)
- Disabled state
- 2 sizes
- Smooth animation

**Dependencies**: None  
**Variants**: 4 (2 sizes × 2 states)  
**Uses Theme Tokens**: colors, spacing, shadows  

---

#### 2.3 **Tabs** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/tabs`

**Props Interface**:
```typescript
interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  scrollable?: boolean;
}

interface TabProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children: React.ReactNode;
}
```

**Features**:
- Tab navigation component
- Primary and secondary variants
- Icon and badge support
- Scrollable tabs
- Full-width option
- Active indicator

**Dependencies**: None  
**Variants**: 4 (2 variants × 2 layouts: scrollable/full-width)  
**Uses Theme Tokens**: colors, spacing, typography, shadows  

---

#### 2.4 **Snackbar** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/snackbar`

**Props Interface**:
```typescript
interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  action?: React.ReactNode;
  duration?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'success' | 'error' | 'warning';
  autoClose?: boolean;
}
```

**Features**:
- Toast notification component
- Auto-dismiss capability
- Custom action button
- Position options
- 4 variants (default, success, error, warning)
- Stacking support

**Dependencies**: None (custom positioning)  
**Variants**: 8 (4 variants × 2 auto-close states)  
**Uses Theme Tokens**: colors, spacing, typography, shadows  

---

#### 2.5 **Tooltip** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/tooltip`

**Props Interface**:
```typescript
interface TooltipProps {
  title: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  arrow?: boolean;
}
```

**Features**:
- Hover tooltip
- 4 position options
- Arrow indicator
- Customizable delay
- Auto positioning (avoid viewport edges)
- Portal rendering

**Dependencies**: None (uses Radix or custom positioning)  
**Variants**: 8 (4 positions × 2 arrow states)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, zIndex  

---

#### 2.6 **Dialog** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/dialog`

**Props Interface**:
```typescript
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: DialogAction[];
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  scroll?: 'paper' | 'body';
}

interface DialogAction {
  label: string;
  variant?: 'text' | 'outlined' | 'filled';
  onClick: () => void;
}
```

**Features**:
- Modal dialog with backdrop
- Header, content, actions layout
- Customizable size
- Scrollable content
- Close button
- Keyboard support (ESC to close)
- Focus trap

**Dependencies**: Button (for actions)  
**Variants**: 6 (3 sizes × 2 scroll options)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, zIndex  

---

#### 2.7 **App Bar** ⏳ (Priority: MEDIUM)
**Location**: `/packages/ui/app-bar`

**Props Interface**:
```typescript
interface AppBarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'small' | 'medium' | 'large';
  elevation?: 'none' | 'low' | 'medium' | 'high';
  sticky?: boolean;
  color?: 'primary' | 'surface' | 'surfaceVariant';
  children?: React.ReactNode;
}

interface AppBarActionProps {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  badge?: string | number;
}
```

**Features**:
- Header/App bar component
- 3 size variants
- Elevation options
- Sticky positioning
- Title and action areas
- Navigation icon support
- Color options

**Dependencies**: None (can use Icon Button)  
**Variants**: 9 (3 sizes × 3 elevations)  
**Uses Theme Tokens**: colors, spacing, shadows, typography, zIndex  

---

### Phase 3: Low Priority Components (5 components)
These components are less frequently used but add value for specific use cases.

#### 3.1 **Lists** ⏳ (Priority: LOW)
**Location**: `/packages/ui/list`

**Props Interface**:
```typescript
interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  variant?: 'single-line' | 'two-line' | 'three-line';
  dense?: boolean;
  children?: React.ReactNode;
}

interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  avatar?: React.ReactNode;
  headline: string;
  supporting?: string;
  trailing?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
}
```

**Features**:
- List with items
- 3 line variants
- Dense mode (compact)
- Avatar, headline, supporting, trailing areas
- Selection support
- Divider integration

**Dependencies**: None (can use Divider)  
**Variants**: 6 (3 line variants × 2 density modes)  
**Uses Theme Tokens**: colors, spacing, typography, borderRadius  

---

#### 3.2 **Menus** ⏳ (Priority: LOW)
**Location**: `/packages/ui/menu`

**Props Interface**:
```typescript
interface MenuProps {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
```

**Features**:
- Dropdown/context menu
- Positioning relative to anchor
- Icon support
- Selected/disabled states
- Keyboard navigation
- Portal rendering

**Dependencies**: None (uses Radix Popover or custom)  
**Variants**: 8 (4 positions × 2 icon variants)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, zIndex  

---

#### 3.3 **Progress Indicators** ⏳ (Priority: LOW)
**Location**: `/packages/ui/progress-indicator`

**Props Interface**:
```typescript
interface LinearProgressProps {
  variant?: 'determinate' | 'indeterminate';
  value?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error';
}

interface CircularProgressProps {
  variant?: 'determinate' | 'indeterminate';
  value?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary';
  thickness?: number;
}
```

**Features**:
- Linear progress bar
- Circular progress indicator
- Determinate and indeterminate modes
- Custom colors
- 3 sizes
- Smooth animations

**Dependencies**: None  
**Variants**: 12 (2 types × 3 sizes × 2 variants)  
**Uses Theme Tokens**: colors, spacing  

---

#### 3.4 **Slider** ⏳ (Priority: LOW)
**Location**: `/packages/ui/slider`

**Props Interface**:
```typescript
interface SliderProps {
  value: number | number[];
  onChange: (value: number | number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  range?: boolean;
  marks?: Array<{ value: number; label?: string }>;
  color?: 'primary' | 'secondary';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

**Features**:
- Range slider
- Single value or range
- Discrete and continuous modes
- Custom marks/steps
- Thumb labels
- Disabled state
- Track fill

**Dependencies**: None  
**Variants**: 6 (3 sizes × 2 modes: single/range)  
**Uses Theme Tokens**: colors, spacing, shadows  

---

#### 3.5 **Navigation Bar/Drawer** ⏳ (Priority: LOW)
**Location**: `/packages/ui/navigation` (provides both)

**Props Interface**:
```typescript
interface NavigationBarProps {
  activeItem?: string;
  onItemChange?: (itemId: string) => void;
  children?: React.ReactNode;
  position?: 'top' | 'bottom';
  labelDisplay?: 'always' | 'selected' | 'never';
}

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
  width?: number;
  children?: React.ReactNode;
}

interface NavigationItemProps {
  icon: React.ReactNode;
  label?: string;
  id: string;
  badge?: string | number;
}
```

**Features**:
- Navigation bar (bottom/top)
- Navigation drawer (sidebar)
- 3 drawer variants
- Badge support
- Label display options
- Icon + label
- Active state

**Dependencies**: Icon Button (for items)  
**Variants**: 8 (2 nav types × 4 variants)  
**Uses Theme Tokens**: colors, spacing, typography, shadows, zIndex  

---

### Phase 4: Specialized Components (4 components)
Advanced components for specific use cases.

#### 4.1 **Date/Time Pickers** ⏳ (Priority: SPECIALIZED)
**Location**: `/packages/ui/date-picker`, `/packages/ui/time-picker`

**Props Interface**:
```typescript
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  variant?: 'modal' | 'inline';
  disabled?: boolean;
  locale?: string;
}

interface TimePickerProps {
  value?: Date;
  onChange: (time: Date) => void;
  format?: '12h' | '24h';
  variant?: 'modal' | 'inline';
  disabled?: boolean;
}
```

**Features**:
- Calendar date picker
- Time picker (hours, minutes)
- Range selection option
- Modal and inline variants
- Localization support
- Keyboard navigation
- Min/max date constraints

**Dependencies**: None (utilities for date calculations)  
**Variants**: 6 (2 types × 2 picker variants × 1.5 modes)  
**Uses Theme Tokens**: colors, spacing, typography, shadows  

---

#### 4.2 **Carousel** ⏳ (Priority: SPECIALIZED)
**Location**: `/packages/ui/carousel`

**Props Interface**:
```typescript
interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  variant?: 'fill' | 'centered' | 'scroll';
  onSlideChange?: (index: number) => void;
}

interface CarouselItem {
  id: string;
  content: React.ReactNode;
  title?: string;
}
```

**Features**:
- Image/content carousel
- Auto-play capability
- Navigation arrows
- Indicator dots
- 3 layout variants
- Keyboard support
- Touch/swipe support
- Smooth transitions

**Dependencies**: None  
**Variants**: 9 (3 variants × 3 control options)  
**Uses Theme Tokens**: colors, spacing, shadows, zIndex  

---

#### 4.3 **Search** ⏳ (Priority: SPECIALIZED)
**Location**: `/packages/ui/search-field`

**Props Interface**:
```typescript
interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  loading?: boolean;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';
  disabled?: boolean;
  clearable?: boolean;
}
```

**Features**:
- Search input with clear button
- Autocomplete suggestions
- Loading state
- Debounce support (external)
- History support (optional)
- Custom filter function
- Keyboard navigation

**Dependencies**: Text Field, Chip (for suggestions)  
**Variants**: 8 (2 variants × 2 sizes × 2 input states)  
**Uses Theme Tokens**: colors, spacing, typography, shadows  

---

#### 4.4 **Code** ✅ (Already Identified)
**Location**: `/packages/ui/code`

**Props Interface**:
```typescript
interface CodeProps {
  code: string;
  language?: string;
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
  highlightLines?: number[];
  copyable?: boolean;
  maxHeight?: string;
}
```

**Features**:
- Syntax highlighting
- Language detection
- Line numbers
- Line highlighting
- Copy button
- Scrollable
- Light/dark themes

**Dependencies**: None (uses Prism or Highlight.js)  
**Variants**: 8 (2 themes × 2 line number modes × 2 highlight modes)  
**Uses Theme Tokens**: colors, spacing, typography  

---

## Section 2: Dependency Analysis

### Dependency Hierarchy

```
Phase 1 (Foundation)
├── Button
├── Card
├── Text Field
├── Icon Button
├── Checkbox
├── Radio Button
├── Badge
└── Divider

Phase 2 (Intermediate)
├── Chips (depends: Button)
├── Switch (standalone)
├── Tabs (depends: Divider)
├── Snackbar (standalone)
├── Tooltip (standalone)
├── Dialog (depends: Button)
└── App Bar (depends: Icon Button)

Phase 3 (Advanced)
├── Lists (depends: Divider)
├── Menus (depends: Divider, Icon Button)
├── Progress Indicators (standalone)
├── Slider (standalone)
└── Navigation (depends: Icon Button, Badge)

Phase 4 (Specialized)
├── Date/Time Pickers (standalone)
├── Carousel (standalone)
├── Search Field (depends: Text Field, Chip)
└── Code (standalone)
```

### Shared Infrastructure

All components depend on these shared utilities/packages:

1. **Theme Tokens** (`@vassembly/theme`)
   - Color tokens
   - Spacing system
   - Typography scales
   - Shadow values
   - Border radius presets
   - Z-index scale

2. **Style Utilities**
   - SCSS modules in each component
   - Consistent naming conventions
   - CSS variable usage from theme

3. **TypeScript Configuration**
   - `@vassembly/typescript-config`
   - Strict mode enabled
   - React 18+ types

4. **Testing Framework**
   - Vitest
   - React Testing Library
   - Test patterns documented

5. **ESLint Configuration**
   - `@vassembly/eslint-config`
   - Consistent code quality

6. **Storybook Integration**
   - Stories for each component
   - Addon support
   - Live documentation

---

## Section 3: Implementation Phases

### Phase 1: Foundation Components (Weeks 1-2)

**Objective**: Establish core UI components that other components depend on.

**Components**:
1. Text Fields
2. Icon Buttons
3. Checkbox
4. Radio Button
5. Badge
6. Divider

**Characteristics**:
- Minimal internal dependencies
- Heavy use of theme tokens
- Core building blocks
- Intensive testing required

**Time Estimate**: 10-12 days  
**Effort per Component**: 1-2 days

**Execution Sequence**:
1. **Day 1**: Text Fields (complex, needs floating label, validation)
2. **Day 2-3**: Icon Button + Checkbox (simpler, can parallelize)
3. **Day 4**: Radio Button (builds on Checkbox)
4. **Day 5**: Badge (simple, display-only)
5. **Day 6**: Divider (simplest)
6. **Days 7-12**: Testing, refinement, documentation

**Deliverables**:
- 6 component packages in `/packages/ui/`
- Storybook stories for each
- 80%+ test coverage
- README documentation
- TypeScript types

**Success Criteria**:
- All components render correctly
- Variant coverage complete
- Accessibility standards met
- Responsive on all breakpoints

---

### Phase 2: Intermediate Components (Weeks 3-4)

**Objective**: Build components that extend Phase 1 capabilities.

**Components**:
1. Chips
2. Switch
3. Tabs
4. Snackbar
5. Tooltip
6. Dialog
7. App Bar

**Characteristics**:
- Some dependencies on Phase 1
- More interaction/state management
- Some positional complexity
- Animation requirements

**Time Estimate**: 14-16 days  
**Effort per Component**: 2-3 days

**Execution Sequence**:
1. **Day 1**: Chips (reuses Button, Badge logic)
2. **Day 2**: Switch (simple toggle)
3. **Day 3-4**: Tabs (uses Divider, more complex)
4. **Day 5**: Snackbar (positioning, animations)
5. **Day 6**: Tooltip (positioning, portal)
6. **Day 7-8**: Dialog (modal complexity, focus management)
7. **Day 9**: App Bar (layout, icon buttons)
8. **Days 10-16**: Testing, refinement, integration testing

**Dependencies to Resolve**:
- Positioning library decision (Popper, Radix, custom?)
- Animation library (CSS transitions vs. Framer Motion?)
- Portal rendering approach

**Deliverables**:
- 7 component packages
- Storybook stories
- 75%+ test coverage
- Component composition examples
- Interaction patterns guide

**Success Criteria**:
- Dialog focus trapping works correctly
- Tooltip/Menu positioning works on viewport edges
- Snackbar stacking implemented
- All animations smooth and performant

---

### Phase 3: Advanced Components (Weeks 5-6)

**Objective**: Build specialized components for data display and navigation.

**Components**:
1. Lists
2. Menus
3. Progress Indicators
4. Slider
5. Navigation Bar/Drawer

**Characteristics**:
- Complex layouts
- Keyboard navigation required
- Accessibility-heavy
- Some browser API usage

**Time Estimate**: 12-14 days  
**Effort per Component**: 2.5-3 days

**Execution Sequence**:
1. **Day 1**: Progress Indicators (simple animations)
2. **Day 2**: Slider (complex interaction logic)
3. **Day 3-4**: Lists (layout, optional actions)
4. **Day 5-6**: Menus (positioning, keyboard nav)
5. **Day 7-8**: Navigation components (layout variants)
6. **Days 9-14**: Testing, accessibility audit, refinement

**Special Considerations**:
- WCAG compliance for all components
- Keyboard navigation comprehensive
- Screen reader testing

**Deliverables**:
- 5 component packages
- Accessibility audit report
- Keyboard navigation guide
- 70%+ test coverage
- Integration examples

**Success Criteria**:
- WCAG 2.1 AA compliance
- Full keyboard navigation
- Tab order logical
- Screen reader compatible

---

### Phase 4: Specialized Components (Weeks 7-8)

**Objective**: Build specialized/advanced components.

**Components**:
1. Date/Time Pickers
2. Carousel
3. Search Field
4. Code (if needed)

**Characteristics**:
- Minimal other component dependencies
- Often used with external libraries
- Complex interaction patterns
- Specific use cases

**Time Estimate**: 10-12 days  
**Effort per Component**: 2.5-3 days

**Execution Sequence**:
1. **Day 1-2**: Date Picker (calendar logic)
2. **Day 3**: Time Picker (clock/input logic)
3. **Day 4-5**: Carousel (transition logic, touch)
4. **Day 6-7**: Search Field (autocomplete, debounce)
5. **Day 8**: Code component (syntax highlighting setup)
6. **Days 9-12**: Testing, performance optimization, examples

**External Dependencies**:
- Date library (date-fns or Day.js)
- Syntax highlighting (Prism or Highlight.js)
- Carousel library or custom implementation

**Deliverables**:
- 4 component packages
- Performance benchmarks
- Usage examples
- 65%+ test coverage
- Integration guides

**Success Criteria**:
- Date picker UX smooth
- Carousel performant with many items
- Search debounce working
- No layout shift during interactions

---

## Section 4: File Structure Template

Each component package follows this consistent structure:

```
/packages/ui/{component-name}/
├── src/
│   ├── {ComponentName}.tsx           # Main component
│   ├── {ComponentName}.module.scss   # Styles
│   ├── {componentName}.stories.tsx   # Storybook stories
│   ├── {componentName}.test.tsx      # Unit tests
│   ├── types.ts                      # TypeScript interfaces
│   ├── hooks/                        # (optional) Custom hooks
│   │   └── use{ComponentName}.ts
│   ├── utils/                        # (optional) Utilities
│   │   └── helpers.ts
│   └── index.ts                      # Public exports
├── package.json                      # Package metadata
├── tsconfig.json                     # TypeScript config
├── vitest.config.ts                  # Test config
├── README.md                         # Documentation
└── .eslintrc.json                    # (optional) Local lint rules
```

### Standard package.json Template

```json
{
  "name": "@vassembly/ui-{component-name}",
  "version": "0.0.1",
  "description": "{Component} component following Material Design 3",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@storybook/react": "^10.0.0",
    "@storybook/addon-links": "^10.0.0",
    "@storybook/addon-essentials": "^10.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vassembly/eslint-config": "workspace:*",
    "@vassembly/theme": "workspace:*",
    "@vassembly/typescript-config": "workspace:*",
    "sass": "^1.69.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

### Standard types.ts Template

```typescript
import type { ReactNode } from 'react';

export interface {ComponentName}Props {
  // Component-specific props
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  // [Add more based on component]
}
```

### Standard Component Structure

```typescript
import { type {ComponentName}Props } from './types';
import styles from './{ComponentName}.module.scss';

export const {ComponentName} = ({
  // Destructured props
}: {ComponentName}Props) => {
  return (
    <div className={styles.root}>
      {/* Component content */}
    </div>
  );
};

export default {ComponentName};
```

### Standard SCSS Module Template

```scss
@use '@vassembly/theme' as theme;

.root {
  display: flex;
  align-items: center;
  padding: theme.$spacing-md;
  border-radius: theme.$border-radius-sm;
  background-color: theme.$color-surface;
  color: theme.$color-on-surface;
  
  &:hover {
    background-color: theme.$color-surface-hover;
  }
  
  &:disabled {
    opacity: theme.$opacity-disabled;
    cursor: not-allowed;
  }
}
```

### Standard Story Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { {ComponentName} } from './{ComponentName}';

type Story = StoryObj<typeof {ComponentName}>;

const meta: Meta<typeof {ComponentName}> = {
  title: 'Components/{ComponentName}',
  component: {ComponentName},
  tags: ['autodocs'],
};

export default meta;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const Variant1: Story = {
  args: {
    // Variant-specific props
  },
};
```

---

## Section 5: Prioritized Execution Roadmap

### Week 1-2: Phase 1 - Foundation Components

**Priority Order**:

| Day | Component | Reasoning |
|-----|-----------|-----------|
| 1 | Text Field | Most complex, needed by many others |
| 2 | Icon Button | Simple but needed by Phase 2 |
| 2 | Checkbox | Can parallelize with Icon Button |
| 3 | Radio Button | Builds on Checkbox knowledge |
| 3 | Badge | Simple, informational |
| 4 | Divider | Simplest, used by Phase 2 |
| 5-7 | Testing & Refinement | All Phase 1 components |
| 7-10 | Documentation | README, examples, Storybook |
| 10-14 | Polish | Bug fixes, accessibility review |

**Success Gate**: All 6 components production-ready with 80%+ test coverage

---

### Week 3-4: Phase 2 - Intermediate Components

**Priority Order**:

| Day | Component | Reasoning |
|-----|-----------|-----------|
| 1 | Chips | Reuses Button, Badge patterns |
| 2 | Switch | Simple toggle, no dependencies |
| 3-4 | Tabs | Uses Divider, organize content |
| 5 | Snackbar | Positioning/animation foundation |
| 6 | Tooltip | Extends positioning logic |
| 7-8 | Dialog | Complex: focus trap, actions, escaping |
| 9 | App Bar | Uses Icon Button, simple layout |
| 10-14 | Testing & Refinement | All Phase 2 components |
| 14-16 | Integration Testing | Test Phase 1 + Phase 2 together |

**Success Gate**: All 7 components with dialog focus management working, 75%+ test coverage

---

### Week 5-6: Phase 3 - Advanced Components

**Priority Order**:

| Day | Component | Reasoning |
|-----|-----------|-----------|
| 1 | Progress Indicators | Simple animations, foundation |
| 2 | Slider | Complex interaction, build on animations |
| 3-4 | Lists | Layout component, many variants |
| 5-6 | Menus | Uses positioning, keyboard nav |
| 7-8 | Navigation | Uses Icon Button, complex layouts |
| 9-12 | Testing & Accessibility | WCAG compliance focus |
| 12-14 | Refinement | Performance, keyboard nav verification |

**Success Gate**: All 5 components WCAG 2.1 AA compliant, 70%+ test coverage

---

### Week 7-8: Phase 4 - Specialized Components

**Priority Order**:

| Day | Component | Reasoning |
|-----|-----------|-----------|
| 1-2 | Date Picker | Most complex, calendar logic |
| 3 | Time Picker | Builds on Date Picker |
| 4-5 | Carousel | Animation, touch support |
| 6-7 | Search Field | Combines Text Field + Chips |
| 8 | Code | Syntax highlighting setup |
| 9-12 | Testing & Optimization | Performance focus |
| 12-14 | Refinement | Examples, documentation |

**Success Gate**: All 4 components with examples, performance acceptable

---

## Section 6: Common Patterns & Best Practices

### Pattern 1: Component Composition

```typescript
// Example: Dialog using Button and Divider
const Dialog = ({ onClose, children, actions }: DialogProps) => (
  <>
    <Divider orientation="horizontal" />
    <div className={styles.content}>
      {children}
    </div>
    <Divider orientation="horizontal" />
    <div className={styles.actions}>
      {actions?.map(action => (
        <Button key={action.label} {...action} />
      ))}
    </div>
  </>
);
```

### Pattern 2: Props Extension

```typescript
// Extend native HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text';
  // Custom props only
}
```

### Pattern 3: Compound Components

```typescript
// For Tabs: Tab group with individual Tab items
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tab label="Tab 1" value="tab1" />
  <Tab label="Tab 2" value="tab2" />
</Tabs>
```

### Pattern 4: Controlled & Uncontrolled

```typescript
// Support both controlled and uncontrolled
interface TextFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}
```

### Pattern 5: Flexible Styling

```typescript
// Allow className override
export const Button = ({ className, ...props }: ButtonProps) => (
  <button 
    className={clsx(styles.root, className)} 
    {...props}
  />
);
```

---

## Section 7: Testing Strategy

### Unit Test Coverage Targets

- **Phase 1**: 80% - Foundation needs solid coverage
- **Phase 2**: 75% - Intermediate complexity
- **Phase 3**: 70% - Accessibility tested separately
- **Phase 4**: 65% - Specialized use cases

### Test Types

1. **Rendering Tests**: Component renders with props
2. **Interaction Tests**: Click, focus, keyboard events
3. **State Tests**: State changes correctly
4. **Accessibility Tests**: ARIA, keyboard navigation, labels
5. **Visual Tests**: (Optional) Snapshot testing for static components

### Example Test Template

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables when disabled prop is set', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## Section 8: Accessibility Requirements

### WCAG 2.1 Standards

All components must meet WCAG 2.1 Level AA:

#### Keyboard Navigation
- Tab order logical and visible
- Escape key closes modals
- Arrow keys for select/multi-item components
- Enter/Space for activation

#### ARIA Implementation
- Role attributes for complex components
- aria-label for icon-only buttons
- aria-expanded for expandable components
- aria-disabled for disabled state
- aria-live for dynamic updates

#### Screen Reader
- Semantic HTML (button, input, etc.)
- Meaningful button text or labels
- Form field labels associated
- Status updates announced

#### Focus Management
- Focus indicator visible
- Focus trap in modals
- Focus restoration after close
- Focus outline meets contrast

### Components Needing Special Attention

1. **Dialog**: Focus trap, ESC handling, backdrop
2. **Menu**: Keyboard navigation, focus management
3. **Tabs**: Arrow key navigation, role="tablist"
4. **Slider**: Arrow keys, ARIA value properties
5. **Date Picker**: Calendar keyboard support
6. **Navigation**: Landmark roles, active state indication

---

## Section 9: Build & Deployment

### Pre-release Checklist

For each component:
- [ ] TypeScript types complete and exported
- [ ] 80%+ test coverage (Phase 1), 70%+ (Phase 3+)
- [ ] Storybook stories document all variants
- [ ] README with usage examples
- [ ] Accessibility audit passed
- [ ] ESLint passes with 0 warnings
- [ ] No console errors/warnings in Storybook
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode support (if applicable)
- [ ] Performance tested (no layout shifts)

### Publishing

1. Update `package.json` version
2. Ensure workspace dependencies resolve
3. Build and test: `pnpm build && pnpm test`
4. Create git tag: `git tag ui-{component}-v0.0.1`
5. Push to repository

### Version Strategy

- Start at `0.0.1`
- Use semantic versioning: MAJOR.MINOR.PATCH
- Batch components into releases when related

---

## Section 10: Documentation & Knowledge

### Deliverables per Phase

1. **Component README** (each component)
   - What it is
   - When to use it
   - Props documentation
   - Usage examples
   - Accessibility notes

2. **Storybook Documentation**
   - Interactive component examples
   - All variants demonstrated
   - Props table
   - Description and notes

3. **Architecture Documentation**
   - How components compose
   - Patterns used
   - Design decisions
   - Performance considerations

4. **Migration Guides** (for updates)
   - Breaking changes listed
   - Migration steps
   - Examples before/after

### Example README Structure

```markdown
# {Component Name}

Short description of component.

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
| variant | 'filled' \| 'outlined' | 'filled' | Component style |
| disabled | boolean | false | Disable interaction |

## Variants

### Filled
\`\`\`tsx
<{ComponentName} variant="filled" />
\`\`\`

## Accessibility

- Uses semantic HTML
- Keyboard navigable
- ARIA labels included
- WCAG 2.1 AA compliant

## Related

- [{RelatedComponent}]({path})
```

---

## Section 11: Risk Mitigation

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Positioning library selection delays Phase 2 | Medium | High | Evaluate options in Week 1, decide by Day 7 |
| Browser compatibility issues | Low | High | Test on Chrome, Firefox, Safari, Edge early |
| Performance degradation with complex components | Medium | Medium | Profile and optimize during development |
| Accessibility compliance gaps | Medium | High | Conduct audit in Phase 3, fix before Phase 4 |
| Theme token gaps discovered mid-phase | Low | Medium | Review all Phase 1 tokens before starting Phase 2 |
| Testing framework limitations | Low | Medium | Evaluate Vitest + Testing Library in Week 1 |

### Contingency Plans

1. **If positioning library decision blocked**: Use custom CSS Grid/Flexbox positioning initially
2. **If accessibility issues found**: Add sprint between phases for fixes
3. **If performance issues emerge**: Implement virtualization, lazy loading
4. **If theme tokens insufficient**: Create extended tokens within theme package

---

## Section 12: Success Metrics

### Quantitative Metrics

- **Code Quality**: 0 ESLint warnings, 75%+ average test coverage
- **Performance**: Component render time < 16ms (60 FPS)
- **Accessibility**: 100% WCAG 2.1 AA compliance (automated + manual)
- **Documentation**: 100% of components have README + Storybook stories
- **Type Safety**: 0 use of `any`, TypeScript strict mode enabled

### Qualitative Metrics

- Components are easy to use and understand
- API is consistent across all components
- Error messages are helpful
- Storybook examples are clear and comprehensive
- Developers report high satisfaction

---

## Appendix A: Component Quick Reference

| # | Component | Phase | Priority | Status | Dependencies | Est. Time |
|---|-----------|-------|----------|--------|--------------|-----------|
| 1 | Button | 1 | HIGH | ✅ | None | - |
| 2 | Card | 1 | HIGH | ✅ | None | - |
| 3 | Text Field | 1 | HIGH | ⏳ | None | 1-2 days |
| 4 | Icon Button | 1 | HIGH | ⏳ | None | 1 day |
| 5 | Checkbox | 1 | HIGH | ⏳ | None | 1 day |
| 6 | Radio Button | 1 | HIGH | ⏳ | Checkbox | 1 day |
| 7 | Badge | 1 | HIGH | ⏳ | None | 0.5 day |
| 8 | Divider | 1 | HIGH | ⏳ | None | 0.5 day |
| 9 | Chips | 2 | MEDIUM | ⏳ | Button, Badge | 2 days |
| 10 | Switch | 2 | MEDIUM | ⏳ | None | 1 day |
| 11 | Tabs | 2 | MEDIUM | ⏳ | Divider | 2 days |
| 12 | Snackbar | 2 | MEDIUM | ⏳ | None | 1.5 days |
| 13 | Tooltip | 2 | MEDIUM | ⏳ | None | 1.5 days |
| 14 | Dialog | 2 | MEDIUM | ⏳ | Button | 2 days |
| 15 | App Bar | 2 | MEDIUM | ⏳ | Icon Button | 1.5 days |
| 16 | Lists | 3 | LOW | ⏳ | Divider | 2 days |
| 17 | Menus | 3 | LOW | ⏳ | Icon Button, Divider | 2.5 days |
| 18 | Progress Indicators | 3 | LOW | ⏳ | None | 1.5 days |
| 19 | Slider | 3 | LOW | ⏳ | None | 2 days |
| 20 | Navigation | 3 | LOW | ⏳ | Icon Button, Badge | 2.5 days |
| 21 | Date Picker | 4 | SPECIALIZED | ⏳ | None | 2.5 days |
| 22 | Time Picker | 4 | SPECIALIZED | ⏳ | Date Picker | 1.5 days |
| 23 | Carousel | 4 | SPECIALIZED | ⏳ | None | 2 days |
| 24 | Search Field | 4 | SPECIALIZED | ⏳ | Text Field, Chip | 2.5 days |

**Total Estimated Effort**: 48-56 developer days (8-10 weeks for one developer)

---

## Appendix B: Glossary

- **MD3**: Material Design 3, Google's latest design system
- **Component Package**: Individual npm package for a UI component
- **Variant**: Different visual or behavioral state of a component
- **Props**: React component properties/input parameters
- **Theme Tokens**: Design system values (colors, spacing, etc.)
- **WCAG**: Web Content Accessibility Guidelines
- **ARIA**: Accessible Rich Internet Applications attributes
- **ESLint**: JavaScript linter for code quality
- **Storybook**: UI component documentation tool
- **Vitest**: JavaScript test runner

---

## Appendix C: External Resources

- [Material Design 3 Documentation](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Documentation](https://react.dev/)
- [MDN Web Docs - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Storybook Documentation](https://storybook.js.org/)
- [Vitest Documentation](https://vitest.dev/)

---

**Document Version**: 1.0  
**Last Updated**: March 22, 2026  
**Owner**: Project Manager  
**Status**: Ready for Implementation
