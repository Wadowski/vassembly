import z from 'zod';

import { mongoDb } from '@vassembly/client-mongodb';

import { MCP_USAGE_COLLECTION_NAME } from '../../clients';

import type { ClearByCommentIdInput } from './types';

const VALIDATION_SCHEMA = z.object({
  commentId: z.string().min(1),
});

export const clearByCommentId = async (input: ClearByCommentIdInput): Promise<void> => {
  const validated = VALIDATION_SCHEMA.parse(input);
  const collection = mongoDb.db.collection(MCP_USAGE_COLLECTION_NAME);

  await collection.deleteMany({ commentId: validated.commentId });
};
