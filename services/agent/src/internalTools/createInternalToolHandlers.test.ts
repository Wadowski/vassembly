import { INTERNAL_TOOL_IDS } from '@vassembly/constants';
import { describe, expect, it } from 'vitest';

import { createInternalToolHandlers } from './createInternalToolHandlers';

import type { InternalToolContext } from './types';

const mockToolContext: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  commentId: 'comment-1',
  invocationId: 'invocation-1',
  callerAgentType: 'system',
  callerAgentId: 'agent-1',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('createInternalToolHandlers', () => {
  it('should register a handler for every internal tool id', () => {
    const handlers = createInternalToolHandlers({ toolContext: mockToolContext });

    expect(Object.keys(handlers).sort()).toEqual([...INTERNAL_TOOL_IDS].sort());
  });

  it('should return structured error when normalization fails', async () => {
    const handlers = createInternalToolHandlers({ toolContext: mockToolContext });
    const useAgentHandler = handlers['agent-use'];

    expect(useAgentHandler).toBeDefined();

    const result = await useAgentHandler!({ name: 'worker' });
    const parsed = JSON.parse(result) as { code?: string; missingFields?: string[] };

    expect(parsed.code).toBe('MISSING_REQUIRED_FIELDS');
    expect(parsed.missingFields).toContain('agentPrompt');
  });
});
