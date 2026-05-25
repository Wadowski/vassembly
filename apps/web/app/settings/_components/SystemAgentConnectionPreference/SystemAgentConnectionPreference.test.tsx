import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SystemAgentConnectionPreference } from './SystemAgentConnectionPreference';

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();
  return {
    ...mod,
    useSystemAgentPreference: vi.fn(() => ({
      data: undefined,
      fetch: vi.fn(),
      isLoading: false,
    })),
    useAiIntegrations: vi.fn(() => ({
      data: { items: [] },
      fetch: vi.fn(),
      isLoading: false,
    })),
    useUpsertSystemAgentPreference: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
    })),
  };
});

describe('SystemAgentConnectionPreference', () => {
  it('should render empty-state guidance when no credentials exist', () => {
    render(<SystemAgentConnectionPreference />);

    expect(screen.getByText(/create your first ai connection to use system agents/i)).not.toBeNull();
    expect(screen.getByRole('link', { name: /add ai connection/i })).not.toBeNull();
  });
});
