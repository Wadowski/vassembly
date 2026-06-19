import { CacheBackend, type Config } from './types';

export const E2E_WEB_PORT = 3001;
export const E2E_API_PORT = 5001;
export const E2E_DOCS_PORT = 3002;

const parseCacheBackend = (value: string | undefined): CacheBackend => {
  if (value === CacheBackend.Redis) {
    return CacheBackend.Redis;
  }
  return CacheBackend.Memory;
};

const webPort = Number(process.env.WEB_PORT) || E2E_WEB_PORT;
const apiPort = Number(process.env.API_PORT) || E2E_API_PORT;
const docsPort = Number(process.env.DOCS_PORT) || E2E_DOCS_PORT;
const webOrigin = `http://localhost:${webPort}`;

const config: Config = {
  apps: {
    web: {
      port: webPort,
      passwordResetUrl: process.env.AUTH_PASSWORD_RESET_WEB_URL,
    },
    docs: {
      port: docsPort,
    },
  },
  encoder: {
    secret: process.env.ENCODER_SECRET || 'test-secret',
    saltRounds: 10,
    algorithm: 'aes-256-cbc',
  },
  cache: {
    backend: parseCacheBackend(process.env.CACHE_BACKEND),
    defaultTtlMs: Number(process.env.CACHE_DEFAULT_TTL_MS) || 300_000,
  },
  mongoDb: {
    url: process.env.MONGODB_URL || '',
    database: process.env.MONGODB_DATABASE || '',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || '',
    ses: {
      passwordResetTemplateName: 'reset-password',
      fromEmail: 'tbd@todo.com',
    },
  },
  deepSeekAi: {
    apiKey: process.env.DEEP_SEEK_AI_API_KEY || '',
    baseURL: process.env.DEEP_SEEK_AI_BASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
  },
  services: {
    api: {
      port: apiPort,
      allowedOrigins: [webOrigin],
    },
  },
};

export default config;
