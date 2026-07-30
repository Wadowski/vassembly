import { randomUUID } from 'node:crypto';

import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from './initDomainContext';
import { ensureAssistantSystemAgent, ensureTaskDomainIndexes } from './seedTask';
import { seedTaskForUser } from './seedTaskData';
import { getSystemAgentIdByName } from './seedSystemAgent';
import { seedSkillsForSpecialization } from './seedSkill';
import type { SeedTaskPlanCommentParams, SeedTaskPlanCommentResult, TaskPlanSeedItem } from './taskPlanTypes';

const TASK_PLAN_TEMPLATE_COLLECTION = 'taskPlanTemplates';
const TASK_PLAN_INSTANCE_COLLECTION = 'taskPlanInstances';

const DEFAULT_SPECIALIZATION_NAME = 'Legal';

const ensureTaskCommentIndexes = async ({ context }: { context: SeedContext }): Promise<void> => {
  await ensureTaskDomainIndexes({ context });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });

  await init({ indexFunctions: [taskCommentDomain.default.mongodbIndexes] });
};

const resolveSkillIds = ({
  skillNames,
  skillIdsByName,
}: {
  skillNames: string[];
  skillIdsByName: Record<string, string>;
}): string[] => {
  return skillNames.map((skillName) => {
    const skillId = skillIdsByName[skillName.trim().toLowerCase()];
    if (!skillId) {
      throw new Error(`Skill "${skillName}" was not seeded`);
    }
    return skillId;
  });
};

const buildInstanceItems = async ({
  context,
  items,
  skillIdsByName,
}: {
  context: SeedContext;
  items: TaskPlanSeedItem[];
  skillIdsByName: Record<string, string>;
}): Promise<Array<Record<string, unknown>>> => {
  const instanceItems: Array<Record<string, unknown>> = [];

  for (const [templateItemIndex, item] of items.entries()) {
    const agentId = await getSystemAgentIdByName({ context, name: item.agentName });
    const skillId =
      item.skillName === null || item.skillName.trim() === ''
        ? null
        : skillIdsByName[item.skillName.trim().toLowerCase()] ?? null;

    instanceItems.push({
      templateItemIndex,
      agentId,
      skillId,
      order: item.order,
      status: item.status,
      startedAt: item.status === 'pending' ? null : new Date(),
      completedAt: item.status === 'done' ? new Date() : null,
      failedAt: item.status === 'failed' ? new Date() : null,
      output: null,
      errorMessage: item.status === 'failed' ? 'E2E seeded failure' : null,
      retryCount: 0,
    });
  }

  return instanceItems;
};

export const seedTaskPlanComment = async ({
  context,
  userId,
  params,
  taskId: existingTaskId,
}: {
  context: SeedContext;
  userId: string;
  params: SeedTaskPlanCommentParams;
  taskId?: string;
}): Promise<SeedTaskPlanCommentResult> => {
  await ensureDomainInfrastructure({ context });
  await ensureTaskCommentIndexes({ context });
  await ensureAssistantSystemAgent({ context });

  const uniqueSkills = [...new Set(params.skillNames.map((name) => name.trim()).filter(Boolean))];
  const { specializationId, skillIds: skillIdsByName } = await seedSkillsForSpecialization({
    context,
    specializationName: DEFAULT_SPECIALIZATION_NAME,
    skills: uniqueSkills.map((name) => ({
      name,
      description: `E2E skill ${name}`,
    })),
  });

  const taskId =
    existingTaskId ??
    (await seedTaskForUser({
      context,
      userId,
      description: 'E2E task plan fixture',
      title: 'Task plan E2E',
      status: 'done',
    }));

  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });
  const commentResult = await taskCommentDomain.default.commands.create({
    taskId,
    userId,
    userText: params.userText ?? 'Review this contract for risky clauses',
  });
  const commentId = commentResult.data.id;
  if (!commentId) {
    throw new Error('Seeded task comment is missing an id');
  }

  const templateItems = await Promise.all(
    params.items.map(async (item, templateItemIndex) => ({
      agentId: await getSystemAgentIdByName({ context, name: item.agentName }),
      skillId:
        item.skillName === null || item.skillName.trim() === ''
          ? null
          : skillIdsByName[item.skillName.trim().toLowerCase()] ?? null,
      description: item.description,
      order: item.order,
      templateItemIndex,
    })),
  );

  const now = new Date();
  const taskPlanTemplateId = randomUUID();
  const taskPlanInstanceId = randomUUID();
  const { mongoDb } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const { ObjectId } = requireWorkspaceModule<typeof import('mongodb')>({
    moduleName: 'mongodb',
  });

  await mongoDb.db.collection(TASK_PLAN_TEMPLATE_COLLECTION).insertOne({
    _id: new ObjectId(),
    id: taskPlanTemplateId,
    shortName: params.shortName,
    description: `E2E plan template for ${params.shortName}`,
    inputDetails: {},
    outputDetails: {},
    items: templateItems.map((templateItem) => {
      const { templateItemIndex: omittedTemplateItemIndex, ...item } = templateItem;
      void omittedTemplateItemIndex;
      return item;
    }),
    createdAt: now,
    updatedAt: now,
    removedAt: null,
  });

  const instanceItems = await buildInstanceItems({
    context,
    items: params.items,
    skillIdsByName,
  });

  await mongoDb.db.collection(TASK_PLAN_INSTANCE_COLLECTION).insertOne({
    _id: new ObjectId(),
    id: taskPlanInstanceId,
    taskPlanTemplateId,
    taskId,
    commentId,
    inputDetails: {},
    status: 'in-progress',
    items: instanceItems,
    startedAt: now,
    completedAt: null,
    failedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const skillIdsUsed = resolveSkillIds({ skillNames: params.skillNames, skillIdsByName });

  await mongoDb.db.collection('taskComments').updateOne(
    { _id: new ObjectId(commentId) },
    {
      $set: {
        taskPlanInstanceId,
        skillIdsUsed,
        ...(params.agentResponse !== undefined && params.agentResponse !== null
          ? { agentResponse: params.agentResponse }
          : {}),
      },
    },
  );

  return {
    taskId,
    commentId,
    taskPlanInstanceId,
    specializationId,
    skillIdsByName,
  };
};

export const seedTaskWithCommentSkills = async ({
  context,
  userId,
  commentSkills,
}: {
  context: SeedContext;
  userId: string;
  commentSkills: Array<{ commentKey: string; skillNames: string[] }>;
}): Promise<{
  taskId: string;
  commentIds: Record<string, string>;
  specializationId: string;
  skillIdsByName: Record<string, string>;
}> => {
  let taskId: string | undefined;
  const commentIds: Record<string, string> = {};
  let specializationId = '';
  let skillIdsByName: Record<string, string> = {};

  for (const entry of commentSkills) {
    const seeded = await seedTaskPlanComment({
      context,
      userId,
      taskId,
      params: {
        shortName: `e2e-plan-${entry.commentKey}`,
        items: [
          {
            order: 1,
            agentName: 'Legal researcher',
            skillName: entry.skillNames[0] ?? null,
            description: `E2E plan for comment ${entry.commentKey}`,
            status: 'done',
          },
        ],
        skillNames: entry.skillNames,
        userText: `Comment ${entry.commentKey}`,
      },
    });

    taskId = seeded.taskId;
    commentIds[entry.commentKey] = seeded.commentId;
    specializationId = seeded.specializationId;
    skillIdsByName = seeded.skillIdsByName;
  }

  if (!taskId) {
    throw new Error('Failed to seed task with comment skills');
  }

  return {
    taskId,
    commentIds,
    specializationId,
    skillIdsByName,
  };
};
