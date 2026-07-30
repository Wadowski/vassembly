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

  it('should execute sibling tool calls in parallel within one iteration', async () => {
    const toolInvokeOrder: string[] = [];
    const firstToolInvoke = vi.fn(async () => {
      toolInvokeOrder.push('first-start');
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      toolInvokeOrder.push('first-end');
      return 'first-result';
    });
    const secondToolInvoke = vi.fn(async () => {
      toolInvokeOrder.push('second-start');
      toolInvokeOrder.push('second-end');
      return 'second-result';
    });
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        content: '',
        tool_calls: [
          { name: 'first', args: {}, id: 'call-1' },
          { name: 'second', args: {}, id: 'call-2' },
        ],
      })
      .mockResolvedValueOnce({
        content: 'Done',
        tool_calls: [],
      });

    await runToolCallLoop({
      model: {
        bindTools: () => createMockModel(invoke),
      } as unknown as BaseChatModel,
      tools: [createMockTool('first', firstToolInvoke), createMockTool('second', secondToolInvoke)],
      messages: [new HumanMessage('Hello')],
      maxIterations: 3,
    });

    expect(firstToolInvoke).toHaveBeenCalled();
    expect(secondToolInvoke).toHaveBeenCalled();
    expect(toolInvokeOrder.indexOf('second-start')).toBeLessThan(toolInvokeOrder.indexOf('first-end'));
  });

  it('should nudge the model when required tool was not called', async () => {
    const persistInvoke = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ taskPlanInstanceId: 'instance-1' }));
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        content: 'Here is the plan in prose only.',
        tool_calls: [],
      })
      .mockResolvedValueOnce({
        content: '',
        tool_calls: [{ name: 'persist_task_plan', args: {}, id: 'call-1' }],
      })
      .mockResolvedValueOnce({
        content: 'Done',
        tool_calls: [],
      });

    const result = await runToolCallLoop({
      model: {
        bindTools: () => createMockModel(invoke),
      } as unknown as BaseChatModel,
      tools: [createMockTool('persist_task_plan', persistInvoke)],
      messages: [new HumanMessage('Hello')],
      maxIterations: 3,
      requireSuccessfulToolLlmName: 'persist_task_plan',
    });

    expect(invoke).toHaveBeenCalledTimes(3);
    expect(persistInvoke).toHaveBeenCalled();
    expect(result.response.content).toBe('Done');
  });

  it('should return tool error as ToolMessage instead of aborting the loop', async () => {
    const toolInvoke = vi.fn().mockRejectedValue(new Error('validation failed'));
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        content: '',
        tool_calls: [{ name: 'persist_task_plan', args: {}, id: 'call-1' }],
      })
      .mockResolvedValueOnce({
        content: 'Done',
        tool_calls: [],
      });

    const result = await runToolCallLoop({
      model: {
        bindTools: () => createMockModel(invoke),
      } as unknown as BaseChatModel,
      tools: [createMockTool('persist_task_plan', toolInvoke)],
      messages: [new HumanMessage('Hello')],
      maxIterations: 3,
    });

    expect(toolInvoke).toHaveBeenCalled();
    expect(result.response.content).toBe('Done');
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('should bind adapted tools while invoking the original tool instances', async () => {
    const bindTools = vi.fn().mockReturnValue(createMockModel(vi.fn().mockResolvedValue({ content: 'Done', tool_calls: [] })));
    const toolInvoke = vi.fn().mockResolvedValue('ok');
    const originalTool = createMockTool('persist_task_plan', toolInvoke);
    const bindingTool = { name: 'persist_task_plan', invoke: vi.fn() } as unknown as DynamicStructuredTool;

    await runToolCallLoop({
      model: { bindTools } as unknown as BaseChatModel,
      tools: [originalTool],
      bindingTools: [bindingTool],
      messages: [new HumanMessage('Hello')],
      maxIterations: 1,
    });

    expect(bindTools).toHaveBeenCalledWith([bindingTool]);
    expect(bindingTool.invoke).not.toHaveBeenCalled();
    expect(toolInvoke).not.toHaveBeenCalled();
  });
});
