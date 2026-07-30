export type TaskActivityFilterGroup =
  | 'comments'
  | 'responses'
  | 'questions'
  | 'agentStarted'
  | 'agentFinished'
  | 'agentFailed'
  | 'agentWaiting'
  | 'toolCalls'
  | 'plans';

export interface TaskActivityPlanItemDto {
  templateItemIndex: number;
  agentId: string;
  agentName?: string | null;
  skillId?: string | null;
  skillName?: string | null;
  order: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  description: string;
}

export interface TaskActivityErrorDetailsDto {
  message: string;
  type?: string | null;
  stackTrace?: string | null;
}

export interface TaskActivityItemDto {
  kind: string;
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: TaskActivityFilterGroup;
  commentId?: string | null;
  userText?: string | null;
  specializationIds?: string[] | null;
  commentSkillIds?: string[] | null;
  agentResponse?: string | null;
  planTemplateShortName?: string | null;
  planTemplateDescription?: string | null;
  planInstanceStatus?: string | null;
  planItems?: TaskActivityPlanItemDto[] | null;
  totalDuration?: number | null;
  totalTokens?: { input: number; output: number; total: number } | null;
  questionId?: string | null;
  question?: string | null;
  answer?: string | null;
  eventId?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  state?: string | null;
  timestamp?: string | null;
  duration?: number | null;
  tokenUsage?: { input: number; output: number; total: number } | null;
  inputMessages?: string | null;
  generatedResponse?: string | null;
  integrationName?: string | null;
  provider?: string | null;
  model?: string | null;
  usageEventId?: string | null;
  mcpId?: string | null;
  mcpName?: string | null;
  internalToolId?: string | null;
  internalToolDisplayName?: string | null;
  toolDisplayName?: string | null;
  toolName?: string | null;
  status?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMs?: number | null;
  input?: string | null;
  inputTruncated?: boolean | null;
  output?: string | null;
  outputTruncated?: boolean | null;
  invocationId?: string | null;
  rootInvokeId?: string | null;
  errorMessage?: string | null;
  errorDetails?: TaskActivityErrorDetailsDto | null;
  outcomeSummary?: string | null;
}

export interface GraphQLTaskActivityTimelineData {
  taskActivityTimeline?: {
    items?: TaskActivityItemDto[] | null;
  } | null;
}

export const mapTaskActivityTimeline = (
  data: GraphQLTaskActivityTimelineData | undefined,
): TaskActivityItemDto[] => {
  return data?.taskActivityTimeline?.items ?? [];
};
