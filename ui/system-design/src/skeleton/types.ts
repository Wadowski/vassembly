import type { CSSProperties, HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  borderRadius?: CSSProperties['borderRadius'];
  height?: CSSProperties['height'];
  width?: CSSProperties['width'];
}
