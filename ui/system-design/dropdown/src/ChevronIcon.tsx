import type React from 'react';
import { className as uiClassName } from '@vassembly/ui-utils';
import styles from './Dropdown.module.scss';
import type { ChevronIconProps } from './types';

export const ChevronIcon = ({ isOpen, className, ...props }: ChevronIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden
    className={uiClassName(styles.chevron, isOpen && styles.chevronOpen, className)}
    {...props}
  >
    <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
  </svg>
);

ChevronIcon.displayName = 'ChevronIcon';

