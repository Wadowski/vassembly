export const formatRelativeTime = (value: string | Date): string => {
  const now = new Date();
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, 'second');
  }
  if (diffSeconds < 3600) {
    return rtf.format(-Math.floor(diffSeconds / 60), 'minute');
  }
  if (diffSeconds < 86400) {
    return rtf.format(-Math.floor(diffSeconds / 3600), 'hour');
  }
  if (diffSeconds < 604800) {
    return rtf.format(-Math.floor(diffSeconds / 86400), 'day');
  }

  return rtf.format(-Math.floor(diffSeconds / 604800), 'week');
};
