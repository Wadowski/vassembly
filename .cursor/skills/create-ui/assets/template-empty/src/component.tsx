import { forwardRef } from 'react';
import styles from './Component.module.scss';
import { ComponentProps } from './types';

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ children, className, ...props }, ref) => {
    const componentClassName = [styles.root, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={componentClassName} {...props}>
        {children}
      </div>
    );
  },
);

Component.displayName = 'Component';
