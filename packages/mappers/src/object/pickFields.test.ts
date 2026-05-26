import { describe, it, expect } from 'vitest';
import { pickFields } from './pickFields';

interface TestEntity {
  id: string;
  name: string;
  email: string;
  password: string;
  status: string;
}

describe('pickFields', () => {
  it('selects specified fields from object', () => {
    const source: TestEntity = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      status: 'active',
    };

    const result = pickFields({
      source,
      keys: ['id', 'name', 'email'],
    });

    expect(result).toEqual({
      id: '123',
      name: 'John',
      email: 'john@example.com',
    });
  });

  it('includes undefined values for missing keys', () => {
    const source: TestEntity = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      status: 'active',
    };

    const result = pickFields({
      source,
      keys: ['id', 'nonexistent' as keyof TestEntity],
    });

    expect(result).toEqual({
      id: '123',
      nonexistent: undefined,
    });
  });

  it('returns empty object for empty keys', () => {
    const source: TestEntity = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      status: 'active',
    };

    const result = pickFields({
      source,
      keys: [],
    });

    expect(result).toEqual({});
  });

  it('handles partial objects', () => {
    const partial: Partial<TestEntity> = {
      id: '123',
      email: 'john@example.com',
    };

    const result = pickFields({
      source: partial,
      keys: ['id', 'email', 'password'],
    });

    expect(result).toEqual({
      id: '123',
      email: 'john@example.com',
      password: undefined,
    });
  });
});
