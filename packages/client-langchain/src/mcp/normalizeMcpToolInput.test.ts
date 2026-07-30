import { describe, expect, it } from 'vitest';

import { normalizeMcpToolInput } from './normalizeMcpToolInput';

describe('normalizeMcpToolInput', () => {
  it('should parse stringified JSON tool arguments', () => {
    const result = normalizeMcpToolInput({
      raw: '{"query":"hello"}',
    });

    expect(result).toEqual({ query: 'hello' });
  });

  it('should pass through non-string values', () => {
    const input = { query: 'hello' };

    expect(normalizeMcpToolInput({ raw: input })).toBe(input);
  });
});
