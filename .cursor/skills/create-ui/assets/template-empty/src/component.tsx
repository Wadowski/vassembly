import styles from './component.module.css';
import { ComponentProps } from './types';

export const Component = ({ children }: ComponentProps) => {
  return (
    <div className={styles.root}>
      {children}
    </div>
  );
};
