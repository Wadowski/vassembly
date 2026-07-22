'use client';

import { useParams } from 'next/navigation';

import { Text } from '@vassembly/ui-system-design/text';

import { ProtectedAuthRoute } from '../../../../../lib/auth/ProtectedAuthRoute';
import { ADMIN_FORBIDDEN_MESSAGE } from '../../../constants';

import { SkillDetailPage } from './_components/SkillDetailPage';
import { SkillDetailSkeleton } from './_components/SkillDetailSkeleton/SkillDetailSkeleton';
import styles from './_components/SkillDetailPage.module.scss';

export default function SkillDetailRoutePage(): JSX.Element {
  const params = useParams();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const skillId = typeof params?.skillId === 'string' ? params.skillId : '';
  const loginRoute = `/login?returnUrl=${encodeURIComponent(
    `/specialization/${specializationId}/skills/${skillId}`,
  )}`;

  return (
    <ProtectedAuthRoute
      requireAuthenticated
      redirectPath={loginRoute}
      roles={['admin']}
      loadingFallback={<SkillDetailSkeleton />}
      forbiddenFallback={
        <main className={styles.page}>
          <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
        </main>
      }
    >
      <SkillDetailPage />
    </ProtectedAuthRoute>
  );
}
