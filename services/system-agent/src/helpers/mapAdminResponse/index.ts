import {
  systemAgentFactory,
  toSystemAgentResponse,
} from '@vassembly/domain-system-agent';

import type { SystemAgentAdminResponse, SystemAgentModel } from '@vassembly/domain-system-agent';

export const mapAdminResponse = (
  data: SystemAgentAdminResponse | SystemAgentModel,
): SystemAgentAdminResponse => {
  if (
    typeof data === 'object' &&
    data !== null &&
    'createdAt' in data &&
    typeof data.createdAt === 'string'
  ) {
    return data as SystemAgentAdminResponse;
  }

  return toSystemAgentResponse({
    systemAgent: data as SystemAgentModel,
  });
};
