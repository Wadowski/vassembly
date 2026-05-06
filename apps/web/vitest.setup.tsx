import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

const buildMediaQueryStub = (): ReturnType<(typeof vi)['fn']> => {
  return vi.fn((queryInput: string) => ({
    matches: false,
    media: queryInput,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: buildMediaQueryStub(),
});

