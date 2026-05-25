import { InternalError, WrongParamError } from '@vassembly/errors';

interface MapConnectionTestErrorParams {
  error?: string;
  mode: 'ephemeral' | 'saved' | 'blockSave';
}

const AUTH_ERROR_PATTERNS = [/401/, /unauthorized/i, /invalid api key/i, /authentication/i, /incorrect api key/i];
const NETWORK_ERROR_PATTERNS = [
  /ENOTFOUND/,
  /ECONNREFUSED/,
  /network/i,
  /fetch failed/i,
  /timeout/i,
  /ETIMEDOUT/,
  /socket hang up/i,
];
const BASE_URL_ERROR_PATTERNS = [/invalid url/i, /cannot reach server/i, /base url/i];

export const mapConnectionTestError = (params: MapConnectionTestErrorParams): never => {
  const message = params.error ?? 'Connection test failed';

  if (AUTH_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new WrongParamError('Invalid API key');
  }

  if (BASE_URL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new WrongParamError(message);
  }

  if (NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    console.error('AI integration connection test network error', message);
    throw new InternalError('Connection test failed due to network error');
  }

  if (params.mode === 'blockSave' || params.mode === 'ephemeral') {
    throw new WrongParamError(`Connection test failed: ${message}`);
  }

  throw new WrongParamError(`Connection test failed: ${message}`);
};
