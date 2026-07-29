import taskPlanInstanceDomain from '@vassembly/domain-task-plan-instance';
import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

const TASK_PLAN_PERSIST_TOOL_ID = 'task-plan-persist';

export interface InternalToolExecutionResult {
  toolId: string;
  content: string;
}

export interface IsTaskPlanPersistedParams {
  commentId: string;
  internalToolResults?: InternalToolExecutionResult[];
}

const parseSuccessfulPersistInstanceId = ({ content }: { content: string }): string | null => {
  try {
    const parsed = JSON.parse(content) as { taskPlanInstanceId?: unknown; error?: unknown };

    if (typeof parsed.error === 'string' && parsed.error.length > 0) {
      return null;
    }

    if (typeof parsed.taskPlanInstanceId === 'string' && parsed.taskPlanInstanceId.length > 0) {
      return parsed.taskPlanInstanceId;
    }
  } catch {
    return null;
  }

  return null;
};

export const extractPersistFailureReason = ({
  internalToolResults = [],
}: {
  internalToolResults?: InternalToolExecutionResult[];
}): string | null => {
  for (const result of internalToolResults) {
    if (result.toolId !== TASK_PLAN_PERSIST_TOOL_ID) {
      continue;
    }

    try {
      const parsed = JSON.parse(result.content) as { error?: unknown };

      if (typeof parsed.error === 'string' && parsed.error.length > 0) {
        return parsed.error;
      }
    } catch {
      if (result.content.trim().length > 0) {
        return result.content;
      }
    }
  }

  return null;
};

export const isTaskPlanPersisted = async ({
  commentId,
  internalToolResults = [],
}: IsTaskPlanPersistedParams): Promise<boolean> => {
  const hasSuccessfulPersistResult = internalToolResults.some((result) => {
    if (result.toolId !== TASK_PLAN_PERSIST_TOOL_ID) {
      return false;
    }

    return parseSuccessfulPersistInstanceId({ content: result.content }) !== null;
  });

  if (hasSuccessfulPersistResult) {
    return true;
  }

  const planInstanceResult = await taskPlanInstanceDomain.queries.getByCommentId({ commentId });

  return planInstanceResult.data?.id !== undefined && planInstanceResult.data.id !== '';
};

export interface ShouldVerifyTaskPlanPersistedParams {
  agentName: string;
  specializationIds?: string[];
}

export const shouldVerifyTaskPlanPersisted = ({
  agentName,
  specializationIds,
}: ShouldVerifyTaskPlanPersistedParams): boolean => {
  return (
    agentName === SYSTEM_AGENT_NAME.TaskPlanner &&
    specializationIds !== undefined &&
    specializationIds.length > 0
  );
};
