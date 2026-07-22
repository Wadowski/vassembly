import { useContext } from 'react';
import type { SnackbarContextValue } from './types';
import { SnackbarContext } from './SnackbarProvider';

export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

