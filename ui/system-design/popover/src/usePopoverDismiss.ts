import { useEffect, type RefObject } from 'react';

export type UsePopoverDismissParams = {
  isEnabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
};

export const usePopoverDismiss = (params: UsePopoverDismissParams): void => {
  const { isEnabled, containerRef, onDismiss } = params;

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handlePointerDown = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        return;
      }
      onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, containerRef, onDismiss]);
};
