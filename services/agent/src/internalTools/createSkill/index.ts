import skillDomain from '@vassembly/domain-skill';
import { ValidationError } from '@vassembly/errors';

import type { CreateSkillToolResult } from './types';

const parseUsesSkillIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => (typeof entry === 'string' && entry.trim() !== '' ? [entry.trim()] : []));
};

export const createSkillToolHandler = async (
  args: Record<string, unknown>,
): Promise<string> => {
  const specializationId =
    typeof args.specializationId === 'string' ? args.specializationId.trim() : '';
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  const description = typeof args.description === 'string' ? args.description.trim() : '';
  const input = typeof args.input === 'string' ? args.input.trim() : '';
  const output = typeof args.output === 'string' ? args.output.trim() : '';
  const rule = typeof args.rule === 'string' ? args.rule.trim() : '';
  const usesSkillIds = parseUsesSkillIds(args.usesSkillIds);

  if (!specializationId) {
    throw new ValidationError('specializationId is required');
  }

  if (!name) {
    throw new ValidationError('name is required');
  }

  if (!description) {
    throw new ValidationError('description is required');
  }

  if (!input) {
    throw new ValidationError('input is required');
  }

  if (!output) {
    throw new ValidationError('output is required');
  }

  if (!rule) {
    throw new ValidationError('rule is required');
  }

  const scripts = Array.isArray(args.scripts)
    ? args.scripts.flatMap((entry) => {
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

        return [
          {
            filename: script.filename.trim(),
            language: script.language as 'python' | 'nodejs' | 'bash' | 'terminal',
            content: script.content,
          },
        ];
      })
    : [];

  const result = await skillDomain.commands.create({
    specializationId,
    name,
    description,
    input,
    output,
    rule,
    scripts,
    usesSkillIds,
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
