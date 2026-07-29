export interface BuildPlanItemWorkerMessageParams {
  templateItemIndex: number;
  description: string;
  skillId: string | null;
  skillName: string | null;
  inputSlice: Record<string, unknown>;
}

export const buildPlanItemWorkerMessage = ({
  templateItemIndex,
  description,
  skillId,
  skillName,
  inputSlice,
}: BuildPlanItemWorkerMessageParams): string => {
  const skillsToUse = skillName ?? 'none';
  const newSkillNeeded =
    skillId === null && description.trim().length > 0 ? description : 'none';

  return [
    `Execute plan item ${templateItemIndex + 1}.`,
    `Goal: ${description}`,
    `Skills to use: ${skillsToUse}`,
    `New skill needed: ${newSkillNeeded}`,
    `Resolved inputs: ${JSON.stringify(inputSlice)}`,
  ].join('\n');
};
