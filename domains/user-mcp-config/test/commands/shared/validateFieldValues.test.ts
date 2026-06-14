import { describe, it, expect } from 'vitest';

import { validateFieldValues } from '../../../src/commands/shared/validateFieldValues';
import type { McpConfigSchema } from '../../../src/model/configSchema';

describe('validateFieldValues', () => {
  const schema = {
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', format: 'email' },
      { key: 'secret', label: 'Secret', type: 'password', required: true, minLength: 8 },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [{ value: 'us-east', label: 'US East' }],
      },
      { key: 'acceptTerms', label: 'Accept', type: 'checkbox', required: true },
    ],
  } as McpConfigSchema;

  describe('required validation', () => {
    it('should reject missing required field when name is omitted', () => {
      expect(() =>
        validateFieldValues({
          schema,
          values: { email: 'test@example.com' },
        }),
      ).toThrow(/name.*required/i);
    });
  });

  describe('format validation', () => {
    it('should reject invalid email format', () => {
      expect(() =>
        validateFieldValues({
          schema,
          values: {
            name: 'John',
            email: 'invalid-email',
            secret: 'longsecret',
            region: 'us-east',
            acceptTerms: true,
          },
        }),
      ).toThrow(/email.*valid/i);
    });

    it('should accept valid email format', () => {
      expect(() =>
        validateFieldValues({
          schema,
          values: {
            name: 'John',
            email: 'john@example.com',
            secret: 'longsecret',
            region: 'us-east',
            acceptTerms: true,
          },
        }),
      ).not.toThrow();
    });
  });

  describe('length validation', () => {
    it('should enforce minLength when secret is too short', () => {
      expect(() =>
        validateFieldValues({
          schema,
          values: { name: 'John', secret: 'short', region: 'us-east', acceptTerms: true },
        }),
      ).toThrow(/secret.*length/i);
    });
  });

  describe('enum validation', () => {
    it('should validate select options when region is invalid', () => {
      expect(() =>
        validateFieldValues({
          schema,
          values: { name: 'John', secret: 'longsecret', region: 'invalid-region', acceptTerms: true },
        }),
      ).toThrow(/region.*one of/i);
    });
  });

  describe('checkbox validation', () => {
    it('should require checkbox when required is true and value is false', () => {
      expect(() =>
        validateFieldValues({
          schema,
          values: { name: 'John', secret: 'longsecret', region: 'us-east', acceptTerms: false },
        }),
      ).toThrow(/acceptTerms.*must be checked/i);
    });
  });
});
