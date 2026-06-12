import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InternalError } from '@vassembly/errors';

import type { McpListItemResponse } from '@vassembly/domain-mcp';

import type { ListMcpsResult, ServiceContext } from './types';

const { mockGetList, mockEnrichMcpListWithUserStatus } = vi.hoisted(() => ({
  mockGetList: vi.fn(),
  mockEnrichMcpListWithUserStatus: vi.fn(),
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    commands: {},
    queries: {
      getList: mockGetList,
    },
  },
}));

vi.mock('../enrichMcpListWithUserStatus', () => ({
  enrichMcpListWithUserStatus: mockEnrichMcpListWithUserStatus,
}));

import { listMcps } from './index';

const buildMcpItem = (overrides: Partial<McpListItemResponse> = {}): McpListItemResponse => ({
  id: 'mcp-1',
  slug: 'github',
  name: 'GitHub MCP',
  description: 'Browse repositories and issues',
  tags: ['development', 'git'],
  iconPath: '/mcps/github.svg',
  documentationUrl: 'https://example.com/docs/github',
  repositoryUrl: 'https://github.com/example/github-mcp',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

const buildContext = (): ServiceContext => ({
  authenticatedUserId: 'user-auth-1',
});

const buildDomainResult = (overrides: Partial<ListMcpsResult> = {}): ListMcpsResult => ({
  items: [buildMcpItem()],
  total: 1,
  page: 0,
  size: 20,
  ...overrides,
});

describe('listMcps handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnrichMcpListWithUserStatus.mockImplementation(async ({ mcps }) =>
      mcps.map((mcp: McpListItemResponse) => ({
        ...mcp,
        configurationStatus: 'pending',
      })),
    );
  });

  describe('happy path', () => {
    it('should return paginated MCPs when page and size are provided', async () => {
      mockGetList.mockResolvedValue(
        buildDomainResult({
          items: [buildMcpItem(), buildMcpItem({ id: 'mcp-2', slug: 'gmail', name: 'Gmail MCP' })],
          total: 42,
          page: 0,
          size: 20,
        }),
      );

      const result = await listMcps({ page: 0, size: 20 }, buildContext());

      expect(result.total).toBe(42);
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(0);
      expect(result.size).toBe(20);
    });

    it('should return result matching ListMcpsResult shape', async () => {
      mockGetList.mockResolvedValue(buildDomainResult());

      const result = await listMcps({ page: 0, size: 20 }, buildContext());

      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            slug: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            tags: expect.any(Array),
            iconPath: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        ]),
        total: expect.any(Number),
        page: expect.any(Number),
        size: expect.any(Number),
      });
    });
  });

  describe('configuration status enrichment', () => {
    it('should populate configurationStatus on each MCP when catalog fetch succeeds', async () => {
      const configuredMcp = buildMcpItem({ id: 'mcp-gmail', slug: 'google-workspace-mcp' });
      const pendingMcp = buildMcpItem({ id: 'mcp-brave', slug: 'brave-search-mcp' });

      mockGetList.mockResolvedValue(
        buildDomainResult({
          items: [configuredMcp, pendingMcp],
          total: 2,
        }),
      );
      mockEnrichMcpListWithUserStatus.mockResolvedValue([
        { ...configuredMcp, configurationStatus: 'configured' },
        { ...pendingMcp, configurationStatus: 'pending' },
      ]);

      const result = await listMcps({ page: 0, size: 20 }, buildContext());

      expect(result.items).toEqual([
        expect.objectContaining({ id: 'mcp-gmail', configurationStatus: 'configured' }),
        expect.objectContaining({ id: 'mcp-brave', configurationStatus: 'pending' }),
      ]);
      expect(result.total).toBe(2);
    });

    it('should re-throw when configuration status enrichment fails', async () => {
      mockGetList.mockResolvedValue(buildDomainResult());
      mockEnrichMcpListWithUserStatus.mockRejectedValue(new InternalError('Status lookup failed'));

      await expect(listMcps({ page: 0, size: 20 }, buildContext())).rejects.toThrow(InternalError);
    });
  });

  describe('filter delegation', () => {
    it('should return search-filtered results when search arg is provided', async () => {
      const githubMcp = buildMcpItem({ name: 'GitHub MCP' });

      mockGetList.mockImplementation(async (params) => {
        if (params.search !== 'github') {
          return { items: [], total: 0, page: 0, size: 20 };
        }

        return { items: [githubMcp], total: 1, page: 0, size: 20 };
      });

      const result = await listMcps({ search: 'github' }, buildContext());

      expect(result.items).toEqual([{ ...githubMcp, configurationStatus: 'pending' }]);
      expect(result.total).toBe(1);
    });

    it('should return tag-filtered results when tags arg is provided', async () => {
      const emailMcp = buildMcpItem({ tags: ['email', 'productivity'] });

      mockGetList.mockImplementation(async (params) => {
        if (!params.tags?.includes('email')) {
          return { items: [], total: 0, page: 0, size: 20 };
        }

        return { items: [emailMcp], total: 1, page: 0, size: 20 };
      });

      const result = await listMcps({ tags: ['email'] }, buildContext());

      expect(result.items).toEqual([{ ...emailMcp, configurationStatus: 'pending' }]);
      expect(result.total).toBe(1);
    });

    it('should return paginated results for requested page and size', async () => {
      mockGetList.mockImplementation(async (params) => ({
        items: [],
        total: 100,
        page: params.page ?? 0,
        size: params.size ?? 20,
      }));

      const result = await listMcps({ page: 3, size: 10 }, buildContext());

      expect(result.page).toBe(3);
      expect(result.size).toBe(10);
      expect(result.total).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should re-throw when domain query fails', async () => {
      mockGetList.mockRejectedValue(new InternalError('Database unavailable'));

      await expect(listMcps({ page: 0, size: 20 }, buildContext())).rejects.toThrow(InternalError);
    });

    it('should throw when ServiceContext is not provided', async () => {
      await expect(
        listMcps({ page: 0, size: 20 }, undefined as unknown as ServiceContext),
      ).rejects.toThrow();
    });
  });

  describe('argument passing', () => {
    it('should map ListMcpsInput fields to domain GetListParams', async () => {
      mockGetList.mockImplementation(async (params) => ({
        items: [buildMcpItem({ slug: JSON.stringify(params) })],
        total: 1,
        page: params.page ?? 0,
        size: params.size ?? 20,
      }));

      const result = await listMcps(
        { page: 2, size: 15, search: 'gmail', tags: ['email', 'productivity'] },
        buildContext(),
      );

      expect(JSON.parse(result.items[0]!.slug)).toEqual({
        page: 2,
        size: 15,
        search: 'gmail',
        tags: ['email', 'productivity'],
      });
    });

    it('should preserve pagination metadata when enriching catalog items', async () => {
      const domainResult = buildDomainResult({
        items: [buildMcpItem({ id: 'mcp-99', slug: 'notion' })],
        total: 7,
        page: 1,
        size: 5,
      });

      mockGetList.mockResolvedValue(domainResult);
      mockEnrichMcpListWithUserStatus.mockResolvedValue([
        { ...domainResult.items[0]!, configurationStatus: 'pending' },
      ]);

      const result = await listMcps({ page: 1, size: 5 }, buildContext());

      expect(result).toEqual({
        ...domainResult,
        items: [{ ...domainResult.items[0]!, configurationStatus: 'pending' }],
      });
    });
  });
});
