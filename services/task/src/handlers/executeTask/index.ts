import { randomUUID } from 'node:crypto';

import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain, { TaskStatus } from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import taskQuestionsDomain from '@vassembly/domain-task-questions';
import { ExecutionPausedError, UserInputWaitingError } from '@vassembly/errors';
import { runAgentInvokeWithTools } from '@vassembly/service-agent';

import { executionRegistry } from '../../executionRegistry';
import { buildResumeMessage } from './buildResumeMessage';
import { createRecordAgentInvokeProgress } from './createRecordAgentInvokeProgress';
import { logTaskTransition } from './logTaskTransition';
import { mapExecutionError } from './mapExecutionError';
import { TaskExecutionMode } from './types';

import type { ExecuteTaskParams } from './types';

const MISSING_CREDENTIAL_MESSAGE = 'Missing AI credential configuration';

const INVALID_AGENT_ASSIGNED_MESSAGE = 'Task cannot be executed without an assigned agent.';

export { TaskExecutionMode } from './types';

export const executeTask = async ({
  taskId,
  userId,
  mode = TaskExecutionMode.Fresh,
}: ExecuteTaskParams): Promise<void> => {
  const startedAt = Date.now();
  const abortSignal = executionRegistry.register({ taskId });

  try {
    const taskResult = await taskDomain.queries.getModelById({ id: taskId });
    const task = taskResult.data;

    if (!task?.agentAssignedId) {
      await taskDomain.commands.fail({
        taskId,
        errorMessage: INVALID_AGENT_ASSIGNED_MESSAGE,
        errorCode: 'INVALID_AGENT_ASSIGNED',
      });
      logTaskTransition({
        event: 'task.status.failed',
        taskId,
        userId,
        errorCode: 'INVALID_AGENT_ASSIGNED',
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    if (mode === TaskExecutionMode.Fresh) {
      await taskDomain.commands.markInProgress({ taskId });
    }

    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    const credentialId = preference.data?.integrationCredentialId;

    if (!credentialId) {
      await taskDomain.commands.fail({
        taskId,
        errorMessage: MISSING_CREDENTIAL_MESSAGE,
        errorCode: 'MISSING_CREDENTIAL',
      });
      logTaskTransition({
        event: 'task.status.failed',
        taskId,
        userId,
        errorCode: 'MISSING_CREDENTIAL',
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    let message = task.description!;

    if (mode === TaskExecutionMode.Resume) {
      const progressResult = await taskProgressDomain.queries.getModelByTaskId({ taskId });
      const events = progressResult.data?.events ?? [];
      const questionsResult = await taskQuestionsDomain.queries.getTaskQuestions({ taskId });
      const answeredQuestions = questionsResult.data?.answeredQuestions ?? [];
      message = buildResumeMessage({
        description: task.description!,
        events,
        answeredQuestions,
      });
    }

    const rootInvocationId = randomUUID();

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: task.agentAssignedId,
      message,
      connectionOverride: { integrationCredentialId: credentialId },
      toolContext: {
        userId,
        taskId,
        invocationId: rootInvocationId,
        callerAgentId: task.agentAssignedId,
        callerAgentType: 'system',
        recursionDepth: 0,
        rootInvokeId: randomUUID(),
        abortSignal,
        shouldAbort: async (): Promise<boolean> => {
          const currentTask = await taskDomain.queries.getModelById({ id: taskId });
          return currentTask.data?.status === TaskStatus.Paused;
        },
        recordAgentInvokeProgress: createRecordAgentInvokeProgress({ taskId, userId }),
      },
    });

    await taskProgressDomain.commands.finalizeTaskProgress({ taskId });

    await taskDomain.commands.complete({ taskId, llmResponse: invokeResult.message });
    logTaskTransition({
      event: 'task.status.done',
      taskId,
      userId,
      durationMs: Date.now() - startedAt,
      provider: invokeResult.metadata?.provider,
      model: invokeResult.metadata?.model,
    });
  } catch (error) {
    if (error instanceof ExecutionPausedError) {
      logTaskTransition({
        event: 'task.execution.paused',
        taskId,
        userId,
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    if (error instanceof UserInputWaitingError) {
      logTaskTransition({
        event: 'task.execution.waiting',
        taskId,
        userId,
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    const mapped = mapExecutionError(error);

    const currentTask = await taskDomain.queries.getModelById({ id: taskId });
    if (currentTask.data?.status === TaskStatus.Waiting) {
      return;
    }

    try {
      await taskProgressDomain.commands.finalizeTaskProgress({ taskId });
    } catch {
      // Silently fail if progress recording fails during error handling
    }

    await taskDomain.commands.fail({ taskId, ...mapped });
    logTaskTransition({
      event: 'task.status.failed',
      taskId,
      userId,
      errorCode: mapped.errorCode,
      durationMs: Date.now() - startedAt,
    });
  } finally {
    executionRegistry.deregister({ taskId });
  }
};
