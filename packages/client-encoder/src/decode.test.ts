import { describe, it, expect } from 'vitest';
import { encode } from './encode';
import { decode } from './decode';

describe('decode', () => {
  it('should decode encoded text back to original', () => {
    const text = 'Hello, World!';
    const encoded = encode(text);
    const decoded = decode(encoded);

    expect(decoded).toBe(text);
  });

  it('should handle empty strings', () => {
    const text = '';
    const encoded = encode(text);
    const decoded = decode(encoded);

    expect(decoded).toBe('');
  });

  it('should handle special characters', () => {
    const text = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const encoded = encode(text);
    const decoded = decode(encoded);

    expect(decoded).toBe(text);
  });

  it('should handle unicode characters', () => {
    const text = '你好世界🌍😀';
    const encoded = encode(text);
    const decoded = decode(encoded);

    expect(decoded).toBe(text);
  });

  it('should handle long text', () => {
    const text = 'a'.repeat(10000);
    const encoded = encode(text);
    const decoded = decode(encoded);

    expect(decoded).toBe(text);
  });
});
