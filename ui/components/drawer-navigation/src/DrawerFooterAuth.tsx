import { Button } from '@vassembly/ui-button';
import { resolveClassName } from '@vassembly/ui-utils';
import type { DrawerFooterVariant } from './types';
import styles from './DrawerFooterAuth.module.scss';

export interface DrawerFooterAuthProps {
  onLogin: () => void;
  onRegister: () => void;
  className?: string;
  variant?: DrawerFooterVariant;
}

export const DrawerFooterAuth = (props: DrawerFooterAuthProps): JSX.Element => {
  const { onLogin, onRegister, className, variant = 'solid' } = props;

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
      <Button
        text="Log in"
        color="primary"
        variant="contained"
        size="medium"
        isFullWidth
        type="button"
        onClick={onLogin}
      />
      <button type="button" className={styles.register} onClick={onRegister}>
        Register
      </button>
    </div>
  );
};

DrawerFooterAuth.displayName = 'DrawerFooterAuth';
