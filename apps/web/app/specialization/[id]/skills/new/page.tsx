'use client';

import { useParams } from 'next/navigation';

import { Text } from '@vassembly/ui-system-design/text';

import { ProtectedAuthRoute } from '../../../../../lib/auth/ProtectedAuthRoute';
import { ADMIN_FORBIDDEN_MESSAGE } from '../../../constants';

import { SkillCreatePage } from './_components/SkillCreatePage';
import styles from './_components/SkillCreatePage.module.scss';

export default function SkillCreateRoutePage(): JSX.Element {
  const params = useParams();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const loginRoute = `/login?returnUrl=${encodeURIComponent(
    `/specialization/${specializationId}/skills/new`,
  )}`;

  return (
    <ProtectedAuthRoute
      requireAuthenticated
      redirectPath={loginRoute}
      roles={['admin']}
      forbiddenFallback={
        <main className={styles.page}>
          <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
        </main>
      }
    >
      <SkillCreatePage />
    </ProtectedAuthRoute>
  );
}
