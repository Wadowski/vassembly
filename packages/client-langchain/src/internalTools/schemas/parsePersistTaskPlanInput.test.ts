import { describe, expect, it } from 'vitest';

import {
  normalizePersistTaskPlanInput,
  persistTaskPlanSchema,
  repairLlmToolArgumentsJson,
} from './parsePersistTaskPlanInput';

const USER_CORRUPTED_ARGUMENTS = String.raw`{"description":"Synthesize research findings on self-learning AI agents into a structured, categorized report and validate its accuracy.","inputDetails":{"goal":{"type:""string""}},"items":[{"agentName":"Machine Learning worker","description":"Synthesize the provided research findings and sources into a structured report categorized by themes (Architectural Integration, Self-Evolution, Reinforcement Learning, Lifelong/Continual Learning, Distributed Autonomy) including specific paper references.","order":1,"skillId":null},{"agentName":"Machine Learning validator","description":"Validate the synthesized report to ensure all themes, findings, and source links from the researcher summary are accurately included and correctly categorized.","order":2,"skillId":null}],"outputDetails":"report: text containing the structured overview","resolvedInputDetails":{"goal":"Provide a comprehensive overview of science documents and papers about self-learning AI agents."},"shortName"😕"self-learning-ai-overview"}`;

describe('repairLlmToolArgumentsJson', () => {
  it('should replace emoji corruption with colons', () => {
    const repaired = repairLlmToolArgumentsJson({
      raw: '"shortName"😕"self-learning-ai-overview"',
    });

    expect(repaired).toBe('"shortName":"self-learning-ai-overview"');
  });
});

describe('persistTaskPlanSchema', () => {
  it('should reject payloads missing required top-level fields', () => {
    const result = persistTaskPlanSchema.safeParse({
      description: 'Plan description',
      inputDetails: {},
      outputDetails: {},
      resolvedInputDetails: {},
    });

    expect(result.success).toBe(false);
  });
});

describe('normalizePersistTaskPlanInput', () => {
  it('should coerce string outputDetails and derive shortName from description', () => {
    const result = normalizePersistTaskPlanInput({
      description: 'Synthesize research findings on self-learning AI agents.',
      inputDetails: { goal: { 'type:"': 'string"' } },
      outputDetails: 'report: text containing the structured overview',
      resolvedInputDetails: { goal: 'Provide a comprehensive overview.' },
      items: [
        {
          agentName: 'Machine Learning worker',
          skillId: null,
          description: 'Synthesize findings into a structured report.',
          order: 1,
        },
      ],
    });

    expect(result.shortName).toBe('synthesize-research-findings-on-self-learning-ai-agents');
    expect(result.outputDetails).toEqual({
      summary: 'report: text containing the structured overview',
    });
    expect(result.items[0]?.agentName).toBe('Machine Learning worker');
  });

  it('should parse corrupted JSON strings from fragile models', () => {
    const result = normalizePersistTaskPlanInput(USER_CORRUPTED_ARGUMENTS);

    expect(result.shortName).toBe('self-learning-ai-overview');
    expect(result.items).toHaveLength(2);
    expect(result.outputDetails).toEqual({
      summary: 'report: text containing the structured overview',
    });
  });

  it('should parse stringified items arrays from Gemini tool calls', () => {
    const result = normalizePersistTaskPlanInput({
      shortName: 'notion-20-country-recipes',
      description:
        'Research 20 distinct national recipes from 20 different countries with standard metadata, then construct and populate a structured database in the user\'s Notion workspace with full recipe details and verify completion.',
      inputDetails: {
        goal: {
          type: 'string',
          required: true,
        },
      },
      outputDetails: {
        notionDatabaseUrl: { type: 'string' },
        status: { type: 'string' },
      },
      resolvedInputDetails: {
        goal: 'Create a summary of 20 meals from 20 different countries with recipes and save it to the user\'s Notion workspace.',
      },
      items: JSON.stringify([
        {
          skillId: 'null',
          skillName: 'recipe-curation-and-schema-standardizer',
          agentName: 'Food & Nutrition researcher',
          description:
            'Research and curate 20 distinct national meals from 20 different countries with standardized schema details including country, prep time, cook time, servings, ingredients, and instructions.',
          order: 1,
        },
        {
          skillName: 'notion-recipe-database-builder',
          agentName: 'Notion worker',
          skillId: 'null',
          order: 2,
          description:
            'Create and populate a structured Notion database with the curated recipes and verify completion.',
        },
      ]),
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.skillId).toBeNull();
    expect(result.items[0]?.skillName).toBe('recipe-curation-and-schema-standardizer');
    expect(result.items[1]?.skillId).toBeNull();
  });
});
