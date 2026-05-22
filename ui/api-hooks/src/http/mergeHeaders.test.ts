import { describe, expect, it } from 'vitest';

import { mergeHeaders } from './mergeHeaders';

describe('mergeHeaders', () => {
  it('should merge default and request headers with request overriding defaults', () => {
    const merged = mergeHeaders({
      defaultHeaders: { 'X-A': '1', 'X-B': 'old' },
      requestHeaders: { 'X-B': 'new', 'X-C': '3' },
    });

    expect(merged).toEqual({
      'X-A': '1',
      'X-B': 'new',
      'X-C': '3',
    });
  });

  it('should set Content-Type when the request has a body', () => {
    const merged = mergeHeaders({
      defaultHeaders: {},
      requestHeaders: {},
      hasBody: true,
    });

    expect(merged['Content-Type']).toBe('application/json');
  });

  it('should set Authorization when authorization value is provided', () => {
    const merged = mergeHeaders({
      defaultHeaders: { 'X-A': '1' },
      requestHeaders: {},
      authorization: 'Bearer token',
    });

    expect(merged.Authorization).toBe('Bearer token');
    expect(merged['X-A']).toBe('1');
  });

  it('should omit Authorization when authorization is undefined', () => {
    const merged = mergeHeaders({
      defaultHeaders: {},
      requestHeaders: { 'X-A': '1' },
    });

    expect(merged).toEqual({
      'X-A': '1',
    });
  });
});
