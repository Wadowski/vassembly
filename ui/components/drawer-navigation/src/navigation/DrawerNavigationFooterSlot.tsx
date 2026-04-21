import { DrawerFooterAuth } from '../footer/DrawerFooterAuth';
import { DrawerFooterUser } from '../footer/DrawerFooterUser';
import type { DrawerUser } from '../types';

export interface DrawerNavigationFooterSlotProps {
  isAuthenticated: boolean;
  user?: DrawerUser;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
}

export const DrawerNavigationFooterSlot = (
  props: DrawerNavigationFooterSlotProps,
): JSX.Element => {
  const { isAuthenticated, user, onOpenSettings, onLogout, onLogin, onRegister } =
    props;

  if (isAuthenticated && user) {
    return (
      <DrawerFooterUser
        user={user}
        onSettings={() => {
          onOpenSettings?.();
        }}
        onLogout={() => {
          onLogout?.();
        }}
      />
    );
  }

  return (
    <DrawerFooterAuth
      onLogin={() => {
        onLogin?.();
      }}
      onRegister={() => {
        onRegister?.();
      }}
    />
  );
};

DrawerNavigationFooterSlot.displayName = 'DrawerNavigationFooterSlot';
