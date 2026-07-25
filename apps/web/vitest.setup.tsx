import '@testing-library/jest-dom/vitest';

import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';

import { createSpecializationHooksMock } from './test/specializationHooksMock';

expect.extend(matchers);

const testApiHooksStubs = vi.hoisted(() => {
  const mockAgentsFetch = vi.fn().mockResolvedValue(undefined);
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  const mockShowSnackbar = vi.fn();
  const mockDismissSnackbar = vi.fn();

  return {
    mockAgentsFetch,
    mockHttpClient,
    mockShowSnackbar,
    mockDismissSnackbar,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: (): string => '/',
  useParams: (): Record<string, string> => ({}),
}));

vi.mock('@vassembly/ui-system-design/snackbar', () => ({
  SnackbarProvider: ({ children }: { children: unknown }) => children,
  useSnackbar: vi.fn(() => ({
    show: testApiHooksStubs.mockShowSnackbar,
    dismiss: testApiHooksStubs.mockDismissSnackbar,
  })),
}));

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();
  return {
    ...mod,
    useAgents: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: undefined,
      fetch: testApiHooksStubs.mockAgentsFetch,
    })),
    useAiIntegrations: vi.fn(() => ({
      data: { items: [], totalCount: 0, page: 0, size: 10 },
      isLoading: false,
      error: undefined,
      fetch: vi.fn().mockResolvedValue(undefined),
    })),
    useAiIntegrationDelete: vi.fn(() => ({
      mutate: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
    })),
    useAiIntegrationRestore: vi.fn(() => ({
      mutate: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
    })),
    useTestConnection: vi.fn(() => ({
      mutate: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
    })),
    useInvokePersonalAgent: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    useMcps: vi.fn(() => ({
      data: { mcps: [] },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })),
    useUserConfiguredMcps: vi.fn(() => ({
      data: { mcps: [] },
      loading: false,
      error: undefined,
    })),
    useInternalTools: vi.fn(() => ({
      data: [],
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })),
    useMcpWithAgents: vi.fn(() => ({
      data: undefined,
      loading: false,
      refetch: vi.fn(),
    })),
    useSetMcpEnabled: vi.fn(() => [
      vi.fn().mockResolvedValue(undefined),
      { loading: false, error: null },
    ]),
    useMcpUsageHistory: vi.fn(() => ({
      items: [],
      total: 0,
      page: 0,
      size: 20,
      loading: false,
      error: undefined,
    })),
    useHttpClient: vi.fn(() => testApiHooksStubs.mockHttpClient),
    useSystemAgents: vi.fn(() => ({
      data: { items: [], page: 0, size: 50, total: 0 },
      isLoading: false,
      error: undefined,
      fetch: vi.fn().mockResolvedValue(undefined),
    })),
    useSystemAgentPreference: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: undefined,
      fetch: vi.fn().mockResolvedValue(undefined),
    })),
    useCreateSystemAgent: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    useUpdateSystemAgent: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    useArchiveSystemAgent: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    useRestoreSystemAgent: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    useInvokeSystemAgent: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    useUpsertSystemAgentPreference: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: undefined,
    })),
    ...createSpecializationHooksMock(),
  };
});

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
