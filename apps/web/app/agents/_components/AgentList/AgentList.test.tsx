import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AgentList } from './AgentList';

describe('AgentList', () => {
  it('should render headline toolbar controls aligned with catalog workflows', () => {
    render(<AgentList />);

    expect(screen.getByRole('heading', { name: /my agents/i })).not.toBeNull();
    expect(screen.getByText(/create, configure, and manage agents/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /create agent/i })).not.toBeNull();
    expect(screen.getByPlaceholderText(/search by name or description/i)).not.toBeNull();
  });

  it('should reserve semantic table columns for agent meta summaries', () => {
    render(<AgentList />);

    expect(screen.getByRole('columnheader', { name: /name/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /status/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /category/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /description/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /actions/i })).not.toBeNull();
  });
});
