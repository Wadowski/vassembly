import React from 'react';

const colors = {
  surface: '#1a1a1e',
  surfaceContainerLowest: '#13131a',
  surfaceContainerLow: '#1f1f26',
  surfaceContainer: '#242428',
  surfaceContainerHigh: '#2e2e34',
  surfaceContainerHighest: '#383840',

  primary900: '#2c303f',
  primary800: '#41475f',
  primary700: '#565e7f',
  primary600: '#6b7a9f',
  primary500: '#8a9bbe',
  primary400: '#a1bfd3',
  primary300: '#b9cede',
  primary200: '#d1dde9',
  primary100: '#e8ecf5',
  primary50: '#f5f7fb',

  secondary900: '#3b4c2f',
  secondary800: '#50664f',
  secondary700: '#65806f',
  secondary600: '#7a9a8f',
  secondary500: '#8abfaf',
  secondary400: '#a1ccbf',
  secondary300: '#b9d9cf',
  secondary200: '#d1e6df',
  secondary100: '#e8f3ef',
  secondary50: '#f5faf8',

  error900: '#993e43',
  error800: '#a9505a',
  error700: '#b96271',
  error600: '#c97488',
  error: '#d9869f',
  error500: '#d9869f',
  error400: '#eba2bb',
  error300: '#f0bacc',
  error200: '#f5d1dd',
  error100: '#fae8ee',
  error50: '#fdf6f7',

  success900: '#3a7956',
  success800: '#4a8963',
  success700: '#5a9970',
  success600: '#6aa97d',
  success500: '#7ab98a',
  success400: '#b3dbc3',
  success300: '#c6e4d2',
  success200: '#d9ede1',
  success100: '#ecf6f0',
  success50: '#f6fbf8',

  warning900: '#896941',
  warning800: '#99794e',
  warning700: '#a9895b',
  warning600: '#b99968',
  warning500: '#c9a875',
  warning400: '#ebd7b7',
  warning300: '#f0e1c9',
  warning200: '#f5ebdb',
  warning100: '#faf5ed',
  warning50: '#fdfbf7',

  textPrimary: '#e5e5e7',
  textSecondary: '#a8a8ac',
  textTertiary: '#7a7a80',

  neutral0: '#ffffff',
  neutral10: '#f5f5f7',
  neutral20: '#e5e5e7',
};

const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '1.5rem',
  pill: '9999px',
};

const typography = {
  displayFamily: 'Space Grotesk, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif',
  bodyFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif',
};

export default {
  title: 'Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The Synthetic Luminal - Design system tokens for Vassembly',
      },
    },
  },
};

export const Colors = () => (
  <div style={{ backgroundColor: colors.surface, color: colors.textPrimary, padding: spacing['2xl'] }}>
    <h1 style={{ marginBottom: spacing['2xl'], fontFamily: typography.displayFamily, fontSize: '2.8rem' }}>
      Color Palette
    </h1>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg }}>Surface Hierarchy & Tonal Stacking</h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        Depth is built through "Tonal Stacking" - layered sheets of soft, blended materials
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md }}>
        <ColorSwatch label="surface" color={colors.surface} description="Base Level" />
        <ColorSwatch label="surface-container-low" color={colors.surfaceContainerLow} />
        <ColorSwatch label="surface-container" color={colors.surfaceContainer} description="Mid-Level" />
        <ColorSwatch label="surface-container-high" color={colors.surfaceContainerHigh} description="Top Level" />
        <ColorSwatch label="surface-container-highest" color={colors.surfaceContainerHighest} />
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>
        Primary Accent (Blue)
      </h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        Main interactive elements and highlights - Sophisticated muted blue-gray
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md }}>
        <ColorSwatch label="primary-900" color={colors.primary900} />
        <ColorSwatch label="primary-800" color={colors.primary800} />
        <ColorSwatch label="primary-700" color={colors.primary700} />
        <ColorSwatch label="primary-600" color={colors.primary600} description="primary" />
        <ColorSwatch label="primary-500" color={colors.primary500} description="primary-dim" />
        <ColorSwatch label="primary-400" color={colors.primary400} />
        <ColorSwatch label="primary-300" color={colors.primary300} />
        <ColorSwatch label="primary-200" color={colors.primary200} />
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.secondary600 }}>
        Secondary Accent (Sage)
      </h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        Alternative active highlight color - Harmonious sage green
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md }}>
        <ColorSwatch label="secondary-900" color={colors.secondary900} />
        <ColorSwatch label="secondary-800" color={colors.secondary800} />
        <ColorSwatch label="secondary-700" color={colors.secondary700} />
        <ColorSwatch label="secondary-600" color={colors.secondary600} description="secondary" />
        <ColorSwatch label="secondary-500" color={colors.secondary500} description="secondary-dim" />
        <ColorSwatch label="secondary-400" color={colors.secondary400} />
        <ColorSwatch label="secondary-300" color={colors.secondary300} />
        <ColorSwatch label="secondary-200" color={colors.secondary200} />
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg }}>Error State</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md }}>
        <ColorSwatch label="error-900" color={colors.error900} />
        <ColorSwatch label="error-800" color={colors.error800} />
        <ColorSwatch label="error-700" color={colors.error700} />
        <ColorSwatch label="error-600" color={colors.error600} />
        <ColorSwatch label="error" color={colors.error} />
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg }}>Text Hierarchy</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.surfaceContainer,
            borderRadius: borderRadius.lg,
            color: colors.textPrimary,
          }}
        >
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: spacing.sm }}>text-primary</div>
          <div style={{ fontSize: '1rem', color: colors.textPrimary }}>Primary text {colors.textPrimary}</div>
        </div>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.surfaceContainer,
            borderRadius: borderRadius.lg,
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: spacing.sm }}>text-secondary</div>
          <div style={{ fontSize: '1rem', color: colors.textSecondary }}>Secondary text {colors.textSecondary}</div>
        </div>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.surfaceContainer,
            borderRadius: borderRadius.lg,
            color: colors.textTertiary,
          }}
        >
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: spacing.sm }}>text-tertiary</div>
          <div style={{ fontSize: '1rem', color: colors.textTertiary }}>Tertiary text {colors.textTertiary}</div>
        </div>
      </div>
    </section>
  </div>
);

export const Typography = () => (
  <div style={{ backgroundColor: colors.surface, color: colors.textPrimary, padding: spacing['2xl'] }}>
    <h1 style={{ marginBottom: spacing['2xl'], fontFamily: typography.displayFamily, fontSize: '2.8rem' }}>
      Typography
    </h1>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>
        Display (Space Grotesk)
      </h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        "Voice of the AI" - Editorial entrance with geometric, futuristic feel
      </p>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Display Large</div>
        <div style={{ fontFamily: typography.displayFamily, fontSize: '3.5rem', fontWeight: 700 }}>
          Welcome to Synthetics
        </div>
      </div>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Display Medium</div>
        <div style={{ fontFamily: typography.displayFamily, fontSize: '2.8rem', fontWeight: 700 }}>
          Interface Design
        </div>
      </div>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Display Small</div>
        <div style={{ fontFamily: typography.displayFamily, fontSize: '2.25rem', fontWeight: 600 }}>
          Advanced Intelligence
        </div>
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Headings</h2>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Heading Large (32px)</div>
        <div style={{ fontFamily: typography.displayFamily, fontSize: '2rem', fontWeight: 700 }}>
          Main Section Heading
        </div>
      </div>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Heading Medium (24px)</div>
        <div style={{ fontFamily: typography.displayFamily, fontSize: '1.5rem', fontWeight: 600 }}>
          Subsection Title
        </div>
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Body Text (Inter)</h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        "The Data" - High legibility against dark backgrounds with optimal x-height
      </p>
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Body Large</div>
        <div style={{ fontFamily: typography.bodyFamily, fontSize: '1.125rem', lineHeight: 1.75 }}>
          This is body large text. It provides excellent readability for primary content areas. The high x-height of
          Inter ensures maximum legibility against our dark charcoal surfaces.
        </div>
      </div>
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>Body Medium</div>
        <div style={{ fontFamily: typography.bodyFamily, fontSize: '1rem', lineHeight: 1.75 }}>
          This is body medium text. Use this for standard content, descriptions, and regular body copy. It maintains
          clarity even at smaller sizes.
        </div>
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Labels (Inter)</h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        Category headers with ALL CAPS and tracked spacing (+10%) for "technical readout" aesthetic
      </p>
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.surfaceContainer,
          borderRadius: borderRadius.md,
          fontFamily: typography.bodyFamily,
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: colors.primary600,
        }}
      >
        Category Header Label
      </div>
    </section>
  </div>
);

export const Spacing = () => (
  <div style={{ backgroundColor: colors.surface, color: colors.textPrimary, padding: spacing['2xl'] }}>
    <h1 style={{ marginBottom: spacing['2xl'], fontFamily: typography.displayFamily, fontSize: '2.8rem' }}>
      Spacing Scale
    </h1>

    <p style={{ opacity: 0.8, marginBottom: spacing.xl }}>
      Base unit: 0.25rem (4px) - Consistent spacing for layout hierarchy. Use spacing-6 (1.5rem) for vertical white
      space between items.
    </p>

    <div style={{ display: 'grid', gap: spacing.lg }}>
      {[
        { name: 'xs (4px)', value: 4 },
        { name: 'sm (8px)', value: 8 },
        { name: 'md (16px)', value: 16 },
        { name: 'lg (24px)', value: 24 },
        { name: 'xl (32px)', value: 32 },
        { name: '2xl (48px)', value: 48 },
        { name: '3xl (64px)', value: 64 },
      ].map(({ name, value }) => (
        <div key={name}>
          <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.sm }}>{name}</div>
          <div
            style={{
              width: `${value * 4}px`,
              height: '40px',
              backgroundColor: colors.primary600,
              borderRadius: borderRadius.lg,
            }}
          />
        </div>
      ))}
    </div>
  </div>
);

export const ShadowsAndDepth = () => (
  <div style={{ backgroundColor: colors.surface, color: colors.textPrimary, padding: spacing['2xl'] }}>
    <h1 style={{ marginBottom: spacing['2xl'], fontFamily: typography.displayFamily, fontSize: '2.8rem' }}>
      Shadows & Depth
    </h1>

    <p style={{ opacity: 0.8, marginBottom: spacing.xl }}>
      We reject traditional drop shadows in favor of "Ambient Luminance" - 40px blur, 0% spread, 6% opacity, tinted
      with the primary hue.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.xl }}>
      <div
        style={{
          padding: spacing.xl,
          backgroundColor: colors.surfaceContainer,
          borderRadius: borderRadius.lg,
          boxShadow: `0 4px 12px rgba(107, 122, 159, 0.06)`,
        }}
      >
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.md }}>Shadow Small</div>
        <div>Subtle floating element glow</div>
      </div>

      <div
        style={{
          padding: spacing.xl,
          backgroundColor: colors.surfaceContainer,
          borderRadius: borderRadius.lg,
          boxShadow: `0 8px 24px rgba(107, 122, 159, 0.08)`,
        }}
      >
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.md }}>Shadow Medium</div>
        <div>Standard elevation</div>
      </div>

      <div
        style={{
          padding: spacing.xl,
          backgroundColor: colors.surfaceContainer,
          borderRadius: borderRadius.lg,
          boxShadow: `0 12px 32px rgba(107, 122, 159, 0.1)`,
        }}
      >
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.md }}>Shadow Large</div>
        <div>Elevated elements</div>
      </div>

      <div
        style={{
          padding: spacing.xl,
          backgroundColor: colors.surfaceContainer,
          borderRadius: borderRadius.lg,
          boxShadow: `0 20px 48px rgba(107, 122, 159, 0.15)`,
        }}
      >
        <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: spacing.md }}>Shadow Modal</div>
        <div>Modals and overlays</div>
      </div>
    </div>

    <section style={{ marginTop: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Tonal Stacking Depth</h2>
      <p style={{ opacity: 0.8, marginBottom: spacing.lg }}>
        Achieve lift by placing containers on different surface levels - the slight darkening creates depth
      </p>

      <div style={{ display: 'grid', gap: spacing.md }}>
        <div style={{ padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, border: `1px solid ${colors.surfaceContainerHigh}` }}>
          Base: surface ({colors.surface})
        </div>

        <div style={{ padding: spacing.md, backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, border: `1px solid ${colors.surfaceContainerHigh}` }}>
          Level 1: surface-container-low ({colors.surfaceContainerLow})
        </div>

        <div style={{ padding: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, border: `1px solid ${colors.surfaceContainerHigh}` }}>
          Level 2: surface-container ({colors.surfaceContainer})
        </div>

        <div style={{ padding: spacing.md, backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg, border: `1px solid ${colors.surfaceContainerHighest}` }}>
          Level 3: surface-container-high ({colors.surfaceContainerHigh})
        </div>

        <div style={{ padding: spacing.md, backgroundColor: colors.surfaceContainerHighest, borderRadius: borderRadius.lg, border: `1px solid ${colors.neutral20}` }}>
          Level 4: surface-container-highest ({colors.surfaceContainerHighest})
        </div>
      </div>
    </section>
  </div>
);

export const BorderRadius = () => (
  <div style={{ backgroundColor: colors.surface, color: colors.textPrimary, padding: spacing['2xl'] }}>
    <h1 style={{ marginBottom: spacing['2xl'], fontFamily: typography.displayFamily, fontSize: '2.8rem' }}>
      Border Radius
    </h1>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
      <RadiusSwatch label="none" radius={borderRadius.none} />
      <RadiusSwatch label="sm (4px)" radius={borderRadius.sm} />
      <RadiusSwatch label="md (6px)" radius={borderRadius.md} />
      <RadiusSwatch label="lg (8px)" radius={borderRadius.lg} />
      <RadiusSwatch label="xl (12px)" radius={borderRadius.xl} />
      <RadiusSwatch label="2xl (16px)" radius={borderRadius['2xl']} />
      <RadiusSwatch label="full (24px)" radius={borderRadius.full} description="Primary CTA" />
      <RadiusSwatch label="pill (9999px)" radius={borderRadius.pill} />
    </div>
  </div>
);

export const ComponentPresets = () => (
  <div style={{ backgroundColor: colors.surface, color: colors.textPrimary, padding: spacing['2xl'] }}>
    <h1 style={{ marginBottom: spacing['2xl'], fontFamily: typography.displayFamily, fontSize: '2.8rem' }}>
      Component Presets
    </h1>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Buttons</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
        <button
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: borderRadius.full,
            background: `linear-gradient(135deg, ${colors.primary600} 0%, ${colors.primary500} 100%)`,
            color: colors.neutral0,
            cursor: 'pointer',
            transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Primary Button
        </button>

        <button
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            fontSize: '1rem',
            fontWeight: 600,
            border: `1px solid rgba(255, 255, 255, 0.15)`,
            borderRadius: borderRadius.lg,
            background: 'rgba(36, 36, 40, 0.5)',
            backdropFilter: 'blur(20px)',
            color: colors.textPrimary,
            cursor: 'pointer',
            transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Secondary Button
        </button>

        <button
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            background: 'transparent',
            color: colors.primary600,
            cursor: 'pointer',
            transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Tertiary Button
        </button>
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Input Fields</h2>

      <div style={{ maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Focus to see the ghost border..."
          style={{
            width: '100%',
            padding: `${spacing.md} ${spacing.md}`,
            fontSize: '1rem',
            backgroundColor: colors.surfaceContainerHigh,
            border: '1px solid transparent',
            borderRadius: borderRadius.md,
            color: colors.textPrimary,
            transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(107, 122, 159, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107, 122, 159, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>
    </section>

    <section style={{ marginBottom: spacing['3xl'] }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: spacing.lg, color: colors.primary600 }}>Chat Bubbles</h2>

      <div style={{ maxWidth: '500px', display: 'grid', gap: spacing.md }}>
        <div
          style={{
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            backgroundColor: colors.surfaceContainer,
            color: colors.textPrimary,
            marginLeft: 'auto',
            maxWidth: '80%',
          }}
        >
          User input message
        </div>

        <div
          style={{
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            background: `linear-gradient(135deg, ${colors.secondary600} 0%, ${colors.secondary500} 100%)`,
            color: colors.neutral0,
            marginRight: 'auto',
            maxWidth: '80%',
          }}
        >
          AI response with gradient to show "active" state
        </div>
      </div>
    </section>
  </div>
);

function ColorSwatch({
  label,
  color,
  description,
}: {
  label: string;
  color: string;
  description?: string;
}) {
  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '120px',
          backgroundColor: color,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.sm,
          border: `1px solid rgba(255, 255, 255, 0.1)`,
        }}
      />
      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{color}</div>
      {description && <div style={{ fontSize: '0.75rem', opacity: 0.6, color: colors.primary600 }}>{description}</div>}
    </div>
  );
}

function RadiusSwatch({
  label,
  radius,
  description,
}: {
  label: string;
  radius: string;
  description?: string;
}) {
  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '100px',
          backgroundColor: colors.primary600,
          borderRadius: radius,
          marginBottom: spacing.sm,
        }}
      />
      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</div>
      {description && <div style={{ fontSize: '0.75rem', opacity: 0.6, color: colors.primary600 }}>{description}</div>}
    </div>
  );
}
