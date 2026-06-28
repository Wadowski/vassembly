import { config } from '@vassembly/config';

interface BuildVerificationUrlParams {
  token: string;
}

export const buildVerificationUrl = ({ token }: BuildVerificationUrlParams): string | null => {
  const base = config.apps.web.emailVerificationUrl?.trim() ?? '';
  if (!base) {
    return null;
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};
