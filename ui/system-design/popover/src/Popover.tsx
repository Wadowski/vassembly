import {
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Popover.module.scss';
import type { PopoverProps } from './types';
import { usePopoverDismiss } from './usePopoverDismiss';

export const Popover = (props: PopoverProps): JSX.Element => {
  const {
    trigger,
    children,
    placement = 'bottom',
    isOpen: isOpenProp,
    onOpenChange,
    className,
    triggerClassName,
  } = props;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const open = isControlled ? Boolean(isOpenProp) : internalOpen;

  const setOpen = useCallback(
    (next: boolean): void => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  const handleDismiss = useCallback((): void => {
    setOpen(false);
  }, [setOpen]);

  usePopoverDismiss({
    isEnabled: open,
    containerRef,
    onDismiss: handleDismiss,
  });

  const handleTriggerActivate = useCallback((): void => {
    setOpen(!open);
  }, [open, setOpen]);

  const rootClassName = resolveClassName(styles.root, triggerClassName);

  const renderTrigger = (): JSX.Element => {
    if (!isValidElement(trigger)) {
      return <>{trigger}</>;
    }

    const element = trigger as ReactElement<{
      onClick?: (event: MouseEvent<HTMLElement>) => void;
      onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
    }>;

    return cloneElement(element, {
      'aria-controls': panelId,
      'aria-expanded': open,
      'aria-haspopup': 'dialog',
      onClick: (event: MouseEvent<HTMLElement>): void => {
        element.props.onClick?.(event);
        if (!event.defaultPrevented) {
          handleTriggerActivate();
        }
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>): void => {
        element.props.onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleTriggerActivate();
        }
      },
      ref: (element as ReactElement & { ref?: React.Ref<HTMLElement | null> }).ref,
    });
  };

  const panelClassName = resolveClassName(styles.panel, className);

  return (
    <div ref={containerRef} className={rootClassName}>
      {renderTrigger()}
      <div
        id={panelId}
        role="dialog"
        aria-modal={false}
        data-placement={placement}
        data-state={open ? 'open' : 'closed'}
        className={panelClassName}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
};

Popover.displayName = 'Popover';
