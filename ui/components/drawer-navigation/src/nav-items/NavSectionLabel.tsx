import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './NavSectionLabel.module.scss';

export interface NavSectionLabelProps {
  children: string;
  className?: string;
  id?: string;
}

export const NavSectionLabel = (props: NavSectionLabelProps): JSX.Element => {
  const { children, className, id } = props;
  return (
    <p id={id} className={resolveClassName(styles.root, className)}>
      {children}
    </p>
  );
};

NavSectionLabel.displayName = 'NavSectionLabel';
