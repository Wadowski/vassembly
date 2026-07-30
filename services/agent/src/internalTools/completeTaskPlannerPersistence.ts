import { InternalError } from '@vassembly/errors';

import {
  extractPersistFailureReason,
  isTaskPlanPersisted,
} from './useAgent/verifyTaskPlanPersisted';

import type { RunAgentInvokeWithToolsResult } from './types';

const TASK_PLANNER_PERSIST_CONTINUATION_INSTRUCTION =
  'Call persist_task_plan now with the plan above. Do not replan or add prose — invoke the tool once with valid JSON. Use only specialization worker names from Available agents. Every item must reference an existing skill via skillName or plan a new reusable generic skill (skillId null; description is the skill specification, including prompt-only skills).';

export interface BuildTaskPlannerPersistContinuationMessageParams {
  plannerInputMessage: string;
  firstResultMessage: string;
}

export const buildTaskPlannerPersistContinuationMessage = ({
  plannerInputMessage,
  firstResultMessage,
}: BuildTaskPlannerPersistContinuationMessageParams): string => {
  return [
    'Original planning request:',
    plannerInputMessage,
    '',
    'Your previous planning response:',
    firstResultMessage,
    '',
    TASK_PLANNER_PERSIST_CONTINUATION_INSTRUCTION,
  ].join('\n');
};

export interface CompleteTaskPlannerPersistenceParams {
  commentId: string;
  plannerInputMessage: string;
  firstResult: RunAgentInvokeWithToolsResult;
  continueInvocation: (message: string) => Promise<RunAgentInvokeWithToolsResult>;
}

const buildFailureMessage = ({
  firstResult,
  continuationResult,
}: {
  firstResult: RunAgentInvokeWithToolsResult;
  continuationResult?: RunAgentInvokeWithToolsResult;
}): string => {
  const mergedResults = [
    ...(firstResult.metadata.internalToolResults ?? []),
    ...(continuationResult?.metadata.internalToolResults ?? []),
  ];

  const failureReason =
    extractPersistFailureReason({
      internalToolResults: continuationResult?.metadata.internalToolResults,
    }) ??
    extractPersistFailureReason({
      internalToolResults: firstResult.metadata.internalToolResults,
    });

  if (failureReason) {
    return `Task planner failed to persist a task plan: ${failureReason}`;
  }

  const wasPersistAttempted = mergedResults.some(
    (result) => result.toolId === 'task-plan-persist',
  );

  if (!wasPersistAttempted) {
    return 'Task planner failed to persist a task plan. persist_task_plan was never called — the planner must invoke it with worker agent names and a skill per item (skillName or new skill description).';
  }

  return 'Task planner failed to persist a task plan. persist_task_plan must succeed with worker agent names and a skill per item (skillName or new skill description).';
};

export const completeTaskPlannerPersistence = async ({
  commentId,
  plannerInputMessage,
  firstResult,
  continueInvocation,
}: CompleteTaskPlannerPersistenceParams): Promise<RunAgentInvokeWithToolsResult> => {
  if (
    await isTaskPlanPersisted({
      commentId,
      internalToolResults: firstResult.metadata.internalToolResults,
    })
  ) {
    return firstResult;
  }

  const continuationResult = await continueInvocation(
    buildTaskPlannerPersistContinuationMessage({
      plannerInputMessage,
      firstResultMessage: firstResult.message,
    }),
  );

  if (
    await isTaskPlanPersisted({
      commentId,
      internalToolResults: [
        ...(firstResult.metadata.internalToolResults ?? []),
        ...(continuationResult.metadata.internalToolResults ?? []),
      ],
    })
  ) {
    return continuationResult;
  }

  throw new InternalError(
    buildFailureMessage({ firstResult, continuationResult }),
  );
};
