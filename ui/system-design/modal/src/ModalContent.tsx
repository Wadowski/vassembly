import { useId } from 'react';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Modal.module.scss';
import type { ModalContentProps } from './types';

export const ModalContent = (props: ModalContentProps): JSX.Element => {
  const { children, title, onClose, size = 'md', className, ...rest } = props;

  const titleId = useId();
  const labelledBy = title ? titleId : undefined;

  const handleClose = (): void => {
    onClose();
  };

  const sizeClass =
    size === 'sm' ? styles.contentSm : size === 'lg' ? styles.contentLg : styles.contentMd;

  const contentClassName = resolveClassName(styles.content, sizeClass, className);

  return (
    <div
      {...rest}
      className={contentClassName}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className={styles.header}>
        {title ? (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        ) : (
          <span className={styles.headerSpacer} aria-hidden="true" />
        )}
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};

ModalContent.displayName = 'ModalContent';
