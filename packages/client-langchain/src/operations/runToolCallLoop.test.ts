import { describe, it, expect, vi } from 'vitest';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { ExecutionPausedError } from '@vassembly/errors';

import { runToolCallLoop } from './runToolCallLoop';

const createMockModel = (invoke: ReturnType<typeof vi.fn>): BaseChatModel =>
  ({ invoke }) as unknown as BaseChatModel;

const createMockTool = (name: string, invoke: ReturnType<typeof vi.fn>): DynamicStructuredTool =>
  ({ name, invoke }) as unknown as DynamicStructuredTool;

describe('runToolCallLoop', () => {
  it('should pass signal to model invoke', async () => {
    const controller = new AbortController();
    const invoke = vi.fn().mockResolvedValue({ content: 'Done', tool_calls: [] });

    await runToolCallLoop({
      model: createMockModel(invoke),
      tools: [],
      messages: [new HumanMessage('Hello')],
      maxIterations: 3,
      signal: controller.signal,
    });

    expect(invoke).toHaveBeenCalledWith([new HumanMessage('Hello')], { signal: controller.signal });
  });

  it('should throw ExecutionPausedError when signal is aborted before invoke', async () => {
    const controller = new AbortController();
    controller.abort();
    const invoke = vi.fn();

    await expect(
      runToolCallLoop({
        model: createMockModel(invoke),
        tools: [],
        messages: [new HumanMessage('Hello')],
        maxIterations: 3,
        signal: controller.signal,
      }),
    ).rejects.toThrow(ExecutionPausedError);

    expect(invoke).not.toHaveBeenCalled();
  });

  it('should throw ExecutionPausedError when shouldAbort returns true before tool invoke', async () => {
    const toolInvoke = vi.fn();
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        content: '',
        tool_calls: [{ name: 'search', args: { q: 'test' }, id: 'call-1' }],
      });

    await expect(
      runToolCallLoop({
        model: {
          bindTools: () => createMockModel(invoke),
        } as unknown as BaseChatModel,
        tools: [createMockTool('search', toolInvoke)],
        messages: [new HumanMessage('Hello')],
        maxIterations: 3,
        shouldAbort: async () => true,
      }),
    ).rejects.toThrow(ExecutionPausedError);

    expect(toolInvoke).not.toHaveBeenCalled();
  });

  it('should throw ExecutionPausedError when invoke rejects with AbortError', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    const invoke = vi.fn().mockRejectedValue(abortError);

    await expect(
      runToolCallLoop({
        model: createMockModel(invoke),
        tools: [],
        messages: [new HumanMessage('Hello')],
        maxIterations: 3,
      }),
    ).rejects.toThrow(ExecutionPausedError);
  });
});
