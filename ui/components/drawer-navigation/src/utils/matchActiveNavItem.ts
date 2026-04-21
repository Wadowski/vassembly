import type { NavGroupItem, NavLinkItem, NavMatchMode } from '../types';

interface DefaultHrefMatchesPathArgs {
  href: string;
  currentPath: string;
  match: NavMatchMode;
}
export const defaultHrefMatchesPath = (args: DefaultHrefMatchesPathArgs): boolean => {
  const { href, currentPath, match } = args;
  if (match === 'exact') {
    return currentPath === href;
  }

  const normalized = href.endsWith('/') && href.length > 1 ? href.slice(0, -1) : href;
  if (currentPath === normalized) {
    return true;
  }
  
  return currentPath.startsWith(`${normalized}/`);
};

export const resolveLinkMatchMode = (item: NavLinkItem): NavMatchMode => {
  return item.match ?? 'exact';
};

interface IsLinkActiveByDefaultArgs {
  item: NavLinkItem;
  currentPath: string;
}
export const isLinkActiveByDefault = (args: IsLinkActiveByDefaultArgs): boolean => {
  const { item, currentPath } = args;
  const mode = resolveLinkMatchMode(item);
  return defaultHrefMatchesPath({ href: item.href, currentPath, match: mode as NavMatchMode });
};

export interface FlatNavLink {
  id: string;
  href: string;
  item: NavLinkItem;
}

export const flattenNavLinks = (items: ReadonlyArray<NavLinkItem | NavGroupItem>): FlatNavLink[] => {
  const out: FlatNavLink[] = [];
  const walk = (nodes: ReadonlyArray<NavLinkItem | NavGroupItem>): void => {
    for (const node of nodes) {
      if (node.kind === 'link') {
        out.push({ id: node.id, href: node.href, item: node });
      } else {
        walk(node.children);
      }
    }
  };
  walk(items);
  return out;
};

interface PickActiveLinkIdArgs {
  links: ReadonlyArray<FlatNavLink>;
  currentPath: string;
  isActiveHref?: (href: string, item: NavLinkItem, currentPath: string) => boolean;
}
export const pickActiveLinkId = (args: PickActiveLinkIdArgs): string | null => {
  const { links, currentPath, isActiveHref } = args;

  const active = links.filter((entry) => isActiveHref ? isActiveHref(entry.href, entry.item, currentPath) : isLinkActiveByDefault({ item: entry.item, currentPath }));
  const exact = active.filter((e) => resolveLinkMatchMode(e.item) === 'exact');
  
  if (exact.length > 0) {
    return exact[0]?.id ?? null;
  }
  
  const sorted = [...active].sort((a, b) => b.href.length - a.href.length);
  return sorted[0]?.id ?? null;
};
