import { describe, it, expect } from 'vitest';
import { encode } from './encode';

describe('encode', () => {
  it('should encode text', () => {
    const text = 'Hello, World!';
    const encoded = encode(text);

    expect(encoded).toBeDefined();
    expect(encoded).not.toBe(text);
    expect(encoded).toContain(':');
  });

  it('should encode different text with different results', () => {
    const text1 = 'Hello, World!';
    const text2 = 'Hello, World!';
    const encoded1 = encode(text1);
    const encoded2 = encode(text2);

    expect(encoded1).not.toBe(encoded2);
  });

  it('should handle empty strings', () => {
    const text = '';
    const encoded = encode(text);

    expect(encoded).toBeDefined();
    expect(encoded).toContain(':');
  });

  it('should handle special characters', () => {
    const text = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const encoded = encode(text);

    expect(encoded).toBeDefined();
    expect(encoded).not.toBe(text);
  });

  it('should handle unicode characters', () => {
    const text = '你好世界🌍😀';
    const encoded = encode(text);

    expect(encoded).toBeDefined();
    expect(encoded).not.toBe(text);
  });

  it('should handle long text', () => {
    const text = 'a'.repeat(10000);
    const encoded = encode(text);

    expect(encoded).toBeDefined();
    expect(encoded).toContain(':');
  });
});
