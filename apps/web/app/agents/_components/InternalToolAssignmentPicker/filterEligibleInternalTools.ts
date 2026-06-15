import { InternalToolAccessScope } from '@vassembly/constants';

import type { InternalToolItem } from './types';

export interface FilterEligibleInternalToolsParams {
  tools: InternalToolItem[];
  agentType: 'personal' | 'system';
  accessScopesById: Map<string, InternalToolAccessScope>;
}

export const filterEligibleInternalTools = ({
  tools,
  agentType,
  accessScopesById,
}: FilterEligibleInternalToolsParams): InternalToolItem[] => {
  if (agentType === 'system') {
    return tools;
  }

  return tools.filter((tool) => {
    const accessScope = accessScopesById.get(tool.id);
    return accessScope === InternalToolAccessScope.SYSTEM_AND_PERSONAL;
  });
};
