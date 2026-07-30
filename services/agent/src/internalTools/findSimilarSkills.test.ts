import { describe, expect, it } from 'vitest';

import { findSimilarSkills } from './findSimilarSkills';

describe('findSimilarSkills', () => {
  it('should return catalog items that overlap with the query', () => {
    const items = [
      {
        name: 'contract-review',
        description: 'Reviews contracts for risky clauses',
        input: 'contract text',
        output: 'findings list',
      },
      {
        name: 'dns-lookup',
        description: 'Resolves hostname to IP',
        input: 'hostname',
        output: 'IP addresses',
      },
    ];

    const result = findSimilarSkills({
      items,
      query: 'review contract clauses for risk',
    });

    expect(result).toEqual([items[0]]);
  });

  it('should return empty array when no items meet threshold', () => {
    const result = findSimilarSkills({
      items: [
        {
          name: 'dns-lookup',
          description: 'Resolves hostname to IP',
          input: 'hostname',
          output: 'IP addresses',
        },
      ],
      query: 'bake chocolate cake',
    });

    expect(result).toEqual([]);
  });
});
