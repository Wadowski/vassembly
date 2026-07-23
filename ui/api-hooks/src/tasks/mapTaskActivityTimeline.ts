export type TaskActivityFilterGroup =
  | 'comments'
  | 'responses'
  | 'questions'
  | 'agentStarted'
  | 'agentFinished'
  | 'agentFailed'
  | 'agentWaiting';

export interface TaskActivityItemDto {
  kind: string;
  id: string;
  occurredAt: string;
  sortKey: string;
  filterGroup: TaskActivityFilterGroup;
  commentId?: string | null;
  userText?: string | null;
  agentResponse?: string | null;
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
