import { ValidationError } from '@vassembly/errors';

import type { ParseSkillPlannerResultParams, ParsedCreateSkillResult } from './types';

const isCreateSkillResult = (value: unknown): value is ParsedCreateSkillResult => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as { skillId?: unknown; isNew?: unknown };

  return typeof record.skillId === 'string' && record.skillId.trim() !== '' && typeof record.isNew === 'boolean';
};

const tryParseJsonObject = ({ text }: { text: string }): ParsedCreateSkillResult | null => {
  try {
    const parsed: unknown = JSON.parse(text);

    if (isCreateSkillResult(parsed)) {
      return { skillId: parsed.skillId.trim(), isNew: parsed.isNew };
    }
  } catch {
    return null;
  }

  return null;
};

export const parseSkillPlannerResult = ({
  message,
}: ParseSkillPlannerResultParams): ParsedCreateSkillResult => {
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

  const jsonObjectPattern = /\{[^{}]*"skillId"\s*:\s*"[^"]+"[^{}]*"isNew"\s*:\s*(true|false)[^{}]*\}/g;
  const matches = trimmedMessage.match(jsonObjectPattern) ?? [];

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const matchResult = tryParseJsonObject({ text: matches[index]! });

    if (matchResult !== null) {
      return matchResult;
    }
  }

  throw new ValidationError('Skill planner response did not include create_skill result JSON');
};
