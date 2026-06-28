const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0']);

const isPrivateIpv4 = ({ hostname }: { hostname: string }): boolean => {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const a = parts[0];
  const b = parts[1];

  if (a === 10) {
    return true;
  }

  if (a === 127) {
    return true;
  }

  if (a === 169 && b === 254) {
    return true;
  }

  if (a === 172 && b !== undefined && b >= 16 && b <= 31) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  return false;
};

const isPrivateIpv6 = ({ hostname }: { hostname: string }): boolean => {
  const normalized = hostname.toLowerCase();

  if (normalized === '::1') {
    return true;
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  if (normalized.startsWith('fe80')) {
    return true;
  }

  return false;
};

export interface AssertHttpsUrlAllowedParams {
  url: string;
}

export const assertHttpsUrlAllowed = ({ url }: AssertHttpsUrlAllowedParams): URL => {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error('URL hostname is not allowed');
  }

  if (hostname.endsWith('.localhost')) {
    throw new Error('URL hostname is not allowed');
  }

  if (isPrivateIpv4({ hostname }) || isPrivateIpv6({ hostname })) {
    throw new Error('URL hostname is not allowed');
  }

  return parsed;
};

export const resolveAbsoluteUrl = ({
  value,
  baseUrl,
}: {
  value: string;
  baseUrl: string;
}): string | null => {
  const trimmed = value.trim();

  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
};
