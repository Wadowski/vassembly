'use client';

import { Pagination } from '@vassembly/ui-system-design/pagination';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './PanelListFooter.module.scss';

export interface PanelListFooterProps {
  total: number;
  rangeStart: number;
  rangeEnd: number;
  currentPage: number;
  totalPages: number;
  ariaLabel: string;
  onPageChange: (newPage: number) => void;
}

export const PanelListFooter = ({
  total,
  rangeStart,
  rangeEnd,
  currentPage,
  totalPages,
  ariaLabel,
  onPageChange,
}: PanelListFooterProps): JSX.Element | null => {
  if (total === 0) {
    return null;
  }

  return (
    <div className={styles.footer}>
      <Text variant="body2" className={styles.countText}>
        Showing {rangeStart}–{rangeEnd} of {total} total
      </Text>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        ariaLabel={ariaLabel}
      />
    </div>
  );
};
