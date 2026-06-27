import { describe, expect, it } from 'vitest';

import {
  formatInternalToolDisplayName,
  formatInternalToolId,
} from './formatInternalToolName';

describe('formatInternalToolId', () => {
  it('should join domain and action with a hyphen', () => {
    expect(formatInternalToolId({ domain: 'agent', action: 'list' })).toBe('agent-list');
    expect(formatInternalToolId({ domain: 'task', action: 'update' })).toBe('task-update');
    expect(formatInternalToolId({ domain: 'skill', action: 'create' })).toBe('skill-create');
  });
});

describe('formatInternalToolDisplayName', () => {
  it('should join domain and action with spaced hyphen', () => {
    expect(formatInternalToolDisplayName({ domain: 'agent', action: 'list' })).toBe(
      'agent - list',
    );
    expect(formatInternalToolDisplayName({ domain: 'task', action: 'update' })).toBe(
      'task - update',
    );
    expect(formatInternalToolDisplayName({ domain: 'skill', action: 'create' })).toBe(
      'skill - create',
    );
  });
});
