'use client';

import { useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { UnauthorizedError } from '@vassembly/errors';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';

import { SpecializationAgentsPanel } from './SpecializationAgentsPanel/SpecializationAgentsPanel';
import { SpecializationDetailHeader } from './SpecializationDetailHeader/SpecializationDetailHeader';
import { SpecializationDetailSkeleton } from './SpecializationDetailSkeleton/SpecializationDetailSkeleton';
import { SpecializationMcpsPanel } from './SpecializationMcpsPanel/SpecializationMcpsPanel';
import { SpecializationSkillsPanel } from './SpecializationSkillsPanel/SpecializationSkillsPanel';
import { SpecializationNotFoundMessage } from './SpecializationNotFoundMessage/SpecializationNotFoundMessage';
import { DETAIL_ERROR_MESSAGE } from './constants';
import styles from './SpecializationDetailPage.module.scss';
import { useIsMobileLayout } from './useIsMobileLayout';
import { useSpecializationDetail } from './useSpecializationDetail';

export const SpecializationDetailPage = (): JSX.Element | null => {
  const params = useParams();
  const router = useRouter();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const isMobile = useIsMobileLayout();
  const loginRoute = `/login?returnUrl=${encodeURIComponent(`/specialization/${specializationId}`)}`;

  const detail = useSpecializationDetail({ specializationId });

  useEffect(() => {
    if (detail.error instanceof UnauthorizedError) {
      router.replace(loginRoute);
    }
  }, [detail.error, loginRoute, router]);

  if (detail.loading) {
    return <SpecializationDetailSkeleton />;
  }

  if (detail.error instanceof UnauthorizedError) {
    return null;
  }

  if (detail.isNotFound) {
    return <SpecializationNotFoundMessage />;
  }

  if (detail.error !== undefined && detail.specialization === undefined) {
    return (
      <main className={styles.page}>
        <div className={styles.errorBlock}>
          <Alert variant="error" message={DETAIL_ERROR_MESSAGE} />
          <Button variant="outlined" text="Try again" onClick={detail.handleRetry} />
        </div>
      </main>
    );
  }

  if (detail.specialization === undefined || detail.specialization === null) {
    return null;
  }

  return (
    <main
      className={styles.page}
      data-testid="specialization-detail-page"
      data-layout={isMobile ? 'mobile' : 'desktop'}
    >
      <SpecializationDetailHeader specialization={detail.specialization} />
      <div className={styles.panels}>
        <div className={styles.topRow}>
          <SpecializationAgentsPanel specializationId={specializationId} />
          <SpecializationMcpsPanel specializationId={specializationId} />
        </div>
        <div className={styles.skillsRow}>
          <SpecializationSkillsPanel specializationId={specializationId} />
        </div>
      </div>
    </main>
  );
};
