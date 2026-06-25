import type { BddWorld, SeedContext } from '@vassembly/e2e';

export interface WebBddWorld extends BddWorld {
  agentId?: string;
  systemAgentId?: string;
  specializationId?: string;
  specializationIds?: Record<string, string>;
  skillId?: string;
  skillIds?: Record<string, string>;
  integrationCredentialId?: string;
  mcpId?: string;
  taskId?: string;
  otherUserId?: string;
  otherUserTaskId?: string;
  showDeletedFilter?: boolean;
  pollingRequestCount?: number;
  secondPage?: import('@playwright/test').Page;
  pauseApiRequestCount?: number;
  wasPauseButtonDisabledAfterFirstClick?: boolean;
  progressEventCountAtPause?: number;
  lastProgressEventTimestamp?: string | null;
  lastProgressEventId?: string | null;
  progressExecutionAttemptAtCheckpoint?: number;
  stopTaskProgressPollingMonitor?: () => void;
  stopBackgroundProgressWriter?: () => void;
  shouldResumeBackgroundProgressWriter?: boolean;
  tabAPage?: import('@playwright/test').Page;
  tabBPage?: import('@playwright/test').Page;
  pendingQuestionIds?: string[];
  questionsByText?: Record<string, string>;
  lastSubmittedQuestionId?: string;
}

export interface SeedMcpParams {
  context: SeedContext;
  name: string;
  provider: string;
  description: string;
}

export interface SeedMcpCatalogParams {
  context: SeedContext;
}

export interface GetMcpIdBySlugParams {
  context: SeedContext;
  slug: string;
}

export interface EnsureMcpIndexesParams {
  context: SeedContext;
}
