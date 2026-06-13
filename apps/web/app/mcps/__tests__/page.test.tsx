import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MOCK_CONFIGURED_MCP_LOOKUP,
  MOCK_DISCOVER_MCPS,
  MOCK_USER_CONFIGURED_MCPS,
  YOUR_MCPS_EMPTY_MESSAGE,
} from './fixtures/mcpListFixtures';

const mockPush = vi.fn();
const mockUseUserConfiguredMcps = vi.fn();
const mockUseMcps = vi.fn();
const mockUseMcpCatalog = vi.fn();
const mockUseAvailableTags = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: (): string => '/mcps',
  useParams: (): Record<string, string> => ({}),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock('@vassembly/ui-user-auth', () => ({
  useUserAuth: vi.fn(() => ({
    isAuthenticated: true,
    bootstrapLoading: false,
    role: 'user',
  })),
}));

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const original = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();

  return {
    ...original,
    useUserConfiguredMcps: (...args: unknown[]) => mockUseUserConfiguredMcps(...args),
    useMcps: (...args: unknown[]) => mockUseMcps(...args),
    useMcpCatalog: (...args: unknown[]) => mockUseMcpCatalog(...args),
    useAvailableTags: (...args: unknown[]) => mockUseAvailableTags(...args),
  };
});

import McpsPage from '../page';

const setupDefaultMocks = (): void => {
  mockUseUserConfiguredMcps.mockReturnValue({
    data: { mcps: MOCK_USER_CONFIGURED_MCPS },
    loading: false,
    error: undefined,
  });

  mockUseMcps.mockReturnValue({
    data: { mcps: MOCK_DISCOVER_MCPS },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  });

  mockUseMcpCatalog.mockReturnValue({
    data: {
      items: MOCK_DISCOVER_MCPS,
      total: MOCK_DISCOVER_MCPS.length,
      page: 0,
      size: 20,
    },
    loading: false,
    error: undefined,
    execute: vi.fn().mockResolvedValue(undefined),
  });

  mockUseAvailableTags.mockReturnValue({
    data: ['email', 'search', 'communication'],
    execute: vi.fn().mockResolvedValue(undefined),
  });
};

describe('McpsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe('YOUR MCPs section', () => {
    it('should show YOUR MCPs section when user has configured MCPs', () => {
      render(<McpsPage />);

      expect(screen.getByRole('heading', { name: /your mcps/i, level: 2 })).not.toBeNull();
      expect(screen.getByText(/gmail mcp/i)).not.toBeNull();
      expect(screen.getByText(/brave search mcp/i)).not.toBeNull();
    });

    it('should show empty state message when no configurations exist', () => {
      mockUseUserConfiguredMcps.mockReturnValue({
        data: { mcps: [] },
        loading: false,
        error: undefined,
      });

      render(<McpsPage />);

      expect(screen.getByText(YOUR_MCPS_EMPTY_MESSAGE)).not.toBeNull();
    });

    it('should display MCP cards in a 3-column grid', () => {
      render(<McpsPage />);

      const yourMcpsGrid = screen.getByTestId('your-mcps-grid');
      expect(yourMcpsGrid).toHaveAttribute('data-columns', '3');
    });

    it('should show Configured badge with configured styling on each YOUR MCPs card', () => {
      render(<McpsPage />);

      const yourMcpsSection = screen.getByRole('region', { name: /your mcps/i });
      const configuredBadges = within(yourMcpsSection).getAllByLabelText(/status: configured/i);

      expect(configuredBadges.length).toBeGreaterThanOrEqual(2);
      configuredBadges.forEach((badge) => {
        expect(badge).toHaveClass('statusBadgeConfigured');
      });
    });
  });

  describe('DISCOVER section', () => {
    it('should render all MCPs with Configured or Pending status badges', () => {
      render(<McpsPage />);

      const discoverSection = screen.getByRole('region', { name: /discover/i });
      expect(within(discoverSection).getByLabelText(/status: configured/i)).not.toBeNull();
      expect(within(discoverSection).getAllByLabelText(/status: pending/i).length).toBeGreaterThanOrEqual(2);
    });

    it('should keep pagination controls functional', async () => {
      const user = userEvent.setup();
      mockUseMcpCatalog.mockReturnValue({
        data: {
          items: MOCK_DISCOVER_MCPS,
          total: 60,
          page: 0,
          size: 20,
        },
        loading: false,
        error: undefined,
        execute: vi.fn().mockResolvedValue(undefined),
      });

      render(<McpsPage />);

      const nextPageButton = screen.getByRole('button', { name: /^next$/i });
      await user.click(nextPageButton);

      expect(screen.getByText(/showing 21–40 of 60 total/i)).not.toBeNull();
    });

    it('should keep search and tag filter inputs working without breaking', async () => {
      const user = userEvent.setup();
      const execute = vi.fn().mockResolvedValue(undefined);
      mockUseMcpCatalog.mockReturnValue({
        data: {
          items: [MOCK_DISCOVER_MCPS[0]],
          total: 1,
          page: 0,
          size: 20,
        },
        loading: false,
        error: undefined,
        execute,
      });

      render(<McpsPage />);

      const searchInput = screen.getByPlaceholderText(/search by name or description/i);
      await user.type(searchInput, 'gmail');

      expect(searchInput).toHaveValue('gmail');
      expect(screen.getByRole('combobox')).not.toBeDisabled();
      expect(screen.getByText(/filter by tags/i)).not.toBeNull();
    });
  });

  describe('navigation', () => {
    it('should navigate to MCP detail page when card is clicked', async () => {
      const user = userEvent.setup();
      render(<McpsPage />);

      const discoverSection = screen.getByRole('region', { name: /discover/i });
      await user.click(within(discoverSection).getByRole('link', { name: /gmail mcp/i }));

      expect(mockPush).toHaveBeenCalledWith('/mcps/mcp-gmail');
    });

    it('should open external documentation and repository links in a new tab without navigating', () => {
      render(<McpsPage />);

      const docsLink = screen.getAllByRole('link', { name: /documentation/i })[0];
      const repoLink = screen.getAllByRole('link', { name: /repository/i })[0];

      expect(docsLink).toHaveAttribute('target', '_blank');
      expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(repoLink).toHaveAttribute('target', '_blank');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should group configured MCPs above pending MCPs in discover sort order', () => {
      render(<McpsPage />);

      const discoverSection = screen.getByRole('region', { name: /discover/i });
      const cardLinks = within(discoverSection).getAllByRole('link');
      const cardNames = cardLinks.map((link) => link.getAttribute('aria-label') ?? link.textContent ?? '');

      const configuredIndex = cardNames.findIndex((name) => name.toLowerCase().includes('gmail'));
      const pendingIndex = cardNames.findIndex((name) => name.toLowerCase().includes('brave'));

      expect(configuredIndex).toBeGreaterThanOrEqual(0);
      expect(pendingIndex).toBeGreaterThan(configuredIndex);
    });
  });

  describe('loading states', () => {
    it('should show skeleton loaders for YOUR MCPs while fetching', () => {
      mockUseUserConfiguredMcps.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      });

      render(<McpsPage />);

      expect(screen.getByTestId('your-mcps-skeleton')).not.toBeNull();
    });

    it('should hide YOUR MCPs cards while loading and show them when complete', () => {
      mockUseUserConfiguredMcps.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      });

      const { rerender } = render(<McpsPage />);
      expect(screen.queryByRole('region', { name: /your mcps/i })).toBeNull();

      mockUseUserConfiguredMcps.mockReturnValue({
        data: { mcps: MOCK_USER_CONFIGURED_MCPS },
        loading: false,
        error: undefined,
      });

      rerender(<McpsPage />);
      expect(screen.getByRole('region', { name: /your mcps/i })).not.toBeNull();
    });
  });

  describe('hook integration', () => {
    it('should call useUserConfiguredMcps and render configured MCP data', () => {
      render(<McpsPage />);

      expect(mockUseUserConfiguredMcps).toHaveBeenCalled();
      MOCK_USER_CONFIGURED_MCPS.forEach((config) => {
        const mcp = MOCK_CONFIGURED_MCP_LOOKUP[config.mcpId];
        if (mcp !== undefined) {
          expect(screen.getByText(mcp.name)).not.toBeNull();
        }
      });
    });

    it('should call useMcps and render configuration status from API enrichment', () => {
      render(<McpsPage />);

      expect(mockUseMcps).toHaveBeenCalled();
      expect(screen.getAllByLabelText(/status: configured/i).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/status: pending/i).length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should use h2 headings for YOUR MCPs and DISCOVER section labels', () => {
      render(<McpsPage />);

      expect(screen.getByRole('heading', { name: /your mcps/i, level: 2 })).not.toBeNull();
      expect(screen.getByRole('heading', { name: /discover/i, level: 2 })).not.toBeNull();
    });

    it('should make MCP cards keyboard focusable with descriptive aria-labels', () => {
      render(<McpsPage />);

      const cardLink = screen.getAllByRole('link', { name: /configure gmail mcp/i })[0];
      expect(cardLink).toHaveAccessibleName(/gmail mcp/i);
    });
  });
});
