import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { InternalError, ExecutionPausedError, UserInputWaitingError } from '@vassembly/errors';

const { mockLoadMcpTools, mockClose } = vi.hoisted(() => {
  const mockClose = vi.fn();
  const mockLoadMcpTools = vi.fn();

  return { mockLoadMcpTools, mockClose };
});

vi.mock('../mcp', () => ({
  MCP_TOOL_MAX_ITERATIONS: 10,
  loadMcpTools: mockLoadMcpTools,
}));

import { invokeWithChatModel } from './invokeWithChatModel';

describe('invokeWithChatModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClose.mockResolvedValue(undefined);
    mockLoadMcpTools.mockResolvedValue({
      tools: [],
      close: mockClose,
    });
  });

  it('should invoke chat model and return message content', async () => {
    const createChatModel = vi.fn().mockReturnValue({
      invoke: vi.fn().mockResolvedValue({ content: 'Test response' }),
    });

    const result = await invokeWithChatModel({
      createChatModel,
      invokeParams: { model: 'test-model', message: 'Hello' },
      errorMessage: 'Failed to invoke',
    });

    expect(result.message).toBe('Test response');
    expect(result.model).toBe('test-model');
    expect(createChatModel).toHaveBeenCalledWith('test-model');
  });

  it('should pass HumanMessage to chat model invoke', async () => {
    const invoke = vi.fn().mockResolvedValue({ content: 'Response' });
    const createChatModel = vi.fn().mockReturnValue({ invoke });

    await invokeWithChatModel({
      createChatModel,
      invokeParams: { model: 'test-model', message: 'Hello world' },
      errorMessage: 'Failed to invoke',
    });

    expect(invoke).toHaveBeenCalledWith([new HumanMessage('Hello world')], undefined);
  });

  it('should pass signal to chat model invoke on no-tools path', async () => {
    const controller = new AbortController();
    const invoke = vi.fn().mockResolvedValue({ content: 'Response' });
    const createChatModel = vi.fn().mockReturnValue({ invoke });

    await invokeWithChatModel({
      createChatModel,
      invokeParams: {
        model: 'test-model',
        message: 'Hello world',
        signal: controller.signal,
      },
      errorMessage: 'Failed to invoke',
    });

    expect(invoke).toHaveBeenCalledWith([new HumanMessage('Hello world')], {
      signal: controller.signal,
    });
  });

  it('should throw ExecutionPausedError when signal is aborted on no-tools path', async () => {
    const controller = new AbortController();
    controller.abort();
    const invoke = vi.fn();

    await expect(
      invokeWithChatModel({
        createChatModel: vi.fn().mockReturnValue({ invoke }),
        invokeParams: {
          model: 'test-model',
          message: 'Hello',
          signal: controller.signal,
        },
        errorMessage: 'Failed to invoke',
      }),
    ).rejects.toThrow(ExecutionPausedError);

    expect(invoke).not.toHaveBeenCalled();
  });

  it('should throw ExecutionPausedError when invoke rejects with AbortError on no-tools path', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';

    await expect(
      invokeWithChatModel({
        createChatModel: vi.fn().mockReturnValue({
          invoke: vi.fn().mockRejectedValue(abortError),
        }),
        invokeParams: { model: 'test-model', message: 'Hello' },
        errorMessage: 'Failed to invoke model',
      }),
    ).rejects.toThrow(ExecutionPausedError);
  });

  it('should include system message when provided', async () => {
    const invoke = vi.fn().mockResolvedValue({ content: 'Response' });
    const createChatModel = vi.fn().mockReturnValue({ invoke });

    await invokeWithChatModel({
      createChatModel,
      invokeParams: {
        model: 'test-model',
        message: 'Hello world',
        systemMessage: 'You are helpful.',
      },
      errorMessage: 'Failed to invoke',
    });

    expect(invoke).toHaveBeenCalledWith(
      [new SystemMessage('You are helpful.'), new HumanMessage('Hello world')],
      undefined,
    );
  });

  it('should load MCP tools and close client when mcpServerConfigs provided', async () => {
    const bindTools = vi.fn().mockReturnValue({
      invoke: vi.fn().mockResolvedValue({ content: 'With tools', tool_calls: [] }),
    });
    const createChatModel = vi.fn().mockReturnValue({ bindTools });
    mockLoadMcpTools.mockResolvedValue({
      tools: [{ name: 'search', invoke: vi.fn() }],
      close: mockClose,
    });

    const result = await invokeWithChatModel({
      createChatModel,
      invokeParams: {
        model: 'test-model',
        message: 'Search for news',
        mcpServerConfigs: [
          {
            serverName: 'brave-1',
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@brave/brave-search-mcp-server'],
          },
        ],
      },
      errorMessage: 'Failed to invoke',
    });

    expect(mockLoadMcpTools).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
    expect(result.message).toBe('With tools');
  });

  it('should throw InternalError when invoke fails', async () => {
    const createChatModel = vi.fn().mockReturnValue({
      invoke: vi.fn().mockRejectedValue(new Error('Model error')),
    });

    await expect(
      invokeWithChatModel({
        createChatModel,
        invokeParams: { model: 'test-model', message: 'Hello' },
        errorMessage: 'Failed to invoke model',
      }),
    ).rejects.toThrow(InternalError);
  });

  it('should propagate UserInputWaitingError without wrapping as InternalError', async () => {
    const waitingError = new UserInputWaitingError();

    await expect(
      invokeWithChatModel({
        createChatModel: vi.fn().mockReturnValue({
          invoke: vi.fn().mockRejectedValue(waitingError),
        }),
        invokeParams: { model: 'test-model', message: 'Hello' },
        errorMessage: 'Failed to invoke model',
      }),
    ).rejects.toBe(waitingError);
  });
});
