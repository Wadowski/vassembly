import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

import {
  ActivityAgentResponse,
  ActivityHitlAnswered,
  ActivityUserComment,
} from './activityEmphasizedCard/ActivityEmphasizedCard';
import { ActivityMcpInvocationRow } from './activityMcpInvocationRow/ActivityMcpInvocationRow';
import { ActivityPlanRow } from './activityPlanRow';
import { ActivityProgressEventRow } from './activityProgressEventRow/ActivityProgressEventRow';

export interface TaskActivityFeedItemProps {
  item: TaskActivityItemDto;
  isAdmin: boolean;
}

export const TaskActivityFeedItem = ({ item, isAdmin }: TaskActivityFeedItemProps): JSX.Element | null => {
  if (item.kind === 'userComment' && item.userText && item.commentId) {
    return (
      <ActivityUserComment
        commentId={item.commentId}
        userText={item.userText}
        specializationIds={item.specializationIds ?? []}
        skillIds={item.commentSkillIds ?? []}
        isAdmin={isAdmin}
      />
    );
  }

  if (item.kind === 'agentResponse' && item.agentResponse && item.commentId) {
    return (
      <ActivityAgentResponse
        commentId={item.commentId}
        agentResponse={item.agentResponse}
        skillIds={item.commentSkillIds ?? []}
        totalDuration={item.totalDuration}
        totalTokens={item.totalTokens}
        isAdmin={isAdmin}
      />
    );
  }

  if (item.kind === 'plan') {
    return <ActivityPlanRow item={item} isAdmin={isAdmin} />;
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

  if (item.kind === 'mcpInvocation' || item.kind === 'toolInvocation') {
    return <ActivityMcpInvocationRow item={item} />;
  }

  return null;
};
