import { beforeEach, vi } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

import { TEST_MCP_CATALOG } from './fixtures/mockCatalog';
import { createInMemoryUserMcpConfigDao } from './helpers/inMemoryUserMcpConfigDao';

export const inMemoryUserMcpConfigDao = createInMemoryUserMcpConfigDao();

let currentTestName = '';

beforeEach((context) => {
  currentTestName = context.task.name;
});

const seedBraveConfigForUser123 = (): void => {
  inMemoryUserMcpConfigDao.seed({
    model: {
      id: 'config-auth-seed',
      userId: 'user-123',
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'enc:secret' },
      status: 'configured',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
};

const { mockGetById, mockGetModelById, mockGetByIds } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockGetModelById: vi.fn(),
  mockGetByIds: vi.fn(),
}));

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock('@vassembly/domain-user-mcp-config/src/clients/mongodb', () => ({
  userMcpConfigDao: inMemoryUserMcpConfigDao,
  UserMcpConfigDAO: vi.fn(),
  setupUserMcpConfigIndexes: vi.fn(),
}));

vi.mock('@vassembly/client-encoder', () => ({
  encode: (text: string): string => `enc:${text}`,
  decode: (encoded: string): string => encoded.replace(/^enc:/, ''),
}));

vi.mock('@vassembly/client-langchain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/client-langchain')>();

  return {
    ...actual,
    testMcpConnection: vi.fn(),
  };
});

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    queries: {
      getList: vi.fn(),
      getById: mockGetById,
      getByIds: mockGetByIds,
      getModelById: mockGetModelById,
    },
  },
  McpConfigurationStatus: {
    Configured: 'configured',
    Pending: 'pending',
  },
  McpModel: class McpModel {},
}));

mockGetById.mockImplementation(async ({ id }: { id: string }) => {
  const entry = TEST_MCP_CATALOG[id];

  if (!entry) {
    throw new NotFoundError(`MCP not found: ${id}`);
  }

  return { data: entry };
});

mockGetModelById.mockImplementation(async ({ id }: { id: string }) => {
  const entry = TEST_MCP_CATALOG[id];

  if (!entry) {
    throw new NotFoundError(`MCP not found: ${id}`);
  }

  return { data: entry };
});

mockGetByIds.mockImplementation(async ({ ids }: { ids: string[] }) => {
  const items = ids
    .map((id) => TEST_MCP_CATALOG[id])
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);

  return { items };
});

export const resetHandlerTestStores = (): void => {
  inMemoryUserMcpConfigDao.reset();

  if (currentTestName === 'should reject test from an unauthorized user') {
    seedBraveConfigForUser123();
  }
};
