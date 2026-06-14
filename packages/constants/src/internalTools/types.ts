export enum InternalToolAccessScope {
  SYSTEM_ONLY = 'SYSTEM_ONLY',
  SYSTEM_AND_PERSONAL = 'SYSTEM_AND_PERSONAL',
}

export interface InternalToolDefinition {
  id: string;
  displayName: string;
  description: string;
  accessScope: InternalToolAccessScope;
  llmToolName: string;
}
