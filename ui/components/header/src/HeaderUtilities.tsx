import { resolveClassName } from '@vassembly/ui-utils';
import styles from './HeaderUtilities.module.scss';
import type { HeaderUtilitiesProps } from './types';

export const HeaderUtilities = (props: HeaderUtilitiesProps): JSX.Element | null => {
  const { children, className } = props;

  return <div className={resolveClassName(styles.utilities, className)}>{children}</div>;
};

HeaderUtilities.displayName = 'HeaderUtilities';
