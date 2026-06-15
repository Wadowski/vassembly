import { useEffect, useState } from 'react';

const RELATIVE_TIME_UPDATE_INTERVAL = 60000;

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h ago`;
  }

  const days = Math.floor(seconds / 86400);
  return `${days}d ago`;
};

interface UseRelativeTimeResult {
  relativeTime: string;
}

export const useRelativeTime = (date: Date | null): UseRelativeTimeResult => {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    if (!date) return;

    setRelativeTime(getRelativeTime(date));

    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(date));
    }, RELATIVE_TIME_UPDATE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [date]);

  return { relativeTime };
};
