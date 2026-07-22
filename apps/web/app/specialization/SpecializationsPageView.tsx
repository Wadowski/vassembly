'use client';

import { Text } from '@vassembly/ui-system-design/text';

import { SpecializationListContainer } from './_components/SpecializationListContainer/SpecializationListContainer';
import styles from './SpecializationsPageView.module.scss';

const PAGE_SUBTITLE = 'AI-generated domain tags and their linked agents and MCPs.';

export const SpecializationsPageView = (): JSX.Element => {
  return (
    <main className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text variant="h1" as="h1">
          Specializations
        </Text>
        <Text variant="body2" className={styles.subtitle}>
          {PAGE_SUBTITLE}
        </Text>
      </header>
      <SpecializationListContainer />
    </main>
  );
};
