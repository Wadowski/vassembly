import { describe, it, expect } from 'vitest';
import { hash } from './hash';

describe('hash', () => {
  it('should hash text', async () => {
    const text = 'password123';
    const hashed = await hash({ text });

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(text);
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('should produce different hashes for same text', async () => {
    const text = 'password123';
    const hash1 = await hash({ text });
    const hash2 = await hash({ text });

    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty strings', async () => {
    const text = '';
    const hashed = await hash({ text });

    expect(hashed).toBeDefined();
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('should handle special characters', async () => {
    const text = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const hashed = await hash({ text });

    expect(hashed).toBeDefined();
    expect(hashed.length).toBeGreaterThan(0);
  });
});
