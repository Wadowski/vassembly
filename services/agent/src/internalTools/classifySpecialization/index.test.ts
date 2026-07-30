import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@vassembly/errors';

import type { AgentInvokeProgressEventInput } from '../types';
import type { InternalToolContext } from '../types';

const {
  mockGetList,
  mockGetPreferenceByUserId,
  mockGetActiveByName,
  mockRunAgentInvokeWithTools,
  mockMcpGetList,
} = vi.hoisted(() => ({
  mockGetList: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockGetActiveByName: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
  mockMcpGetList: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    queries: {
      getList: mockGetList,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: {
      getPreferenceByUserId: mockGetPreferenceByUserId,
      getActiveByName: mockGetActiveByName,
    },
  },
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    queries: {
      getList: mockMcpGetList,
    },
  },
}));

vi.mock('../runAgentInvokeWithTools', () => ({
  runAgentInvokeWithTools: mockRunAgentInvokeWithTools,
}));

import { classifySpecializationToolHandler } from './index';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  commentId: 'comment-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

const createContextWithProgressCapture = (): {
  context: InternalToolContext;
  progressEvents: AgentInvokeProgressEventInput[];
} => {
  const progressEvents: AgentInvokeProgressEventInput[] = [];

  return {
    progressEvents,
    context: {
      ...BASE_CONTEXT,
      recordAgentInvokeProgress: async (input) => {
        progressEvents.push(input);
      },
    },
  };
};

describe('classifySpecialization internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetList.mockResolvedValue({
      items: [
        { id: 'spec-legal', name: 'legal', description: 'Legal work' },
        { id: 'spec-notion', name: 'notion', description: 'Notion work' },
      ],
      total: 2,
      page: 0,
      size: 500,
    });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: 'cred-1' },
    });
    mockGetActiveByName.mockResolvedValue({
      data: { id: 'classifier-agent-1' },
    });
    mockMcpGetList.mockResolvedValue({
      items: [],
      total: 0,
      page: 0,
      size: 200,
    });
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'legal',
      metadata: {
        mcpIdsUsed: [],
        skippedMcpIds: [],
        internalToolIdsUsed: [],
        skippedInternalToolIds: [],
        maxUseAgentDepth: 3,
      },
    });
  });

  describe('ClassifySpecializationResult type migration', () => {
    it('should return classified result with existing IDs only when catalog matches', async () => {
      const result = await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'Review employment contract terms' },
        BASE_CONTEXT,
      );

      expect(JSON.parse(result)).toEqual({
        type: 'classified',
        existingSpecializationIds: ['spec-legal'],
        newSpecializations: [],
      });
    });

    it('should return classified result with new specializations only when output has NEW lines', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'NEW: compliance|Handles compliance reviews',
        metadata: {
          mcpIdsUsed: [],
          skippedMcpIds: [],
          internalToolIdsUsed: [],
          skippedInternalToolIds: [],
          maxUseAgentDepth: 3,
        },
      });

      const result = await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'Review employment contract terms' },
        BASE_CONTEXT,
      );

      expect(JSON.parse(result)).toEqual({
        type: 'classified',
        existingSpecializationIds: [],
        newSpecializations: [
          { name: 'compliance', description: 'Handles compliance reviews' },
        ],
      });
    });

    it('should return classified result with both existing IDs and new specializations when output is mixed', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'legal\nNEW:airtable|Airtable workspace updates\nnotion',
        metadata: {
          mcpIdsUsed: [],
          skippedMcpIds: [],
          internalToolIdsUsed: [],
          skippedInternalToolIds: [],
          maxUseAgentDepth: 3,
        },
      });

      const result = await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'Review legal docs and update Airtable in Notion' },
        BASE_CONTEXT,
      );

      expect(JSON.parse(result)).toEqual({
        type: 'classified',
        existingSpecializationIds: ['spec-legal', 'spec-notion'],
        newSpecializations: [
          { name: 'airtable', description: 'Airtable workspace updates' },
        ],
      });
    });

    it('should return skipped JSON when description is too short', async () => {
      const result = await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'short' },
        BASE_CONTEXT,
      );

      expect(JSON.parse(result)).toEqual({ type: 'skipped', reason: 'short_description' });
      expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
    });

    it('should return skipped JSON when classifier output is malformed', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'unknown-domain',
        metadata: {
          mcpIdsUsed: [],
          skippedMcpIds: [],
          internalToolIdsUsed: [],
          skippedInternalToolIds: [],
          maxUseAgentDepth: 3,
        },
      });

      const result = await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'Review employment contract terms' },
        BASE_CONTEXT,
      );

      expect(JSON.parse(result)).toEqual({ type: 'skipped', reason: 'invalid_output' });
    });

    it('should throw ValidationError when description is missing', async () => {
      await expect(
        classifySpecializationToolHandler({ taskId: 'task-1' }, BASE_CONTEXT),
      ).rejects.toThrow(ValidationError);
    });

    it('should supplement notion when the LLM only returns the subject-matter specialization', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: 'spec-food', name: 'food & nutrition', description: 'Food and meals' },
          { id: 'spec-notion', name: 'notion', description: 'Notion work' },
        ],
        total: 2,
        page: 0,
        size: 500,
      });
      mockMcpGetList.mockResolvedValue({
        items: [
          {
            id: 'mcp-notion',
            name: 'Notion MCP',
            slug: 'notion-mcp',
            description: 'Read and write Notion pages, databases, and workspaces',
            tags: ['knowledge', 'notion', 'notes', 'productivity'],
          },
        ],
        total: 1,
        page: 0,
        size: 200,
      });
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'food',
        metadata: {
          mcpIdsUsed: [],
          skippedMcpIds: [],
          internalToolIdsUsed: [],
          skippedInternalToolIds: [],
          maxUseAgentDepth: 3,
        },
      });

      const result = await classifySpecializationToolHandler(
        {
          taskId: 'task-1',
          description: 'Create a summary in my notion about 20 most popular meals',
        },
        BASE_CONTEXT,
      );

      expect(JSON.parse(result)).toEqual({
        type: 'classified',
        existingSpecializationIds: ['spec-food', 'spec-notion'],
        newSpecializations: [],
      });
    });
  });

  describe('progress recording', () => {
    it('should record skipped progress with outcome summary when description is too short', async () => {
      const { context, progressEvents } = createContextWithProgressCapture();

      await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'short' },
        context,
      );

      expect(progressEvents).toEqual([
        expect.objectContaining({
          agentId: 'classifier-agent-1',
          state: 'skipped',
          outcomeSummary: 'Skipped: short_description',
        }),
      ]);
    });

    it('should record started and completed progress with outcome summary on successful classification', async () => {
      const { context, progressEvents } = createContextWithProgressCapture();

      await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'Review employment contract terms' },
        context,
      );

      expect(progressEvents).toHaveLength(2);
      expect(progressEvents[0]).toMatchObject({
        agentId: 'classifier-agent-1',
        state: 'started',
      });
      expect(progressEvents[1]).toMatchObject({
        agentId: 'classifier-agent-1',
        state: 'completed',
        outcomeSummary: 'Matched: legal',
      });
    });

    it('should record started and skipped progress when classifier output is invalid', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'unknown-domain',
        metadata: {
          mcpIdsUsed: [],
          skippedMcpIds: [],
          internalToolIdsUsed: [],
          skippedInternalToolIds: [],
          maxUseAgentDepth: 3,
        },
      });

      const { context, progressEvents } = createContextWithProgressCapture();

      await classifySpecializationToolHandler(
        { taskId: 'task-1', description: 'Review employment contract terms' },
        context,
      );

      expect(progressEvents).toHaveLength(2);
      expect(progressEvents[0]).toMatchObject({ state: 'started' });
      expect(progressEvents[1]).toMatchObject({
        state: 'skipped',
        outcomeSummary: 'Skipped: invalid_output',
      });
    });
  });
});
