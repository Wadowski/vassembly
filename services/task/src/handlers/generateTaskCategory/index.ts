import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain from '@vassembly/domain-task';
import { runAgentInvokeWithTools } from '@vassembly/service-agent';

import { logTaskCategoryEvent } from './logTaskCategoryEvent';
import { normalizeGeneratedCategory } from './normalizeGeneratedCategory';

import type { GenerateTaskCategoryHandlerInput } from './types';

export const generateTaskCategory = async ({
  taskId,
  userId,
}: GenerateTaskCategoryHandlerInput): Promise<void> => {
  const startedAt = Date.now();

  try {
    logTaskCategoryEvent({ event: 'task.category.started', taskId, userId });

    const taskResult = await taskDomain.queries.getModelById({ id: taskId });
    const task = taskResult.data;

    if (task?.category != null) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: 'already_set' });
      return;
    }

    if (!task?.description?.trim()) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: 'empty_description' });
      return;
    }

    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    const integrationCredentialId = preference.data?.integrationCredentialId;

    if (!integrationCredentialId) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: 'missing_credential' });
      return;
    }

    const agentResult = await systemAgentDomain.queries.getActiveByName({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
    });

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: agentResult.data.id!,
      message: task.description,
      connectionOverride: { integrationCredentialId },
      toolContext: {} as Parameters<typeof runAgentInvokeWithTools>[0]['toolContext'],
    });

    const normalized = normalizeGeneratedCategory({ rawOutput: invokeResult.message });

    if (!normalized.isValid) {
      logTaskCategoryEvent({
        event: 'task.category.skipped',
        taskId,
        userId,
        reason: normalized.reason,
      });
      return;
    }

    await taskDomain.commands.updateTask({ id: taskId, category: normalized.category });

    logTaskCategoryEvent({
      event: 'task.category.completed',
      taskId,
      userId,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logTaskCategoryEvent({
      event: 'task.category.failed',
      taskId,
      userId,
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
  }
};
