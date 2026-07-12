import { describe, expect, it } from 'vitest';

import { parseRuleDirectives } from './parseRuleDirectives';

const buildScript = ({
  filename,
  skillId = 'skill-1',
  skillName = 'contract-review',
}: {
  filename: string;
  skillId?: string;
  skillName?: string;
}) => ({
  filename,
  language: 'python' as const,
  storageKey: `key-${filename}`,
  skillId,
  skillName,
});

describe('parseRuleDirectives', () => {
  it('should return run_skill_script directive matches', () => {
    const matches = parseRuleDirectives({
      skillName: 'contract-review',
      rule: 'Step 1\nrun_skill_script scripts/validate.py\nStep 2',
      scripts: [buildScript({ filename: 'scripts/validate.py' })],
    });

    expect(matches).toEqual([
      {
        skillName: 'contract-review',
        filename: 'scripts/validate.py',
        skillId: 'skill-1',
      },
    ]);
  });

  it('should attribute directives to referenced skill sections', () => {
    const matches = parseRuleDirectives({
      skillName: 'contract-processor',
      rule: [
        'run_skill_script scripts/parent.py',
        '',
        '## Referenced skill: contract-review',
        '',
        'run_skill_script scripts/child.py',
      ].join('\n'),
      scripts: [
        buildScript({
          filename: 'scripts/parent.py',
          skillId: 'parent-1',
          skillName: 'contract-processor',
        }),
        buildScript({
          filename: 'scripts/child.py',
          skillId: 'child-1',
          skillName: 'contract-review',
        }),
      ],
    });

    expect(matches).toEqual([
      {
        skillName: 'contract-processor',
        filename: 'scripts/parent.py',
        skillId: 'parent-1',
      },
      {
        skillName: 'contract-review',
        filename: 'scripts/child.py',
        skillId: 'child-1',
      },
    ]);
  });

  it('should return empty array when no directive is present', () => {
    const matches = parseRuleDirectives({
      skillName: 'contract-review',
      rule: 'Only prose instructions',
      scripts: [buildScript({ filename: 'scripts/validate.py' })],
    });

    expect(matches).toEqual([]);
  });
});
