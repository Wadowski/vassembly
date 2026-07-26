export interface SetZeroConfigMcpsEnabledInput {
  enabled: boolean;
}

export interface SetZeroConfigMcpsEnabledResult {
  enabled: boolean;
  mcpIds: string[];
  updatedCount: number;
}
