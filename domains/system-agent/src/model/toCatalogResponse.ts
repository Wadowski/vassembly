import { assertRequiredFields } from '@vassembly/mappers';

import type { SystemAgentCatalogDetail } from './dto';
import type { SystemAgentModel } from './model';

const REQUIRED_FIELDS = ['id', 'name', 'status', 'rule'] as const;

export interface ToDetailParams {
  systemAgent: SystemAgentModel;
}

export const toDetail = ({
  systemAgent,
}: ToDetailParams): SystemAgentCatalogDetail => {
  assertRequiredFields({
    entity: systemAgent,
    fields: REQUIRED_FIELDS,
    entityName: 'System agent',
  });

  return {
    id: systemAgent.id!,
    name: systemAgent.name!,
    description: systemAgent.description,
    category: systemAgent.category,
    status: systemAgent.status!,
    rule: systemAgent.rule!,
  };
};
