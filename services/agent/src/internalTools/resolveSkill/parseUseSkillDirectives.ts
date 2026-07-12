export interface ParseUseSkillDirectivesParams {
  rule: string;
}

export interface UseSkillDirective {
  raw: string;
  skillName: string;
  required: boolean;
}

const USE_SKILL_PATTERN =
  /^use\s+skill\s+(?<skillName>[^\s]+)(?:\s+(?<modifier>required|optional))?\s*$/gim;

export const parseUseSkillDirectives = ({
  rule,
}: ParseUseSkillDirectivesParams): UseSkillDirective[] => {
  const directives: UseSkillDirective[] = [];

  for (const match of rule.matchAll(USE_SKILL_PATTERN)) {
    const skillName = match.groups?.skillName?.trim();

    if (!skillName) {
      continue;
    }

    directives.push({
      raw: match[0],
      skillName,
      required: match.groups?.modifier === 'required',
    });
  }

  return directives;
};
