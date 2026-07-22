import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { ArrowDownIcon } from '@vassembly/ui-system-design/icons';
import type { NavGroupItem } from '../types';
import styles from './NavCollapsibleGroup.module.scss';

export interface NavCollapsibleGroupProps {
  item: NavGroupItem;
  isExpanded: boolean;
  onToggle: (args: { groupId: string }) => void;
  panelId: string;
  isReducedMotion: boolean;
  children: React.ReactNode;
}

export const NavCollapsibleGroup = (props: NavCollapsibleGroupProps): JSX.Element => {
  const { item, isExpanded, onToggle, panelId, isReducedMotion, children } = props;
  const headerId = `${item.id}-header`;

  return (
    <li className={styles.groupRoot}>
      <button
        type="button"
        id={headerId}
        className={styles.header}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => {
          onToggle({ groupId: item.id });
        }}
      >
        <span className={styles.icon} aria-hidden>
          {item.icon && <item.icon />}
        </span>
        <span className={styles.label}>{item.label}</span>
        <span className={resolveClassName(styles.chevron, isExpanded ? styles.chevronOpen : styles.chevronClosed)} aria-hidden>
          <ArrowDownIcon />
        </span>
      </button>
      <div
        className={resolveClassName(
          styles.body,
          isExpanded ? styles.bodyOpen : styles.bodyClosed,
          isReducedMotion && styles.bodyReduced,
        )}
      >
        <div className={styles.bodyInner}>
          <ul id={panelId} className={styles.nestedList}>
            {children}
          </ul>
        </div>
      </div>
    </li>
  );
};

NavCollapsibleGroup.displayName = 'NavCollapsibleGroup';
