import { Config } from './types';

const config: Config = {
  apps: {
    web: {
      port: 3000,
      passwordResetUrl: process.env.AUTH_PASSWORD_RESET_WEB_URL,
    },
    docs: {
      port: 3001,
    }
  },
  encoder: {
    secret: 'test-secret',
    saltRounds: 10,
    algorithm: 'aes-256-cbc',
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
      port: 5000,
      allowedOrigins: ['http://localhost:3000'],
    },
  },
};

export default config;