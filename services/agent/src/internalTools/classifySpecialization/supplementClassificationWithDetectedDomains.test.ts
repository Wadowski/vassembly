import { describe, expect, it } from 'vitest';

import { supplementClassificationWithDetectedDomains } from './supplementClassificationWithDetectedDomains';

const CATALOG_ITEMS = [
  { id: 'spec-food', name: 'food & nutrition' },
  { id: 'spec-notion', name: 'notion' },
];

const NOTION_MCP = {
  name: 'Notion MCP',
  slug: 'notion-mcp',
  description: 'Read and write Notion pages, databases, and workspaces',
  tags: ['knowledge', 'notion', 'notes', 'productivity'],
};

describe('supplementClassificationWithDetectedDomains', () => {
  it('should add notion when the LLM only classified the subject-matter domain', () => {
    const result = supplementClassificationWithDetectedDomains({
      classification: {
        isValid: true,
        existingSpecializationIds: ['spec-food'],
        newSpecializations: [],
      },
      description: 'Create a summary in my notion about 20 most popular meals',
      catalogItems: CATALOG_ITEMS,
      mcpItems: [NOTION_MCP],
    });

    expect(result).toEqual({
      isValid: true,
      existingSpecializationIds: ['spec-food', 'spec-notion'],
      newSpecializations: [],
    });
  });
});
