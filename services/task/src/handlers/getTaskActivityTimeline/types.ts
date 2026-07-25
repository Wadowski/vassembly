import { ProgressEventState, type TokenUsage } from '@vassembly/domain-task-progress';

export type TaskActivityFilterGroup =
  | 'comments'
  | 'responses'
  | 'questions'
  | 'agentStarted'
  | 'agentFinished'
  | 'agentFailed'
  | 'agentWaiting'
  | 'mcpUsage';

export type TaskActivityItemKind =
  | 'userComment'
  | 'agentResponse'
  | 'hitlAnswered'
  | 'progressEvent'
  | 'mcpInvocationStarted'
  | 'mcpInvocationCompleted';

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
}

export interface TaskActivityUserCommentItem {
  kind: 'userComment';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'comments';
  commentId: string;
  userText: string;
}

export interface TaskActivityAgentResponseItem {
  kind: 'agentResponse';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'responses';
  commentId: string;
  agentResponse: string;
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

export interface TaskActivityMcpInvocationStartedItem {
  kind: 'mcpInvocationStarted';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'mcpUsage';
  commentId: string;
  usageEventId: string;
  mcpId: string;
  mcpName: string;
  toolName: string;
  agentId: string;
}

export interface TaskActivityMcpInvocationCompletedItem {
  kind: 'mcpInvocationCompleted';
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: 'mcpUsage';
  commentId: string;
  usageEventId: string;
  mcpId: string;
  mcpName: string;
  toolName: string;
  agentId: string;
  status: string;
  durationMs?: number;
  errorMessage?: string;
}

export type TaskActivityItem =
  | TaskActivityUserCommentItem
  | TaskActivityAgentResponseItem
  | TaskActivityHitlAnsweredItem
  | TaskActivityProgressEventItem
  | TaskActivityMcpInvocationStartedItem
  | TaskActivityMcpInvocationCompletedItem;

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
  };

  return filterGroupByState[normalized] ?? 'agentStarted';
};
