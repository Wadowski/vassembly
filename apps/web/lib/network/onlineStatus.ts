export const resolveOfflineRestrictionMessage = (): string | undefined => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear offline. Connect to the internet before saving.';
  }
  return undefined;
};
