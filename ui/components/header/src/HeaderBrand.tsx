import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './HeaderBrand.module.scss';
import type { HeaderBrandProps } from './types';

export const HeaderBrand = (props: HeaderBrandProps): JSX.Element => {
  const { children, className } = props;

  return <div className={resolveClassName(styles.brand, className)}>{children}</div>;
};

HeaderBrand.displayName = 'HeaderBrand';
