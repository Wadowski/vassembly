import { describe, it, expect } from 'vitest';

import { formatSkillsCatalogSection } from './formatSkillsCatalogSection';

describe('formatSkillsCatalogSection', () => {
  it('should return empty string for empty catalog', () => {
    expect(formatSkillsCatalogSection({ items: [] })).toBe('');
  });

  it('should format skills into markdown table with input and output', () => {
    const section = formatSkillsCatalogSection({
      items: [
        {
          name: 'contract-review',
          description: 'Review contracts',
          input: 'contract text',
          output: 'findings list',
        },
        {
          name: 'legal-research',
          description: 'Research case law',
          input: '',
          output: '',
        },
      ],
    });

    expect(section).toContain('## Available Skills');
    expect(section).toContain('| Name | Description | Input | Output |');
    expect(section).toContain('| contract-review | Review contracts | contract text | findings list |');
    expect(section).toContain('| legal-research | Research case law | — | — |');
  });
});
