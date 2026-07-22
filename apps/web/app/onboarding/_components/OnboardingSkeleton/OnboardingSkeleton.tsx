'use client';

import { Skeleton } from '@vassembly/ui-system-design/skeleton';

import styles from './OnboardingSkeleton.module.scss';

export const OnboardingSkeleton = (): JSX.Element => (
  <main className={styles.container}>
    <div>
      <Skeleton width="280px" height="32px" className={styles.sectionLabel} />
      <Skeleton width="320px" height="20px" />
    </div>
    <div className={styles.layoutSplit}>
      <div className={styles.progressColumn}>
        <div className={styles.stepperSkeleton}>
          {[0, 1].map((index) => (
            <div key={index} className={styles.stepperRow}>
              <Skeleton width="40px" height="40px" className={styles.stepperIcon} />
              <div className={styles.stepperText}>
                <Skeleton width="160px" height="20px" />
                <Skeleton width="100%" height="16px" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.contentColumn}>
        <Skeleton width="100%" height="180px" className={styles.cardSkeleton} />
        <Skeleton width="100%" height="160px" className={styles.cardSkeleton} />
      </div>
    </div>
  </main>
);
