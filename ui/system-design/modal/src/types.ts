import type { HTMLAttributes, ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface ModalOverlayProps {
  onClick: () => void;
  className?: string;
}

export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
}
