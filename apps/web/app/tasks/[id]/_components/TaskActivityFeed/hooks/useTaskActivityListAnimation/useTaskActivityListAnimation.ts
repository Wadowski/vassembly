import { useLayoutEffect, useRef } from 'react';

import { getItemIdsKey } from './getItemIdsKey';
import { getListItemOffsetTop } from './getListItemOffsetTop';

export const ACTIVITY_LIST_ANIMATION_DURATION_MS = 400;
export const ACTIVITY_ITEM_ENTER_SELECTOR = '[data-activity-item-enter]';

export interface UseTaskActivityListAnimationParams {
  itemIdsKey: string;
  enteringClassName: string;
}

export interface UseTaskActivityListAnimationResult {
  listRef: React.RefObject<HTMLUListElement | null>;
}

const getIsReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const saveItemPositions = ({
  list,
}: {
  list: HTMLUListElement;
}): Map<string, number> => {
  const positions = new Map<string, number>();
  const elements = list.querySelectorAll<HTMLElement>('[data-activity-item-id]');

  elements.forEach((element) => {
    const { activityItemId } = element.dataset;

    if (activityItemId) {
      positions.set(activityItemId, getListItemOffsetTop({ listItem: element }));
    }
  });

  return positions;
};

const parseItemIdsKey = ({ itemIdsKey }: { itemIdsKey: string }): string[] => {
  if (itemIdsKey.length === 0) {
    return [];
  }

  return itemIdsKey.split('\0');
};

export const getNewlyAddedItemIds = ({
  previousItemIds,
  nextItemIds,
}: {
  previousItemIds: string[];
  nextItemIds: string[];
}): string[] => {
  const previousIdSet = new Set(previousItemIds);
  return nextItemIds.filter((id) => !previousIdSet.has(id));
};

const getEnterTarget = ({
  list,
  itemId,
}: {
  list: HTMLUListElement;
  itemId: string;
}): HTMLElement | null => {
  const listItem = list.querySelector<HTMLElement>(`[data-activity-item-id="${itemId}"]`);

  if (!listItem) {
    return null;
  }

  return listItem.querySelector<HTMLElement>(ACTIVITY_ITEM_ENTER_SELECTOR);
};

export const useTaskActivityListAnimation = ({
  itemIdsKey,
  enteringClassName,
}: UseTaskActivityListAnimationParams): UseTaskActivityListAnimationResult => {
  const listRef = useRef<HTMLUListElement>(null);
  const prevItemIdsKeyRef = useRef<string | null>(null);
  const prevItemIdsRef = useRef<string[]>([]);
  const prevPositionsRef = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    if (itemIdsKey === prevItemIdsKeyRef.current) {
      return;
    }

    const list = listRef.current;
    const nextItemIds = parseItemIdsKey({ itemIdsKey });
    const previousItemIds = prevItemIdsRef.current;

    if (!list) {
      prevItemIdsKeyRef.current = itemIdsKey;
      prevItemIdsRef.current = nextItemIds;
      return;
    }

    if (prevItemIdsKeyRef.current === null) {
      prevPositionsRef.current = saveItemPositions({ list });
      prevItemIdsKeyRef.current = itemIdsKey;
      prevItemIdsRef.current = nextItemIds;
      return;
    }

    const newlyAddedIds = getNewlyAddedItemIds({ previousItemIds, nextItemIds });

    if (newlyAddedIds.length === 0) {
      prevPositionsRef.current = saveItemPositions({ list });
      prevItemIdsKeyRef.current = itemIdsKey;
      prevItemIdsRef.current = nextItemIds;
      return;
    }

    const isReducedMotion = getIsReducedMotion();

    if (!isReducedMotion) {
      const elements = list.querySelectorAll<HTMLElement>('[data-activity-item-id]');

      elements.forEach((element) => {
        const { activityItemId } = element.dataset;

        if (!activityItemId || newlyAddedIds.includes(activityItemId)) {
          return;
        }

        const prevTop = prevPositionsRef.current.get(activityItemId);

        if (prevTop === undefined) {
          return;
        }

        const nextTop = getListItemOffsetTop({ listItem: element });
        const deltaY = prevTop - nextTop;

        if (Math.abs(deltaY) < 0.5) {
          return;
        }

        element.style.transform = `translateY(${deltaY}px)`;
        element.style.transition = 'none';
        element.getBoundingClientRect();
        element.style.transition = `transform ${ACTIVITY_LIST_ANIMATION_DURATION_MS}ms ease`;
        element.style.transform = '';

        const handleTransitionEnd = (): void => {
          element.style.transition = '';
          element.style.transform = '';
          element.removeEventListener('transitionend', handleTransitionEnd);
        };

        element.addEventListener('transitionend', handleTransitionEnd);
      });

      newlyAddedIds.forEach((id) => {
        const enterTarget = getEnterTarget({ list, itemId: id });

        if (!enterTarget || !enteringClassName) {
          return;
        }

        enterTarget.classList.add(enteringClassName);

        const handleAnimationEnd = (): void => {
          enterTarget.classList.remove(enteringClassName);
          enterTarget.removeEventListener('animationend', handleAnimationEnd);
        };

        enterTarget.addEventListener('animationend', handleAnimationEnd);
      });
    }

    prevPositionsRef.current = saveItemPositions({ list });
    prevItemIdsKeyRef.current = itemIdsKey;
    prevItemIdsRef.current = nextItemIds;
  }, [enteringClassName, itemIdsKey]);

  return { listRef };
};

export { getItemIdsKey };
