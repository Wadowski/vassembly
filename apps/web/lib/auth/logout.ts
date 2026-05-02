import { clearTokens } from './sessionStorage';

export const logout = (): void => {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
