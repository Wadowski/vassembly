import { NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { mcpMongodbDao } from '../../clients';
import { mcpFactory } from '../../model';

import type { AddSpecializationIdInput, AddSpecializationIdResult } from './types';

const VALIDATION_SCHEMA = z.object({
  mcpId: z.string().min(1),
  specializationId: z.string().min(1),
});

export const addSpecializationId = async ({
  mcpId,
  specializationId,
}: AddSpecializationIdInput): Promise<AddSpecializationIdResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse({ mcpId, specializationId });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const whereQuery = mcpFactory.create({ id: parsed.data.mcpId }).toMongoDb?.();

  if (!whereQuery) {
    throw new ValidationError('Invalid MCP id');
  }

  const set = mcpMongodbDao.transformToDeepUpdate(
    mcpFactory.create({ updatedAt: new Date() }) as unknown as Record<string, unknown>,
  );

  const result = await mcpMongodbDao.collection.updateOne(
    whereQuery,
    {
      $addToSet: { specializationIds: parsed.data.specializationId },
      $set: set,
    } as unknown as Parameters<typeof mcpMongodbDao.collection.updateOne>[1],
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError(`MCP not found: ${parsed.data.mcpId}`);
  }

  return { success: true };
};
