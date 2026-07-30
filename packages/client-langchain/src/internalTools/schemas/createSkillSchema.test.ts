import { describe, expect, it } from 'vitest';

import { createSkillSchema } from './createSkillSchema';

describe('createSkillSchema', () => {
  const baseInput = {
    specializationId: 'spec-1',
    name: 'format-recipe-to-json',
    description: 'Formats recipe data as JSON',
    input: 'Recipe text',
    output: 'JSON object',
    rule: '1. Parse input\n2. run_skill_script scripts/format-recipe-to-json.py',
  };

  it('should accept javascript language alias as nodejs', () => {
    const result = createSkillSchema.safeParse({
      ...baseInput,
      scripts: [
        {
          filename: 'scripts/format-recipe-to-json.py',
          language: 'javascript',
          content: 'print("ok")',
        },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.scripts[0]?.language).toBe('nodejs');
    }
  });

  it('should parse stringified scripts array', () => {
    const result = createSkillSchema.safeParse({
      ...baseInput,
      scripts: JSON.stringify([
        {
          filename: 'scripts/format-recipe-to-json.py',
          language: 'python',
          content: 'print("ok")',
        },
      ]),
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.scripts).toHaveLength(1);
      expect(result.data.scripts[0]?.filename).toBe('scripts/format-recipe-to-json.py');
    }
  });

  it('should reject run_skill_script references without scripts', () => {
    const result = createSkillSchema.safeParse({
      ...baseInput,
      scripts: [],
    });

    expect(result.success).toBe(false);
  });

  it('should accept prompt-only skills without run_skill_script references', () => {
    const result = createSkillSchema.safeParse({
      ...baseInput,
      rule: '1. Read the input\n2. Return structured JSON',
      scripts: [],
    });

    expect(result.success).toBe(true);
  });
});
