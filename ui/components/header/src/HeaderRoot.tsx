import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './HeaderRoot.module.scss';
import type { HeaderRootProps } from './types';

export const HeaderRoot = (props: HeaderRootProps): JSX.Element => {
  const { children, className, id, isSticky } = props;

  return (
    <header
      id={id}
      className={resolveClassName(styles.root, isSticky && styles.rootSticky, className)}
    >
      <div className={styles.inner}>{children}</div>
    </header>
  );
};

HeaderRoot.displayName = 'HeaderRoot';
