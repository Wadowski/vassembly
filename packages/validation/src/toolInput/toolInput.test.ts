import { describe, expect, it } from 'vitest';

import { buildMissingFieldsErrorPayload } from './buildMissingFieldsErrorPayload';
import { coerceArrayDefaults } from './coerceArrayDefaults';
import { coerceNullableFields } from './coerceNullableFields';
import { coerceNumericFields } from './coerceNumericFields';
import { coerceRecordJsonFields } from './coerceRecordJsonFields';
import { coerceStringifiedJson } from './coerceStringifiedJson';
import { normalizeToolInputShape } from './normalizeToolInputShape';
import { repairLlmJson } from './repairLlmJson';

describe('repairLlmJson', () => {
  it('should replace emoji corruption with colons', () => {
    const repaired = repairLlmJson({
      raw: '"shortName"😕"self-learning-ai-overview"',
    });

    expect(repaired).toBe('"shortName":"self-learning-ai-overview"');
  });
});

describe('coerceStringifiedJson', () => {
  it('should parse stringified JSON objects', () => {
    const result = coerceStringifiedJson({
      raw: '{"name":"agent","agentPrompt":"do work"}',
    });

    expect(result).toEqual({ name: 'agent', agentPrompt: 'do work' });
  });

  it('should pass through non-string values', () => {
    const input = { name: 'agent' };

    expect(coerceStringifiedJson({ raw: input })).toBe(input);
  });
});

describe('coerceNullableFields', () => {
  it('should convert null sentinels to undefined for allowlisted fields', () => {
    const result = coerceNullableFields({
      record: { category: 'null', title: 'keep' },
      fields: ['category'],
    });

    expect(result.category).toBeUndefined();
    expect(result.title).toBe('keep');
  });
});

describe('coerceArrayDefaults', () => {
  it('should default null optional arrays to empty arrays', () => {
    const result = coerceArrayDefaults({
      record: { scripts: null, usesSkillIds: undefined },
      fields: ['scripts', 'usesSkillIds'],
    });

    expect(result.scripts).toEqual([]);
    expect(result.usesSkillIds).toEqual([]);
  });
});

describe('coerceNumericFields', () => {
  it('should coerce numeric strings to numbers', () => {
    const result = coerceNumericFields({
      record: { order: '3' },
      fields: ['order'],
    });

    expect(result.order).toBe(3);
  });
});

describe('coerceRecordJsonFields', () => {
  it('should parse string record fields as JSON objects', () => {
    const result = coerceRecordJsonFields({
      record: { input: '{"key":"value"}' },
      fields: ['input'],
    });

    expect(result.input).toEqual({ key: 'value' });
  });
});

describe('normalizeToolInputShape', () => {
  it('should apply configured coercions in sequence', () => {
    const result = normalizeToolInputShape({
      raw: '{"scripts":null,"specializationId":"none","order":"2"}',
      config: {
        arrayDefaultFields: ['scripts'],
        nullableToUndefinedFields: ['specializationId'],
        numericFields: ['order'],
      },
    });

    expect(result.scripts).toEqual([]);
    expect(result.specializationId).toBeUndefined();
    expect(result.order).toBe(2);
  });
});

describe('buildMissingFieldsErrorPayload', () => {
  it('should return missing required fields with actionable hint', () => {
    const payload = buildMissingFieldsErrorPayload({
      toolLabel: 'use_agent',
      issues: [
        {
          path: ['agentPrompt'],
          message: 'Required',
          code: 'invalid_type',
        },
      ],
    });

    expect(payload.code).toBe('MISSING_REQUIRED_FIELDS');
    expect(payload.missingFields).toEqual(['agentPrompt']);
    expect(payload.hint).toContain('agentPrompt');
  });
});
