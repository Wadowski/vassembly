import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CURRENT_DATE_TIME_SECTION_HEADING } from '@vassembly/constants';

const { mockGetModelById, mockInvoke } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock('../../queries', () => ({
  getModelById: mockGetModelById,
}));

import { invoke } from './index';

const MODELED_CLIENT = {
  invoke: mockInvoke,
};

const BASE_AGENT = {
  id: 'agent-1',
  userId: 'user-1',
  rule: 'You are a research assistant.',
};

describe('invoke agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({ data: BASE_AGENT });
    mockInvoke.mockResolvedValue({ message: 'Done.' });
  });

  it('should append current date and time to the agent rule system message', async () => {
    await invoke({
      modeledProviderClient: MODELED_CLIENT,
      agentId: 'agent-1',
      userId: 'user-1',
      message: 'Hello',
      systemMessage: BASE_AGENT.rule,
    });

    const invokeCall = mockInvoke.mock.calls[0]?.[0];

    expect(invokeCall?.systemMessage).toContain(BASE_AGENT.rule);
    expect(invokeCall?.systemMessage).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append current date and time when system message is omitted', async () => {
    await invoke({
      modeledProviderClient: MODELED_CLIENT,
      agentId: 'agent-1',
      userId: 'user-1',
      message: 'Hello',
    });

    const invokeCall = mockInvoke.mock.calls[0]?.[0];

    expect(invokeCall?.systemMessage).toContain(BASE_AGENT.rule);
    expect(invokeCall?.systemMessage).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });
});
