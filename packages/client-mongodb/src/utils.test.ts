import { describe, expect, it } from 'vitest';
import { flattenObject } from './utils.js';

describe('flattenObject', () => {
  it('returns empty object for empty input', () => {
    expect(flattenObject({})).toEqual({});
  });

  it('returns flat object unchanged', () => {
    const input = { a: 1, b: 2, c: 'hello' };
    expect(flattenObject(input)).toEqual(input);
  });

  it('flattens nested object with dot notation', () => {
    const input = { a: { b: 1 } };
    expect(flattenObject(input)).toEqual({ 'a.b': 1 });
  });

  it('flattens deeply nested objects', () => {
    const input = { a: { b: { c: 42 } } };
    expect(flattenObject(input)).toEqual({ 'a.b.c': 42 });
  });

  it('flattens multiple nested keys', () => {
    const input = { a: { x: 1 }, b: { y: 2 } };
    expect(flattenObject(input)).toEqual({ 'a.x': 1, 'b.y': 2 });
  });

  it('preserves primitive values in nested structure', () => {
    const input = { a: { b: 1, c: 'str', d: true } };
    expect(flattenObject(input)).toEqual({
      'a.b': 1,
      'a.c': 'str',
      'a.d': true,
    });
  });

  it('preserves array of primitives', () => {
    const input = { a: [1, 2, 3] };
    expect(flattenObject(input)).toEqual({ a: [1, 2, 3] });
  });

  it('recursively flattens objects inside arrays', () => {
    const input = { a: [{ b: 1 }, { c: 2 }] };
    expect(flattenObject(input)).toEqual({
      a: [{ b: 1 }, { c: 2 }],
    });
  });

  it('flattens nested objects inside array elements', () => {
    const input = { items: [{ data: { id: 1 } }] };
    expect(flattenObject(input)).toEqual({
      items: [{ 'data.id': 1 }],
    });
  });

  it('does not flatten Date objects', () => {
    const date = new Date('2024-01-01');
    const input = { a: date };
    expect(flattenObject(input)).toEqual({ a: date });
  });

  it('does not flatten null', () => {
    const input = { a: null };
    expect(flattenObject(input)).toEqual({ a: null });
  });

  it('uses additionalObjectCheck to exclude objects', () => {
    const input = { a: { b: 1 }, c: { _bsontype: 'ObjectID' } };
    const excludeObjectId = (field: { _bsontype?: string }) =>
      field?._bsontype !== 'ObjectID';
    expect(flattenObject(input, excludeObjectId)).toEqual({
      'a.b': 1,
      c: { _bsontype: 'ObjectID' },
    });
  });

  it('excludes nested objects when additionalObjectCheck returns false', () => {
    const input = { a: { _bsontype: 'ObjectID', value: '123' } };
    const excludeObjectId = (field: { _bsontype?: string }) =>
      field?._bsontype !== 'ObjectID';
    expect(flattenObject(input, excludeObjectId)).toEqual({
      a: { _bsontype: 'ObjectID', value: '123' },
    });
  });

  it('uses default additionalObjectCheck when not provided', () => {
    const input = { a: { b: 1 } };
    expect(flattenObject(input)).toEqual({ 'a.b': 1 });
  });
});
