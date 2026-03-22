import { describe, it, expect } from 'vitest';
import { hash } from './hash';
import { compareHash } from './compareHash';

describe('compareHash', () => {
  it('should return true for matching text and hash', async () => {
    const text = 'password123';
    const hashed = await hash({ text });
    const isMatch = await compareHash({ text, hash: hashed });

    expect(isMatch).toBe(true);
  });

  it('should return false for non-matching text and hash', async () => {
    const text = 'password123';
    const hashed = await hash({ text });
    const isMatch = await compareHash({ text: 'wrongpassword', hash: hashed });

    expect(isMatch).toBe(false);
  });

  it('should handle empty strings', async () => {
    const text = '';
    const hashed = await hash({ text });
    const isMatch = await compareHash({ text: '', hash: hashed });

    expect(isMatch).toBe(true);
  });

  it('should be case sensitive', async () => {
    const text = 'Password123';
    const hashed = await hash({ text });
    const isMatch = await compareHash({ text: 'password123', hash: hashed });

    expect(isMatch).toBe(false);
  });
});
