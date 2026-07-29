import { describe, expect, it } from 'vitest';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

import { areActivityTimelinesEqual } from './areActivityTimelinesEqual';

const buildItem = ({ id }: { id: string }): TaskActivityItemDto => ({
  kind: 'progressEvent',
  id,
  occurredAt: '2026-01-01T00:00:00.000Z',
  sortKey: id,
  filterGroup: 'agentStarted',
});

describe('areActivityTimelinesEqual', () => {
  it('should return true when timelines are deeply equal', () => {
    const left = [buildItem({ id: 'a' }), buildItem({ id: 'b' })];
    const right = [buildItem({ id: 'a' }), buildItem({ id: 'b' })];

    expect(areActivityTimelinesEqual(left, right)).toBe(true);
  });

  it('should return false when timeline content changes', () => {
    const left = [buildItem({ id: 'a' })];
    const right = [{ ...buildItem({ id: 'a' }), state: 'failed' }];

    expect(areActivityTimelinesEqual(left, right)).toBe(false);
  });
});
