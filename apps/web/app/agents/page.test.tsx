import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AgentsPage from './page';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@vassembly/ui-user-auth', () => ({
  useUserAuth: vi.fn(),
}));

import { useUserAuth } from '@vassembly/ui-user-auth';

describe('AgentsPage protected routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hide workspace catalog until authenticated sessions gate access', () => {
    vi.mocked(useUserAuth).mockReturnValue({ isAuthenticated: false, bootstrapLoading: false } as never);

    render(<AgentsPage />);

    expect(screen.queryByRole('heading', { name: /agents/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /ai integrations/i })).toBeNull();
  });

  it('should render authenticated catalog chrome once sessions satisfy ProtectedAuthRoute', () => {
    vi.mocked(useUserAuth).mockReturnValue({ isAuthenticated: true, bootstrapLoading: false } as never);

    render(<AgentsPage />);

    expect(screen.queryByRole('heading', { name: /agents/i })).not.toBeNull();
    expect(screen.queryByRole('heading', { name: /ai integrations/i })).not.toBeNull();
  });

  it('should show loading skeleton while bootstrap is in progress', () => {
    vi.mocked(useUserAuth).mockReturnValue({ isAuthenticated: false, bootstrapLoading: true } as never);

    render(<AgentsPage />);

    expect(screen.queryByRole('heading', { name: /agents/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /ai integrations/i })).toBeNull();
  });
});
