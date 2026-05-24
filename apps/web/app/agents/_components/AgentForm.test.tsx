import { AgentCategory, AgentStatus } from '@vassembly/ui-api-hooks';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AgentForm } from './AgentForm';
import { AgentFormMode } from './AgentForm.types';

describe('AgentForm', () => {
  it('should block submission until mandatory catalog metadata exists', () => {
    const handleSubmit = vi.fn();

    render(
      <AgentForm
        mode={AgentFormMode.Create}
        initialAgent={undefined}
        removedAt={null}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: /create agent/i }).hasAttribute('disabled')).toBe(true);

    fireEvent.blur(screen.getByLabelText(/name/i), { target: { value: '' } });
    expect(screen.getByText(/name is required/i)).not.toBeNull();

    fireEvent.blur(screen.getByLabelText(/category/i));
    expect(screen.getByText(/category is required/i)).not.toBeNull();

    fireEvent.blur(screen.getByLabelText(/description/i), { target: { value: '' } });
    expect(screen.getByText(/description is required/i)).not.toBeNull();

    fireEvent.blur(screen.getByLabelText(/rule/i), { target: { value: '' } });
    expect(screen.getByText(/rule is required/i)).not.toBeNull();

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should refuse oversized textual payloads mirroring PRD limits', async () => {
    const user = userEvent.setup();

    render(
      <AgentForm
        mode={AgentFormMode.Create}
        initialAgent={undefined}
        removedAt={null}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/name/i), 'x'.repeat(101));
    fireEvent.blur(screen.getByLabelText(/name/i));

    expect(screen.getByText(/name must be at most 100 characters/i)).not.toBeNull();
  });

  it('should expose immutable messaging whenever persisted agents remain archived', () => {
    render(
      <AgentForm
        mode={AgentFormMode.Edit}
        removedAt="2026-03-01T00:00:00.000Z"
        initialAgent={{
          id: 'agent-archived',
          name: 'Old Bot',
          category: AgentCategory.Utility,
          description: 'Archived copy',
          rule: 'Idle',
          userId: 'user-1',
          status: AgentStatus.Archived,
          integrationCredentialId: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          removedAt: '2026-03-01T00:00:00.000Z',
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/this agent has been deleted\. restore it to make changes\./i),
    ).not.toBeNull();

    const nameInput = screen.getByRole('textbox', { name: /name/i });
    expect(nameInput.hasAttribute('disabled')).toBe(true);

    expect(screen.getByRole('button', { name: /update agent/i }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: /^restore$/i })).not.toBeNull();
  });

  it('should hydrate editable datasets when updating healthy agents', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <AgentForm
        mode={AgentFormMode.Edit}
        removedAt={null}
        initialAgent={{
          id: 'agent-1',
          name: 'Planner',
          category: AgentCategory.Coding,
          description: 'Plans sprint',
          rule: 'Stay consistent',
          userId: 'user-1',
          status: AgentStatus.Active,
          integrationCredentialId: 'cred-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-05T00:00:00.000Z',
          removedAt: null,
        }}
        onSubmit={handleSubmit}
      />,
    );

    await user.clear(screen.getByRole('textbox', { name: /name/i }));
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Roadmapper');

    await user.click(screen.getByRole('button', { name: /update agent/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
