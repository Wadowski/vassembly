import { describe, it, expect, beforeEach } from 'vitest';

import { executionRegistry } from './index';

describe('executionRegistry', () => {
  beforeEach(() => {
    executionRegistry.deregister({ taskId: 'task-1' });
    executionRegistry.deregister({ taskId: 'task-2' });
    executionRegistry.deregister({ taskId: 'missing-task' });
  });

  it('should return registered abort signal when task is registered', () => {
    const signal = executionRegistry.register({ taskId: 'task-1' });

    const storedSignal = executionRegistry.getSignal({ taskId: 'task-1' });

    expect(storedSignal).toBe(signal);
    expect(signal.aborted).toBe(false);
  });

  it('should abort signal and remove entry when abort is called', () => {
    const signal = executionRegistry.register({ taskId: 'task-1' });

    const didAbort = executionRegistry.abort({ taskId: 'task-1' });

    expect(didAbort).toBe(true);
    expect(signal.aborted).toBe(true);
    expect(executionRegistry.getSignal({ taskId: 'task-1' })).toBeUndefined();
  });

  it('should return undefined when deregister is called', () => {
    executionRegistry.register({ taskId: 'task-2' });

    executionRegistry.deregister({ taskId: 'task-2' });

    expect(executionRegistry.getSignal({ taskId: 'task-2' })).toBeUndefined();
  });

  it('should not throw when abort is called for unregistered taskId', () => {
    expect(() => executionRegistry.abort({ taskId: 'missing-task' })).not.toThrow();
    expect(executionRegistry.abort({ taskId: 'missing-task' })).toBe(false);
  });
});
