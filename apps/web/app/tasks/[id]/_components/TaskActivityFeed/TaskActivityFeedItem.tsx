import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

import {
  ActivityAgentResponse,
  ActivityHitlAnswered,
  ActivityUserComment,
} from './activityEmphasizedCard/ActivityEmphasizedCard';
import { ActivityProgressEventRow } from './activityProgressEventRow/ActivityProgressEventRow';
import { ActivityMcpInvocationRow } from './activityMcpInvocationRow/ActivityMcpInvocationRow';

export interface TaskActivityFeedItemProps {
  item: TaskActivityItemDto;
}

export const TaskActivityFeedItem = ({ item }: TaskActivityFeedItemProps): JSX.Element | null => {
  if (item.kind === 'userComment' && item.userText && item.commentId) {
    return <ActivityUserComment commentId={item.commentId} userText={item.userText} />;
  }

  if (item.kind === 'agentResponse' && item.agentResponse && item.commentId) {
    return (
      <ActivityAgentResponse
        commentId={item.commentId}
        agentResponse={item.agentResponse}
        totalDuration={item.totalDuration}
        totalTokens={item.totalTokens}
      />
    );
  }

  if (item.kind === 'hitlAnswered' && item.questionId && item.question && item.answer) {
    return (
      <ActivityHitlAnswered
        questionId={item.questionId}
        question={item.question}
        answer={item.answer}
      />
    );
  }

  if (item.kind === 'progressEvent') {
    return <ActivityProgressEventRow item={item} />;
  }

  if (item.kind === 'mcpInvocationStarted' || item.kind === 'mcpInvocationCompleted') {
    return <ActivityMcpInvocationRow item={item} />;
  }

  return null;
};
