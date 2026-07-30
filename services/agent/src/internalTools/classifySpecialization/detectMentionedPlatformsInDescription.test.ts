import { describe, expect, it } from 'vitest';

import { detectMentionedPlatformsInDescription } from './detectMentionedPlatformsInDescription';

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

describe('detectMentionedPlatformsInDescription', () => {
  it('should detect notion when mentioned in a meals plus Notion task', () => {
    const result = detectMentionedPlatformsInDescription({
      description: 'Create a summary in my notion about 20 most popular meals',
      mcpItems: [NOTION_MCP],
      catalogItems: CATALOG_ITEMS,
    });

    expect(result).toEqual({
      existingSpecializationIds: ['spec-notion'],
      newSpecializations: [],
    });
  });

  it('should propose a new notion specialization when none exists in the catalog', () => {
    const result = detectMentionedPlatformsInDescription({
      description: 'Create a summary in my notion about 20 most popular meals',
      mcpItems: [NOTION_MCP],
      catalogItems: [{ id: 'spec-food', name: 'food & nutrition' }],
    });

    expect(result).toEqual({
      existingSpecializationIds: [],
      newSpecializations: [
        {
          name: 'notion',
          description: 'Read and write Notion pages, databases, and workspaces',
        },
      ],
    });
  });
});
