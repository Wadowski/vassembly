'use client';

import { useEffect, useState } from 'react';

import { MOBILE_LAYOUT_MEDIA_QUERY } from './constants';

export const useIsMobileLayout = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY);

    const applyMatch = (): void => {
      setIsMobile(mediaQueryList.matches);
    };

    applyMatch();
    mediaQueryList.addEventListener('change', applyMatch);

    return (): void => {
      mediaQueryList.removeEventListener('change', applyMatch);
    };
  }, []);

  return isMobile;
};
