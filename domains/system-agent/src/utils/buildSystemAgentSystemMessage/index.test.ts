import { describe, expect, it } from 'vitest';

import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

import { buildSystemAgentSystemMessage } from './index';
import { formatIntentCategoriesSection } from './formatIntentCategoriesSection';
import { formatIntentRoutingSection } from './formatIntentRoutingSection';

describe('formatIntentCategoriesSection', () => {
  it('should include all category slugs and descriptions', () => {
    const section = formatIntentCategoriesSection();

    expect(section).toContain('Valid slugs: question | task | scheduled_task | routine_task');
    expect(section).toContain('### question');
    expect(section).toContain('### routine_task');
    expect(section).toContain('Examples:');
  });
});

describe('formatIntentRoutingSection', () => {
  it('should map each slug to a worker agent name', () => {
    const section = formatIntentRoutingSection();

    expect(section).toContain('- question → "Question worker"');
    expect(section).toContain('- routine_task → "Routine task worker"');
  });
});

describe('buildSystemAgentSystemMessage', () => {
  const baseRule = 'Base orchestration rule.';

  it('should append categories for intent classifier', () => {
    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
      rule: baseRule,
    });

    expect(result.startsWith(baseRule)).toBe(true);
    expect(result).toContain('## Categories');
    expect(result).toContain('### task');
  });

  it('should append routing for assistant', () => {
    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.Assistant,
      rule: baseRule,
    });

    expect(result.startsWith(baseRule)).toBe(true);
    expect(result).toContain('## Routing');
    expect(result).toContain('Question worker');
  });

  it('should return rule unchanged for worker agents', () => {
    const workerRule = 'Plan the work.';

    expect(
      buildSystemAgentSystemMessage({
        name: SYSTEM_AGENT_NAME.TaskWorker,
        rule: workerRule,
      }),
    ).toBe(workerRule);
  });

  it('should append skills catalog section when provided', () => {
    const catalogSection = '## Available Skills\n\n- **contract-review**: Review contracts';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.TaskWorker,
      rule: baseRule,
      skillsCatalogSection: catalogSection,
    });

    expect(result).toBe(`${baseRule}\n\n${catalogSection}`);
  });

  it('should append skills catalog after intent classifier sections', () => {
    const catalogSection = '## Available Skills\n\n- **legal-research**: Research law';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
      rule: baseRule,
      skillsCatalogSection: catalogSection,
    });

    expect(result).toContain('## Categories');
    expect(result.endsWith(catalogSection)).toBe(true);
  });
});
