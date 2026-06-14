import { describe, expect, it } from 'vitest';

import {
  assignedToolIdsCreateSchema,
  assignedToolIdsUpdateSchema,
} from './assignedToolIdsSchema';

const V1_REGISTRY_TOOL_IDS = ['use-agent', 'list-agents'] as const;

describe('assignedToolIdsCreateSchema', () => {
  it('should default to empty array when assignedToolIds is omitted', () => {
    const result = assignedToolIdsCreateSchema.parse(undefined);

    expect(result).toEqual([]);
  });

  it('should accept empty array when explicitly provided', () => {
    const result = assignedToolIdsCreateSchema.parse([]);

    expect(result).toEqual([]);
  });

  it('should accept valid registry tool ids', () => {
    const result = assignedToolIdsCreateSchema.parse(['use-agent', 'list-agents']);

    expect(result).toEqual(['use-agent', 'list-agents']);
  });

  it('should accept all v1 registry tool ids without an artificial max length cap', () => {
    const result = assignedToolIdsCreateSchema.parse([...V1_REGISTRY_TOOL_IDS]);

    expect(result).toEqual([...V1_REGISTRY_TOOL_IDS]);
  });

  it('should reject duplicate tool ids', () => {
    expect(() => assignedToolIdsCreateSchema.parse(['use-agent', 'use-agent'])).toThrow();
  });

  it('should reject empty string tool ids', () => {
    expect(() => assignedToolIdsCreateSchema.parse([''])).toThrow();
  });

  it('should reject unknown tool ids not in the registry', () => {
    expect(() => assignedToolIdsCreateSchema.parse(['unknown-tool'])).toThrow();
  });
});

describe('assignedToolIdsUpdateSchema', () => {
  it('should allow assignedToolIds to be omitted on update', () => {
    const result = assignedToolIdsUpdateSchema.parse(undefined);

    expect(result).toBeUndefined();
  });

  it('should accept valid registry tool ids replacement', () => {
    const result = assignedToolIdsUpdateSchema.parse(['list-agents']);

    expect(result).toEqual(['list-agents']);
  });

  it('should accept clearing assignedToolIds to empty array', () => {
    const result = assignedToolIdsUpdateSchema.parse([]);

    expect(result).toEqual([]);
  });

  it('should reject duplicate tool ids on update', () => {
    expect(() =>
      assignedToolIdsUpdateSchema.parse(['list-agents', 'list-agents']),
    ).toThrow();
  });

  it('should reject unknown tool ids not in the registry on update', () => {
    expect(() => assignedToolIdsUpdateSchema.parse(['not-a-real-tool'])).toThrow();
  });
});
