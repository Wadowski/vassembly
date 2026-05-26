import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlatformAgentCard } from './PlatformAgentCard';
import { SystemAgentCategory, SystemAgentStatus } from '@vassembly/ui-api-hooks';

const adminAgent = {
  id: 'agent-1',
  name: 'Code Review Assist',
  description: 'Reviews pull requests.',
  category: SystemAgentCategory.Coding,
  status: SystemAgentStatus.Active,
  rule: 'Review code carefully.',
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  removedAt: null,
};

describe('PlatformAgentCard', () => {
  it('should render platform badge, name, and run action', () => {
    render(
      <PlatformAgentCard
        agent={adminAgent}
        onRun={vi.fn()}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
        onRestore={vi.fn()}
        onTestInvoke={vi.fn()}
      />,
    );

    expect(screen.getByText('Platform Agent')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Code Review Assist' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /run/i })).not.toBeNull();
  });

  it('should expose admin actions', () => {
    render(
      <PlatformAgentCard
        agent={{
          ...adminAgent,
          name: 'Onboarding Guide',
        }}
        onRun={vi.fn()}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
        onRestore={vi.fn()}
        onTestInvoke={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /edit/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /archive/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /test invoke/i })).not.toBeNull();
  });
});
