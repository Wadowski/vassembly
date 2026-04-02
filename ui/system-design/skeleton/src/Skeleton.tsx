import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import styles from './Skeleton.module.scss';
import type { SkeletonProps } from './types';

const DEFAULT_WIDTH = '100%';
const DEFAULT_HEIGHT = '1rem';

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      borderRadius: borderRadiusProp,
      className,
      height: heightProp,
      style,
      width: widthProp,
      ...rest
    },
    ref,
  ) => {
    const resolvedStyle: CSSProperties = {
      width: widthProp ?? DEFAULT_WIDTH,
      height: heightProp ?? DEFAULT_HEIGHT,
      ...(borderRadiusProp !== undefined ? { borderRadius: borderRadiusProp } : {}),
      ...style,
    };

    const rootClassName = [styles.root, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={rootClassName} style={resolvedStyle} {...rest} />
    );
  },
);

Skeleton.displayName = 'Skeleton';
