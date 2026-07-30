import path from 'node:path';

import { defineConfig } from 'vitest/config';

const dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@vassembly/client-mongodb': path.resolve(dirname, './test-mocks/client-mongodb.ts'),
    },
  },
});
