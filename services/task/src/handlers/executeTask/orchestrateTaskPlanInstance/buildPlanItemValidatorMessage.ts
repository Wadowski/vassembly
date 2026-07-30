import type { BuildPlanItemMessageParams } from './buildPlanItemMessage';

export const buildPlanItemValidatorMessage = ({
  templateItemIndex,
  description,
  priorItemsContext,
}: Pick<
  BuildPlanItemMessageParams,
  'templateItemIndex' | 'description' | 'priorItemsContext'
>): string => {
  return [
    `Validate plan item ${templateItemIndex + 1}.`,
    `Goal to verify: ${description}`,
    'Prior results:',
    priorItemsContext,
  ].join('\n');
};
