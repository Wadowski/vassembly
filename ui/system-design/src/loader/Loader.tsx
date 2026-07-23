import { Children, useId } from 'react';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Loader.module.scss';
import type { LoaderProps } from './types';

export const Loader = ({
  ariaLabel,
  children,
  className,
  ...props
}: LoaderProps) => {
  const rootClassName = resolveClassName(styles.loader, className);
  const statusLabelId = useId();

  if (Children.count(children) > 0) {
    return (
      <div
        {...props}
        role="status"
        aria-labelledby={statusLabelId}
        className={rootClassName}
      >
        <span id={statusLabelId} className={styles.visuallyHidden}>
          {children}
        </span>
        <span className={styles.spinner} aria-hidden />
      </div>
    );
  }

  return (
    <div
      {...props}
      role="status"
      aria-label={ariaLabel ?? 'Loading'}
      className={rootClassName}
    >
      <span className={styles.spinner} aria-hidden />
    </div>
  );
};
