import { DrawerFooterAuth } from './DrawerFooterAuth';
import { DrawerFooterUser } from './DrawerFooterUser';
import type { DrawerFooterVariant, DrawerUser } from './types';

export interface DrawerNavigationFooterSlotProps {
  isAuthenticated: boolean;
  user?: DrawerUser;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  footerVariant?: DrawerFooterVariant;
}

export const DrawerNavigationFooterSlot = (
  props: DrawerNavigationFooterSlotProps,
): JSX.Element => {
  const { isAuthenticated, user, onOpenSettings, onLogout, onLogin, onRegister, footerVariant } =
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
        variant={footerVariant}
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
      variant={footerVariant}
    />
  );
};

DrawerNavigationFooterSlot.displayName = 'DrawerNavigationFooterSlot';
