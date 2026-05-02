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

  it('should produce the same encoding for the same text', () => {
    const text = 'Hello, World!';
    const encoded1 = encode(text);
    const encoded2 = encode(text);

    expect(encoded1).toBe(encoded2);
  });

  it('should encode different texts to different encodings', () => {
    const text1 = 'Hello, World!';
    const text2 = 'Hello, World?';
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
