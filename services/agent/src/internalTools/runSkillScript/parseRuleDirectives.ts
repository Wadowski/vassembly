import { resolveScriptFilename } from './resolveScriptFilename';
import { splitComposedRuleIntoSections } from './splitComposedRuleIntoSections';

import type {
  ParseRuleDirectivesParams,
  RuleDirectiveMatch,
  ScriptWithOwnership,
} from './types';

const RUN_SKILL_SCRIPT_PATTERN =
  /^run_skill_script\s+(?<filename>scripts\/[^\s]+)\s*$/gim;

const RUN_SCRIPTS_PATTERN = /^run\s+(?<filename>scripts\/[^\s]+)\s*$/gim;

const RUN_SKILL_PATTERN = /^run\s+skill\s+(?<scriptRef>[^\s]+)\s*$/gim;

const buildDirectiveKey = ({
  skillId,
  filename,
}: {
  skillId: string;
  filename: string;
}): string => `${skillId}:${filename}`;

const resolveScriptOwnership = ({
  filename,
  skillName,
  scripts,
}: {
  filename: string;
  skillName: string;
  scripts: ScriptWithOwnership[];
}): ScriptWithOwnership | null => {
  const ownedBySkillName = scripts.filter((script) => script.skillName === skillName);
  const exactOwnedMatch = ownedBySkillName.find((script) => script.filename === filename);

  if (exactOwnedMatch) {
    return exactOwnedMatch;
  }

  const globalMatches = scripts.filter((script) => script.filename === filename);

  if (globalMatches.length === 1) {
    return globalMatches[0]!;
  }

  return null;
};

const collectDirectivesFromSection = ({
  skillName,
  content,
  scripts,
  seen,
}: {
  skillName: string;
  content: string;
  scripts: ScriptWithOwnership[];
  seen: Set<string>;
}): RuleDirectiveMatch[] => {
  const matches: RuleDirectiveMatch[] = [];

  for (const match of content.matchAll(RUN_SKILL_SCRIPT_PATTERN)) {
    const filename = match.groups?.filename?.trim();

    if (!filename) {
      continue;
    }

    const ownership = resolveScriptOwnership({ filename, skillName, scripts });

    if (!ownership) {
      continue;
    }

    const directiveKey = buildDirectiveKey({ skillId: ownership.skillId, filename });

    if (seen.has(directiveKey)) {
      continue;
    }

    seen.add(directiveKey);
    matches.push({
      skillName: ownership.skillName,
      filename: ownership.filename,
      skillId: ownership.skillId,
    });
  }

  for (const match of content.matchAll(RUN_SCRIPTS_PATTERN)) {
    const filename = match.groups?.filename?.trim();

    if (!filename) {
      continue;
    }

    const ownership = resolveScriptOwnership({ filename, skillName, scripts });

    if (!ownership) {
      continue;
    }

    const directiveKey = buildDirectiveKey({ skillId: ownership.skillId, filename });

    if (seen.has(directiveKey)) {
      continue;
    }

    seen.add(directiveKey);
    matches.push({
      skillName: ownership.skillName,
      filename: ownership.filename,
      skillId: ownership.skillId,
    });
  }

  for (const match of content.matchAll(RUN_SKILL_PATTERN)) {
    const scriptRef = match.groups?.scriptRef?.trim();

    if (!scriptRef) {
      continue;
    }

    const ownedScripts = scripts.filter((script) => script.skillName === skillName);
    const filename = resolveScriptFilename({ scriptRef, scripts: ownedScripts });

    if (!filename) {
      continue;
    }

    const ownership = resolveScriptOwnership({ filename, skillName, scripts });

    if (!ownership) {
      continue;
    }

    const directiveKey = buildDirectiveKey({ skillId: ownership.skillId, filename });

    if (seen.has(directiveKey)) {
      continue;
    }

    seen.add(directiveKey);
    matches.push({
      skillName: ownership.skillName,
      filename: ownership.filename,
      skillId: ownership.skillId,
    });
  }

  return matches;
};

export const parseRuleDirectives = ({
  rule,
  skillName,
  scripts,
}: ParseRuleDirectivesParams): RuleDirectiveMatch[] => {
  const seen = new Set<string>();
  const sections = splitComposedRuleIntoSections({ rule, rootSkillName: skillName });
  const matches: RuleDirectiveMatch[] = [];

  for (const section of sections) {
    matches.push(
      ...collectDirectivesFromSection({
        skillName: section.skillName,
        content: section.content,
        scripts,
        seen,
      }),
    );
  }

  return matches;
};
