import type { HeaderNavLink } from '@vassembly/ui-header';

export interface BuildHeaderNavLinksParams {
  pathname: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

export function buildHeaderNavLinks(
  params: BuildHeaderNavLinksParams,
): HeaderNavLink[] {
  return params.links.map((link) => ({
    ...link,
    isActive: link.href === params.pathname,
  }));
}
