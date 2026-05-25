import type { SystemAgentCatalogDetail, SystemAgentCatalogListItem } from './dto';
import type { SystemAgentModel } from './model';

export interface ToCatalogListItemParams {
  systemAgent: SystemAgentModel;
}

export interface ToCatalogDetailParams {
  systemAgent: SystemAgentModel;
}

export const toCatalogListItem = ({
  systemAgent,
}: ToCatalogListItemParams): SystemAgentCatalogListItem => {
  if (systemAgent.id === undefined) {
    throw new Error('System agent id is required');
  }

  if (systemAgent.name === undefined) {
    throw new Error('System agent name is required');
  }

  if (systemAgent.status === undefined) {
    throw new Error('System agent status is required');
  }

  return {
    id: systemAgent.id,
    name: systemAgent.name,
    description: systemAgent.description,
    category: systemAgent.category,
    status: systemAgent.status,
  };
};

export const toCatalogDetail = ({
  systemAgent,
}: ToCatalogDetailParams): SystemAgentCatalogDetail => {
  if (systemAgent.rule === undefined) {
    throw new Error('System agent rule is required');
  }

  return {
    ...toCatalogListItem({ systemAgent }),
    rule: systemAgent.rule,
  };
};
