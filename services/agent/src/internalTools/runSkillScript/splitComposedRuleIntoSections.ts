export interface RuleSection {
  skillName: string;
  content: string;
}

const REFERENCED_SKILL_SECTION_PATTERN =
  /^## Referenced skill:\s*(?<skillName>.+)\n\n(?<content>[\s\S]*?)(?=\n## Referenced skill:|$)/gm;

export interface SplitComposedRuleIntoSectionsParams {
  rule: string;
  rootSkillName: string;
}

export const splitComposedRuleIntoSections = ({
  rule,
  rootSkillName,
}: SplitComposedRuleIntoSectionsParams): RuleSection[] => {
  const marker = '\n## Referenced skill:';
  const markerIndex = rule.indexOf(marker);

  if (markerIndex === -1) {
    return [{ skillName: rootSkillName, content: rule }];
  }

  const sections: RuleSection[] = [
    { skillName: rootSkillName, content: rule.slice(0, markerIndex).trimEnd() },
  ];

  const remainder = rule.slice(markerIndex + 1);

  for (const match of remainder.matchAll(REFERENCED_SKILL_SECTION_PATTERN)) {
    const skillName = match.groups?.skillName?.trim();
    const content = match.groups?.content;

    if (!skillName || content === undefined) {
      continue;
    }

    sections.push({ skillName, content: content.trimEnd() });
  }

  return sections;
};
