import { getDbById } from '@vassembly/queries';

import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory } from '../../model';

import type { SystemAgentModel } from '../../model';

export const getModelById = getDbById<SystemAgentModel>({
  dao: systemAgentMongodbDao,
  factory: systemAgentFactory,
});
