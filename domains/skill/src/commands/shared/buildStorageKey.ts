export interface BuildSkillScriptStorageKeyParams {
  skillId: string;
  filename: string;
}

export const buildSkillScriptStorageKey = ({
  skillId,
  filename,
}: BuildSkillScriptStorageKeyParams): string => `skills/${skillId}/${filename}`;
