import { randomUUID } from 'node:crypto';

import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain from '@vassembly/domain-task';
import { runAgentInvokeWithTools } from '@vassembly/service-agent';

import { logTaskTransition } from './logTaskTransition';
import { mapExecutionError } from './mapExecutionError';

import type { ExecuteTaskParams } from './types';

const MISSING_CREDENTIAL_MESSAGE =
  'Configure a "preferred for system calls" AI credential in Settings.';

const INVALID_AGENT_ASSIGNED_MESSAGE = 'Task cannot be executed without an assigned agent.';

export const executeTask = async ({ taskId, userId }: ExecuteTaskParams): Promise<void> => {
  const startedAt = Date.now();

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

    await taskDomain.commands.markInProgress({ taskId });

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

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: task.agentAssignedId,
      message: task.description!,
      connectionOverride: { integrationCredentialId: credentialId },
      toolContext: {
        userId,
        callerAgentId: task.agentAssignedId,
        callerAgentType: 'system',
        recursionDepth: 0,
        rootInvokeId: randomUUID(),
      },
    });

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
    const mapped = mapExecutionError(error);
    await taskDomain.commands.fail({ taskId, ...mapped });
    logTaskTransition({
      event: 'task.status.failed',
      taskId,
      userId,
      errorCode: mapped.errorCode,
      durationMs: Date.now() - startedAt,
    });
  }
};
