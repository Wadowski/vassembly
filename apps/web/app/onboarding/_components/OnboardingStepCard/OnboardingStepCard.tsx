'use client';

import { CheckIcon, LockIcon } from '@vassembly/ui-icons';
import { Text } from '@vassembly/ui-text';

import type { OnboardingStepCardProps, OnboardingStepStatus } from './types';
import styles from './OnboardingStepCard.module.scss';

const STATUS_BADGE_LABEL: Record<OnboardingStepStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  locked: 'Locked',
  active: 'In progress',
  done: 'Done',
};

const resolveCardClassName = ({
  status,
  isLocked,
}: {
  status: OnboardingStepStatus;
  isLocked: boolean;
}): string => {
  const classes = [styles.card];

  if (status === 'done' || status === 'verified') {
    classes.push(styles.cardDone);
    return classes.join(' ');
  }

  if (isLocked || status === 'locked') {
    classes.push(styles.cardLocked);
    return classes.join(' ');
  }

  if (status === 'pending' || status === 'active') {
    classes.push(styles.cardActive);
  }

  return classes.join(' ');
};

const resolveStepCircleClassName = ({
  status,
  isLocked,
}: {
  status: OnboardingStepStatus;
  isLocked: boolean;
}): string => {
  const classes = [styles.stepCircle];

  if (status === 'verified' || status === 'done') {
    classes.push(styles.stepCircleDone);
    return classes.join(' ');
  }

  if (isLocked || status === 'locked') {
    classes.push(styles.stepCircleLocked);
    return classes.join(' ');
  }

  if (status === 'pending' || status === 'active') {
    classes.push(styles.stepCircleActive);
  }

  return classes.join(' ');
};

const resolveBadgeClassName = (status: OnboardingStepStatus): string => {
  const badgeClassByStatus: Record<OnboardingStepStatus, string | undefined> = {
    pending: styles.badgePending,
    verified: styles.badgeVerified,
    locked: styles.badgeLocked,
    active: styles.badgeActive,
    done: styles.badgeDone,
  };

  const statusClassName = badgeClassByStatus[status] ?? '';
  return `${styles.badge ?? ''} ${statusClassName}`.trim();
};

const resolveStepIndicator = ({
  stepNumber,
  status,
  isLocked,
}: {
  stepNumber: 1 | 2;
  status: OnboardingStepStatus;
  isLocked: boolean;
}): JSX.Element => {
  if (status === 'verified' || status === 'done') {
    return <CheckIcon aria-hidden />;
  }

  if (isLocked || status === 'locked') {
    return <LockIcon aria-hidden />;
  }

  return <span>{stepNumber}</span>;
};

export const OnboardingStepCard = ({
  stepNumber,
  title,
  description,
  status,
  isLocked,
  body,
  footer,
}: OnboardingStepCardProps): JSX.Element => {
  const cardClassName = resolveCardClassName({ status, isLocked });
  const stepCircleClassName = resolveStepCircleClassName({ status, isLocked });
  const badgeClassName = resolveBadgeClassName(status);

  return (
    <article className={cardClassName} aria-labelledby={`onboarding-step-${stepNumber}-title`}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={stepCircleClassName} aria-hidden>
            {resolveStepIndicator({ stepNumber, status, isLocked })}
          </div>
          <div className={styles.titleBlock}>
            <Text variant="h3" as="h2" id={`onboarding-step-${stepNumber}-title`}>
              {title}
            </Text>
            <Text variant="body2">{description}</Text>
          </div>
        </div>
        <span className={badgeClassName}>{STATUS_BADGE_LABEL[status]}</span>
      </header>
      <div className={styles.body}>{body}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </article>
  );
};
