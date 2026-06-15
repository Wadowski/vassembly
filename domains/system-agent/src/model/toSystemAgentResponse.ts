import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { SystemAgentAdminResponse } from './dto';
import type { SystemAgentModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'name',
  'rule',
  'status',
  'createdByAdminId',
  'updatedByAdminId',
  'createdAt',
  'updatedAt',
] as const;

export interface ToSystemAgentResponseParams {
  systemAgent: SystemAgentModel;
}

export const toSystemAgentResponse = ({
  systemAgent,
}: ToSystemAgentResponseParams): SystemAgentAdminResponse => {
  assertRequiredFields({
    entity: systemAgent,
    fields: REQUIRED_FIELDS,
    entityName: 'System agent',
  });

  return {
    id: systemAgent.id!,
    name: systemAgent.name!,
    description: systemAgent.description,
    rule: systemAgent.rule!,
    category: systemAgent.category,
    status: systemAgent.status!,
    createdByAdminId: systemAgent.createdByAdminId!,
    updatedByAdminId: systemAgent.updatedByAdminId!,
    createdAt: toIsoString({ value: systemAgent.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: systemAgent.updatedAt!, fieldName: 'updatedAt' }),
    removedAt: toNullableIsoString(systemAgent.removedAt),
    assignedToolIds: systemAgent.assignedToolIds ?? [],
  };
};
