import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Modal.module.scss';
import type { ModalOverlayProps } from './types';

export const ModalOverlay = (props: ModalOverlayProps): JSX.Element => {
  const { onClick, className } = props;

  const handleClick = (): void => {
    onClick();
  };

  const overlayClassName = resolveClassName(styles.overlay, className);

  return (
    <div
      className={overlayClassName}
      role="presentation"
      aria-hidden="true"
      onClick={handleClick}
    />
  );
};

ModalOverlay.displayName = 'ModalOverlay';
