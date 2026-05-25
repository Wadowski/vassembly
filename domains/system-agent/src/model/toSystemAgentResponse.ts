import type { SystemAgentAdminResponse } from './dto';
import type { SystemAgentModel } from './model';

export interface ToSystemAgentResponseParams {
  systemAgent: SystemAgentModel;
}

export const toSystemAgentResponse = ({
  systemAgent,
}: ToSystemAgentResponseParams): SystemAgentAdminResponse => {
  if (systemAgent.id === undefined) {
    throw new Error('System agent id is required');
  }

  if (systemAgent.name === undefined) {
    throw new Error('System agent name is required');
  }

  if (systemAgent.rule === undefined) {
    throw new Error('System agent rule is required');
  }

  if (systemAgent.status === undefined) {
    throw new Error('System agent status is required');
  }

  if (systemAgent.createdByAdminId === undefined) {
    throw new Error('System agent createdByAdminId is required');
  }

  if (systemAgent.updatedByAdminId === undefined) {
    throw new Error('System agent updatedByAdminId is required');
  }

  if (systemAgent.createdAt === undefined) {
    throw new Error('System agent createdAt is required');
  }

  if (systemAgent.updatedAt === undefined) {
    throw new Error('System agent updatedAt is required');
  }

  return {
    id: systemAgent.id,
    name: systemAgent.name,
    description: systemAgent.description,
    rule: systemAgent.rule,
    category: systemAgent.category,
    status: systemAgent.status,
    createdByAdminId: systemAgent.createdByAdminId,
    updatedByAdminId: systemAgent.updatedByAdminId,
    createdAt: systemAgent.createdAt.toISOString(),
    updatedAt: systemAgent.updatedAt.toISOString(),
    removedAt: systemAgent.removedAt?.toISOString() ?? null,
  };
};
