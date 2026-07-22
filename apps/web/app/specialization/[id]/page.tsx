'use client';

import { useParams } from 'next/navigation';

import { Text } from '@vassembly/ui-system-design/text';

import { ProtectedAuthRoute } from '../../../lib/auth/ProtectedAuthRoute';

import { ADMIN_FORBIDDEN_MESSAGE } from '../constants';
import { SpecializationDetailPage } from './_components/SpecializationDetailPage';
import { SpecializationDetailSkeleton } from './_components/SpecializationDetailSkeleton/SpecializationDetailSkeleton';
import styles from './_components/SpecializationDetailPage.module.scss';

export default function SpecializationDetailRoutePage(): JSX.Element {
  const params = useParams();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const loginRoute = `/login?returnUrl=${encodeURIComponent(`/specialization/${specializationId}`)}`;

  return (
    <ProtectedAuthRoute
      requireAuthenticated
      redirectPath={loginRoute}
      roles={['admin']}
      loadingFallback={<SpecializationDetailSkeleton />}
      forbiddenFallback={
        <main className={styles.page}>
          <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
        </main>
      }
    >
      <SpecializationDetailPage />
    </ProtectedAuthRoute>
  );
}
