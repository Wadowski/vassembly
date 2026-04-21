import { useMemo } from 'react';
import { flattenNavLinks, pickActiveLinkId } from './matchActiveNavItem';
import type { NavLinkItem, NavSection } from '../types';

export interface UseDrawerActiveLinkArgs {
  sections: ReadonlyArray<NavSection>;
  currentPath?: string;
  isActiveHref?: (args: { href: string; item: NavLinkItem; currentPath: string }) => boolean;
}

export const useDrawerActiveLink = (args: UseDrawerActiveLinkArgs): string | null => {
  const { sections, currentPath, isActiveHref } = args;

  const flatLinks = useMemo(() => {
    return sections.flatMap((section) => flattenNavLinks(section.items));
  }, [sections]);

  return useMemo(() => {
    if (!currentPath) {
      return null;
    }
    return pickActiveLinkId({
      links: flatLinks,
      currentPath,
      isActiveHref: isActiveHref
        ? (href, item, path) => isActiveHref({ href, item, currentPath: path })
        : undefined,
    });
  }, [currentPath, flatLinks, isActiveHref]);
};
