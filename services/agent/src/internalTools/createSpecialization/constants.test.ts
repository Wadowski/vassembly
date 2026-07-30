import { describe, expect, it } from 'vitest';

import { SPECIALIZATION_AGENT_RULES } from './constants';

describe('SPECIALIZATION_AGENT_RULES', () => {
  it('should use process steps output format for methodologist rule', () => {
    const methodologistRule = SPECIALIZATION_AGENT_RULES.methodologist;

    expect(methodologistRule).toContain('Process steps:');
    expect(methodologistRule).not.toContain('Findings:');
  });

  it('should use data gathering output format for researcher rule', () => {
    const researcherRule = SPECIALIZATION_AGENT_RULES.researcher;

    expect(researcherRule).toContain('Findings:');
    expect(researcherRule).toContain('Data script:');
    expect(researcherRule).not.toContain('Process steps:');
  });
});
