import { describe, it, expect } from 'vitest';
import { printSchema } from 'graphql';

import { createBuilder } from './builder';

describe('createBuilder', () => {
  it('returns a builder whose toSchema exposes a type map and SDL', () => {
    const builder = createBuilder();
    const schema = builder.toSchema();

    expect(typeof schema.getTypeMap).toBe('function');
    expect(typeof printSchema(schema)).toBe('string');
  });
});
