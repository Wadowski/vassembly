import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooManyRequestsError } from '@vassembly/errors';

const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;

const loadAssertUserRateLimit = async () => {
  vi.resetModules();
  const module = await import('./assertUserRateLimit.js');
  return module.assertUserRateLimit;
};

describe('assertUserRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should pass silently when request count is under the limit', async () => {
    const assertUserRateLimit = await loadAssertUserRateLimit();

    expect(() =>
      assertUserRateLimit({
        userId: 'user-1',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ).not.toThrow();
  });

  it('should allow five requests and throw TooManyRequestsError on the sixth within the window', async () => {
    const assertUserRateLimit = await loadAssertUserRateLimit();

    for (let requestIndex = 0; requestIndex < RATE_LIMIT; requestIndex += 1) {
      expect(() =>
        assertUserRateLimit({
          userId: 'user-1',
          limit: RATE_LIMIT,
          windowMs: WINDOW_MS,
        }),
      ).not.toThrow();
    }

    expect(() =>
      assertUserRateLimit({
        userId: 'user-1',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ).toThrow(TooManyRequestsError);
  });

  it('should allow new requests after the rolling window expires', async () => {
    const assertUserRateLimit = await loadAssertUserRateLimit();

    for (let requestIndex = 0; requestIndex < RATE_LIMIT; requestIndex += 1) {
      assertUserRateLimit({
        userId: 'user-1',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      });
    }

    expect(() =>
      assertUserRateLimit({
        userId: 'user-1',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ).toThrow(TooManyRequestsError);

    vi.advanceTimersByTime(WINDOW_MS + 1);

    expect(() =>
      assertUserRateLimit({
        userId: 'user-1',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ).not.toThrow();
  });

  it('should track rate limits independently per user', async () => {
    const assertUserRateLimit = await loadAssertUserRateLimit();

    for (let requestIndex = 0; requestIndex < RATE_LIMIT; requestIndex += 1) {
      assertUserRateLimit({
        userId: 'user-a',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      });
    }

    expect(() =>
      assertUserRateLimit({
        userId: 'user-a',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ).toThrow(TooManyRequestsError);

    expect(() =>
      assertUserRateLimit({
        userId: 'user-b',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ).not.toThrow();
  });

  it('should count rapid concurrent requests correctly', async () => {
    const assertUserRateLimit = await loadAssertUserRateLimit();

    const concurrentRequests = Array.from({ length: RATE_LIMIT + 1 }, () =>
      Promise.resolve().then(() =>
        assertUserRateLimit({
          userId: 'user-concurrent',
          limit: RATE_LIMIT,
          windowMs: WINDOW_MS,
        }),
      ),
    );

    const results = await Promise.allSettled(concurrentRequests);
    const rejectedCount = results.filter((result) => result.status === 'rejected').length;

    expect(rejectedCount).toBe(1);
    expect(results.some((result) => result.status === 'rejected' && result.reason instanceof TooManyRequestsError)).toBe(
      true,
    );
  });

  it('should expose retryAfterSeconds on TooManyRequestsError when limit is exceeded', async () => {
    const assertUserRateLimit = await loadAssertUserRateLimit();

    for (let requestIndex = 0; requestIndex < RATE_LIMIT; requestIndex += 1) {
      assertUserRateLimit({
        userId: 'user-retry',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      });
    }

    try {
      assertUserRateLimit({
        userId: 'user-retry',
        limit: RATE_LIMIT,
        windowMs: WINDOW_MS,
      });
      throw new Error('Expected TooManyRequestsError');
    } catch (error) {
      expect(error).toBeInstanceOf(TooManyRequestsError);
      expect((error as TooManyRequestsError).retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});
