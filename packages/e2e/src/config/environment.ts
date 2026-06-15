import { config } from '@vassembly/config';

import { DEFAULT_MONGO_DATABASE, DEFAULT_MONGO_URL } from '../constants';
import type { E2eEnvironment } from './types';

export const getE2eEnvironment = (): E2eEnvironment => {
  const webPort = config.apps.web.port;
  const apiPort = config.services.api.port;

  const requestLoopThreshold = parseInt(process.env.E2E_REQUEST_LOOP_THRESHOLD ?? '20', 10);

  if (!Number.isInteger(requestLoopThreshold) || requestLoopThreshold <= 0) {
    throw new Error(
      `Invalid E2E_REQUEST_LOOP_THRESHOLD: must be a positive integer, got ${requestLoopThreshold}`
    );
  }

  return {
    webBaseUrl: process.env.E2E_WEB_BASE_URL ?? `http://localhost:${webPort}`,
    apiBaseUrl: process.env.E2E_API_BASE_URL ?? `http://localhost:${apiPort}`,
    mongoUrl: process.env.MONGODB_URL || config.mongoDb.url || DEFAULT_MONGO_URL,
    mongoDatabase:
      process.env.MONGODB_DATABASE || config.mongoDb.database || DEFAULT_MONGO_DATABASE,
    jwtSecret: process.env.JWT_SECRET || config.jwt.secret,
    consoleErrorPatterns: (
      process.env.E2E_CONSOLE_ERROR_PATTERNS || 'Maximum update depth exceeded|Too many re-renders'
    )
      .split('|')
      .map((pattern) => pattern.trim()),
    requestLoopThreshold,
    enableDiagnostics: process.env.E2E_ENABLE_DIAGNOSTICS !== 'false',
  };
};
