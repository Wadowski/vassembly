import { describe, it, expect } from 'vitest';
import { printSchema } from 'graphql';

import { createBuilder } from './builder';
import { buildGraphQLConfig } from './buildConfig';

describe('buildGraphQLConfig', () => {
  it('returns schema from builder.toSchema and forwards path when provided', () => {
    const builder = createBuilder();
    const expectedSdl = printSchema(builder.toSchema());

    const result = buildGraphQLConfig({
      builder,
      path: '/graphql',
    });

    expect(printSchema(result.schema)).toBe(expectedSdl);
    expect(result.path).toBe('/graphql');
  });

  it('omits path in result when path is not provided', () => {
    const builder = createBuilder();

    const result = buildGraphQLConfig({ builder });

    expect(result.path).toBeUndefined();
  });
});
