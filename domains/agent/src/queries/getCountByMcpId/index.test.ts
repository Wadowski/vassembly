import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockCountDocuments } = vi.hoisted(() => ({
  mockCountDocuments: vi.fn(),
}));

vi.mock('../../clients', () => ({
  agentMongodbDao: {
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

import { getCountByMcpId } from './index';

describe('getCountByMcpId agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should count agents assigned to the given mcp for the user', async () => {
    mockCountDocuments.mockResolvedValue(2);

    const count = await getCountByMcpId({ userId: 'user-1', mcpId: 'mcp-1' });

    expect(count).toBe(2);
    expect(mockCountDocuments).toHaveBeenCalledWith({
      userId: 'user-1',
      assignedMcpIds: 'mcp-1',
      removedAt: null,
    });
  });

  it('should return zero when no agents match the mcp assignment', async () => {
    mockCountDocuments.mockResolvedValue(0);

    const count = await getCountByMcpId({ userId: 'user-1', mcpId: 'mcp-missing' });

    expect(count).toBe(0);
  });

  it('should scope count to the requesting user', async () => {
    mockCountDocuments.mockResolvedValue(0);

    await getCountByMcpId({ userId: 'user-99', mcpId: 'mcp-1' });

    expect(mockCountDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-99' }),
    );
  });
});
