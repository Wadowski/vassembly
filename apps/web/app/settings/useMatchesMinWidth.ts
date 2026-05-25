'use client';

import { useEffect, useState } from 'react';

export const SETTINGS_DESKTOP_MIN_WIDTH_MEDIA = '(min-width: 1024px)';

export const useMatchesMinWidth = (customQuery?: string): boolean => {
  const query = customQuery ?? SETTINGS_DESKTOP_MIN_WIDTH_MEDIA;
  const [matchesQuery, setMatchesQuery] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    const applyMatch = (): void => {
      setMatchesQuery(mediaQueryList.matches);
    };

    applyMatch();
    mediaQueryList.addEventListener('change', applyMatch);

    return (): void => {
      mediaQueryList.removeEventListener('change', applyMatch);
    };
  }, [query]);

  return matchesQuery;
};
