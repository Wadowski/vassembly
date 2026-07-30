import { InternalError } from '@vassembly/errors';

import taskPlanInstanceDomain, {
  TaskPlanInstanceStatus,
} from '@vassembly/domain-task-plan-instance';
import taskPlanTemplateDomain from '@vassembly/domain-task-plan-template';

import { logTaskPlanEvent } from '../logTaskPlanEvent';
import { createRecordAgentInvokeProgress } from '../../shared/createRecordAgentInvokeProgress';
import { createRecordInternalToolUsageEvent } from '../createRecordInternalToolUsageEvent';
import { createRecordMcpUsageEvent } from '../createRecordMcpUsageEvent';
import { recordProgressEvent } from '../../shared/recordProgressHelper';
import { groupItemsByOrder } from './groupItemsByOrder';
import { runPlanItem } from './runPlanItem';

import type { PriorItemContextEntry } from './buildPriorItemsContext';
import type { OrchestrateTaskPlanInstanceParams, OrchestrateTaskPlanInstanceResult } from './types';

export interface OrchestrateTaskPlanInstanceOptions {
  userId?: string;
  agentAssignedId?: string;
  credentialId?: string;
  specializationIds?: string[] | null;
  abortSignal?: AbortSignal;
  shouldReconcile?: boolean;
}

const reconcileRetryItems = async ({
  instanceId,
  items,
  taskId,
  commentId,
  userId,
  taskPlanTemplateId,
}: {
  instanceId: string;
  items: Array<{ templateItemIndex: number; status: TaskPlanInstanceStatus }>;
  taskId: string;
  commentId: string;
  userId?: string;
  taskPlanTemplateId?: string;
}): Promise<void> => {
  const itemsToRetry = items.filter((item) => item.status === TaskPlanInstanceStatus.Failed);

  await Promise.all(
    itemsToRetry.map(async (item) => {
      await taskPlanInstanceDomain.commands.retryItem({
        id: instanceId,
        templateItemIndex: item.templateItemIndex,
      });

      logTaskPlanEvent({
        event: 'taskPlan.instance.itemRetried',
        taskId,
        commentId,
        userId,
        taskPlanTemplateId,
        taskPlanInstanceId: instanceId,
        templateItemIndex: item.templateItemIndex,
      });
    }),
  );
};

const resolveProgressAgentId = ({
  agentAssignedId,
  items,
}: {
  agentAssignedId?: string;
  items: Array<{ agentId: string }>;
}): string => {
  if (agentAssignedId) {
    return agentAssignedId;
  }

  const firstItemAgentId = items[0]?.agentId;

  if (!firstItemAgentId) {
    throw new InternalError('Task plan instance has no items to resolve progress agent');
  }

  return firstItemAgentId;
};

export const orchestrateTaskPlanInstance = async (
  params: OrchestrateTaskPlanInstanceParams,
  options: OrchestrateTaskPlanInstanceOptions = {},
): Promise<OrchestrateTaskPlanInstanceResult> => {
  const startedAt = Date.now();
  const executedItemIndexes: number[] = [];
  const instanceResult = await taskPlanInstanceDomain.queries.getModelById({
    id: params.taskPlanInstanceId,
  });
  const instance = instanceResult.data;

  if (
    options.shouldReconcile &&
    instance.status === TaskPlanInstanceStatus.Failed
  ) {
    await reconcileRetryItems({
      instanceId: params.taskPlanInstanceId,
      items: instance.items ?? [],
      taskId: params.taskId,
      commentId: params.commentId,
      userId: options.userId,
      taskPlanTemplateId: instance.taskPlanTemplateId,
    });
  }

  const refreshedInstance = await taskPlanInstanceDomain.queries.getModelById({
    id: params.taskPlanInstanceId,
  });
  const currentInstance = refreshedInstance.data;
  const templateResult = await taskPlanTemplateDomain.queries.getModelById({
    id: currentInstance.taskPlanTemplateId!,
  });
  const template = templateResult.data;
  const itemGroups = groupItemsByOrder({ items: currentInstance.items ?? [] });
  const itemSkillIds = new Map(
    (currentInstance.items ?? []).map((item) => [item.templateItemIndex, item.skillId]),
  );
  const completedItemContext = new Map<number, PriorItemContextEntry>(
    (currentInstance.items ?? [])
      .filter((item) => item.status === TaskPlanInstanceStatus.Done)
      .map((item) => [
        item.templateItemIndex,
        {
          templateItemIndex: item.templateItemIndex,
          description: template.items?.[item.templateItemIndex]?.description ?? '',
          output: item.output ?? null,
        },
      ]),
  );
  const progressAgentId = resolveProgressAgentId({
    agentAssignedId: options.agentAssignedId,
    items: currentInstance.items ?? [],
  });

  if (options.userId) {
    await recordProgressEvent({
      taskId: params.taskId,
      userId: options.userId,
      commentId: params.commentId,
      agentId: progressAgentId,
      state: 'started',
    });
  }

  let hasFailed = false;
  let executedCount = 0;

  const recordingCallbacks =
    options.userId
      ? {
          recordAgentInvokeProgress: createRecordAgentInvokeProgress({
            taskId: params.taskId,
            userId: options.userId,
            commentId: params.commentId,
          }),
          recordMcpUsageEvent: createRecordMcpUsageEvent({
            taskId: params.taskId,
            userId: options.userId,
            commentId: params.commentId,
          }),
          recordInternalToolUsageEvent: createRecordInternalToolUsageEvent({
            taskId: params.taskId,
            userId: options.userId,
            commentId: params.commentId,
          }),
        }
      : {};

  for (const group of itemGroups) {
    if (hasFailed) {
      break;
    }

    const runnableItems = group.filter((item) => item.status === TaskPlanInstanceStatus.Pending);

    if (runnableItems.length === 0) {
      continue;
    }

    const groupResults = await Promise.all(
      runnableItems.map(async (item) => {
        await taskPlanInstanceDomain.commands.updateItemStatus({
          id: params.taskPlanInstanceId,
          templateItemIndex: item.templateItemIndex,
          status: TaskPlanInstanceStatus.InProgress,
        });

        logTaskPlanEvent({
          event: 'taskPlan.instance.itemStarted',
          taskId: params.taskId,
          commentId: params.commentId,
          userId: options.userId,
          taskPlanTemplateId: template.id,
          taskPlanInstanceId: params.taskPlanInstanceId,
          templateItemIndex: item.templateItemIndex,
        });

        const templateItem = template.items?.[item.templateItemIndex];
        const templateItemOrder = templateItem?.order ?? 0;
        const priorItems = [...completedItemContext.values()].filter(
          (entry) =>
            (template.items?.[entry.templateItemIndex]?.order ?? 0) < templateItemOrder,
        );

        const result = await runPlanItem({
          templateItemIndex: item.templateItemIndex,
          agentId: item.agentId,
          description: templateItem?.description ?? '',
          templateItem: {
            description: templateItem?.description ?? '',
            skillId: templateItem?.skillId ?? null,
          },
          instanceInputDetails: currentInstance.inputDetails ?? {},
          priorItems,
          taskId: params.taskId,
          commentId: params.commentId,
          userId: options.userId ?? '',
          credentialId: options.credentialId ?? '',
          specializationIds: options.specializationIds ?? null,
          abortSignal: options.abortSignal,
          ...recordingCallbacks,
        });

        if (result.createdSkillId) {
          itemSkillIds.set(item.templateItemIndex, result.createdSkillId);
          await taskPlanTemplateDomain.commands.backfillItemSkillId({
            id: template.id!,
            templateItemIndex: item.templateItemIndex,
            skillId: result.createdSkillId,
          });
          await taskPlanInstanceDomain.commands.backfillItemSkillId({
            id: params.taskPlanInstanceId,
            templateItemIndex: item.templateItemIndex,
            skillId: result.createdSkillId,
          });

          logTaskPlanEvent({
            event: 'taskPlan.instance.skillBackfilled',
            taskId: params.taskId,
            commentId: params.commentId,
            userId: options.userId,
            taskPlanTemplateId: template.id,
            taskPlanInstanceId: params.taskPlanInstanceId,
            templateItemIndex: item.templateItemIndex,
            skillId: result.createdSkillId,
          });
        }

        await taskPlanInstanceDomain.commands.updateItemStatus({
          id: params.taskPlanInstanceId,
          templateItemIndex: item.templateItemIndex,
          status:
            result.status === 'done'
              ? TaskPlanInstanceStatus.Done
              : TaskPlanInstanceStatus.Failed,
          output: result.status === 'done' ? result.output : undefined,
          errorMessage: result.errorMessage,
        });

        if (result.status === 'done') {
          completedItemContext.set(item.templateItemIndex, {
            templateItemIndex: item.templateItemIndex,
            description: templateItem?.description ?? '',
            output: result.output ?? null,
          });

          logTaskPlanEvent({
            event: 'taskPlan.instance.itemCompleted',
            taskId: params.taskId,
            commentId: params.commentId,
            userId: options.userId,
            taskPlanTemplateId: template.id,
            taskPlanInstanceId: params.taskPlanInstanceId,
            templateItemIndex: item.templateItemIndex,
          });
        } else {
          logTaskPlanEvent({
            event: 'taskPlan.instance.itemFailed',
            taskId: params.taskId,
            commentId: params.commentId,
            userId: options.userId,
            taskPlanTemplateId: template.id,
            taskPlanInstanceId: params.taskPlanInstanceId,
            templateItemIndex: item.templateItemIndex,
            reason: result.errorMessage,
          });
        }

        return {
          templateItemIndex: item.templateItemIndex,
          status: result.status,
        };
      }),
    );

    for (const groupResult of groupResults) {
      executedItemIndexes.push(groupResult.templateItemIndex);
      executedCount += 1;
    }

    if (groupResults.some((groupResult) => groupResult.status === 'failed')) {
      hasFailed = true;
    }
  }

  const totalItems = currentInstance.items?.length ?? 0;
  const instanceStatus = hasFailed
    ? TaskPlanInstanceStatus.Failed
    : executedCount === totalItems && totalItems > 0
      ? TaskPlanInstanceStatus.Done
      : TaskPlanInstanceStatus.InProgress;

  const skillIdsUsed = [...new Set(
    [...itemSkillIds.values()].filter((skillId): skillId is string => skillId !== null),
  )];

  const durationMs = Date.now() - startedAt;

  if (options.userId) {
    if (instanceStatus === TaskPlanInstanceStatus.Failed) {
      await recordProgressEvent({
        taskId: params.taskId,
        userId: options.userId,
        commentId: params.commentId,
        agentId: progressAgentId,
        state: 'failed',
        duration: durationMs,
      });
    } else if (instanceStatus === TaskPlanInstanceStatus.Done) {
      await recordProgressEvent({
        taskId: params.taskId,
        userId: options.userId,
        commentId: params.commentId,
        agentId: progressAgentId,
        state: 'completed',
        duration: durationMs,
      });
    }
  }

  if (instanceStatus === TaskPlanInstanceStatus.Failed) {
    logTaskPlanEvent({
      event: 'taskPlan.instance.failed',
      taskId: params.taskId,
      commentId: params.commentId,
      userId: options.userId,
      taskPlanTemplateId: template.id,
      taskPlanInstanceId: params.taskPlanInstanceId,
      durationMs,
    });
  } else if (instanceStatus === TaskPlanInstanceStatus.Done) {
    logTaskPlanEvent({
      event: 'taskPlan.instance.completed',
      taskId: params.taskId,
      commentId: params.commentId,
      userId: options.userId,
      taskPlanTemplateId: template.id,
      taskPlanInstanceId: params.taskPlanInstanceId,
      durationMs,
    });
  }

  return {
    instanceStatus,
    skillIdsUsed,
    executedItemIndexes,
  };
};
