'use client';

import { Text } from '@vassembly/ui-system-design/text';

import styles from './SkillRuleSection.module.scss';
import type { SkillRuleSectionProps } from '../types';

export const SkillRuleSection = ({ rule }: SkillRuleSectionProps): JSX.Element => {
  return (
    <section className={styles.section} aria-label="Skill instructions">
      <Text variant="h2" as="h2">
        Instructions
      </Text>
      <pre className={styles.rule} data-testid="skill-rule-content">
        {rule}
      </pre>
    </section>
  );
};
