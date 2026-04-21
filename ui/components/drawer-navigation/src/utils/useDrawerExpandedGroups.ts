import { useCallback, useMemo, useState } from 'react';
import type { NavGroupItem, NavLinkItem, NavSection } from '../types';

const collectDefaultOpenFromItems = (items: ReadonlyArray<NavLinkItem | NavGroupItem>, into: Set<string>): void => {
  for (const item of items) {
    if (item.kind === 'group') {
      if (item.defaultOpen) {
        into.add(item.id);
      }
      collectDefaultOpenFromItems(item.children, into);
    }
  }
};

export interface UseDrawerExpandedGroupsArgs {
  sections: ReadonlyArray<NavSection>;
  expandedGroupIds?: ReadonlySet<string>;
  onExpandedGroupIdsChange?: (ids: ReadonlySet<string>) => void;
  defaultExpandedGroupIds?: ReadonlySet<string>;
}

export interface UseDrawerExpandedGroupsResult {
  expandedGroupIds: ReadonlySet<string>;
  toggleGroup: (args: { groupId: string }) => void;
  isGroupExpanded: (groupId: string) => boolean;
}

export const useDrawerExpandedGroups = (
  args: UseDrawerExpandedGroupsArgs,
): UseDrawerExpandedGroupsResult => {
  const { sections, expandedGroupIds: controlled, onExpandedGroupIdsChange, defaultExpandedGroupIds } = args;

  const initialUncontrolled = useMemo(() => {
    const next = new Set(defaultExpandedGroupIds ?? []);
    for (const section of sections) {
      collectDefaultOpenFromItems(section.items, next);
    }
    return next;
  }, [sections, defaultExpandedGroupIds]);

  const [internal, setInternal] = useState<ReadonlySet<string>>(() => new Set(initialUncontrolled));

  const isControlled = !!controlled;
  const expanded = isControlled ? controlled : internal;

  const toggleGroup = useCallback(
    ({ groupId }: { groupId: string }): void => {
      const next = new Set(expanded);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      if (!isControlled) {
        setInternal(next);
      }
      onExpandedGroupIdsChange?.(next);
    },
    [expanded, isControlled, onExpandedGroupIdsChange],
  );

  const isGroupExpanded = useCallback(
    (groupId: string): boolean => {
      return expanded.has(groupId);
    },
    [expanded],
  );

  return { expandedGroupIds: expanded, toggleGroup, isGroupExpanded };
};
