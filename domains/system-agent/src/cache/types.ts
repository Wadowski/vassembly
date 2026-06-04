import type { SystemAgentModel } from '../model';

export type CachedSystemAgentPayload = Partial<SystemAgentModel> & { id: string };
