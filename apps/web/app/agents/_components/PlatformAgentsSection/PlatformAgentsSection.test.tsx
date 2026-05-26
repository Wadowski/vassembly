import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SYSTEM_AGENTS_CREATE_PATH } from '../../systemAgentRoutes';
import { PlatformAgentsSection } from './PlatformAgentsSection';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('./usePlatformAgentsSection', () => ({
  usePlatformAgentsSection: vi.fn(() => ({
    filters: {
      searchInput: '',
      handleSearchChange: vi.fn(),
      handleStatusChange: vi.fn(),
      handleCategoryChange: vi.fn(),
      clearSearch: vi.fn(),
      statusFilter: 'active',
      categoryFilter: 'all',
    },
    agents: [],
    isLoading: false,
    isEmpty: true,
    isFilteredEmpty: false,
    archiveOpen: false,
    restoreOpen: false,
    invokeOpen: false,
    focusAgent: null,
    focusAgentName: '',
    isArchiveBusy: false,
    isRestoreBusy: false,
    openArchiveFor: vi.fn(),
    openRestoreFor: vi.fn(),
    openInvokeFor: vi.fn(),
    closeArchive: vi.fn(),
    closeRestore: vi.fn(),
    closeInvoke: vi.fn(),
    confirmArchive: vi.fn(),
    confirmRestore: vi.fn(),
  })),
}));

describe('PlatformAgentsSection', () => {
  it('should render admin platform agents controls', () => {
    render(<PlatformAgentsSection />);

    expect(screen.getByRole('heading', { name: /platform agents/i })).not.toBeNull();
    expect(
      screen.getByText(/governed agents provided by your organization/i),
    ).not.toBeNull();
    expect(screen.getByPlaceholderText(/search platform agents/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /create system agent/i })).not.toBeNull();
    expect(screen.getByText(/no system agents yet/i)).not.toBeNull();
  });

  it('should reserve semantic table columns for platform agent summaries', () => {
    render(<PlatformAgentsSection />);

    expect(screen.getByRole('columnheader', { name: /name/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /status/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /category/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /description/i })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: /actions/i })).not.toBeNull();
  });

  it('should navigate to create page when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<PlatformAgentsSection />);

    await user.click(screen.getByRole('button', { name: /create system agent/i }));

    expect(pushMock).toHaveBeenCalledWith(SYSTEM_AGENTS_CREATE_PATH);
  });
});
