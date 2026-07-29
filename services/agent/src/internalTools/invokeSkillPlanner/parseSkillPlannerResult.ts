import { ValidationError } from '@vassembly/errors';

import type { ParseSkillPlannerResultParams, ParsedSkillPlannerResult } from './types';

const isCreateSkillResult = (
  value: unknown,
): value is { skillId: string; isNew: boolean } => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as { skillId?: unknown; isNew?: unknown };

  return typeof record.skillId === 'string' && record.skillId.trim() !== '' && typeof record.isNew === 'boolean';
};

const isReuseSkillResult = (
  value: unknown,
): value is { action: 'reuse'; skillName: string; fitScore?: number; refinements?: string } => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as { action?: unknown; skillName?: unknown };

  return record.action === 'reuse' && typeof record.skillName === 'string' && record.skillName.trim() !== '';
};

const isComposeSkillResult = (
  value: unknown,
): value is { action: 'compose'; skillNames: string[]; fitScore?: number } => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as { action?: unknown; skillNames?: unknown };

  return (
    record.action === 'compose' &&
    Array.isArray(record.skillNames) &&
    record.skillNames.every((name) => typeof name === 'string' && name.trim() !== '')
  );
};

const tryParseJsonObject = ({ text }: { text: string }): ParsedSkillPlannerResult | null => {
  try {
    const parsed: unknown = JSON.parse(text);

    if (isReuseSkillResult(parsed)) {
      return {
        action: 'reuse',
        skillName: parsed.skillName.trim(),
        fitScore: parsed.fitScore,
        refinements: parsed.refinements,
      };
    }

    if (isComposeSkillResult(parsed)) {
      return {
        action: 'compose',
        skillNames: parsed.skillNames.map((name) => name.trim()),
        fitScore: parsed.fitScore,
      };
    }

    if (isCreateSkillResult(parsed)) {
      return {
        action: 'create',
        skillId: parsed.skillId.trim(),
        isNew: parsed.isNew,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const parseSkillPlannerResult = ({
  message,
}: ParseSkillPlannerResultParams): ParsedSkillPlannerResult => {
  const trimmedMessage = message.trim();

  if (trimmedMessage === '') {
    throw new ValidationError('Skill planner returned an empty response');
  }

  const lines = trimmedMessage.split('\n').map((line) => line.trim()).filter((line) => line !== '');

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const lineResult = tryParseJsonObject({ text: lines[index]! });

    if (lineResult !== null) {
      return lineResult;
    }
  }

  const jsonObjectPattern =
    /\{[^{}]*(?:"action"\s*:\s*"(reuse|compose)"|"skillId"\s*:\s*"[^"]+")[^{}]*\}/g;
  const matches = trimmedMessage.match(jsonObjectPattern) ?? [];

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const matchResult = tryParseJsonObject({ text: matches[index]! });

    if (matchResult !== null) {
      return matchResult;
    }
  }

  throw new ValidationError('Skill planner response did not include a valid result JSON');
};
