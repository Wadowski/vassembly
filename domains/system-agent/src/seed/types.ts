import type { AgentCategory } from '../constants';

export interface SystemAgentSeedEntry {
  name: string;
  rule: string;
  description?: string;
  category?: AgentCategory;
  assignedToolIds?: string[];
  _disabled?: boolean;
}

export interface LoadSystemAgentsResult {
  insertedCount: number;
  skippedCount: number;
  updatedCount: number;
}
