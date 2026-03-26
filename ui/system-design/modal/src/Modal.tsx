import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ModalContent } from './ModalContent';
import { ModalOverlay } from './ModalOverlay';
import styles from './Modal.module.scss';
import type { ModalProps } from './types';

export const Modal = (props: ModalProps): JSX.Element | null => {
  const { isOpen, onClose, children, title, className, size = 'md' } = props;

  const handleEscape = useCallback((event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleOverlayClose = (): void => {
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.root}>
      <ModalOverlay onClick={handleOverlayClose} />
      <ModalContent title={title} onClose={onClose} size={size} className={className}>
        {children}
      </ModalContent>
    </div>,
    document.body,
  );
};

Modal.displayName = 'Modal';
