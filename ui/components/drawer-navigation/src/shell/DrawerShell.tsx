import type { ReactNode } from 'react';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './DrawerShell.module.scss';

export interface DrawerShellProps {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const DrawerShell = (props: DrawerShellProps): JSX.Element => {
  const { header, children, footer, className, contentClassName } = props;

  return (
    <div className={resolveClassName(styles.root, className)}>
      {header}
      <div className={resolveClassName(styles.scroll, contentClassName)}>{children}</div>
      <div className={styles.footer}>{footer}</div>
    </div>
  );
};

DrawerShell.displayName = 'DrawerShell';
