import { describe, expect, it } from 'vitest';
import {
  defaultHrefMatchesPath,
  isLinkActiveByDefault,
  pickActiveLinkId,
} from '../utils/matchActiveNavItem';
import type { FlatNavLink } from '../utils/matchActiveNavItem';
import type { NavLinkItem } from '../types';

const link = (args: Partial<NavLinkItem> & Pick<NavLinkItem, 'id' | 'href'>): NavLinkItem => ({
  kind: 'link',
  label: 'L',
  ...args,
});

describe('defaultHrefMatchesPath', () => {
  it('matches exact path', () => {
    expect(
      defaultHrefMatchesPath({ href: '/foo', currentPath: '/foo', match: 'exact' }),
    ).toBe(true);
    expect(
      defaultHrefMatchesPath({ href: '/foo', currentPath: '/foobar', match: 'exact' }),
    ).toBe(false);
  });

  it('matches prefix with boundary', () => {
    expect(
      defaultHrefMatchesPath({ href: '/report', currentPath: '/reports', match: 'prefix' }),
    ).toBe(false);
    expect(
      defaultHrefMatchesPath({ href: '/reports', currentPath: '/reports/2024', match: 'prefix' }),
    ).toBe(true);
  });
});

describe('pickActiveLinkId', () => {
  it('prefers longest prefix', () => {
    const links: FlatNavLink[] = [
      { id: 'a', href: '/app', item: link({ id: 'a', href: '/app', match: 'prefix' }) },
      { id: 'b', href: '/app/settings', item: link({ id: 'b', href: '/app/settings', match: 'prefix' }) },
    ];
    expect(pickActiveLinkId({ links, currentPath: '/app/settings/profile', isActiveHref: undefined })).toBe(
      'b',
    );
  });
});

describe('isLinkActiveByDefault', () => {
  it('uses prefix match when configured', () => {
    const item = link({ id: 'x', href: '/docs', match: 'prefix' });
    expect(isLinkActiveByDefault({ item, currentPath: '/docs/guide' })).toBe(true);
  });
});
