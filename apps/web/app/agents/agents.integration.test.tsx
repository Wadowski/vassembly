import type { AgentDto } from '@vassembly/ui-api-hooks';
import { AgentCategory, AgentStatus, useAgents } from '@vassembly/ui-api-hooks';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentList } from './_components/AgentList';

const buildAgent = (overrides: Partial<AgentDto>): AgentDto => ({
  id: 'agent-1',
  name: 'Alpha',
  category: AgentCategory.Coding,
  description: 'desc',
  rule: 'rule',
  userId: 'user-1',
  status: AgentStatus.Active,
  integrationCredentialId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  removedAt: null,
  ...overrides,
});

describe('Agents workspace flows integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compose destructive dialogs atop catalog rows without losing contextual naming', async () => {
    const user = userEvent.setup();

    vi.mocked(useAgents).mockReturnValue({
      data: {
        items: [buildAgent({ id: 'ag-del', name: 'Code Review Helper' })],
        totalCount: 1,
        page: 0,
        size: 10,
      },
      isLoading: false,
      error: undefined,
      fetch: vi.fn().mockResolvedValue(undefined),
    });

    render(<AgentList />);

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button', { name: /^delete$/i }));

    expect(screen.getByRole('dialog', { name: /delete agent/i })).not.toBeNull();
    expect(screen.getByText(/are you sure you want to delete/i)).not.toBeNull();
  });

  it('should compose restorative dialogs while archived cohorts remain visible', async () => {
    const user = userEvent.setup();

    vi.mocked(useAgents).mockReturnValue({
      data: {
        items: [
          buildAgent({
            id: 'ag-arch',
            name: 'Ops Buddy',
            status: AgentStatus.Archived,
            removedAt: '2026-03-01T00:00:00.000Z',
          }),
        ],
        totalCount: 1,
        page: 0,
        size: 10,
      },
      isLoading: false,
      error: undefined,
      fetch: vi.fn().mockResolvedValue(undefined),
    });

    render(<AgentList />);

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button', { name: /^restore$/i }));

    expect(screen.getByRole('dialog', { name: /restore agent/i })).not.toBeNull();
    expect(screen.getByText(/restore .* to active status/i)).not.toBeNull();
  });
});
