import {
  getInternalToolById,
  isToolEligibleForAgentType,
} from '@vassembly/constants';
import { WrongParamError } from '@vassembly/errors';

export interface ValidateAssignedToolIdsParams {
  assignedToolIds: string[];
  agentType: 'personal' | 'system';
}

export const validateAssignedToolIds = async ({
  assignedToolIds,
  agentType,
}: ValidateAssignedToolIdsParams): Promise<void> => {
  if (new Set(assignedToolIds).size !== assignedToolIds.length) {
    throw new WrongParamError('assignedToolIds must not contain duplicates');
  }

  for (const toolId of assignedToolIds) {
    const tool = getInternalToolById(toolId);

    if (!tool) {
      throw new WrongParamError(`Unknown internal tool: ${toolId}`);
    }

    if (!isToolEligibleForAgentType({ tool, agentType })) {
      throw new WrongParamError(`Tool ${toolId} is not available for personal agents`);
    }
  }
};
