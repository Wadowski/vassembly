import { NavigationMenuIcon } from '@vassembly/ui-system-design/icons';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './MenuTriggerCTA.module.scss';
import type { MenuTriggerCTAProps } from './types';

const DEFAULT_MENU_LABEL = 'Open menu';

export const MenuTriggerCTA = (props: MenuTriggerCTAProps): JSX.Element => {
  const { onPress, isExpanded, controlsId, className, ariaLabel } = props;

  const label = ariaLabel ?? DEFAULT_MENU_LABEL;

  return (
    <button
      type="button"
      className={resolveClassName(styles.button, className)}
      aria-expanded={isExpanded}
      aria-label={label}
      {...(controlsId && { 'aria-controls': controlsId })}
      onClick={onPress}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <NavigationMenuIcon className={styles.icon} />
      </span>
    </button>
  );
};

MenuTriggerCTA.displayName = 'MenuTriggerCTA';
