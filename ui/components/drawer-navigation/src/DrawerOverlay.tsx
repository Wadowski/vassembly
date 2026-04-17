import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { resolveClassName } from '@vassembly/ui-utils';
import type { DrawerOpenChangeEvent, DrawerOverlayCloseReason } from './types';
import styles from './DrawerOverlay.module.scss';

export interface DrawerOverlayProps {
  isOpen: boolean;
  onOpenChange: (event: DrawerOpenChangeEvent) => void;
  openerRef?: RefObject<HTMLElement | null>;
  className?: string;
  scrimClassName?: string;
  isReducedMotion: boolean;
  children: ReactNode;
}

export const DrawerOverlay = (props: DrawerOverlayProps): JSX.Element | null => {
  const { isOpen, onOpenChange, openerRef, className, scrimClassName, isReducedMotion, children } = props;
  const wasOpenRef = useRef(false);

  const emitClose = useCallback(
    (reason: DrawerOverlayCloseReason): void => {
      onOpenChange({ isOpen: false, reason });
    },
    [onOpenChange],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        emitClose('escape');
      }
    };
    if (!isOpen) {
      return undefined;
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, emitClose]);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen && openerRef?.current) {
      openerRef.current.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, openerRef]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={resolveClassName(styles.root, className)} role="presentation">
      <button
        type="button"
        className={resolveClassName(styles.scrim, styles.scrimVisible, scrimClassName)}
        aria-label="Close navigation"
        onClick={() => {
          emitClose('scrim');
        }}
      />
      <div
        className={resolveClassName(
          styles.panel,
          styles.panelOpen,
          isReducedMotion && styles.panelReduced,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

DrawerOverlay.displayName = 'DrawerOverlay';
