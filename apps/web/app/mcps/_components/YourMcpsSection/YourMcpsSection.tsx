'use client';

import { Skeleton } from '@vassembly/ui-system-design/skeleton';
import { Text } from '@vassembly/ui-system-design/text';

import { McpListItem } from '../McpListItem/McpListItem';

import { YOUR_MCPS_EMPTY_MESSAGE } from './constants';
import styles from './YourMcpsSection.module.scss';
import { useYourMcpsSection } from './useYourMcpsSection';

/**
 * Section showing MCPs the user has already configured.
 */
export const YourMcpsSection = (): JSX.Element | null => {
  const section = useYourMcpsSection();

  if (section.loading) {
    return (
      <div data-testid="your-mcps-skeleton" className={styles.skeletonGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={styles.skeletonCard}>
            <Skeleton width="60%" height="24px" />
            <Skeleton width="100%" height="48px" />
            <Skeleton width="80%" height="20px" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={styles.section} aria-label="YOUR MCPs" role="region">
      <Text variant="h2" as="h2">YOUR MCPs</Text>
      {section.isEmpty ? (
        <Text variant="body2" className={styles.emptyMessage}>{YOUR_MCPS_EMPTY_MESSAGE}</Text>
      ) : (
        <div className={styles.grid} data-testid="your-mcps-grid" data-columns="3">
          {section.configuredMcps.map((mcp) => (
            <McpListItem key={mcp.id} mcp={mcp} statusBadge="configured" iconSize={section.iconSize} />
          ))}
        </div>
      )}
    </section>
  );
};
