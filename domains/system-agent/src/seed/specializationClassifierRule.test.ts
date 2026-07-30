import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const EXPECTED_MAX_SPECIALIZATION_RESULTS = 5;

const seedFilePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../seed/systemAgents.json',
);

const loadClassifierRule = (): string => {
  const seedEntries = JSON.parse(readFileSync(seedFilePath, 'utf-8')) as Array<{
    name: string;
    rule: string;
  }>;
  const classifier = seedEntries.find((entry) => entry.name === 'Specialization classifier');

  if (!classifier) {
    throw new Error('Specialization classifier seed entry not found');
  }

  return classifier.rule;
};

describe('Specialization classifier seed rule drift guard', () => {
  it('should reference the current specialization cap in rule text', () => {
    const rule = loadClassifierRule();

    expect(rule).toContain(String(EXPECTED_MAX_SPECIALIZATION_RESULTS));
    expect(rule).not.toMatch(/1[\u2013-]3/);
    expect(rule).not.toMatch(/at most 3/i);
  });

  it('should not instruct the classifier to prefer fewer specializations', () => {
    const rule = loadClassifierRule();

    expect(rule.toLowerCase()).not.toContain('prefer fewer');
  });

  it('should document mixed existing and NEW output format', () => {
    const rule = loadClassifierRule();

    expect(rule).toContain('NEW:');
    expect(rule.toLowerCase()).toMatch(/existing.*new|new.*existing/);
  });

  it('should document multi-domain subject-matter plus platform output', () => {
    const rule = loadClassifierRule();

    expect(rule.toLowerCase()).toContain('food & nutrition');
    expect(rule.toLowerCase()).toContain('notion');
  });

  it('should match MAX_SPECIALIZATION_RESULTS once exported from @vassembly/constants', async () => {
    const constants = await import('@vassembly/constants');

    expect(constants).toHaveProperty('MAX_SPECIALIZATION_RESULTS', EXPECTED_MAX_SPECIALIZATION_RESULTS);
  });
});
