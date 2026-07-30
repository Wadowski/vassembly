import { describe, expect, it } from 'vitest';

import { getItemIdsKey, getNewlyAddedItemIds } from './useTaskActivityListAnimation';

describe('getItemIdsKey', () => {
  it('should join item ids with a stable delimiter', () => {
    expect(getItemIdsKey({ itemIds: ['a', 'b', 'c'] })).toBe('a\0b\0c');
  });

  it('should return an empty string for an empty list', () => {
    expect(getItemIdsKey({ itemIds: [] })).toBe('');
  });
});

describe('getNewlyAddedItemIds', () => {
  it('should return only ids that were not in the previous list', () => {
    expect(
      getNewlyAddedItemIds({
        previousItemIds: ['comment-1', 'event-1'],
        nextItemIds: ['event-2', 'comment-1', 'event-1'],
      }),
    ).toEqual(['event-2']);
  });

  it('should return an empty array when the list is unchanged', () => {
    expect(
      getNewlyAddedItemIds({
        previousItemIds: ['comment-1', 'event-1'],
        nextItemIds: ['comment-1', 'event-1'],
      }),
    ).toEqual([]);
  });
});
