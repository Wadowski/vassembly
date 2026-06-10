import type { APIRequestContext, APIResponse, Page } from '@playwright/test';

export interface AuthContext {
  userId: string;
  token: string;
  email: string;
}

export interface BddWorld {
  page?: Page;
  request?: APIRequestContext;
  baseURL: string;
  lastResponse?: APIResponse;
  auth?: AuthContext | null;
}

export interface SeedContext {
  mongoUrl: string;
  mongoDatabase: string;
}
