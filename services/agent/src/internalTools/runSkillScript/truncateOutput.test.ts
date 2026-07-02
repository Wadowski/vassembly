import { describe, expect, it } from 'vitest';

import { truncateOutput } from './truncateOutput';

describe('truncateOutput', () => {
  it('should truncate stdout when it exceeds the limit', () => {
    const result = truncateOutput({
      stdout: 'a'.repeat(20),
      stderr: '',
      stdoutMaxBytes: 10,
      stderrMaxBytes: 10,
    });

    expect(result.stdout).toHaveLength(10);
    expect(result.truncated).toBe(true);
  });
});
