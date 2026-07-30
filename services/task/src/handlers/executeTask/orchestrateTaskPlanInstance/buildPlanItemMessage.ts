import type { SpecializationAgentRole } from '@vassembly/service-agent';

import { buildPlanItemResearcherMessage } from './buildPlanItemResearcherMessage';
import { buildPlanItemValidatorMessage } from './buildPlanItemValidatorMessage';
import { buildPlanItemWorkerMessage } from './buildPlanItemWorkerMessage';

type PlanItemAgentRole = Exclude<SpecializationAgentRole, 'methodologist'>;

export interface BuildPlanItemMessageParams {
  role: PlanItemAgentRole;
  templateItemIndex: number;
  description: string;
  skillId: string | null;
  skillName: string | null;
  inputSlice: Record<string, unknown>;
  priorItemsContext: string;
}

const PLAN_ITEM_MESSAGE_BUILDERS: Record<
  PlanItemAgentRole,
  (params: BuildPlanItemMessageParams) => string
> = {
  worker: buildPlanItemWorkerMessage,
  researcher: buildPlanItemResearcherMessage,
  validator: buildPlanItemValidatorMessage,
};

export const buildPlanItemMessage = (params: BuildPlanItemMessageParams): string =>
  PLAN_ITEM_MESSAGE_BUILDERS[params.role](params);
