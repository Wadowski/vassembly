import { describe, expect, it } from 'vitest';

import { sanitizeJsonSchemaForGemini } from './index';

describe('sanitizeJsonSchemaForGemini', () => {
  it('should convert nullable type arrays to a single type with nullable flag', () => {
    const result = sanitizeJsonSchemaForGemini({
      schema: {
        type: 'object',
        properties: {
          skillId: { type: ['string', 'null'] },
        },
      },
    });

    expect(result).toEqual({
      type: 'object',
      properties: {
        skillId: { type: 'string', nullable: true },
      },
    });
  });

  it('should flatten nullable anyOf branches', () => {
    const result = sanitizeJsonSchemaForGemini({
      schema: {
        anyOf: [{ type: 'string' }, { type: 'null' }],
      },
    });

    expect(result).toEqual({
      type: 'string',
      nullable: true,
    });
  });

  it('should sanitize nested array item schemas', () => {
    const result = sanitizeJsonSchemaForGemini({
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skillName: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    });

    expect(result).toEqual({
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skillName: { type: 'string', nullable: true },
            },
          },
        },
      },
    });
  });
});
