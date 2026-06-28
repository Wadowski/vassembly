import { describe, expect, it } from 'vitest';

import { CURRENT_DATE_TIME_SECTION_HEADING, SYSTEM_AGENT_NAME } from '@vassembly/constants';

import { buildSystemAgentSystemMessage } from './index';
import { formatIntentCategoriesSection } from './formatIntentCategoriesSection';
import { formatIntentRoutingSection } from './formatIntentRoutingSection';

const FIXED_NOW = new Date('2026-06-28T09:31:00.000Z');

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
      now: FIXED_NOW,
    });

    expect(result.startsWith(baseRule)).toBe(true);
    expect(result).toContain('## Categories');
    expect(result).toContain('### task');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append routing for assistant', () => {
    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.Assistant,
      rule: baseRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(baseRule)).toBe(true);
    expect(result).toContain('## Routing');
    expect(result).toContain('Question worker');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append datetime section for worker agents', () => {
    const workerRule = 'Plan the work.';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.TaskWorker,
      rule: workerRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(workerRule)).toBe(true);
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
    expect(result).toContain('Sunday, June 28, 2026 · 09:31 UTC');
  });

  it('should append skills catalog section when provided', () => {
    const catalogSection = '## Available Skills\n\n- **contract-review**: Review contracts';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.TaskWorker,
      rule: baseRule,
      skillsCatalogSection: catalogSection,
      now: FIXED_NOW,
    });

    expect(result).toContain(catalogSection);
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
    expect(result.indexOf(catalogSection)).toBeLessThan(
      result.indexOf(CURRENT_DATE_TIME_SECTION_HEADING),
    );
  });

  it('should append skills catalog after intent classifier sections', () => {
    const catalogSection = '## Available Skills\n\n- **legal-research**: Research law';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
      rule: baseRule,
      skillsCatalogSection: catalogSection,
      now: FIXED_NOW,
    });

    expect(result).toContain('## Categories');
    expect(result).toContain(catalogSection);
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
    expect(result.indexOf(catalogSection)).toBeLessThan(
      result.indexOf(CURRENT_DATE_TIME_SECTION_HEADING),
    );
  });
});
