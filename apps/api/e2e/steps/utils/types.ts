import type { APIResponse } from '@playwright/test';

import type { BddWorld } from '../../../../../packages/e2e/src/fixtures/types';

export interface ApiBddWorld extends BddWorld {
  lastResponseBody?: unknown;
  lastItems?: unknown[];
  mcpId?: string;
}

export interface SeedMcpParams {
  context: { mongoUrl: string; mongoDatabase: string };
  name: string;
  provider: string;
  description: string;
}

export interface EnsureMcpIndexesParams {
  context: { mongoUrl: string; mongoDatabase: string };
}

export interface ParseResponseBodyParams {
  response: APIResponse;
}

export interface GetNestedValueParams {
  source: unknown;
  path: string;
}

export interface ResolveItemsArrayParams {
  source: unknown;
  path: string;
}
