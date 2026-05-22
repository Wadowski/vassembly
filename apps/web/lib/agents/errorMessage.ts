export const getRequestErrorMessage = (error: unknown, fallback: string): string => {
  if (error) {
    return (error as { message: string }).message;
  }
  return fallback;
};
