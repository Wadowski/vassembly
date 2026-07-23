import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Menu.module.scss';
import type { MenuDividerProps } from './types';

export const MenuDivider = ({ inset = false }: MenuDividerProps): JSX.Element => {
  const className = resolveClassName(styles.divider, inset ? styles.dividerInset : undefined);
  return <hr role="separator" className={className} />;
};
