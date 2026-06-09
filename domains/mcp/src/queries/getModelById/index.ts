import { getDbById } from '@vassembly/queries';

import { mcpMongodbDao } from '../../clients';
import { mcpFactory } from '../../model';

import type { McpModel } from '../../model';

export const getModelById = getDbById<McpModel>({
  dao: mcpMongodbDao,
  factory: mcpFactory,
});
