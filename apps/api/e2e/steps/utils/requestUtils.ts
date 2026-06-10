import type { APIRequestContext, APIResponse } from '@playwright/test';

import type { ApiBddWorld } from './types';

export interface BuildAuthHeadersParams {
  world: ApiBddWorld;
}

export interface StoreApiResponseParams {
  response: APIResponse;
  world: ApiBddWorld;
}

export const buildAuthHeaders = ({ world }: BuildAuthHeadersParams): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (world.auth?.token !== undefined) {
    headers.Authorization = `Bearer ${world.auth.token}`;
  }

  return headers;
};

export const storeApiResponse = async ({
  response,
  world,
}: StoreApiResponseParams): Promise<void> => {
  world.lastResponse = response;

  try {
    world.lastResponseBody = await response.json();
  } catch {
    world.lastResponseBody = undefined;
  }
};

export const sendJsonRequest = async ({
  request,
  world,
  method,
  path,
  body,
}: {
  request: APIRequestContext;
  world: ApiBddWorld;
  method: string;
  path: string;
  body: string;
}): Promise<void> => {
  const url = new URL(path, world.baseURL).toString();
  const response = await request.fetch(url, {
    method: method.toUpperCase(),
    headers: buildAuthHeaders({ world }),
    data: JSON.parse(body),
  });

  await storeApiResponse({ response, world });
};
