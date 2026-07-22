'use client';

import { Text } from '@vassembly/ui-system-design/text';

import styles from './OnboardingPageHeader.module.scss';

export const OnboardingPageHeader = (): JSX.Element => (
  <header className={styles.header}>
    <Text variant="h1">Complete your account setup</Text>
    <Text variant="body2">Two quick steps before you can use Vassembly.</Text>
  </header>
);
