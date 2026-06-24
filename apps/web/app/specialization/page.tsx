'use client';

import { Text } from '@vassembly/ui-text';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';

import { ADMIN_FORBIDDEN_MESSAGE, SPECIALIZATION_LIST_PATH } from './constants';
import { SpecializationsPageView } from './SpecializationsPageView';
import { SpecializationsSkeleton } from './_components/SpecializationListContainer/SpecializationsSkeleton/SpecializationsSkeleton';
import styles from './SpecializationsPageView.module.scss';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent(SPECIALIZATION_LIST_PATH)}`;

export default function SpecializationsPage(): JSX.Element {
  return (
    <ProtectedAuthRoute
      requireAuthenticated
      redirectPath={LOGIN_ROUTE}
      roles={['admin']}
      loadingFallback={<SpecializationsSkeleton />}
      forbiddenFallback={
        <main className={styles.pageStack}>
          <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
        </main>
      }
    >
      <SpecializationsPageView />
    </ProtectedAuthRoute>
  );
}
