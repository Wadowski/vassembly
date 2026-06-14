import { describe, expect, it } from 'vitest';
import { resolveLayoutConfig } from './resolveLayoutConfig';

describe('resolveLayoutConfig', () => {
  it('omits Agents from drawer when user is not authenticated', () => {
    const config = resolveLayoutConfig({
      variant: 'main',
      drawer: { isAuthenticated: false },
    });

    const workspace = config.drawer.sections.find((section) => section.id === 'workspace');
    const itemIds = workspace?.items.map((item) => item.id) ?? [];

    expect(itemIds).toEqual(['home']);
  });

  it('includes Agents in drawer when user is authenticated', () => {
    const config = resolveLayoutConfig({
      variant: 'main',
      drawer: { isAuthenticated: true },
    });

    const workspace = config.drawer.sections.find((section) => section.id === 'workspace');
    const itemIds = workspace?.items.map((item) => item.id) ?? [];

    expect(itemIds).toEqual(['home', 'agents', 'mcps']);
  });

  it('keeps explicit drawer sections override', () => {
    const config = resolveLayoutConfig({
      variant: 'main',
      drawer: {
        isAuthenticated: true,
        sections: [
          {
            id: 'custom',
            label: 'Custom',
            items: [{ kind: 'link', id: 'only', label: 'Only', href: '/only' }],
          },
        ],
      },
    });

    expect(config.drawer.sections).toHaveLength(1);
    expect(config.drawer.sections[0]?.id).toBe('custom');
  });
});
