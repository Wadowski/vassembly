import { useCallback, useEffect, useRef, useState } from 'react';

interface UseModalStateOptions {
  onClose?: () => void;
}

interface UseModalStateResult {
  isOpen: boolean;
  selectedEventId: string | null;
  openModal: (eventId: string) => void;
  closeModal: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export const useModalState = (options?: UseModalStateOptions): UseModalStateResult => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedEventId(null);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
    options?.onClose?.();
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeModal]);

  return {
    isOpen,
    selectedEventId,
    openModal,
    closeModal,
    triggerRef,
  };
};
