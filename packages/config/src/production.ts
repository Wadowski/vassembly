import { CacheBackend, Environment, type Config } from './types';
import { buildExecutionConfig } from './buildExecutionConfig';
import { buildMcpServersConfig } from './buildMcpServersConfig';

const parseCacheBackend = (value: string | undefined): CacheBackend => {
  if (value === CacheBackend.Redis) {
    return CacheBackend.Redis;
  }
  return CacheBackend.Memory;
};

const config: Config = {
  environment: Environment.Production,
  apps: {
    web: {
      port: 3000,
      passwordResetUrl: process.env.AUTH_PASSWORD_RESET_WEB_URL,
      emailVerificationUrl: process.env.EMAIL_VERIFICATION_WEB_URL,
    },
    docs: {
      port: 3001,
    }
  },
  encoder: {
    secret: process.env.ENCODER_SECRET || '',
    saltRounds: 10,
    algorithm: 'aes-256-cbc',
  },
  cache: {
    backend: parseCacheBackend(process.env.CACHE_BACKEND),
    defaultTtlMs: Number(process.env.CACHE_DEFAULT_TTL_MS) || 300_000,
  },
  redis: {
    url: process.env.REDIS_URL || '',
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
      emailVerificationTemplateName: 'verify-email',
      fromEmail: 'tbd@todo.com',
    },
  },
  deepSeekAi: {
    apiKey: process.env.DEEP_SEEK_AI_API_KEY || '',
    baseURL: process.env.DEEP_SEEK_AI_BASE_URL || '',
  },
  platformAi: {
    provider: process.env.PLATFORM_AI_PROVIDER || '',
    apiKey: process.env.PLATFORM_AI_API_KEY || '',
    baseUrl: process.env.PLATFORM_AI_BASE_URL || '',
    defaultModel: process.env.PLATFORM_AI_DEFAULT_MODEL || '',
    organizationId: process.env.PLATFORM_AI_ORGANIZATION_ID,
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
  },
  skills: {
    scriptStorage: {
      bucketName: process.env.SKILL_SCRIPT_STORAGE_BUCKET || '',
      localRootPath: process.env.SKILL_SCRIPT_STORAGE_LOCAL_PATH,
    },
    execution: buildExecutionConfig({ backend: 'cloud' }),
  },
  mcpServers: buildMcpServersConfig(),
  services: {
    api: {
      port: 5000,
      allowedOrigins: [],
    },
  },
};

export default config;