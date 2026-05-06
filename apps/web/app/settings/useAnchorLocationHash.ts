'use client';

import { useEffect, useState } from 'react';

export const useAnchorLocationHash = (): string => {
  const [activeHashToken, setActiveHashToken] = useState('');

  useEffect(() => {
    const synchronizeHash = (): void => {
      if (typeof window === 'undefined') {
        setActiveHashToken('');
        return;
      }
      setActiveHashToken(window.location.hash);
    };

    synchronizeHash();

    window.addEventListener('hashchange', synchronizeHash);

    return (): void => window.removeEventListener('hashchange', synchronizeHash);
  }, []);

  return activeHashToken;
};
