import { requireWorkspaceModule } from '@vassembly/e2e';

import { ensureAssistantSystemAgent } from './seedTask';
import type { SeedTaskForUserParams } from './seedTask';

export const seedTaskForUser = async (params: SeedTaskForUserParams): Promise<string> => {
  const {
    context,
    userId,
    description,
    title = null,
    status,
    agentAssignedId,
    llmResponse = null,
    errorMessage = null,
    errorCode = null,
    clearDescription = false,
  } = params;

  const taskDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task')>({
    moduleName: '@vassembly/domain-task',
  });
  const { taskMongodbDao } = requireWorkspaceModule<
    typeof import('@vassembly/domain-task/src/clients')
  >({
    moduleName: '@vassembly/domain-task/src/clients',
  });
  const { ObjectId } = requireWorkspaceModule<typeof import('mongodb')>({
    moduleName: 'mongodb',
  });

  const assistantId =
    agentAssignedId === undefined
      ? await ensureAssistantSystemAgent({ context })
      : agentAssignedId;

  const created = await taskDomain.default.commands.create({
    userId,
    description,
    agentAssignedId: assistantId,
  });

  const id = created.data.id;
  if (!id) {
    throw new Error('Seeded task is missing an id');
  }

  const updates: Record<string, unknown> = {};
  if (title !== null) {
    updates.title = title;
  }
  if (status !== undefined) {
    updates.status = status;
  }
  if (llmResponse !== null) {
    updates.llmResponse = llmResponse;
  }
  if (errorMessage !== null) {
    updates.errorMessage = errorMessage;
  }
  if (errorCode !== null) {
    updates.errorCode = errorCode;
  }
  if (clearDescription) {
    updates.description = '';
  }

  if (Object.keys(updates).length > 0) {
    await taskMongodbDao.collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  }

  return id;
};
