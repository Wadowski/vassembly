import { CogIcon, LogoutIcon } from '@vassembly/ui-icons';
import { resolveClassName } from '@vassembly/ui-utils';
import { Text } from '@vassembly/ui-text';
import type { DrawerFooterVariant, DrawerUser } from './types';
import styles from './DrawerFooterUser.module.scss';

export interface DrawerFooterUserProps {
  user: DrawerUser;
  onSettings: () => void;
  onLogout: () => void;
  className?: string;
  variant?: DrawerFooterVariant;
}

const buildInitials = (user: DrawerUser): string => {
  if (user.initials) {
    return user.initials;
  }

  const parts = user.displayName.trim().split(/\s+/u);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';

  return `${first}${second}`.toUpperCase();
};

export const DrawerFooterUser = (props: DrawerFooterUserProps): JSX.Element => {
  const { user, onSettings, onLogout, className, variant = 'solid' } = props;
  const initials = buildInitials(user);

  return (
    <div
      className={resolveClassName(
        styles.root,
        variant === 'glass' && styles.rootGlass,
        className,
      )}
      role="region"
      aria-label="Account"
    >
      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden={Boolean(user.avatarUrl)}>
          {user.avatarUrl ? (
            <img className={styles.avatarImg} src={user.avatarUrl} alt="" />
          ) : (
            initials
          )}
        </div>
        <div className={styles.meta}>
          <p className={styles.name}>{user.displayName}</p>
          <p className={styles.email}>{user.email}</p>
          {user.roleLabel ? <p className={styles.role}>{user.roleLabel}</p> : null}
        </div>
      </div>
      <button type="button" className={styles.row} onClick={onSettings}>
        <span className={styles.rowIcon}>
          <CogIcon />
        </span>
        <Text variant="body1">Settings</Text>
      </button>
      <button type="button" className={resolveClassName(styles.row, styles.logout)} onClick={onLogout}>
        <span className={styles.rowIcon}>
          <LogoutIcon />
        </span>
        <Text variant="body1">Log out</Text>
      </button>
    </div>
  );
};

DrawerFooterUser.displayName = 'DrawerFooterUser';
