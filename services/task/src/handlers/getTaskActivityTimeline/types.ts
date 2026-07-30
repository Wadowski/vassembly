import { ProgressEventState, type TokenUsage } from '@vassembly/domain-task-progress';

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

export type TaskActivityItemKind =
  | 'userComment'
  | 'agentResponse'
  | 'hitlAnswered'
  | 'progressEvent'
  | 'mcpInvocation'
  | 'toolInvocation'
  | 'plan';

export interface TaskActivityProgressEventItem {
  kind: 'progressEvent';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: TaskActivityFilterGroup;
  commentId: string;
  eventId: string;
  agentId: string;
  state: string;
  timestamp: string;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: { input: number; output: number; total: number };
  errorDetails?: { message: string; type?: string; stackTrace?: string };
  integrationName?: string;
  provider?: string;
  model?: string;
  outcomeSummary?: string;
}

export interface TaskActivityPlanItemRow {
  templateItemIndex: number;
  agentId: string;
  agentName?: string;
  skillId: string | null;
  skillName?: string | null;
  order: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  description: string;
}

export interface TaskActivityPlanItem {
  kind: 'plan';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'plans';
  commentId: string;
  commentSkillIds: string[];
  planTemplateShortName: string;
  planTemplateDescription: string;
  planInstanceStatus: string;
  planItems: TaskActivityPlanItemRow[];
  planTemplate: {
    shortName: string;
    description: string;
    inputDetails: Record<string, unknown>;
    outputDetails: Record<string, unknown>;
  };
  planInstance: {
    status: string;
    inputDetails: Record<string, unknown>;
  };
}

export interface TaskActivityUserCommentItem {
  kind: 'userComment';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'comments';
  commentId: string;
  userText: string;
  specializationIds: string[];
  commentSkillIds: string[];
}

export interface TaskActivityAgentResponseItem {
  kind: 'agentResponse';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'responses';
  commentId: string;
  agentResponse: string;
  commentSkillIds: string[];
  totalDuration?: number;
  totalTokens?: TokenUsage;
}

export interface TaskActivityHitlAnsweredItem {
  kind: 'hitlAnswered';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'questions';
  commentId: string;
  questionId: string;
  question: string;
  answer: string;
}

export interface TaskActivityToolInvocationDetails {
  usageEventId: string;
  toolName: string;
  agentId: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  input?: string;
  inputTruncated?: boolean;
  output?: string;
  outputTruncated?: boolean;
  invocationId?: string;
  rootInvokeId?: string;
}

export interface TaskActivityMcpInvocationItem extends TaskActivityToolInvocationDetails {
  kind: 'mcpInvocation';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'toolCalls';
  commentId: string;
  mcpId: string;
  mcpName: string;
  toolDisplayName?: string;
}

export interface TaskActivityInternalToolInvocationItem extends TaskActivityToolInvocationDetails {
  kind: 'toolInvocation';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'toolCalls';
  commentId: string;
  internalToolId: string;
  internalToolDisplayName: string;
}

export type TaskActivityItem =
  | TaskActivityUserCommentItem
  | TaskActivityAgentResponseItem
  | TaskActivityHitlAnsweredItem
  | TaskActivityProgressEventItem
  | TaskActivityMcpInvocationItem
  | TaskActivityInternalToolInvocationItem
  | TaskActivityPlanItem;

export interface GetTaskActivityTimelineHandlerInput {
  userId: string;
  taskId: string;
}

export interface GetTaskActivityTimelineHandlerOutput {
  items: TaskActivityItem[];
}

export const mapProgressStateToFilterGroup = ({
  state,
}: {
  state: string;
}): TaskActivityFilterGroup => {
  const normalized = state.toLowerCase();

  const filterGroupByState: Record<string, TaskActivityFilterGroup> = {
    [ProgressEventState.Started]: 'agentStarted',
    [ProgressEventState.Completed]: 'agentFinished',
    [ProgressEventState.Failed]: 'agentFailed',
    [ProgressEventState.Waiting]: 'agentWaiting',
    [ProgressEventState.Skipped]: 'agentFinished',
  };

  return filterGroupByState[normalized] ?? 'agentStarted';
};
