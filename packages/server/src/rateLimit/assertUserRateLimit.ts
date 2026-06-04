import { TooManyRequestsError } from '@vassembly/errors';

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60_000;

const userRequestTimestamps = new Map<string, number[]>(); // TODO: Use Redis instead of in-memory Map

export interface RateLimitConfig {
  userId: string;
  limit?: number;
  windowMs?: number;
}

export const assertUserRateLimit = ({ userId, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS }: RateLimitConfig): void => {
  const now = Date.now();
  const timestamps = userRequestTimestamps.get(userId) ?? [];
  const activeTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0]!;
    const retryAfterMs = oldestTimestamp + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    throw new TooManyRequestsError('Too many requests', retryAfterSeconds);
  }

  activeTimestamps.push(now);
  userRequestTimestamps.set(userId, activeTimestamps);
};
