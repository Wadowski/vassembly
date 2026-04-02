import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Menu.module.scss';
import type { MenuGroupProps } from './types';

export const MenuGroup = ({ title, children }: MenuGroupProps): JSX.Element => {
  return (
    <div role="group" className={styles.group}>
      {title ? (
        <div className={resolveClassName(styles.groupTitle)}>
          <Text variant="label" as="div">
            {title}
          </Text>
        </div>
      ) : null}
      {children}
    </div>
  );
};
