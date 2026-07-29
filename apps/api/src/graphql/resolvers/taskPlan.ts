import taskCommentDomain from '@vassembly/domain-task-comment';
import taskPlanInstanceDomain, {
  TaskPlanInstanceStatus,
} from '@vassembly/domain-task-plan-instance';
import type { TaskPlanInstanceItemResponse } from '@vassembly/domain-task-plan-instance';
import taskPlanTemplateDomain from '@vassembly/domain-task-plan-template';
import { defineObjectType, graphQLListType } from '@vassembly/graphql';

import type { ApiGraphQLContext } from '../shared/types';
import { resolveAgentDisplayNames } from './shared/resolveAgentDisplayName';
import { resolveSkillDisplayNames } from './shared/resolveSkillDisplayName';

import type { Builder } from '@vassembly/graphql';

interface TaskCommentPlanParent {
  taskPlanInstanceId?: string | null;
}

interface TaskSkillIdsParent {
  id: string;
}

interface EnrichedPlanItem {
  templateItemIndex: number;
  agentId: string;
  agentName: string;
  skillId: string | null;
  skillName: string | null;
  order: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  description?: string | null;
}

const toIsoStringOrNull = (value: Date | string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const mapInstanceItemForEnrichment = (
  item: TaskPlanInstanceItemResponse,
): {
  templateItemIndex: number;
  agentId: string;
  skillId: string | null;
  order: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  retryCount: number;
} => ({
  templateItemIndex: item.templateItemIndex,
  agentId: item.agentId,
  skillId: item.skillId,
  order: item.order,
  status: item.status,
  startedAt: toIsoStringOrNull(item.startedAt),
  completedAt: toIsoStringOrNull(item.completedAt),
  failedAt: toIsoStringOrNull(item.failedAt),
  errorMessage: item.errorMessage,
  retryCount: item.retryCount,
});

const enrichPlanItems = async ({
  templateItems,
  instanceItems,
  userId,
}: {
  templateItems: Array<{
    agentId: string;
    skillId: string | null;
    description: string;
    order: number;
  }>;
  instanceItems: Array<{
    templateItemIndex: number;
    agentId: string;
    skillId: string | null;
    order: number;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    failedAt?: string | null;
    errorMessage?: string | null;
    retryCount: number;
  }>;
  userId?: string;
}) => {
  const agentIds = [
    ...templateItems.map((item) => item.agentId),
    ...instanceItems.map((item) => item.agentId),
  ];
  const skillIds = [
    ...templateItems.map((item) => item.skillId),
    ...instanceItems.map((item) => item.skillId),
  ].filter((skillId): skillId is string => skillId !== null);

  const [agentNames, skillNames] = await Promise.all([
    resolveAgentDisplayNames({ agentIds, userId }),
    resolveSkillDisplayNames({ skillIds }),
  ]);

  return {
    templateItems: templateItems.map((item) => ({
      ...item,
      agentName: agentNames.get(item.agentId) ?? item.agentId,
      skillName: item.skillId ? skillNames.get(item.skillId) ?? null : null,
    })),
    instanceItems: instanceItems.map((item) => ({
      ...item,
      agentName: agentNames.get(item.agentId) ?? item.agentId,
      skillName: item.skillId ? skillNames.get(item.skillId) ?? null : null,
      description: templateItems[item.templateItemIndex]?.description ?? null,
    })) as EnrichedPlanItem[],
  };
};

export const registerTaskPlanResolvers = (builder: Builder): void => {
  defineObjectType(builder, 'TaskPlanTemplateItem', {
    fields: (t) => ({
      agentId: t.exposeID('agentId'),
      agentName: t.exposeString('agentName'),
      skillId: t.exposeID('skillId', { nullable: true }),
      skillName: t.exposeString('skillName', { nullable: true }),
      description: t.exposeString('description'),
      order: t.exposeInt('order'),
    }),
  });

  defineObjectType(builder, 'TaskPlanTemplate', {
    fields: (t) => ({
      id: t.exposeID('id'),
      shortName: t.exposeString('shortName'),
      description: t.exposeString('description'),
      inputDetails: t.field({
        type: 'JSON',
        resolve: (parent: { inputDetails?: Record<string, unknown> }) => parent.inputDetails ?? {},
      }),
      outputDetails: t.field({
        type: 'JSON',
        resolve: (parent: { outputDetails?: Record<string, unknown> }) => parent.outputDetails ?? {},
      }),
      items: t.field({
        type: graphQLListType('TaskPlanTemplateItem'),
        resolve: (parent: { items?: object[] }) => parent.items ?? [],
      }),
    }),
  });

  defineObjectType(builder, 'TaskPlanInstanceItem', {
    fields: (t) => ({
      templateItemIndex: t.exposeInt('templateItemIndex'),
      agentId: t.exposeID('agentId'),
      agentName: t.exposeString('agentName'),
      skillId: t.exposeID('skillId', { nullable: true }),
      skillName: t.exposeString('skillName', { nullable: true }),
      order: t.exposeInt('order'),
      status: t.exposeString('status'),
      startedAt: t.exposeString('startedAt', { nullable: true }),
      completedAt: t.exposeString('completedAt', { nullable: true }),
      failedAt: t.exposeString('failedAt', { nullable: true }),
      errorMessage: t.exposeString('errorMessage', { nullable: true }),
      retryCount: t.exposeInt('retryCount'),
      description: t.exposeString('description', { nullable: true }),
    }),
  });

  defineObjectType(builder, 'TaskPlanInstance', {
    fields: (t) => ({
      id: t.exposeID('id'),
      taskPlanTemplateId: t.exposeID('taskPlanTemplateId'),
      status: t.exposeString('status'),
      inputDetails: t.field({
        type: 'JSON',
        resolve: (parent: { inputDetails?: Record<string, unknown> }) => parent.inputDetails ?? {},
      }),
      items: t.field({
        type: graphQLListType('TaskPlanInstanceItem'),
        resolve: (parent: { items?: object[] }) => parent.items ?? [],
      }),
      startedAt: t.exposeString('startedAt', { nullable: true }),
      completedAt: t.exposeString('completedAt', { nullable: true }),
      failedAt: t.exposeString('failedAt', { nullable: true }),
    }),
  });

  defineObjectType(builder, 'TaskCommentPlan', {
    fields: (t) => ({
      template: t.field({
        type: 'TaskPlanTemplate',
        resolve: (parent: { template: object }) => parent.template,
      }),
      instance: t.field({
        type: 'TaskPlanInstance',
        resolve: (parent: { instance: object }) => parent.instance,
      }),
    }),
  });

  builder.objectField('TaskComment', 'plan', (t) =>
    t.field({
      type: 'TaskCommentPlan',
      nullable: true,
      resolve: async (parent, _args, context: ApiGraphQLContext) => {
        const taskPlanInstanceId = (parent as TaskCommentPlanParent).taskPlanInstanceId;
        if (!taskPlanInstanceId) {
          return null;
        }

        const instanceResult = await taskPlanInstanceDomain.queries.getById({
          id: taskPlanInstanceId,
        });
        const templateId = instanceResult.data.taskPlanTemplateId;

        if (!templateId) {
          return null;
        }

        const templateResult = await taskPlanTemplateDomain.queries.getById({
          id: templateId,
        });

        const enriched = await enrichPlanItems({
          templateItems: templateResult.data.items ?? [],
          instanceItems: (instanceResult.data.items ?? []).map(mapInstanceItemForEnrichment),
          userId: context.userId,
        });

        return {
          template: {
            ...templateResult.data,
            items: enriched.templateItems,
          },
          instance: {
            ...instanceResult.data,
            items: enriched.instanceItems,
          },
        };
      },
    }),
  );

  builder.objectField('Task', 'skillIdsUsed', (t) =>
    t.field({
      type: graphQLListType('String'),
      nullable: true,
      resolve: async (parent) => {
        const taskId = (parent as TaskSkillIdsParent).id;
        const listResult = await taskCommentDomain.queries.listByTaskId({
          taskId,
        });
        const comments = listResult.data ?? [];
        const skillIds = new Set<string>();

        for (const comment of comments) {
          for (const skillId of comment.skillIdsUsed ?? []) {
            skillIds.add(skillId);
          }
        }

        return [...skillIds];
      },
    }),
  );
};

export { TaskPlanInstanceStatus };
