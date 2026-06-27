import skillDomain from '@vassembly/domain-skill';
import { ValidationError } from '@vassembly/errors';

import type { CreateSkillToolResult } from './types';

const parseScripts = (
  value: unknown,
): Array<{ filename: string; language: 'python' | 'nodejs' | 'bash'; content: string }> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const script = entry as {
      filename?: unknown;
      language?: unknown;
      content?: unknown;
    };

    if (
      typeof script.filename !== 'string' ||
      typeof script.language !== 'string' ||
      typeof script.content !== 'string'
    ) {
      return [];
    }

    if (
      script.language !== 'python' &&
      script.language !== 'nodejs' &&
      script.language !== 'bash'
    ) {
      return [];
    }

    return [
      {
        filename: script.filename.trim(),
        language: script.language,
        content: script.content,
      },
    ];
  });
};

export const createSkillToolHandler = async (
  args: Record<string, unknown>,
): Promise<string> => {
  const specializationId =
    typeof args.specializationId === 'string' ? args.specializationId.trim() : '';
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  const description = typeof args.description === 'string' ? args.description.trim() : '';
  const rule = typeof args.rule === 'string' ? args.rule.trim() : '';
  const scripts = parseScripts(args.scripts);

  if (!specializationId) {
    throw new ValidationError('specializationId is required');
  }

  if (!name) {
    throw new ValidationError('name is required');
  }

  if (!description) {
    throw new ValidationError('description is required');
  }

  if (!rule) {
    throw new ValidationError('rule is required');
  }

  const result = await skillDomain.commands.create({
    specializationId,
    name,
    description,
    rule,
    scripts,
    onDuplicate: 'returnExisting',
  });

  if (!result.data.id) {
    throw new ValidationError('Failed to create skill');
  }

  return JSON.stringify({
    skillId: result.data.id,
    isNew: result.isNew,
  } satisfies CreateSkillToolResult);
};
