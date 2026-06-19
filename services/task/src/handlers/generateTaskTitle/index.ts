import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain from '@vassembly/domain-task';
import { runAgentInvokeWithTools } from '@vassembly/service-agent';

import { logTaskTitleEvent } from './logTaskTitleEvent';
import { normalizeGeneratedTitle } from './normalizeGeneratedTitle';

import type { GenerateTaskTitleHandlerInput } from './types';

export const generateTaskTitle = async ({
  taskId,
  userId,
}: GenerateTaskTitleHandlerInput): Promise<void> => {
  const startedAt = Date.now();

  try {
    logTaskTitleEvent({ event: 'task.title.started', taskId, userId });

    const taskResult = await taskDomain.queries.getModelById({ id: taskId });
    const task = taskResult.data;

    if (task?.title != null && task.title.trim() !== '') {
      logTaskTitleEvent({ event: 'task.title.skipped', taskId, userId, reason: 'already_set' });
      return;
    }

    if (!task?.description?.trim()) {
      logTaskTitleEvent({ event: 'task.title.skipped', taskId, userId, reason: 'empty_description' });
      return;
    }

    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    const integrationCredentialId = preference.data?.integrationCredentialId;

    if (!integrationCredentialId) {
      logTaskTitleEvent({ event: 'task.title.skipped', taskId, userId, reason: 'missing_credential' });
      return;
    }

    const agentResult = await systemAgentDomain.queries.getActiveByName({
      name: SYSTEM_AGENT_NAME.TaskTitleGenerator,
    });

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: agentResult.data.id!,
      message: task.description,
      connectionOverride: { integrationCredentialId },
      toolContext: {} as Parameters<typeof runAgentInvokeWithTools>[0]['toolContext'],
    });

    const normalized = normalizeGeneratedTitle({ rawOutput: invokeResult.message });

    if (!normalized.isValid) {
      logTaskTitleEvent({
        event: 'task.title.skipped',
        taskId,
        userId,
        reason: normalized.reason,
      });
      return;
    }

    await taskDomain.commands.updateTask({ id: taskId, title: normalized.title });

    logTaskTitleEvent({
      event: 'task.title.completed',
      taskId,
      userId,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logTaskTitleEvent({
      event: 'task.title.failed',
      taskId,
      userId,
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
  }
};
