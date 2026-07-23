'use client';

import { useState } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './ExpandableText.module.scss';
import { shouldOfferExpand } from './shouldOfferExpand';

export interface ExpandableTextProps {
  text: string;
  testId?: string;
  variant?: 'plain' | 'pre';
}

export const ExpandableText = ({
  text,
  testId,
  variant = 'plain',
}: ExpandableTextProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = shouldOfferExpand({ text });

  const bodyClassName = isExpanded ? styles.body : `${styles.body} ${styles.bodyClamped}`;

  return (
    <div className={styles.wrapper} data-testid={testId}>
      {variant === 'pre' ? (
        <pre className={bodyClassName}>{text}</pre>
      ) : (
        <Text variant="body1" className={bodyClassName}>
          {text}
        </Text>
      )}
      {canExpand ? (
        <Button
          variant="text"
          color="primary"
          text={isExpanded ? 'Show less' : 'Show more'}
          onClick={() => {
            setIsExpanded((current) => !current);
          }}
          data-testid={testId ? `${testId}-toggle` : 'expandable-text-toggle'}
        />
      ) : null}
    </div>
  );
};
