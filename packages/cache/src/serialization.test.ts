import { describe, expect, it } from 'vitest';

import { deserializeCacheValue, serializeCacheValue } from './serialization';

describe('cache serialization', () => {
  it('should round-trip serializable values', () => {
    const value = { id: '1', name: 'Assistant', count: 2 };

    const serialized = serializeCacheValue({ value });
    const restored = deserializeCacheValue<typeof value>({ serialized });

    expect(restored).toEqual(value);
  });

  it('should throw when serialized payload is invalid json', () => {
    expect(() => deserializeCacheValue({ serialized: 'not-json' })).toThrow(
      'Failed to deserialize cache value',
    );
  });
});
