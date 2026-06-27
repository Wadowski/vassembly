import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import { NotFoundError, ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetActiveById } = vi.hoisted(() => ({
  mockGetActiveById: vi.fn(),
}));

vi.mock('../../queries', () => ({
  getActiveById: mockGetActiveById,
}));

import type { ModeledProviderClient } from './types';
import { invoke } from './index';

const SYSTEM_AGENT_ID = '507f1f77bcf86cd799439011';
const AGENT_RULE = 'You are a compliance assistant.';

const buildEchoClient = (): ModeledProviderClient => ({
  invoke: async (params) => {
    if (typeof params === 'string') {
      return {
        message: params,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        metadata: { model: 'gpt-4', provider: 'openai' },
      };
    }

    const systemMessage = params.systemMessage ?? '';
    return {
      message: `${systemMessage}\n\n${params.message}`,
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      metadata: { model: 'gpt-4', provider: 'openai' },
    };
  },
});

describe('invoke system agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should append intent categories when invoking intent classifier', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: SYSTEM_AGENT_ID,
        name: SYSTEM_AGENT_NAME.IntentClassifier,
        rule: 'Classify the input.',
        status: 'active',
        removedAt: null,
      },
    });

    const result = await invoke({
      modeledProviderClient: buildEchoClient(),
      systemAgentId: SYSTEM_AGENT_ID,
      message: 'What is TypeScript?',
    });

    expect(result.message).toContain('Classify the input.');
    expect(result.message).toContain('## Categories');
    expect(result.message).toContain('### question');
  });

  it('should pass structured invoke params with agent rule as systemMessage', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: SYSTEM_AGENT_ID,
        name: 'Compliance Bot',
        rule: AGENT_RULE,
        status: 'active',
        removedAt: null,
      },
    });

    const result = await invoke({
      modeledProviderClient: buildEchoClient(),
      systemAgentId: SYSTEM_AGENT_ID,
      message: 'Summarize policy section 4.',
    });

    expect(result.message).toBe(`${AGENT_RULE}\n\nSummarize policy section 4.`);
    expect(result.usage?.totalTokens).toBe(15);
    expect(result.metadata?.provider).toBe('openai');
  });

  it('should pass internalToolBindings through to modeled provider client', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: SYSTEM_AGENT_ID,
        name: 'Compliance Bot',
        rule: AGENT_RULE,
        status: 'active',
        removedAt: null,
      },
    });

    const handler = vi.fn().mockResolvedValue('tool result');
    const invokeSpy = vi.fn().mockResolvedValue({ message: 'Done' });
    const client: ModeledProviderClient = { invoke: invokeSpy };

    await invoke({
      modeledProviderClient: client,
      systemAgentId: SYSTEM_AGENT_ID,
      message: 'Run tools',
      internalToolBindings: [{ toolId: 'agent-list', handler }],
    });

    expect(invokeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Run tools',
        systemMessage: AGENT_RULE,
        internalToolBindings: [{ toolId: 'agent-list', handler }],
      }),
    );
  });

  it('should throw NotFoundError when system agent does not exist', async () => {
    mockGetActiveById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      invoke({
        modeledProviderClient: buildEchoClient(),
        systemAgentId: 'missing-id',
        message: 'Hello',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when system agent is archived', async () => {
    mockGetActiveById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      invoke({
        modeledProviderClient: buildEchoClient(),
        systemAgentId: SYSTEM_AGENT_ID,
        message: 'Hello',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when system agent is disabled', async () => {
    mockGetActiveById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      invoke({
        modeledProviderClient: buildEchoClient(),
        systemAgentId: SYSTEM_AGENT_ID,
        message: 'Hello',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should pass skillsCatalogSection through to system message builder', async () => {
    const catalogSection = '## Available Skills\n\n- **contract-review**: Review contracts';
    mockGetActiveById.mockResolvedValue({
      data: {
        id: SYSTEM_AGENT_ID,
        name: 'Compliance Bot',
        rule: AGENT_RULE,
        status: 'active',
        removedAt: null,
      },
    });

    const invokeSpy = vi.fn().mockResolvedValue({ message: 'Done' });
    const client: ModeledProviderClient = { invoke: invokeSpy };

    await invoke({
      modeledProviderClient: client,
      systemAgentId: SYSTEM_AGENT_ID,
      message: 'Run tools',
      skillsCatalogSection: catalogSection,
    });

    expect(invokeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        systemMessage: `${AGENT_RULE}\n\n${catalogSection}`,
      }),
    );
  });

  it('should reject invoke when message is empty after trim', async () => {
    await expect(
      invoke({
        modeledProviderClient: buildEchoClient(),
        systemAgentId: SYSTEM_AGENT_ID,
        message: '   ',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
