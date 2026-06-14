import { ConflictError, NotFoundError, UnauthorizedError } from '@vassembly/errors';

const LIST_CAP = 50;

export interface StoredUserMcpConfig {
  id: string;
  userId: string;
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  status: 'configured';
  createdAt: Date;
  updatedAt: Date;
}

const buildStoreKey = ({ userId, mcpId }: { userId: string; mcpId: string }): string =>
  `${userId}:${mcpId}`;

export interface InMemoryUserMcpConfigDao {
  reset: () => void;
  create: (params: { model: StoredUserMcpConfig }) => Promise<StoredUserMcpConfig>;
  getByUserAndMcpId: (params: {
    userId: string;
    mcpId: string;
  }) => Promise<StoredUserMcpConfig | null>;
  getByMcpId: (params: { mcpId: string }) => Promise<StoredUserMcpConfig | null>;
  getListByUserId: (params: { userId: string }) => Promise<StoredUserMcpConfig[]>;
  update: (params: { model: StoredUserMcpConfig }) => Promise<StoredUserMcpConfig>;
  remove: (params: { userId: string; mcpId: string }) => Promise<boolean>;
}

export const createInMemoryUserMcpConfigDao = (): InMemoryUserMcpConfigDao => {
  const store = new Map<string, StoredUserMcpConfig>();
  let idCounter = 0;

  return {
    reset: (): void => {
      store.clear();
      idCounter = 0;
    },

    create: async ({ model }): Promise<StoredUserMcpConfig> => {
      const key = buildStoreKey({ userId: model.userId, mcpId: model.mcpId });

      if (store.has(key)) {
        throw new ConflictError('Configuration already exists for this MCP');
      }

      const now = new Date();
      const persisted: StoredUserMcpConfig = {
        ...model,
        id: model.id || `config-${idCounter + 1}`,
        status: 'configured',
        createdAt: now,
        updatedAt: now,
      };

      idCounter += 1;
      store.set(key, persisted);
      return persisted;
    },

    getByUserAndMcpId: async ({ userId, mcpId }): Promise<StoredUserMcpConfig | null> => {
      return store.get(buildStoreKey({ userId, mcpId })) ?? null;
    },

    getByMcpId: async ({ mcpId }): Promise<StoredUserMcpConfig | null> => {
      return [...store.values()].find((config) => config.mcpId === mcpId) ?? null;
    },

    getListByUserId: async ({ userId }): Promise<StoredUserMcpConfig[]> => {
      const configs = [...store.values()].filter((config) => config.userId === userId);

      return configs
        .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
        .slice(0, LIST_CAP);
    },

    update: async ({ model }): Promise<StoredUserMcpConfig> => {
      const key = buildStoreKey({ userId: model.userId, mcpId: model.mcpId });
      const existing = store.get(key);

      if (!existing) {
        throw new NotFoundError('Configuration not found');
      }

      if (existing.userId !== model.userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const updated: StoredUserMcpConfig = {
        ...model,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };

      store.set(key, updated);
      return updated;
    },

    remove: async ({ userId, mcpId }): Promise<boolean> => {
      const key = buildStoreKey({ userId, mcpId });
      const existing = store.get(key);

      if (!existing) {
        return true;
      }

      if (existing.userId !== userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      store.delete(key);
      return true;
    },
  };
};
