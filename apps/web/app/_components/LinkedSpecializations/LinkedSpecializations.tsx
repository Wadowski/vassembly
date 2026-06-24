'use client';

import Link from 'next/link';

import { useLinkedSpecializations } from '@vassembly/ui-api-hooks';
import { Tag } from '@vassembly/ui-tag';

import styles from './LinkedSpecializations.module.scss';
import type { LinkedSpecializationsProps, LinkedSpecializationsViewProps } from './types';

export const LinkedSpecializationsView = ({
  specializationIds,
  isAdmin,
  linked,
}: LinkedSpecializationsViewProps): JSX.Element | null => {
  if (specializationIds.length === 0) {
    return null;
  }

  if (linked.loading && linked.specializations.length === 0) {
    return null;
  }

  if (linked.specializations.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Linked specializations">
      <div className={styles.tags}>
        {linked.specializations.map((specialization) => {
          const tag = (
            <Tag size="small" variant="default">
              {specialization.name}
            </Tag>
          );

          if (isAdmin) {
            return (
              <Link
                key={specialization.id}
                href={`/specialization/${specialization.id}`}
                className={styles.tagLink}
              >
                {tag}
              </Link>
            );
          }

          return (
            <span key={specialization.id} className={styles.tag}>
              {tag}
            </span>
          );
        })}
      </div>
    </section>
  );
};

export const LinkedSpecializations = ({
  specializationIds,
  isAdmin,
}: LinkedSpecializationsProps): JSX.Element | null => {
  const linked = useLinkedSpecializations({ ids: specializationIds });

  return (
    <LinkedSpecializationsView
      specializationIds={specializationIds}
      isAdmin={isAdmin}
      linked={linked}
    />
  );
};
