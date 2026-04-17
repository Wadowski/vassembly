import type { NavGroupItem, NavLinkItem, NavSection } from './types';

const warnDeepGroup = (groupId: string): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[DrawerNavigation] Nav group "${groupId}" exceeds max nesting depth (2).`);
  }
};

const walkGroup = (item: NavGroupItem, groupDepth: number): void => {
  for (const child of item.children) {
    if (child.kind === 'group') {
      if (groupDepth >= 2) {
        warnDeepGroup(child.id);
      } else {
        walkGroup(child, groupDepth + 1);
      }
    }
  }
};

export const warnIfNavDepthInvalid = (sections: ReadonlyArray<NavSection>): void => {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.kind === 'group') {
        walkGroup(item, 0);
      }
    }
  }
};
