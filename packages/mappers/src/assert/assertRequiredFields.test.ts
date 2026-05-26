import { describe, it, expect } from 'vitest';
import { assertRequiredFields } from './assertRequiredFields';

interface TestEntity {
  id?: string;
  name?: string;
  email?: string;
  status?: string;
}

describe('assertRequiredFields', () => {
  it('passes when all required fields are present', () => {
    const entity: TestEntity = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
    };

    expect(() =>
      assertRequiredFields({
        entity,
        fields: ['id', 'name', 'email'],
        entityName: 'TestEntity',
      })
    ).not.toThrow();
  });

  it('throws error when required field is undefined', () => {
    const entity: TestEntity = {
      id: '123',
      name: undefined,
      email: 'test@example.com',
    };

    expect(() =>
      assertRequiredFields({
        entity,
        fields: ['id', 'name', 'email'],
        entityName: 'TestEntity',
      })
    ).toThrow('TestEntity name is required');
  });

  it('throws error when required field is missing', () => {
    const entity: TestEntity = {
      id: '123',
      email: 'test@example.com',
    };

    expect(() =>
      assertRequiredFields({
        entity,
        fields: ['id', 'name', 'email'],
        entityName: 'TestEntity',
      })
    ).toThrow('TestEntity name is required');
  });

  it('checks multiple fields and fails on first missing', () => {
    const entity: TestEntity = {
      status: 'active',
    };

    expect(() =>
      assertRequiredFields({
        entity,
        fields: ['id', 'name', 'email'],
        entityName: 'TestEntity',
      })
    ).toThrow('TestEntity id is required');
  });

  it('passes with empty required fields list', () => {
    const entity: TestEntity = {};

    expect(() =>
      assertRequiredFields({
        entity,
        fields: [],
        entityName: 'TestEntity',
      })
    ).not.toThrow();
  });

  it('includes entity name in error message', () => {
    const entity: TestEntity = {
      id: undefined,
    };

    expect(() =>
      assertRequiredFields({
        entity,
        fields: ['id'],
        entityName: 'User',
      })
    ).toThrow('User id is required');
  });
});
