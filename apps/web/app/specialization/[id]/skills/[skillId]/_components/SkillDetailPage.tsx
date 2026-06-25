'use client';

import { useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { UnauthorizedError } from '@vassembly/errors';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';

import { SkillDetailHeader } from './SkillDetailHeader/SkillDetailHeader';
import { SkillDetailSkeleton } from './SkillDetailSkeleton/SkillDetailSkeleton';
import { SkillNotFoundMessage } from './SkillNotFoundMessage/SkillNotFoundMessage';
import { SkillRuleSection } from './SkillRuleSection/SkillRuleSection';
import { SkillScriptsSection } from './SkillScriptsSection/SkillScriptsSection';
import { DETAIL_ERROR_MESSAGE } from './constants';
import styles from './SkillDetailPage.module.scss';
import { useSkillDetail } from './useSkillDetail';

export const SkillDetailPage = (): JSX.Element | null => {
  const params = useParams();
  const router = useRouter();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const skillId = typeof params?.skillId === 'string' ? params.skillId : '';
  const loginRoute = `/login?returnUrl=${encodeURIComponent(
    `/specialization/${specializationId}/skills/${skillId}`,
  )}`;

  const detail = useSkillDetail({ specializationId, skillId });

  useEffect(() => {
    if (detail.error instanceof UnauthorizedError) {
      router.replace(loginRoute);
    }
  }, [detail.error, loginRoute, router]);

  if (detail.loading) {
    return <SkillDetailSkeleton />;
  }

  if (detail.error instanceof UnauthorizedError) {
    return null;
  }

  if (detail.isNotFound) {
    return <SkillNotFoundMessage specializationId={specializationId} />;
  }

  if (detail.error !== undefined && detail.skill === undefined) {
    return (
      <main className={styles.page}>
        <div className={styles.errorBlock}>
          <Alert variant="error" message={DETAIL_ERROR_MESSAGE} />
          <Button variant="outlined" text="Try again" onClick={detail.handleRetry} />
        </div>
      </main>
    );
  }

  if (detail.skill === undefined) {
    return null;
  }

  return (
    <main className={styles.page} data-testid="skill-detail-page">
      <SkillDetailHeader
        specializationId={specializationId}
        specializationName={detail.specializationName}
        skill={detail.skill}
      />
      <SkillRuleSection rule={detail.skill.rule} />
      <SkillScriptsSection
        scripts={detail.skill.scripts}
        activeScript={detail.activeScript}
        scriptContent={detail.scriptContent}
        scriptLoading={detail.scriptLoading}
        scriptError={detail.scriptError}
        onSelectScript={detail.setActiveScript}
        onScriptRetry={detail.handleScriptRetry}
      />
    </main>
  );
};
