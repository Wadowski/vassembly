import { INTERNAL_TOOL_IDS } from '@vassembly/constants';
import { describe, expect, it } from 'vitest';

import { INTERNAL_TOOL_SCHEMAS } from '../buildInternalTools';
import { normalizeToolInput } from './normalizeToolInput';
import { TOOL_NORMALIZERS } from './toolNormalizers';

describe('TOOL_NORMALIZERS registry', () => {
  it('should have a normalizer and schema for every registered internal tool id', () => {
    expect(Object.keys(TOOL_NORMALIZERS).sort()).toEqual([...INTERNAL_TOOL_IDS].sort());
    expect(Object.keys(INTERNAL_TOOL_SCHEMAS).sort()).toEqual([...INTERNAL_TOOL_IDS].sort());
  });
});

describe('normalizeToolInput', () => {
  it('should coerce stringified JSON for use_agent', () => {
    const result = normalizeToolInput<{ name: string; agentPrompt: string }>({
      toolId: 'agent-use',
      raw: '{"name":"worker","agentPrompt":"Do the task"}',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ name: 'worker', agentPrompt: 'Do the task' });
    }
  });

  it('should return missing required fields for use_agent without agentPrompt', () => {
    const result = normalizeToolInput({
      toolId: 'agent-use',
      raw: { name: 'worker' },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errorPayload.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(result.errorPayload.missingFields).toContain('agentPrompt');
    }
  });

  it('should coerce null optional arrays for create_skill', () => {
    const result = normalizeToolInput({
      toolId: 'skill-create',
      raw: {
        specializationId: 'spec-1',
        name: 'skill',
        description: 'desc',
        input: 'in',
        output: 'out',
        rule: 'rule',
        scripts: null,
        usesSkillIds: null,
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(
        expect.objectContaining({
          scripts: [],
          usesSkillIds: [],
        }),
      );
    }
  });

  it('should coerce null record fields for run_skill_script', () => {
    const result = normalizeToolInput({
      toolId: 'skill-run-script',
      raw: {
        skillName: 'contract-review',
        filename: 'scripts/run.py',
        input: '{"docId":"123"}',
        env: null,
        args: null,
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(
        expect.objectContaining({
          input: { docId: '123' },
          args: [],
        }),
      );
    }
  });
});
