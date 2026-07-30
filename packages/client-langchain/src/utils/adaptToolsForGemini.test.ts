import { describe, expect, it } from 'vitest';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { adaptToolsForGemini } from './adaptToolsForGemini';

describe('adaptToolsForGemini', () => {
  it('should sanitize nullable fields in tool schemas', () => {
    const tool = new DynamicStructuredTool({
      name: 'persist_task_plan',
      description: 'Persist task plan',
      schema: z.object({
        items: z.array(
          z.object({
            skillId: z.string().nullable(),
          }),
        ),
      }),
      func: async () => 'ok',
    });

    const [adaptedTool] = adaptToolsForGemini({ tools: [tool] });

    expect(adaptedTool?.name).toBe('persist_task_plan');
    expect(adaptedTool?.schema).toEqual({
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skillId: { type: 'string', nullable: true },
            },
            required: ['skillId'],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    });
  });
});
