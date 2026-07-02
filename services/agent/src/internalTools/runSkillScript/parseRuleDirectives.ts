import type { ParseRuleDirectivesParams, RuleDirectiveMatch } from './types';

const RUN_SKILL_SCRIPT_PATTERN =
  /^run_skill_script\s+(?<filename>scripts\/[^\s]+)\s*$/gim;

const RUN_SCRIPTS_PATTERN = /^run\s+(?<filename>scripts\/[^\s]+)\s*$/gim;

const RUN_SKILL_PATTERN = /^run\s+skill\s+(?<scriptRef>[^\s]+)\s*$/gim;

const resolveScriptFilename = ({
  scriptRef,
  scripts,
}: {
  scriptRef: string;
  scripts: Array<{ filename: string }>;
}): string | null => {
  const normalizedRef = scriptRef.trim().toLowerCase();

  const exactMatch = scripts.find((script) => script.filename === scriptRef);
  if (exactMatch) {
    return exactMatch.filename;
  }

  const basenameMatches = scripts.filter((script) => {
    const basename = script.filename.split('/').pop()?.toLowerCase() ?? '';
    const nameWithoutExt = basename.replace(/\.[^.]+$/, '');
    return (
      basename === normalizedRef ||
      nameWithoutExt === normalizedRef ||
      script.filename.toLowerCase().endsWith(`/${normalizedRef}`)
    );
  });

  if (basenameMatches.length === 1) {
    return basenameMatches[0]!.filename;
  }

  return null;
};

export const parseRuleDirectives = ({
  rule,
  skillName,
  scripts,
}: ParseRuleDirectivesParams): RuleDirectiveMatch[] => {
  const matches: RuleDirectiveMatch[] = [];
  const seen = new Set<string>();

  for (const match of rule.matchAll(RUN_SKILL_SCRIPT_PATTERN)) {
    const filename = match.groups?.filename?.trim();
    if (!filename || seen.has(filename)) {
      continue;
    }

    seen.add(filename);
    matches.push({ skillName, filename });
  }

  for (const match of rule.matchAll(RUN_SCRIPTS_PATTERN)) {
    const filename = match.groups?.filename?.trim();
    if (!filename || seen.has(filename)) {
      continue;
    }

    seen.add(filename);
    matches.push({ skillName, filename });
  }

  for (const match of rule.matchAll(RUN_SKILL_PATTERN)) {
    const scriptRef = match.groups?.scriptRef?.trim();
    if (!scriptRef) {
      continue;
    }

    const filename = resolveScriptFilename({ scriptRef, scripts });
    if (!filename || seen.has(filename)) {
      continue;
    }

    seen.add(filename);
    matches.push({ skillName, filename });
  }

  return matches;
};
