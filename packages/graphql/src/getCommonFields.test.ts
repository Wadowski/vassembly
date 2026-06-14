import { describe, it, expect } from 'vitest';

import { getCommonFields } from './defineSchema';
import type { GraphQLFieldBuilder } from './types';

describe('getCommonFields', () => {
  it('maps standard model field definitions from the field builder', () => {
    const t = {
      exposeID: (name: string, opts: { nullable?: boolean }) => ({ kind: 'id' as const, name, opts }),
      expose: (name: string, opts: { type: string; nullable?: boolean }) => ({
        kind: 'expose' as const,
        name,
        opts,
      }),
    } as unknown as Pick<GraphQLFieldBuilder, 'exposeID' | 'expose'>;

    expect(getCommonFields(t as GraphQLFieldBuilder)).toEqual({
      id: { kind: 'id', name: 'id', opts: { nullable: true } },
      createdAt: { kind: 'expose', name: 'createdAt', opts: { type: 'DateTime', nullable: true } },
      updatedAt: { kind: 'expose', name: 'updatedAt', opts: { type: 'DateTime', nullable: true } },
      removedAt: { kind: 'expose', name: 'removedAt', opts: { type: 'DateTime', nullable: true } },
    });
  });
});
