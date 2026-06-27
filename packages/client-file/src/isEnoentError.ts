export const isEnoentError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as NodeJS.ErrnoException).code === 'ENOENT';
};
