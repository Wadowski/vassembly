import { randomUUID } from 'node:crypto';

import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from './initDomainContext';
import { ensureTaskProgressDomainIndexes } from './pauseResumeRetryHelpers';
import {
  seedSpecialization,
  seedSpecializationWithRelations,
} from './seedSpecialization';
import { ensureAssistantSystemAgent, ensureTaskDomainIndexes } from './seedTask';
import { seedTaskForUser } from './seedTaskData';
import { getSystemAgentIdByName } from './seedSystemAgent';
import { seedMcpCatalog } from './seedMcp';
import type {
  MultiSpecClassificationSeedResult,
  MultiSpecPlanSeedItem,
  SeedClassifierProgressEventParams,
  SeedClassifierTurnParams,
  SeedMultiSpecPlanCommentParams,
  SeedMultiSpecPlanCommentResult,
} from './multiSpecTaskTypes';

const TASK_PLAN_TEMPLATE_COLLECTION = 'taskPlanTemplates';
const TASK_PLAN_INSTANCE_COLLECTION = 'taskPlanInstances';

const normalizeSpecializationKey = (name: string): string => name.trim().toLowerCase();

export const rememberSpecializationId = ({
  store,
  name,
  specializationId,
}: {
  store: Record<string, string>;
  name: string;
  specializationId: string;
}): Record<string, string> => ({
  ...store,
  [normalizeSpecializationKey(name)]: specializationId,
});

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

export const specializationExistsInCatalog = async ({
  context,
  name,
}: {
  context: SeedContext;
  name: string;
}): Promise<boolean> => {
  const specializationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-specialization')>({
    moduleName: '@vassembly/domain-specialization',
  });

  const catalog = await specializationDomain.default.queries.getList({ page: 0, size: 200 });
  const normalized = normalizeSpecializationKey(name);

  return catalog.items.some((item) => normalizeSpecializationKey(item.name) === normalized);
};

export const seedTaskCommentAwaitingClassification = async ({
  context,
  userId,
  userText,
  taskId: existingTaskId,
}: {
  context: SeedContext;
  userId: string;
  userText: string;
  taskId?: string;
}): Promise<MultiSpecClassificationSeedResult> => {
  await ensureDomainInfrastructure({ context });
  await ensureTaskCommentIndexes({ context });

  const taskId =
    existingTaskId ??
    (await seedTaskForUser({
      context,
      userId,
      description: userText,
      title: 'Multi-spec classification E2E',
      status: 'done',
    }));

  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });

  const commentResult = await taskCommentDomain.default.commands.create({
    taskId,
    userId,
    userText,
  });

  const commentId = commentResult.data.id;
  if (!commentId) {
    throw new Error('Seeded task comment is missing an id');
  }

  return { taskId, commentId };
};

export const runCommentClassification = async ({
  context,
  userId,
  taskId,
  commentId,
}: {
  context: SeedContext;
  userId: string;
  taskId: string;
  commentId: string;
}): Promise<{ specializationIds: string[]; classifierInputMessage?: string }> => {
  await ensureTaskProgressDomainIndexes({ context });
  await ensureAssistantSystemAgent({ context });

  const taskProgressDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-progress')>({
    moduleName: '@vassembly/domain-task-progress',
  });
  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });
  const serviceAgent = requireWorkspaceModule<typeof import('@vassembly/service-agent')>({
    moduleName: '@vassembly/service-agent',
  });

  const commentResult = await taskCommentDomain.default.queries.getModelById({ id: commentId });
  const comment = commentResult.data;
  if (!comment) {
    throw new Error(`Comment "${commentId}" was not found`);
  }

  if (comment.specializationIds && comment.specializationIds.length > 0) {
    return { specializationIds: comment.specializationIds };
  }

  await taskProgressDomain.default.commands.initializeTaskProgress({
    taskId,
    userId,
    commentId,
  });

  const description = comment.userText ?? '';
  const toolContext = {
    userId,
    taskId,
    commentId,
    invocationId: randomUUID(),
    callerAgentId: '',
    callerAgentType: 'system' as const,
    recursionDepth: 0,
    rootInvokeId: randomUUID(),
  };

  const classifyRaw = await serviceAgent.classifySpecializationToolHandler(
    { taskId, description },
    toolContext,
  );
  const classifyResult = JSON.parse(classifyRaw) as import('@vassembly/service-agent').ClassifySpecializationResult;

  const specializationIds = await resolveClassificationResult({
    context,
    classifyResult,
    toolContext,
    serviceAgent,
  });

  if (specializationIds.length > 0) {
    await taskCommentDomain.default.commands.setSpecializationIds({
      commentId,
      specializationIds,
    });
  }

  return {
    specializationIds,
    classifierInputMessage: description,
  };
};

const resolveClassificationResult = async ({
  context,
  classifyResult,
  toolContext,
  serviceAgent,
}: {
  context: SeedContext;
  classifyResult: import('@vassembly/service-agent').ClassifySpecializationResult;
  toolContext: import('@vassembly/service-agent').InternalToolContext;
  serviceAgent: typeof import('@vassembly/service-agent');
}): Promise<string[]> => {
  if (classifyResult.type === 'skipped') {
    return [];
  }

  const createdIds: string[] = [];

  for (const newSpec of classifyResult.newSpecializations) {
    const createRaw = await serviceAgent.createSpecializationToolHandler(
      { name: newSpec.name, description: newSpec.description },
      toolContext,
    );
    const createResult = JSON.parse(createRaw) as import('@vassembly/service-agent').CreateSpecializationToolResult;
    createdIds.push(createResult.specializationId);
  }

  void context;
  return [...classifyResult.existingSpecializationIds, ...createdIds];
};

export const getCommentSpecializationIds = async ({
  context,
  commentId,
}: {
  context: SeedContext;
  commentId: string;
}): Promise<string[]> => {
  initSeedContext({ context });

  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });

  const commentResult = await taskCommentDomain.default.queries.getModelById({ id: commentId });
  return commentResult.data?.specializationIds ?? [];
};

export const getSpecializationIdByName = async ({
  context,
  name,
}: {
  context: SeedContext;
  name: string;
}): Promise<string | null> => {
  initSeedContext({ context });

  const specializationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-specialization')>({
    moduleName: '@vassembly/domain-specialization',
  });

  const catalog = await specializationDomain.default.queries.getList({ page: 0, size: 200 });
  const normalized = normalizeSpecializationKey(name);
  const match = catalog.items.find((item) => normalizeSpecializationKey(item.name) === normalized);

  return match?.id ?? null;
};

const initSeedContext = ({ context }: { context: SeedContext }): void => {
  process.env.MONGODB_URL = context.mongoUrl;
  process.env.MONGODB_DATABASE = context.mongoDatabase;
};

export const seedSpecializationWithWorkerAgents = async ({
  context,
  name,
}: {
  context: SeedContext;
  name: string;
}): Promise<string> => {
  return seedSpecializationWithRelations({
    context,
    name,
    description: `E2E specialization for ${name}`,
    agentCount: 3,
    linkedMcpCount: 0,
  });
};

export const ensureMcpCatalogIncludesNotion = async ({
  context,
}: {
  context: SeedContext;
}): Promise<void> => {
  await seedMcpCatalog({ context });
};

export const seedMultiSpecPlanComment = async ({
  context,
  userId,
  params,
}: {
  context: SeedContext;
  userId: string;
  params: SeedMultiSpecPlanCommentParams;
}): Promise<SeedMultiSpecPlanCommentResult> => {
  await ensureDomainInfrastructure({ context });
  await ensureTaskCommentIndexes({ context });

  let specializationIdsByName: Record<string, string> = {};

  for (const specializationName of params.specializationNames) {
    const specializationId = await seedSpecializationWithWorkerAgents({
      context,
      name: specializationName,
    });
    specializationIdsByName = rememberSpecializationId({
      store: specializationIdsByName,
      name: specializationName,
      specializationId,
    });
  }

  const taskId = await seedTaskForUser({
    context,
    userId,
    description: params.userText ?? 'Multi-spec plan E2E',
    title: 'Multi-spec plan E2E',
    status: 'done',
  });

  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });

  const commentResult = await taskCommentDomain.default.commands.create({
    taskId,
    userId,
    userText: params.userText ?? 'Multi-spec plan comment',
  });
  const commentId = commentResult.data.id;
  if (!commentId) {
    throw new Error('Seeded task comment is missing an id');
  }

  const specializationIds = params.specializationNames.map((name) => {
    const specializationId = specializationIdsByName[normalizeSpecializationKey(name)];
    if (!specializationId) {
      throw new Error(`Specialization "${name}" was not seeded`);
    }
    return specializationId;
  });

  await taskCommentDomain.default.commands.setSpecializationIds({
    commentId,
    specializationIds,
  });

  const templateItems = await Promise.all(
    params.items.map(async (item, templateItemIndex) => ({
      agentId: await getSystemAgentIdByName({ context, name: item.agentName }),
      skillId: null,
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
    items: templateItems.map(({ templateItemIndex: omitted, ...item }) => {
      void omitted;
      return item;
    }),
    createdAt: now,
    updatedAt: now,
    removedAt: null,
  });

  const instanceItems = await Promise.all(
    params.items.map(async (item, templateItemIndex) => ({
      templateItemIndex,
      agentId: await getSystemAgentIdByName({ context, name: item.agentName }),
      skillId: null,
      order: item.order,
      status: item.status,
      startedAt: item.status === 'pending' ? null : now,
      completedAt: item.status === 'done' ? now : null,
      failedAt: item.status === 'failed' ? now : null,
      output: null,
      errorMessage: item.status === 'failed' ? 'E2E seeded failure' : null,
      retryCount: 0,
    })),
  );

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

  await mongoDb.db.collection('taskComments').updateOne(
    { _id: new ObjectId(commentId) },
    { $set: { taskPlanInstanceId } },
  );

  return {
    taskId,
    commentId,
    taskPlanInstanceId,
    specializationIdsByName,
  };
};

export const seedClassifierProgressEvent = async ({
  context,
  userId,
  taskId,
  commentId,
  params,
}: {
  context: SeedContext;
  userId: string;
  taskId: string;
  commentId: string;
  params: SeedClassifierProgressEventParams;
}): Promise<string> => {
  await ensureTaskProgressDomainIndexes({ context });

  const taskProgressDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-progress')>({
    moduleName: '@vassembly/domain-task-progress',
  });
  const { ProgressEventState } = taskProgressDomain;

  const classifierAgentId = await getSystemAgentIdByName({
    context,
    name: SYSTEM_AGENT_NAME.SpecializationClassifier,
  });

  await taskProgressDomain.default.commands.initializeTaskProgress({
    taskId,
    userId,
    commentId,
  });

  const stateByName: Record<SeedClassifierProgressEventParams['state'], string> = {
    completed: ProgressEventState.Completed,
    skipped: ProgressEventState.Skipped ?? 'skipped',
    failed: ProgressEventState.Failed,
    started: ProgressEventState.Started,
  };

  const eventId = randomUUID();
  await taskProgressDomain.default.commands.recordProgressEvent({
    commentId,
    agentId: classifierAgentId,
    state: stateByName[params.state],
    eventId,
    inputMessages: params.inputMessages ?? JSON.stringify({ prompt: 'E2E classifier input' }),
    generatedResponse: params.generatedResponse ?? JSON.stringify({ output: 'E2E classifier output' }),
    tokenUsage: params.tokenUsage ?? { input: 120, output: 45, total: 165 },
    durationMs: params.durationMs ?? 2_400,
    outcomeSummary: params.outcomeSummary,
    timestamp: new Date(Date.now() + (params.occurredAtOffsetMs ?? 0)),
  });

  return eventId;
};

export const seedClassifierTurnProgressEvents = async ({
  context,
  userId,
  taskId,
  commentId,
  params,
}: {
  context: SeedContext;
  userId: string;
  taskId: string;
  commentId: string;
  params: SeedClassifierTurnParams;
}): Promise<void> => {
  await seedClassifierProgressEvent({
    context,
    userId,
    taskId,
    commentId,
    params: {
      ...params.classifier,
      occurredAtOffsetMs: -10_000,
    },
  });

  for (const [index, agentName] of params.downstreamAgentNames.entries()) {
    await seedDownstreamProgressEvent({
      context,
      commentId,
      agentName,
      occurredAtOffsetMs: -5_000 + index * 1_000,
    });
  }
};

const seedDownstreamProgressEvent = async ({
  context,
  commentId,
  agentName,
  occurredAtOffsetMs,
}: {
  context: SeedContext;
  commentId: string;
  agentName: string;
  occurredAtOffsetMs: number;
}): Promise<void> => {
  const taskProgressDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-progress')>({
    moduleName: '@vassembly/domain-task-progress',
  });
  const { ProgressEventState } = taskProgressDomain;

  const agentId = await getSystemAgentIdByName({ context, name: agentName });

  await taskProgressDomain.default.commands.recordProgressEvent({
    commentId,
    agentId,
    state: ProgressEventState.Completed,
    eventId: randomUUID(),
    inputMessages: JSON.stringify({ prompt: `${agentName} input` }),
    generatedResponse: JSON.stringify({ output: `${agentName} output` }),
    tokenUsage: { input: 90, output: 30, total: 120 },
    durationMs: 1_500,
    timestamp: new Date(Date.now() + occurredAtOffsetMs),
  });
};

export const getClassifierRuleText = async ({ context }: { context: SeedContext }): Promise<string> => {
  initSeedContext({ context });
  await ensureTaskDomainIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  const agent = await systemAgentDomain.default.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SpecializationClassifier,
  });

  return agent.data.rule ?? '';
};

export const seedCommentWithSpecializations = async ({
  context,
  userId,
  specializationNames,
  userText,
}: {
  context: SeedContext;
  userId: string;
  specializationNames: string[];
  userText: string;
}): Promise<{
  taskId: string;
  commentId: string;
  specializationIdsByName: Record<string, string>;
}> => {
  let specializationIdsByName: Record<string, string> = {};

  for (const specializationName of specializationNames) {
    const specializationId = await seedSpecializationWithWorkerAgents({
      context,
      name: specializationName,
    });
    specializationIdsByName = rememberSpecializationId({
      store: specializationIdsByName,
      name: specializationName,
      specializationId,
    });
  }

  const taskId = await seedTaskForUser({
    context,
    userId,
    description: userText,
    title: 'Multi-spec comment E2E',
    status: 'done',
  });

  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });

  const commentResult = await taskCommentDomain.default.commands.create({
    taskId,
    userId,
    userText,
  });
  const commentId = commentResult.data.id;
  if (!commentId) {
    throw new Error('Seeded task comment is missing an id');
  }

  const specializationIds = specializationNames.map((name) => {
    const specializationId = specializationIdsByName[normalizeSpecializationKey(name)];
    if (!specializationId) {
      throw new Error(`Specialization "${name}" was not seeded`);
    }
    return specializationId;
  });

  await taskCommentDomain.default.commands.setSpecializationIds({
    commentId,
    specializationIds,
  });

  return { taskId, commentId, specializationIdsByName };
};

export const attachPlanToComment = async ({
  context,
  taskId,
  commentId,
  shortName,
  items,
}: {
  context: SeedContext;
  taskId: string;
  commentId: string;
  shortName: string;
  items: MultiSpecPlanSeedItem[];
}): Promise<string> => {
  const templateItems = await Promise.all(
    items.map(async (item, templateItemIndex) => ({
      agentId: await getSystemAgentIdByName({ context, name: item.agentName }),
      skillId: null,
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
    shortName,
    description: `E2E plan template for ${shortName}`,
    inputDetails: {},
    outputDetails: {},
    items: templateItems.map(({ templateItemIndex: omitted, ...item }) => {
      void omitted;
      return item;
    }),
    createdAt: now,
    updatedAt: now,
    removedAt: null,
  });

  const instanceItems = await Promise.all(
    items.map(async (item, templateItemIndex) => ({
      templateItemIndex,
      agentId: await getSystemAgentIdByName({ context, name: item.agentName }),
      skillId: null,
      order: item.order,
      status: item.status,
      startedAt: item.status === 'pending' ? null : now,
      completedAt: item.status === 'done' ? now : null,
      failedAt: item.status === 'failed' ? now : null,
      output: null,
      errorMessage: item.status === 'failed' ? 'E2E seeded failure' : null,
      retryCount: 0,
    })),
  );

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

  await mongoDb.db.collection('taskComments').updateOne(
    { _id: new ObjectId(commentId) },
    { $set: { taskPlanInstanceId } },
  );

  return taskPlanInstanceId;
};

export const applyClassifierOutputLinesToComment = async ({
  context,
  userId,
  taskId,
  commentId,
  outputLines,
}: {
  context: SeedContext;
  userId: string;
  taskId: string;
  commentId: string;
  outputLines: string[];
}): Promise<string[]> => {
  await ensureTaskProgressDomainIndexes({ context });

  const serviceAgent = requireWorkspaceModule<typeof import('@vassembly/service-agent')>({
    moduleName: '@vassembly/service-agent',
  });
  const specializationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-specialization')>({
    moduleName: '@vassembly/domain-specialization',
  });
  const taskCommentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-comment')>({
    moduleName: '@vassembly/domain-task-comment',
  });

  const catalog = await specializationDomain.default.queries.getList({ page: 0, size: 200 });
  const catalogItems = catalog.items.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const normalizeModule = requireWorkspaceModule<
    typeof import('@vassembly/service-agent/src/internalTools/classifySpecialization/normalizeGeneratedSpecializations')
  >({
    moduleName: '@vassembly/service-agent/src/internalTools/classifySpecialization/normalizeGeneratedSpecializations',
  });

  const normalized = normalizeModule.normalizeGeneratedSpecializations({
    rawOutput: outputLines.join('\n'),
    catalogItems,
  });

  if (!normalized.isValid) {
    return [];
  }

  const toolContext = {
    userId,
    taskId,
    commentId,
    invocationId: randomUUID(),
    callerAgentId: '',
    callerAgentType: 'system' as const,
    recursionDepth: 0,
    rootInvokeId: randomUUID(),
  };

  const specializationIds: string[] = [];

  if (normalized.type === 'existing') {
    specializationIds.push(...normalized.specializationIds);
  }

  if (normalized.type === 'new') {
    const createRaw = await serviceAgent.createSpecializationToolHandler(
      { name: normalized.name, description: normalized.description },
      toolContext,
    );
    const createResult = JSON.parse(createRaw) as import('@vassembly/service-agent').CreateSpecializationToolResult;
    specializationIds.push(createResult.specializationId);
  }

  const combinedResult = normalized as {
    existingSpecializationIds?: string[];
    newSpecializations?: Array<{ name: string; description: string }>;
  };

  if (combinedResult.existingSpecializationIds) {
    specializationIds.push(...combinedResult.existingSpecializationIds);
  }

  for (const newSpec of combinedResult.newSpecializations ?? []) {
    const createRaw = await serviceAgent.createSpecializationToolHandler(
      { name: newSpec.name, description: newSpec.description },
      toolContext,
    );
    const createResult = JSON.parse(createRaw) as import('@vassembly/service-agent').CreateSpecializationToolResult;
    specializationIds.push(createResult.specializationId);
  }

  const uniqueSpecializationIds = [...new Set(specializationIds)];

  if (uniqueSpecializationIds.length > 0) {
    await taskCommentDomain.default.commands.setSpecializationIds({
      commentId,
      specializationIds: uniqueSpecializationIds,
    });
  }

  return uniqueSpecializationIds;
};

export const seedBareSpecialization = async ({
  context,
  name,
}: {
  context: SeedContext;
  name: string;
}): Promise<string> => seedSpecialization({ context, name, description: `E2E specialization for ${name}` });
