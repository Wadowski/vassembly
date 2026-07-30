export interface MultiSpecClassificationSeedResult {
  taskId: string;
  commentId: string;
}

export interface MultiSpecPlanSeedItem {
  order: number;
  agentName: string;
  description: string;
  status: 'pending' | 'in-progress' | 'done' | 'failed';
}

export interface SeedMultiSpecPlanCommentParams {
  shortName: string;
  specializationNames: string[];
  items: MultiSpecPlanSeedItem[];
  userText?: string;
}

export interface SeedMultiSpecPlanCommentResult {
  taskId: string;
  commentId: string;
  taskPlanInstanceId: string;
  specializationIdsByName: Record<string, string>;
}

export interface SeedClassifierProgressEventParams {
  state: 'completed' | 'skipped' | 'failed' | 'started';
  outcomeSummary?: string;
  inputMessages?: string;
  generatedResponse?: string;
  durationMs?: number;
  tokenUsage?: { input: number; output: number; total: number };
  occurredAtOffsetMs?: number;
}

export interface SeedClassifierTurnParams {
  classifier: SeedClassifierProgressEventParams;
  downstreamAgentNames: string[];
}
