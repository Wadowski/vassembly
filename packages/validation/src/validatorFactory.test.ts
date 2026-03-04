import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validatorFactory } from './validatorFactory';
import { WrongParamError } from '@vassembly/errors';

describe('createValidator', () => {
  it('should return a function', () => {
    const schema = z.object({ name: z.string() });
    const validator = validatorFactory(schema);

    expect(typeof validator).toBe('function');
  });

  it('should validate data successfully with matching schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const validator = validatorFactory(schema);

    const result = validator({ name: 'John', age: 30 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'John', age: 30 });
    }
  });

  it('should fail validation with invalid data', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const validator = validatorFactory(schema);

    const result = validator({ name: 'John', age: 'not a number' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(WrongParamError);
      expect(result.error.statusCode).toBe(400);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.error).toBeDefined();
    }
  });

  it('should handle optional fields correctly', () => {
    const schema = z.object({
      name: z.string(),
      nickname: z.string().optional(),
    });
    const validator = validatorFactory(schema);

    const result = validator({ name: 'John' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
      expect(result.data.nickname).toBeUndefined();
    }
  });

  it('should handle complex nested schemas', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        contact: z.object({
          email: z.string().email(),
          phone: z.string().optional(),
        }),
      }),
    });
    const validator = validatorFactory(schema);

    const result = validator({
      user: {
        name: 'Jane',
        contact: { email: 'jane@example.com' },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.name).toBe('Jane');
      expect(result.data.user.contact.email).toBe('jane@example.com');
    }
  });

  it('should fail on missing required fields', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string(),
    });
    const validator = validatorFactory(schema);

    const result = validator({ name: 'John' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(WrongParamError);
    }
  });

  it('should handle array schemas', () => {
    const schema = z.array(z.number());
    const validator = validatorFactory(schema);

    const result = validator([1, 2, 3, 4]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3, 4]);
    }
  });

  it('should fail validation with invalid array elements', () => {
    const schema = z.array(z.number());
    const validator = validatorFactory(schema);

    const result = validator([1, 'two', 3]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(WrongParamError);
    }
  });

  it('should handle union types', () => {
    const schema = z.union([z.string(), z.number()]);
    const validator = validatorFactory(schema);

    const result1 = validator('test');
    const result2 = validator(42);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it('should fail on invalid union type', () => {
    const schema = z.union([z.string(), z.number()]);
    const validator = validatorFactory(schema);

    const result = validator({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(WrongParamError);
    }
  });
});
