import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlatformAgentCard } from './PlatformAgentCard';
import { SystemAgentCategory, SystemAgentStatus } from '@vassembly/ui-api-hooks';

describe('PlatformAgentCard', () => {
  it('should render platform badge, name, and run action for catalog agents', () => {
    render(
      <PlatformAgentCard
        agent={{
          id: 'agent-1',
          name: 'Code Review Assist',
          description: 'Reviews pull requests.',
          category: SystemAgentCategory.Coding,
          status: SystemAgentStatus.Active,
        }}
        onRun={vi.fn()}
      />,
    );

    expect(screen.getByText('Platform Agent')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Code Review Assist' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /run/i })).not.toBeNull();
  });

  it('should expose admin actions when isAdmin is true', () => {
    render(
      <PlatformAgentCard
        agent={{
          id: 'agent-1',
          name: 'Onboarding Guide',
          status: SystemAgentStatus.Active,
        }}
        isAdmin
        onRun={vi.fn()}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
        onTestInvoke={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /edit/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /archive/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /test invoke/i })).not.toBeNull();
  });
});
