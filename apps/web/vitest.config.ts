import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.tsx'],
    globals: true,
    include: ['./**/*.{test,spec}.{tsx,ts}'],
    typecheck: {
      include: ['**/*.test.ts', '**/*.test.tsx'],
    },
  },
});
