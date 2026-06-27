import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  assignedToolIdsCreateSchema,
  assignedToolIdsUpdateSchema,
} from './assignedToolIdsSchema';

const VALID_REGISTRY_TOOL_IDS = ['agent-use', 'agent-list'] as const;

const TOO_MANY_TOOL_IDS = ['agent-use', 'agent-list', 'extra-tool'] as const;

describe('assignedToolIdsCreateSchema', () => {
  it('should default to empty array when omitted', () => {
    const result = assignedToolIdsCreateSchema.parse(undefined);

    expect(result).toEqual([]);
  });

  it('should accept valid registry tool ids', () => {
    const result = assignedToolIdsCreateSchema.parse([...VALID_REGISTRY_TOOL_IDS]);

    expect(result).toEqual(['agent-use', 'agent-list']);
  });

  it('should reject when assignedToolIds exceeds maximum count', () => {
    expect(() => assignedToolIdsCreateSchema.parse([...TOO_MANY_TOOL_IDS])).toThrow(ZodError);
  });

  it('should reject when assignedToolIds contains duplicate ids', () => {
    expect(() => assignedToolIdsCreateSchema.parse(['agent-use', 'agent-use'])).toThrow(ZodError);
  });

  it('should reject when assignedToolIds contains empty strings', () => {
    expect(() => assignedToolIdsCreateSchema.parse([''])).toThrow(ZodError);
  });

  it('should reject when assignedToolIds contains unknown registry ids', () => {
    expect(() => assignedToolIdsCreateSchema.parse(['nonexistent-tool'])).toThrow(ZodError);
  });
});

describe('assignedToolIdsUpdateSchema', () => {
  it('should allow omitting assignedToolIds', () => {
    const result = assignedToolIdsUpdateSchema.parse(undefined);

    expect(result).toBeUndefined();
  });

  it('should accept valid registry tool ids replacement', () => {
    const result = assignedToolIdsUpdateSchema.parse(['agent-use']);

    expect(result).toEqual(['agent-use']);
  });

  it('should accept clearing assignedToolIds to empty array', () => {
    const result = assignedToolIdsUpdateSchema.parse([]);

    expect(result).toEqual([]);
  });

  it('should reject when assignedToolIds exceeds maximum count', () => {
    expect(() => assignedToolIdsUpdateSchema.parse([...TOO_MANY_TOOL_IDS])).toThrow(ZodError);
  });

  it('should reject when assignedToolIds contains duplicate ids', () => {
    expect(() => assignedToolIdsUpdateSchema.parse(['agent-list', 'agent-list'])).toThrow(
      ZodError,
    );
  });

  it('should reject when assignedToolIds contains unknown registry ids', () => {
    expect(() => assignedToolIdsUpdateSchema.parse(['unknown-tool'])).toThrow(ZodError);
  });
});
