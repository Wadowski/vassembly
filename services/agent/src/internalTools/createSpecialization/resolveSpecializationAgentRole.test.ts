import { describe, expect, it } from 'vitest';

import { resolveSpecializationAgentRole } from './resolveSpecializationAgentRole';

describe('resolveSpecializationAgentRole', () => {
  it('should return methodologist for methodologist agent names', () => {
    expect(resolveSpecializationAgentRole({ name: 'Legal methodologist' })).toBe('methodologist');
  });

  it('should return researcher for researcher agent names', () => {
    expect(resolveSpecializationAgentRole({ name: 'Legal researcher' })).toBe('researcher');
  });

  it('should return worker for worker agent names', () => {
    expect(resolveSpecializationAgentRole({ name: 'Legal worker' })).toBe('worker');
  });

  it('should return validator for validator agent names', () => {
    expect(resolveSpecializationAgentRole({ name: 'Legal validator' })).toBe('validator');
  });

  it('should return undefined for system task worker names', () => {
    expect(resolveSpecializationAgentRole({ name: 'Task worker' })).toBeUndefined();
    expect(resolveSpecializationAgentRole({ name: 'Question worker' })).toBeUndefined();
  });

  it('should return undefined for unrelated agent names', () => {
    expect(resolveSpecializationAgentRole({ name: 'Task planner' })).toBeUndefined();
  });
});
