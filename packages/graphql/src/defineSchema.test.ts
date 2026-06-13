import { describe, it, expect } from 'vitest';

import { createBuilder } from './builder';
import { defineModelSchema } from './defineSchema';
import { applyResolvers } from './resolvers';
import type { Builder } from './types';

const prepareBuilderForObjectSchemaTests = (builder: Builder): void => {
  builder.scalarType('DateTime', {
    serialize: (value: unknown) => value as Date,
    parseValue: (value: unknown) => value as Date,
  });
  builder.queryType({});
};

describe('defineModelSchema', () => {
  it('registers object type with common fields merged into domain fields by default', () => {
    const builder = createBuilder();
    prepareBuilderForObjectSchemaTests(builder);
    defineModelSchema({
      builder,
      name: 'Widget',
      fields: (t) => ({
        title: t.exposeString('title', { nullable: true }),
      }),
    });
    applyResolvers({
      builder,
      queries: (t) => ({
        widget: t.field({
          type: 'Widget' as never,
          resolve: () =>
            ({
              id: 'w1',
              title: 'Hello',
              createdAt: new Date('2020-01-01'),
              updatedAt: new Date('2020-01-02'),
              removedAt: null,
            }) as never,
        }),
      }),
    });

    const schema = builder.toSchema();
    const widget = schema.getType('Widget');

    expect(widget).toBeDefined();
    expect(typeof (widget as { getFields?: () => Record<string, unknown> }).getFields).toBe(
      'function',
    );
    const fields = (widget as { getFields: () => Record<string, unknown> }).getFields();
    expect(Object.keys(fields).sort()).toEqual(
      ['createdAt', 'id', 'removedAt', 'title', 'updatedAt'].sort(),
    );
  });

  it('registers object type with only domain fields when includeCommonFields is false', () => {
    const builder = createBuilder();
    prepareBuilderForObjectSchemaTests(builder);
    defineModelSchema({
      builder,
      name: 'Gadget',
      includeCommonFields: false,
      fields: (t) => ({
        code: t.exposeString('code', { nullable: true }),
      }),
    });
    applyResolvers({
      builder,
      queries: (t) => ({
        gadget: t.field({
          type: 'Gadget' as never,
          resolve: () => ({ code: 'G-1' }) as never,
        }),
      }),
    });

    const schema = builder.toSchema();
    const gadget = schema.getType('Gadget');

    expect(gadget).toBeDefined();
    expect(
      Object.keys((gadget as { getFields: () => Record<string, unknown> }).getFields()),
    ).toEqual(['code']);
  });
});
