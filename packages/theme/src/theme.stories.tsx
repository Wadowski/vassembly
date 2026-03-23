import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import './tokens/index.scss';

const getComputedTokens = () => {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  
  const getVar = (name: string) => styles.getPropertyValue(name).trim();
  
  return {
    colors: {
      primary: Object.fromEntries(
        [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100].map(shade => [
          shade,
          getVar(`--color-primary-${shade}`),
        ])
      ),
      secondary: Object.fromEntries(
        [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100].map(shade => [
          shade,
          getVar(`--color-secondary-${shade}`),
        ])
      ),
      tertiary: Object.fromEntries(
        [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100].map(shade => [
          shade,
          getVar(`--color-tertiary-${shade}`),
        ])
      ),
      neutral: Object.fromEntries(
        [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100].map(shade => [
          shade,
          getVar(`--color-neutral-${shade}`),
        ])
      ),
      error: Object.fromEntries(
        [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100].map(shade => [
          shade,
          getVar(`--color-error-${shade}`),
        ])
      ),
    },
    spacing: {
      xs: getVar('--spacing-xs'),
      sm: getVar('--spacing-sm'),
      md: getVar('--spacing-md'),
      lg: getVar('--spacing-lg'),
      xl: getVar('--spacing-xl'),
      xxl: getVar('--spacing-xxl'),
    },
    borderRadius: {
      none: getVar('--border-radius-none'),
      sm: getVar('--border-radius-sm'),
      md: getVar('--border-radius-md'),
      lg: getVar('--border-radius-lg'),
      full: getVar('--border-radius-full'),
    },
    shadows: {
      sm: getVar('--shadow-sm'),
      md: getVar('--shadow-md'),
      lg: getVar('--shadow-lg'),
      xl: getVar('--shadow-xl'),
    },
    fontFamilies: {
      sans: getVar('--font-family-sans'),
      mono: getVar('--font-family-mono'),
    },
    fontSizes: {
      xs: getVar('--font-size-xs'),
      sm: getVar('--font-size-sm'),
      base: getVar('--font-size-base'),
      lg: getVar('--font-size-lg'),
      xl: getVar('--font-size-xl'),
      xxl: getVar('--font-size-xxl'),
    },
    fontWeights: {
      regular: getVar('--font-weight-regular'),
      medium: getVar('--font-weight-medium'),
      semibold: getVar('--font-weight-semibold'),
      bold: getVar('--font-weight-bold'),
    },
    lineHeights: {
      tight: getVar('--line-height-tight'),
      normal: getVar('--line-height-normal'),
      relaxed: getVar('--line-height-relaxed'),
    },
    opacity: {
      0: getVar('--opacity-0'),
      10: getVar('--opacity-10'),
      20: getVar('--opacity-20'),
      30: getVar('--opacity-30'),
      40: getVar('--opacity-40'),
      50: getVar('--opacity-50'),
      60: getVar('--opacity-60'),
      70: getVar('--opacity-70'),
      80: getVar('--opacity-80'),
      90: getVar('--opacity-90'),
      100: getVar('--opacity-100'),
    },
    breakpoints: {
      sm: getVar('--breakpoint-sm'),
      md: getVar('--breakpoint-md'),
      lg: getVar('--breakpoint-lg'),
      xl: getVar('--breakpoint-xl'),
      xxl: getVar('--breakpoint-xxl'),
    },
    zIndex: {
      base: getVar('--z-index-base'),
      dropdown: getVar('--z-index-dropdown'),
      sticky: getVar('--z-index-sticky'),
      fixed: getVar('--z-index-fixed'),
      modal: getVar('--z-index-modal'),
      popover: getVar('--z-index-popover'),
      tooltip: getVar('--z-index-tooltip'),
    },
  };
};

const tokens = getComputedTokens();

const meta: Meta = {
  title: 'Design System/Theme',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {Object.entries(tokens.colors).map(([category, colorGroup]) => (
        <div key={category}>
          <h3 style={{ margin: '0 0 1rem 0', textTransform: 'capitalize' }}>
            {category}
          </h3>
          {typeof colorGroup === 'object' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
              {Object.entries(colorGroup).map(([shade, hex]) => (
                <div key={`${category}-${shade}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '80px',
                      backgroundColor: String(hex),
                      border: '1px solid #ccc',
                      borderRadius: '0.375rem',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
                    {shade}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontFamily: 'monospace' }}>
                    {hex}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Spacing Scale</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(tokens.spacing).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: value,
                  height: '40px',
                  backgroundColor: '#0ea5e9',
                  borderRadius: '0.375rem',
                }}
              />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: '200px' }}>
                <span style={{ fontWeight: 600, minWidth: '60px' }}>{key}</span>
                <span style={{ fontFamily: 'monospace', color: '#666' }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Border Radius</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(tokens.borderRadius).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: '#9333ea',
                  borderRadius: value,
                }}
              />
              <span style={{ fontWeight: 600 }}>{key}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Shadow Levels</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(tokens.shadows).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                style={{
                  width: '100%',
                  height: '80px',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.375rem',
                  boxShadow: value,
                  border: '1px solid #f0f0f0',
                }}
              />
              <span style={{ fontWeight: 600 }}>{key}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666', wordBreak: 'break-all' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Font Families</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(tokens.fontFamilies).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{key}</span>
              <div style={{ fontFamily: value, fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
                The quick brown fox jumps over the lazy dog
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#999' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Font Sizes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(tokens.fontSizes).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{ fontWeight: 600, minWidth: '60px' }}>{key}</span>
              <span style={{ fontSize: value }}>The quick brown fox</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Font Weights</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(tokens.fontWeights).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 600, minWidth: '100px' }}>{key}</span>
              <span style={{ fontWeight: Number(value) }}>The quick brown fox jumps over the lazy dog</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Line Heights</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(tokens.lineHeights).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 600, minWidth: '100px' }}>{key}</span>
              <div style={{ lineHeight: value, flex: 1 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                  {value}
                </span>
                <div>
                  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy
                  dog. The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Opacity: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Opacity Levels</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(tokens.opacity).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: '#0ea5e9',
                  opacity: Number(value),
                  borderRadius: '0.375rem',
                  border: '1px solid #ccc',
                }}
              />
              <span style={{ fontWeight: 600 }}>{key}%</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Breakpoints: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Responsive Breakpoints</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(tokens.breakpoints).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 600, minWidth: '120px', textTransform: 'capitalize' }}>
                {key}
              </span>
              <div
                style={{
                  flex: 1,
                  height: '30px',
                  backgroundColor: '#22c55e',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                {value}
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const ZIndex = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Z-Index Scale</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(tokens.zIndex).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 600, minWidth: '120px', textTransform: 'capitalize' }}>
                {key}
              </span>
              <div
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: '#a855f7',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const AllTokensReference = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h2>Design Tokens Reference</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          This is a complete reference of all available design tokens for the Vassembly theme system.
        </p>
      </div>

      <section>
        <h3>How to Use Tokens</h3>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>
          <strong>In TypeScript/JavaScript:</strong>
        </p>
        <pre
          style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.375rem',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {`import { colors, spacing, fontSizes } from '@vassembly/theme';\n\nconst buttonStyle = {\n  backgroundColor: colors.primary[500],\n  padding: spacing.md,\n  fontSize: fontSizes.lg,\n};`}
        </pre>
      </section>

      <section>
        <h3>CSS Variables</h3>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>
          All tokens are available as CSS variables. Call <code>injectThemeCSSVariables()</code> to inject them into the
          document root.
        </p>
        <pre
          style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.375rem',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {`import { injectThemeCSSVariables } from '@vassembly/theme';\n\ninjectThemeCSSVariables();\n\n/* In your CSS */\n.button {\n  background-color: var(--color-primary-500);\n  padding: var(--spacing-md);\n  font-size: var(--font-size-lg);\n}`}
        </pre>
      </section>
    </div>
  ),
};
