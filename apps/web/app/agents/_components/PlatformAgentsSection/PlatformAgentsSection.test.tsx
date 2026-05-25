import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlatformAgentsSection } from './PlatformAgentsSection';

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
    isInvokeEnabled: false,
    createOpen: false,
    editOpen: false,
    archiveOpen: false,
    restoreOpen: false,
    invokeOpen: false,
    focusAgent: null,
    focusAgentName: '',
    focusAdminAgent: undefined,
    nameConflictError: undefined,
    isCreateSubmitting: false,
    isUpdateSubmitting: false,
    isArchiveBusy: false,
    isRestoreBusy: false,
    openCreate: vi.fn(),
    closeCreate: vi.fn(),
    openEditFor: vi.fn(),
    openArchiveFor: vi.fn(),
    openRestoreFor: vi.fn(),
    openInvokeFor: vi.fn(),
    closeEdit: vi.fn(),
    closeArchive: vi.fn(),
    closeRestore: vi.fn(),
    closeInvoke: vi.fn(),
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    confirmArchive: vi.fn(),
    confirmRestore: vi.fn(),
  })),
}));

describe('PlatformAgentsSection', () => {
  it('should render platform agents section copy and search for users', () => {
    render(<PlatformAgentsSection />);

    expect(screen.getByRole('heading', { name: /platform agents/i })).not.toBeNull();
    expect(
      screen.getByText(/governed agents provided by your organization/i),
    ).not.toBeNull();
    expect(screen.getByPlaceholderText(/search platform agents/i)).not.toBeNull();
    expect(screen.getByText(/no platform agents are available right now/i)).not.toBeNull();
  });

  it('should render admin create controls when isAdmin is true', () => {
    render(<PlatformAgentsSection isAdmin />);

    expect(screen.getByRole('button', { name: /create system agent/i })).not.toBeNull();
    expect(screen.getByText(/no system agents yet/i)).not.toBeNull();
  });
});
