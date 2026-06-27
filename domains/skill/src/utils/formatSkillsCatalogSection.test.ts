import { describe, it, expect } from 'vitest';

import { formatSkillsCatalogSection } from './formatSkillsCatalogSection';

describe('formatSkillsCatalogSection', () => {
  it('should return empty string for empty catalog', () => {
    expect(formatSkillsCatalogSection({ items: [] })).toBe('');
  });

  it('should format skills into markdown section', () => {
    const section = formatSkillsCatalogSection({
      items: [
        { name: 'contract-review', description: 'Review contracts' },
        { name: 'legal-research', description: 'Research case law' },
      ],
    });

    expect(section).toBe(
      '## Available Skills\n\n- **contract-review**: Review contracts\n- **legal-research**: Research case law',
    );
  });
});
