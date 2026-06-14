import { vi } from 'vitest';

import { createInMemoryUserMcpConfigDao } from './helpers/inMemoryUserMcpConfigDao';

export const inMemoryUserMcpConfigDao = createInMemoryUserMcpConfigDao();

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock('../src/clients/mongodb', () => ({
  userMcpConfigDao: inMemoryUserMcpConfigDao,
  UserMcpConfigDAO: vi.fn(),
  setupUserMcpConfigIndexes: vi.fn(),
}));

vi.mock('@vassembly/client-encoder', () => ({
  encode: (text: string): string => `enc:${text}`,
  decode: (encoded: string): string => encoded.replace(/^enc:/, ''),
}));

export const resetUserMcpConfigStore = (): void => {
  inMemoryUserMcpConfigDao.reset();
};
