import { describe, expect, it } from 'vitest';

import { buildUrl } from './buildUrl';

describe('buildUrl', () => {
  it('should join base URL and path, trimming trailing slashes and adding a leading slash on the path', () => {
    expect(
      buildUrl({
        baseUrl: 'https://api.example.com/v1/',
        path: 'items',
      }),
    ).toBe('https://api.example.com/v1/items');
  });

  it('should append query parameters for defined primitive values and omit null and undefined', () => {
    const url = buildUrl({
      baseUrl: 'https://api.example.com',
      path: '/search',
      query: {
        q: 'a',
        n: 2,
        flag: true,
        empty: null,
        missing: undefined,
      },
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('a');
    expect(parsed.searchParams.get('n')).toBe('2');
    expect(parsed.searchParams.get('flag')).toBe('true');
    expect(parsed.searchParams.has('empty')).toBe(false);
    expect(parsed.searchParams.has('missing')).toBe(false);
  });
});
