import { describe, it, expect, vi, beforeEach } from 'vitest';

const TASK_TITLE_SESSION_ID = 'TASK_TITLE_GENERATION';
const TASK_TITLE_GENERATOR_AGENT_NAME = 'Task title generator';

const {
  mockGetModelById,
  mockUpdateTask,
  mockGetPreferenceByUserId,
  mockGetActiveByName,
  mockRunAgentInvokeWithTools,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockGetActiveByName: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
  mockLogger: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: { getModelById: mockGetModelById },
    commands: { updateTask: mockUpdateTask },
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

vi.mock('@vassembly/service-agent', () => ({
  runAgentInvokeWithTools: mockRunAgentInvokeWithTools,
}));

vi.mock('@vassembly/logger', () => ({
  logger: mockLogger,
}));

import { generateTaskTitle } from './index';

const TASK_ID = 'task-1';
const USER_ID = 'user-1';
const CREDENTIAL_ID = 'cred-1';
const TITLE_GENERATOR_AGENT_ID = 'title-generator-agent-id';

const BASE_TASK = {
  id: TASK_ID,
  userId: USER_ID,
  description: 'Prepare quarterly board report for stakeholders',
  title: null as string | null,
};

const INVOKE_METADATA = {
  provider: 'openai',
  model: 'gpt-4',
  mcpIdsUsed: [],
  skippedMcpIds: [],
  internalToolIdsUsed: [],
  skippedInternalToolIds: [],
  maxUseAgentDepth: 0,
};

const expectAllLogsUseTaskTitleSession = (): void => {
  for (const call of mockLogger.mock.calls) {
    expect(call[1]?.meta?.sessionId).toBe(TASK_TITLE_SESSION_ID);
  }
};

const findLogCall = (event: string): unknown[] | undefined =>
  mockLogger.mock.calls.find((call) => call[0] === event);

describe('generateTaskTitle handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({ data: BASE_TASK });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: CREDENTIAL_ID },
    });
    mockGetActiveByName.mockResolvedValue({
      data: { id: TITLE_GENERATOR_AGENT_ID },
    });
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'Quarterly board report',
      metadata: INVOKE_METADATA,
    });
    mockUpdateTask.mockResolvedValue({ data: { ...BASE_TASK, title: 'Quarterly board report' } });
  });

  describe('happy path', () => {
    it('should call updateTask with normalized title and log completed when title generation succeeds', async () => {
      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockRunAgentInvokeWithTools).toHaveBeenCalledWith({
        userId: USER_ID,
        agentType: 'system',
        agentId: TITLE_GENERATOR_AGENT_ID,
        message: BASE_TASK.description,
        connectionOverride: { integrationCredentialId: CREDENTIAL_ID },
        toolContext: {},
      });
      expect(mockGetActiveByName).toHaveBeenCalledWith({
        name: TASK_TITLE_GENERATOR_AGENT_NAME,
      });
      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: TASK_ID,
        title: 'Quarterly board report',
      });
      expect(findLogCall('task.title.completed')).toEqual(
        expect.arrayContaining([
          'task.title.completed',
          expect.objectContaining({
            meta: expect.objectContaining({
              sessionId: TASK_TITLE_SESSION_ID,
              taskId: TASK_ID,
              userId: USER_ID,
            }),
            data: expect.objectContaining({
              durationMs: expect.any(Number),
            }),
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });
  });

  describe('skip scenarios', () => {
    it('should skip when title is already set', async () => {
      mockGetModelById.mockResolvedValue({
        data: { ...BASE_TASK, title: 'Existing title' },
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.skipped')).toEqual(
        expect.arrayContaining([
          'task.title.skipped',
          expect.objectContaining({
            meta: expect.objectContaining({
              sessionId: TASK_TITLE_SESSION_ID,
              taskId: TASK_ID,
              userId: USER_ID,
            }),
            data: { reason: 'already_set' },
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });

    it('should skip when description is empty', async () => {
      mockGetModelById.mockResolvedValue({
        data: { ...BASE_TASK, description: '   ' },
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.skipped')).toEqual(
        expect.arrayContaining([
          'task.title.skipped',
          expect.objectContaining({
            data: { reason: 'empty_description' },
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });

    it('should skip when credential is missing', async () => {
      mockGetPreferenceByUserId.mockResolvedValue({ data: null });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.skipped')).toEqual(
        expect.arrayContaining([
          'task.title.skipped',
          expect.objectContaining({
            data: { reason: 'missing_credential' },
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });
  });

  describe('LLM output validation', () => {
    it('should reject title longer than 8 words', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'one two three four five six seven eight nine ten',
        metadata: INVOKE_METADATA,
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.skipped')).toEqual(
        expect.arrayContaining([
          'task.title.skipped',
          expect.objectContaining({
            data: { reason: 'invalid_output' },
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });

    it('should reject empty normalized output', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: '...',
        metadata: INVOKE_METADATA,
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.skipped')).toEqual(
        expect.arrayContaining([
          'task.title.skipped',
          expect.objectContaining({
            data: { reason: 'empty_output' },
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });
  });

  describe('title normalization', () => {
    it('should strip trailing punctuation before persisting', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'Board report.',
        metadata: INVOKE_METADATA,
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: TASK_ID,
        title: 'Board report',
      });
      expectAllLogsUseTaskTitleSession();
    });

    it('should persist only the first line of multi-line output', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: 'Line one\nLine two',
        metadata: INVOKE_METADATA,
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: TASK_ID,
        title: 'Line one',
      });
      expectAllLogsUseTaskTitleSession();
    });

    it('should strip surrounding quotes before persisting', async () => {
      mockRunAgentInvokeWithTools.mockResolvedValue({
        message: '"Invoice review"',
        metadata: INVOKE_METADATA,
      });

      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: TASK_ID,
        title: 'Invoice review',
      });
      expectAllLogsUseTaskTitleSession();
    });
  });

  describe('error handling', () => {
    it('should fail silently when LLM invoke throws', async () => {
      mockRunAgentInvokeWithTools.mockRejectedValue(new Error('Provider unavailable'));

      await expect(
        generateTaskTitle({ taskId: TASK_ID, userId: USER_ID }),
      ).resolves.toBeUndefined();

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.failed')).toEqual(
        expect.arrayContaining([
          'task.title.failed',
          expect.objectContaining({
            meta: expect.objectContaining({
              sessionId: TASK_TITLE_SESSION_ID,
              taskId: TASK_ID,
              userId: USER_ID,
            }),
            data: expect.objectContaining({
              reason: 'Provider unavailable',
              durationMs: expect.any(Number),
            }),
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });

    it('should fail silently when task load throws', async () => {
      mockGetModelById.mockRejectedValue(new Error('Database connection lost'));

      await expect(
        generateTaskTitle({ taskId: TASK_ID, userId: USER_ID }),
      ).resolves.toBeUndefined();

      expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(findLogCall('task.title.failed')).toEqual(
        expect.arrayContaining([
          'task.title.failed',
          expect.objectContaining({
            data: expect.objectContaining({
              reason: 'Database connection lost',
            }),
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });

    it('should fail silently when updateTask throws', async () => {
      mockUpdateTask.mockRejectedValue(new Error('Persist failed'));

      await expect(
        generateTaskTitle({ taskId: TASK_ID, userId: USER_ID }),
      ).resolves.toBeUndefined();

      expect(findLogCall('task.title.failed')).toEqual(
        expect.arrayContaining([
          'task.title.failed',
          expect.objectContaining({
            data: expect.objectContaining({
              reason: 'Persist failed',
            }),
          }),
        ]),
      );
      expectAllLogsUseTaskTitleSession();
    });
  });

  describe('logging', () => {
    it('should log all events with sessionId TASK_TITLE_GENERATION', async () => {
      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      expect(mockLogger).toHaveBeenCalled();
      expectAllLogsUseTaskTitleSession();
      expect(findLogCall('task.title.started')).toEqual(
        expect.arrayContaining([
          'task.title.started',
          expect.objectContaining({
            meta: expect.objectContaining({
              sessionId: TASK_TITLE_SESSION_ID,
              taskId: TASK_ID,
              userId: USER_ID,
            }),
          }),
        ]),
      );
    });

    it('should include taskId, userId, and durationMs on completed event', async () => {
      await generateTaskTitle({ taskId: TASK_ID, userId: USER_ID });

      const completedCall = findLogCall('task.title.completed');
      expect(completedCall).toBeDefined();

      const completedPayload = completedCall?.[1] as {
        meta: { taskId: string; userId: string; sessionId: string };
        data: { durationMs: number };
      };

      expect(completedPayload.meta.taskId).toBe(TASK_ID);
      expect(completedPayload.meta.userId).toBe(USER_ID);
      expect(completedPayload.meta.sessionId).toBe(TASK_TITLE_SESSION_ID);
      expect(completedPayload.data.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
