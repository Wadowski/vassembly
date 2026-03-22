import { describe, it, expect } from 'vitest';
import { randomString } from './randomString';

describe('generateRandomText', () => {
  it('should generate random text with default length', () => {
    const text = randomString();

    expect(text).toBeDefined();
    expect(text.length).toBe(36);
    expect(typeof text).toBe('string');
  });

  it('should generate random text with custom length', () => {
    const length = 32;
    const text = randomString(length);

    expect(text.length).toBe(length);
  });

  it('should generate different random text on each call', () => {
    const text1 = randomString();
    const text2 = randomString();

    expect(text1).not.toBe(text2);
  });

  it('should handle zero length', () => {
    const text = randomString(0);

    expect(text).toBe('');
    expect(text.length).toBe(0);
  });

  it('should handle large length values', () => {
    const length = 1000;
    const text = randomString(length);

    expect(text.length).toBe(length);
  });
});
