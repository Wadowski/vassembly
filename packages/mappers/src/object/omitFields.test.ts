import { describe, it, expect } from 'vitest';
import { omitFields } from './omitFields';

interface TestEntity {
  id: string;
  name: string;
  email: string;
  password: string;
  status: string;
}

describe('omitFields', () => {
  it('removes specified fields from object', () => {
    const source: TestEntity = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      status: 'active',
    };

    const result = omitFields({
      source,
      keys: ['password'],
    });

    expect(result).toEqual({
      id: '123',
      name: 'John',
      email: 'john@example.com',
      status: 'active',
    });
  });

  it('removes multiple fields', () => {
    const source: TestEntity = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      status: 'active',
    };

    const result = omitFields({
      source,
      keys: ['password', 'email'],
    });

    expect(result).toEqual({
      id: '123',
      name: 'John',
      status: 'active',
    });
  });

  it('returns original object shape when no fields omitted', () => {
    const source: TestEntity = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      status: 'active',
    };

    const result = omitFields({
      source,
      keys: [],
    });

    expect(result).toEqual(source);
  });

  it('handles partial objects', () => {
    const partial: Partial<TestEntity> = {
      id: '123',
      password: 'secret',
    };

    const result = omitFields({
      source: partial,
      keys: ['password'],
    });

    expect(result).toEqual({
      id: '123',
    });
  });
});
