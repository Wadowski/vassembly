import type { APIRequestContext, APIResponse, Page } from '@playwright/test';
import type { DiagnosticsState } from '../steps/utils/diagnostics/types';

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
  resetToken?: string;
  agentId?: string;
  specializationId?: string;
  skillId?: string;
  taskId?: string;
  storedFields?: Record<string, string>;
  diagnostics?: DiagnosticsState;
  skipDiagnosticAssertions?: boolean;
}

export interface SeedContext {
  mongoUrl: string;
  mongoDatabase: string;
}
