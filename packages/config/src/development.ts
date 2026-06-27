import { CacheBackend, Environment, type Config } from './types';

const parseCacheBackend = (value: string | undefined): CacheBackend => {
  if (value === CacheBackend.Redis) {
    return CacheBackend.Redis;
  }
  return CacheBackend.Memory;
};

const config: Config = {
  environment: Environment.Development,
  apps: {
    web: {
      port: 3000,
      passwordResetUrl: process.env.AUTH_PASSWORD_RESET_WEB_URL,
    },
    docs: {
      port: 3001,
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
  skills: {
    scriptStorage: {
      bucketName: process.env.SKILL_SCRIPT_STORAGE_BUCKET || '',
      localRootPath: process.env.SKILL_SCRIPT_STORAGE_LOCAL_PATH || './.data/skill-scripts',
    },
  },
  services: {
    api: {
      port: 5000,
      allowedOrigins: ['http://localhost:3000'],
    },
  },
};

export default config;
