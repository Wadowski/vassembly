'use client';

import { Skeleton } from '@vassembly/ui-system-design/skeleton';

import pageStyles from './TaskDetailPage.module.scss';

const DESCRIPTION_LINE_WIDTHS = ['100%', '95%', '90%', '60%'] as const;

export const TaskDetailSkeleton = (): JSX.Element => {
  return (
    <main
      className={pageStyles.pageStack}
      aria-busy="true"
      data-testid="task-detail-skeleton"
    >
      <header className={pageStyles.sectionStack}>
        <Skeleton width="140px" height="20px" />
        <Skeleton width="70%" height="32px" borderRadius="0.375rem" />
      </header>
      <article className={pageStyles.contentColumn}>
        <section className={pageStyles.sectionStack}>
          <Skeleton width="120px" height="16px" />
          <div className={pageStyles.descriptionSkeletonLines}>
            {DESCRIPTION_LINE_WIDTHS.map((width) => (
              <Skeleton key={width} width={width} height="16px" />
            ))}
          </div>
        </section>
        <div className={pageStyles.sectionCard}>
          <Skeleton width="80px" height="16px" />
          <div className={pageStyles.metadataList}>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={pageStyles.metadataRow}>
                <Skeleton width="80px" height="16px" />
                <Skeleton width="60%" height="16px" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
};
