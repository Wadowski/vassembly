import { runAgentInvokeWithTools } from '@vassembly/service-agent';

import { buildPlanItemMessage } from './buildPlanItemMessage';
import { buildPriorItemsContext } from './buildPriorItemsContext';
import { extractCreatedSkillId } from './extractCreatedSkillId';
import { resolveItemInputSlice } from './resolveItemInputSlice';
import { resolvePlanItemAgentRole } from './resolvePlanItemAgentRole';
import { resolveSkillNameForItem } from './resolveSkillNameForItem';

import type { PriorItemContextEntry } from './buildPriorItemsContext';
import type {
  RecordAgentInvokeProgress,
  RecordInternalToolUsageEvent,
  RecordMcpUsageEvent,
} from '@vassembly/service-agent';

export interface RunPlanItemParams {
  templateItemIndex: number;
  agentId: string;
  description: string;
  templateItem: { description: string; skillId: string | null };
  instanceInputDetails: Record<string, unknown>;
  priorItems: PriorItemContextEntry[];
  taskId: string;
  commentId: string;
  userId: string;
  credentialId: string;
  specializationIds: string[] | null;
  abortSignal?: AbortSignal;
  recordAgentInvokeProgress?: RecordAgentInvokeProgress;
  recordMcpUsageEvent?: RecordMcpUsageEvent;
  recordInternalToolUsageEvent?: RecordInternalToolUsageEvent;
}

export interface RunPlanItemResult {
  status: 'done' | 'failed';
  errorMessage?: string;
  createdSkillId?: string;
  output?: Record<string, unknown>;
}

export const runPlanItem = async ({
  templateItemIndex,
  agentId,
  description,
  templateItem,
  instanceInputDetails,
  priorItems,
  taskId,
  commentId,
  userId,
  credentialId,
  specializationIds,
  abortSignal,
  recordAgentInvokeProgress,
  recordMcpUsageEvent,
  recordInternalToolUsageEvent,
}: RunPlanItemParams): Promise<RunPlanItemResult> => {
  const inputSlice = resolveItemInputSlice({
    templateItem,
    instanceInputDetails,
  });
  const skillName = await resolveSkillNameForItem({ skillId: templateItem.skillId });
  const role = await resolvePlanItemAgentRole({ agentId });
  const priorItemsContext = buildPriorItemsContext({ priorItems });

  const message = buildPlanItemMessage({
    role,
    templateItemIndex,
    description,
    skillId: templateItem.skillId,
    skillName,
    inputSlice,
    priorItemsContext,
  });

  try {
    const result = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId,
      message,
      connectionOverride: { integrationCredentialId: credentialId },
      toolContext: {
        userId,
        taskId,
        commentId,
        invocationId: `plan-item-${templateItemIndex}`,
        callerAgentId: agentId,
        callerAgentType: 'system',
        recursionDepth: 0,
        rootInvokeId: `plan-item-${templateItemIndex}`,
        specializationIds,
        abortSignal,
        recordAgentInvokeProgress,
        recordMcpUsageEvent,
        recordInternalToolUsageEvent,
      },
    });

    const createdSkillId = extractCreatedSkillId({
      internalToolResults: result.metadata.internalToolResults,
    });

    return {
      status: 'done',
      output: { message: result.message },
      ...(createdSkillId ? { createdSkillId } : {}),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Plan item execution failed';

    return {
      status: 'failed',
      errorMessage,
    };
  }
};
