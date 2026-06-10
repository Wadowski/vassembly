import type { SeedContext } from '../fixtures/types';

export interface SeedUserResult {
  id: string;
  email: string;
  token: string;
}

export interface SeedUserParams {
  email: string;
  password: string;
  context: SeedContext;
}

export interface SeedDatabaseParams {
  context: SeedContext;
}

export interface TeardownDatabaseParams {
  context: SeedContext;
}

export interface ApplySeedContextParams {
  context: SeedContext;
}
