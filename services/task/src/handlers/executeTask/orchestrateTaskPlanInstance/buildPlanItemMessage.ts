import type { SpecializationAgentRole } from '@vassembly/service-agent';

import { buildPlanItemResearcherMessage } from './buildPlanItemResearcherMessage';
import { buildPlanItemValidatorMessage } from './buildPlanItemValidatorMessage';
import { buildPlanItemWorkerMessage } from './buildPlanItemWorkerMessage';

export interface BuildPlanItemMessageParams {
  role: SpecializationAgentRole;
  templateItemIndex: number;
  description: string;
  skillId: string | null;
  skillName: string | null;
  inputSlice: Record<string, unknown>;
  priorItemsContext: string;
}

const PLAN_ITEM_MESSAGE_BUILDERS: Record<
  SpecializationAgentRole,
  (params: BuildPlanItemMessageParams) => string
> = {
  worker: buildPlanItemWorkerMessage,
  researcher: buildPlanItemResearcherMessage,
  validator: buildPlanItemValidatorMessage,
};

export const buildPlanItemMessage = (params: BuildPlanItemMessageParams): string =>
  PLAN_ITEM_MESSAGE_BUILDERS[params.role](params);
