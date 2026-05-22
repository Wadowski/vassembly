'use client';

import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setDebounced(value), delayMs);
    return (): void => {
      clearTimeout(timerId);
    };
  }, [value, delayMs]);

  return debounced;
};
