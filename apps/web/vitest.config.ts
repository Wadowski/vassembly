import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.tsx'],
    globals: true,
    include: ['./**/*.{test,spec}.{tsx,ts}'],
  },
});

