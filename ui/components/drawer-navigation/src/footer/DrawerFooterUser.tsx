import { useState } from 'react';
import { CogIcon, LogoutIcon } from '@vassembly/ui-system-design/icons';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import { Text } from '@vassembly/ui-system-design/text';
import { Menu, MenuItem } from '@vassembly/ui-system-design/menu';
import type { DrawerUser } from '../types';
import styles from './DrawerFooterUser.module.scss';

export interface DrawerFooterUserProps {
  user: DrawerUser;
  onSettings: () => void;
  onLogout: () => void;
  className?: string;
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
  const { user, onSettings, onLogout, className } = props;
  const initials = buildInitials(user);

  return (
    <div
      className={resolveClassName(
        styles.root,
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
            <Text variant="body1">{initials}</Text>
          )}
        </div>
        <div className={styles.meta}>
          <Text variant="body1">{user.displayName}</Text>
          <Text variant="body2">{user.email}</Text>
          {user.roleLabel ? <Text variant="caption">{user.roleLabel}</Text> : null}
        </div>
      </div>
      <Menu
        mode="single"
        ariaLabel="Account actions"
      >
        <MenuItem
          itemKey="settings"
          icon={<CogIcon />}
          onClick={onSettings}
        >
          Settings
        </MenuItem>
        <MenuItem
          itemKey="logout"
          icon={<LogoutIcon />}
          onClick={onLogout}
          className={styles.logout}
        >
          Log out
        </MenuItem>
      </Menu>
    </div>
  );
};

DrawerFooterUser.displayName = 'DrawerFooterUser';
