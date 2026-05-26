import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname = path.dirname(new URL('./', import.meta.url).pathname);

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
