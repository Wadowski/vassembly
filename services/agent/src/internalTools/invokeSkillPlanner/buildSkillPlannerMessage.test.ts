import { describe, expect, it } from 'vitest';

import { buildSkillPlannerMessage } from './buildSkillPlannerMessage';

describe('buildSkillPlannerMessage', () => {
  it('should include specialization, goal, MCPs, and JSON footer instructions', () => {
    const message = buildSkillPlannerMessage({
      specializationName: 'Legal',
      specializationId: 'spec-legal',
      goal: 'Review NDAs for risky clauses',
      mcpItems: [{ slug: 'legal-search', name: 'Legal Search', description: 'Search legal docs' }],
      skillsCatalogSection: '## Available Skills\n\n- **nda-review**: Review NDAs',
    });

    expect(message).toContain('Specialization: Legal (spec-legal)');
    expect(message).toContain('Review NDAs for risky clauses');
    expect(message).toContain('legal-search (Legal Search)');
    expect(message).toContain('## Available Skills');
    expect(message).toContain('{"skillId":"<id>","isNew":true|false}');
  });

  it('should note when no MCPs are linked', () => {
    const message = buildSkillPlannerMessage({
      specializationName: 'Finance',
      specializationId: 'spec-finance',
      goal: 'Summarize expenses',
      mcpItems: [],
    });

    expect(message).toContain('No MCPs linked to this specialization.');
  });
});
