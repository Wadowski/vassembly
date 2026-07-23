import { Button } from '@vassembly/ui-system-design/button';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './DrawerFooterAuth.module.scss';

export interface DrawerFooterAuthProps {
  onLogin: () => void;
  onRegister: () => void;
  className?: string;
}

export const DrawerFooterAuth = (props: DrawerFooterAuthProps): JSX.Element => {
  const { onLogin, onRegister, className } = props;

  return (
    <div
      className={resolveClassName(
        styles.root,
        className,
      )}
      role="region"
      aria-label="Account"
    >
      <Button
        text="Log in"
        // color="primary"
        // variant="contained"
        // size="medium"
        onClick={onLogin}
      />
      <Button 
        text="Register" 
        color="primary"
        variant="text" 
        size="medium" 
        onClick={onRegister} 
      />
    </div>
  );
};

DrawerFooterAuth.displayName = 'DrawerFooterAuth';
