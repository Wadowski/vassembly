import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { resolveClassName } from '@vassembly/ui-utils';
import { Snackbar } from './Snackbar';
import styles from './Snackbar.module.scss';
import type {
  SnackbarContextValue,
  SnackbarItem,
  SnackbarPosition,
  SnackbarProviderProps,
  SnackbarVariant,
} from './types';

export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);
SnackbarContext.displayName = 'SnackbarContext';

const DEFAULT_POSITION: SnackbarPosition = 'bottom-center';
const DEFAULT_MAX_VISIBLE = 5;
const DEFAULT_DURATION_MS = 4000;
const DEFAULT_VARIANT: SnackbarVariant = 'info';

const POSITION_CLASS_MAP: Record<SnackbarPosition, string> = {
  'top-left': styles.positionTopLeft,
  'top-center': styles.positionTopCenter,
  'top-right': styles.positionTopRight,
  'bottom-left': styles.positionBottomLeft,
  'bottom-center': styles.positionBottomCenter,
  'bottom-right': styles.positionBottomRight,
};

export const SnackbarProvider = ({
  children,
  position = DEFAULT_POSITION,
  maxVisible = DEFAULT_MAX_VISIBLE,
}: SnackbarProviderProps) => {
  const [items, setItems] = useState<SnackbarItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutByIdRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const idCounterRef = useRef(0);
  const maxVisibleRef = useRef(maxVisible);

  useEffect(() => {
    maxVisibleRef.current = maxVisible;
  }, [maxVisible]);

  const dismiss = useCallback((id: string): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const existingTimeout = timeoutByIdRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutByIdRef.current.delete(id);
    }
  }, []);

  const getNextId = useCallback((): string => {
    const maybeCrypto = typeof globalThis === 'undefined' ? undefined : (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
      return maybeCrypto.randomUUID();
    }
    idCounterRef.current += 1;
    return `snackbar-${idCounterRef.current}`;
  }, []);

  const show = useCallback(
    (item: Omit<SnackbarItem, 'id'>): void => {
      const id = getNextId();
      const variant = item.variant ?? DEFAULT_VARIANT;
      const durationMs = item.duration ?? DEFAULT_DURATION_MS;
      const isDismissible = item.isDismissible ?? false;

      const nextItem: SnackbarItem = {
        id,
        message: item.message,
        variant,
        duration: durationMs,
        isDismissible,
      };

      setItems((prev) => {
        const combined = [...prev, nextItem];
        const maxVisibleValue = maxVisibleRef.current;

        if (combined.length <= maxVisibleValue) return combined;

        const excess = combined.length - maxVisibleValue;
        const removed = combined.slice(0, excess);
        for (const removedItem of removed) {
          const existingTimeout = timeoutByIdRef.current.get(removedItem.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            timeoutByIdRef.current.delete(removedItem.id);
          }
        }
        return combined.slice(excess);
      });

      if (durationMs > 0) {
        const timeoutId = setTimeout(() => {
          dismiss(id);
        }, durationMs);
        timeoutByIdRef.current.set(id, timeoutId);
      }
    },
    [dismiss, getNextId],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutByIdRef.current.values()) {
        clearTimeout(timeoutId);
      }
      timeoutByIdRef.current.clear();
    };
  }, []);

  const contextValue = useMemo<SnackbarContextValue>(
    () => ({
      show,
      dismiss,
    }),
    [show, dismiss],
  );

  const positionClass = POSITION_CLASS_MAP[position];

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      {isMounted
        ? ReactDOM.createPortal(
            <div role="region" aria-label="Notifications" aria-live="polite" className={resolveClassName(styles.provider, positionClass)}>
              {items.map((item) => (
                <Snackbar
                  key={item.id}
                  message={item.message}
                  variant={item.variant ?? DEFAULT_VARIANT}
                  isDismissible={item.isDismissible ?? false}
                  onDismiss={() => dismiss(item.id)}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </SnackbarContext.Provider>
  );
};

