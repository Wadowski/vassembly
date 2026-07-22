'use client';

import { useEffect, useMemo } from 'react';

import { useSkillsBySpecialization } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './SkillUsesSkillsSection.module.scss';

export interface SkillUsesSkillsSectionProps {
  specializationId: string;
  usesSkillIds: string[];
}

export const SkillUsesSkillsSection = ({
  specializationId,
  usesSkillIds,
}: SkillUsesSkillsSectionProps): JSX.Element | null => {
  const { data: skillsData, execute: fetchSkills } = useSkillsBySpecialization();

  useEffect(() => {
    if (specializationId !== '' && usesSkillIds.length > 0) {
      void fetchSkills({ specializationId, size: 200 });
    }
  }, [fetchSkills, specializationId, usesSkillIds.length]);

  const labels = useMemo(() => {
    const nameById = new Map((skillsData?.items ?? []).map((skill) => [skill.id, skill.name]));

    return usesSkillIds.map((skillId) => nameById.get(skillId) ?? skillId);
  }, [skillsData?.items, usesSkillIds]);

  if (usesSkillIds.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Uses skills">
      <Text variant="h2" as="h2">
        Uses skills
      </Text>
      <ul className={styles.list}>
        {usesSkillIds.map((skillId, index) => (
          <li key={skillId}>
            <Text variant="body1">{labels[index]}</Text>
          </li>
        ))}
      </ul>
    </section>
  );
};
