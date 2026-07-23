import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export type AccordionVariant = 'default' | 'bordered' | 'flush';
export type AccordionType = 'single' | 'multiple';

type AccordionBaseProps = {
  children?: ReactNode;
  className?: string;
  variant?: AccordionVariant;
};

export type AccordionMultipleProps = AccordionBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    type?: 'multiple';
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    value?: string[];
  };

export type AccordionSingleProps = AccordionBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    type: 'single';
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    value?: string | null;
  };

export type AccordionProps = AccordionMultipleProps | AccordionSingleProps;

export type AccordionItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children?: ReactNode;
  disabled?: boolean;
  value: string;
};

export type AccordionTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> & {
  children?: ReactNode;
};

export type AccordionPanelProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};
